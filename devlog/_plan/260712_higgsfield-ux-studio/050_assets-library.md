---
created: 2026-07-12
tags: [ima2-gen, phase, assets, storage]
---

# Phase 050 — Assets 저장 계층 + 워크스페이스 (첫 기능 추가)

스펙: `004_gallery-chaining.md` 4-2. 여기부터 기능 구간. 이 저장 계층이
060(프리셋 저장)·070(요소)·080(노드 템플릿)의 공통 기반이라 기능 중
가장 먼저 간다.

## 범위

1. 서버: `/api/assets` — 폴더/태그 CRUD + 검색. `kind` 필드로
   image | video | element | preset | template 수용(070/080 대비).
2. 저장 형식: 미결정 항목(JSON 인덱스 vs SQLite)을 구현 착수 시점에
   스파이크 1회로 결정하고 이 문서에 기록.
3. UI: `#assets` 워크스페이스(030에서 예약한 레일 슬롯 활성화) —
   폴더 트리 + 태그 필터 + 검색 + 그리드(040 가상화 재사용).
4. 히스토리 → "보관" 승격 액션(040 오버레이에 추가). 자동 승격 없음.

## 스파이크 결정 — SQLite (2026-07-13, A-감사 반영 인용 교정)

JSON 인덱스 vs SQLite → **SQLite(better-sqlite3) 채택**. sol 탐사 근거:

- 구조화 저장소 관례가 이미 SQLite: `lib/db.ts:12-22`(singleton·WAL·FK·중앙 migrate),
  `lib/db.ts:25-176,219-269`(CREATE TABLE IF NOT EXISTS + 조건부 ALTER, 전 테이블 중앙 소유).
- ID·시각 관례: `s_/as_/aq_<ULID>` + epoch ms — `lib/sessionStore.ts:8-15`,
  `lib/agentStore.ts:48-65`. assets는 `a_`/`af_` 접두 ULID.
- better-sqlite3는 이미 production dep + native smoke 테스트:
  `package.json`(dependencies·allowScripts·smoke). 신규 의존성 0.
- JSON+`atomicWriteJson`은 단일 문서용 — CRUD마다 전체 재직렬화 필요
  (`lib/atomicWrite.ts:1-14`). 폴더/태그 다대다 + 복합 필터에 부적합.
- history의 3초 TTL full-scan(`lib/historyIndex.ts:6-35`,
  `lib/historyList.ts:29-105`)은 총량 무상한이라 검색 기반으로 복제 금지.
- 바이너리는 `generatedDir`에 그대로 두고 SQLite에는 카탈로그 행만
  (파일 경로 참조). `lib/assetLifecycle.ts:21-47`의 경로+symlink 제한 관례 유지.

## 루프 스펙 (WP1-3 공통)

- 아키타입: spec-satisfaction. 트리거: 사용자 050 착수 지시(HOTL goal 활성).
- 목표: 히스토리와 분리된 영속 Assets 계층 + `#assets` 워크스페이스 + 보관 승격.
- 논골: 060/070/080 기능 본체, 자동 승격, 바이너리 이동/복사, XMP 스키마 변경,
  HistoryStrip 오버레이 확장(040 출하 형태 유지), site/ 변경.
- Verifier: `npm run typecheck` / `typecheck:tests` / `npm test` /
  `test:inventory` / `cd ui && npm run build` + 인앱 브라우저 스모크 스크린샷.
- 종료: goalplan `implement-ima2-gen-phase-050-*` c1-c5 met. 리소스 바운드 ~4h.
- 에스컬레이션: 제품 스코프가 바뀌는 결정만 NEEDS_HUMAN.

## WP1 — 서버 계층 (diff-level)

**감사 반영(A, GO-WITH-FIXES): DDL은 `lib/db.ts` 중앙 `migrate()` 소유**
(`lib/db.ts:25-277` 관례, schema version 갱신 포함). `lib/assetsStore.ts`는
`getDb()` import 후 CRUD만 담당(`lib/sessionStore.ts:8-15` 관례) — 모듈 소유
ensure 없음.

**MODIFY `lib/db.ts`** — migrate()에 아래 DDL + 인덱스 추가, schema version 갱신:

```sql
asset_folders(id TEXT PK, name TEXT NOT NULL, parent_id TEXT NULL REF asset_folders,
              created_at INTEGER, updated_at INTEGER)
assets(id TEXT PK, kind TEXT NOT NULL CHECK(kind IN
         ('image','video','element','preset','template')),
       name TEXT NOT NULL, file_path TEXT NULL, folder_id TEXT NULL REF asset_folders,
       notes TEXT NULL, metadata TEXT NULL /*JSON*/, created_at INTEGER, updated_at INTEGER)
asset_tags(asset_id REF assets ON DELETE CASCADE, tag TEXT NOT NULL,
           PRIMARY KEY(asset_id, tag))
-- idx: assets(kind), assets(folder_id), assets(created_at DESC), asset_tags(tag)
```

**NEW `lib/assetsStore.ts`** (<400줄):

- `createAsset/getAsset/updateAsset/deleteAsset`(행+태그만 삭제, 파일 불변),
  `listAssets({kind?,folderId?,tag?,q?,cursor?,limit=50 max500})` —
  정렬 `created_at DESC, id DESC`, 커서는 `(createdAt,id)` 튜플 인코딩
  (`base64(createdAt:id)`), predicate `(created_at < ?) OR (created_at = ? AND
  id < ?)`. 동일-ms tie 테스트 필수.
- 폴더 무결성: create/move 시 parent 존재 검증(없으면 400 `INVALID_PARENT`),
  self/자손으로 move 금지(409 `FOLDER_CYCLE`), delete는 자산·하위 폴더 모두
  없을 때만(아니면 409 `FOLDER_NOT_EMPTY`). `listFolders/createFolder/`
  `updateFolder(name|parentId)/deleteFolder`, `listTags`.
- kind 검증은 route/store 경계 allowlist가 1차(400 `INVALID_ASSET_KIND`),
  SQLite CHECK는 방어 계층.

**NEW `routes/assets.ts`** (`routes/sessions.ts:28-95` 관례 — handler별
try/catch, 400/404/409/500 구조화 JSON):

| Method | Path | 동작 |
|---|---|---|
| GET | `/api/assets` | 목록+검색(kind/folderId/tag/q/cursor/limit) |
| POST | `/api/assets` | 승격/생성 `{filePath,kind,name?,folderId?,tags?,metadata?}` |
| PATCH/DELETE | `/api/assets/:id` | 수정(이름/폴더/태그/노트) / 카탈로그 삭제 |
| GET/POST | `/api/assets/folders` | 폴더 목록/생성 |
| PATCH/DELETE | `/api/assets/folders/:id` | 개명 / 빈 폴더 삭제 |
| GET | `/api/assets/tags` | distinct 태그 |

- 등록 순서 static-first: `/api/assets/folders*` → `/api/assets/tags` →
  `/api/assets` → `/api/assets/:id` (향후 GET :id 대비).
- `filePath`는 `generatedDir` 내부만 허용(`lib/assetLifecycle.ts` 관례), 탈출 시 400.
- **MODIFY `routes/index.ts:1-61`** — import + `registerAssetsRoutes(app, ctx)`.

**NEW `tests/assets-store.test.ts`, `tests/assets-routes.test.ts`** — 계약:
CRUD 왕복, 잘못된 kind→400, 없는 id→404, 비빈 폴더 삭제→409, filePath 탈출→400,
필터 단독+조합, 커서 페이지네이션(limit=2로 3건→2페이지 + 동일-ms tie),
`INVALID_PARENT`/`FOLDER_CYCLE`/`FOLDER_NOT_EMPTY`, image·video 두 kind 승격
메타데이터 왕복, 자산 삭제 후 파일 잔존 assert(파일시스템 확인).
격리(감사 7): env(`IMA2_CONFIG_DIR`,`IMA2_DB_PATH`)를 mkdtemp로 **import 전**
설정 → dynamic import → teardown에서 `closeDb()`+temp 제거
(`tests/agent-mode-queue-contract.test.ts:9-25` 관례).
인벤토리(감사 6): `node scripts/classify-tests.mjs`(쓰기 모드) 실행 후
`docs/migration/runtime-test-inventory.md` 갱신분 커밋 — 자동 등록 아님.

## WP2 — UI 워크스페이스 (diff-level)

| 파일 | 작업 |
|---|---|
| `ui/src/types.ts:1` | MODIFY `UIMode`에 `"assets"` |
| `ui/src/App.tsx:61-66` + `ui/src/store/storePersistence.ts:114-122` | MODIFY 정규화·persisted loader가 `assets` 보존(감사 1: 미수정 시 classic 강등으로 도달 불가) |
| `ui/src/components/MobileAppBar.tsx:11-19`, `MobileComposeSheet.tsx:25-42`, `Sidebar.tsx:17-30`, `MobileSettingsToggle.tsx:34-38` | MODIFY 폐쇄형 모드 분기에 assets 추가(감사 1·2) |
| `ui/src/components/NavRail.tsx:10-21,31-74,88-93` | MODIFY 해시 양방향 매핑 + `IconAssets`(18×18 stroke) + RAIL_ITEMS 엔트리 |
| `ui/src/i18n/en.json`, `ko.json` | MODIFY `nav.assets`, `assets.*`(검색/빈 상태/폴더/태그/토스트), `chain.saveToAssets` |
| `ui/src/App.tsx:28-42,61-75,128-145` | MODIFY lazy `AssetsWorkspace`, 정규화 통과, RightPanel/히스토리 숨김(agent 관례), mount 분기 |
| `ui/src/components/assets/AssetsWorkspace.tsx` | NEW 툴바(검색·kind·태그 필터)+트리+그리드 조립 |
| `ui/src/components/assets/AssetsFolderTree.tsx` | NEW (`PromptImportFolderSection.tsx:75-115` 관례) |
| `ui/src/components/assets/AssetsGrid.tsx` | NEW `useVirtualizer` 직접 사용(`GalleryDateGrid.tsx:20-82` 패턴, GenerateItem 결합 배제) + IO 썸네일 게이트(`HistoryStrip.tsx:76-114`) |
| `ui/src/styles/assets-workspace.css` + `ui/src/main.tsx` | NEW/MODIFY (`agent-workspace.css:1-42` 레이아웃 관례) |
| `ui/src/store/storeTypes.ts`, `useAppStore.ts` | MODIFY assets 상태/액션 타입 + 조합 |
| `ui/src/store/storeAssetsImpl.ts` | NEW fetch/mutate (`storeHistoryImpl.ts:46-75` 로딩 가드 관례) |
| `ui/src/lib/api-assets.ts` + `api.ts` | NEW/MODIFY DTO+클라이언트 (api-core 관례) |
| `ui/src/lib/resultChaining.ts:11-64` | MODIFY `saveToAssets` 액션(registry+실행 핸들러) |
| `ui/src/components/GalleryImageTile.tsx:23-79` | MODIFY ChainIcon + store plumbing |
| `ui/src/components/ResultActions.tsx:247-275` | MODIFY 뷰어 보관 버튼(공유 핸들러 재사용) |

- 모드 정책(감사 2): assets는 agent와 같은 workspace-only 모드 — Sidebar·
  RightPanel(`App.tsx:144`)·HistoryStrip(`App.tsx:67-75,128`)·모바일 compose/
  settings 토글 전부 숨김. `GalleryModal`은 050에서 재사용하지 않음(히스토리
  스토어 강결합, `GalleryModal.tsx:64-94`) — 타일 오버레이 액션만, 뷰어는 후속.
- `saveToAssets` 계약(감사 4·5): deps에 단일 액션 `saveToAssets(item)` 추가,
  POST body는 `{ filePath: item.filename, kind: item.mediaType === "video" ?
  "video" : "image", name: item.prompt 앞 80자 || filename, tags: [],
  metadata: { prompt, provider, model, mediaType, requestId?, sessionId?,
  createdAt } }` — `url`(`/generated/...`) 금지, `available =
  Boolean(item.filename)` (image·video 동일). 모든 caller(GalleryImageTile
  getStore plumbing, ResultActions) 동시 갱신.
- i18n은 nested 객체(`nav`/`chain`/`assets` 아래 중첩, flat dotted key 아님).
  모바일 레일 5개 아이템 소형 뷰포트 QA 포함(감사 residual).
- 040 "가상화 재사용"은 메커니즘 재사용으로 해석: `GalleryDateGrid`는
  `GenerateItem`+생성 스토어에 강결합(sol 탐사 확인)이라 컴포넌트 직수입 대신
  동일 패턴의 assets 전용 그리드. 빈 상태 3종(자산 0/폴더 빈/검색 0) 필수.

**활성화 시나리오** (C-ACTIVATION-GROUNDING-01): 보관 클릭→POST 성공 토스트→
`#assets` 그리드 표시+히스토리 불변(스크린샷); 검색/태그 필터→목록 변화(스크린샷);
자산 삭제→그리드 제거+파일 잔존; kind 400/폴더 409/경로 탈출 400은 테스트로.

## WP3 — 클로즈아웃

- 풀 게이트 fresh 재실행, `assets/050/` 스크린샷 정리.
- SoT 동기화(SOT-SYNC-01): `structure/03-server-api.md`(+필요시 01·04)에
  `/api/assets` 반영. 이 문서 상태 done.
- dev 커밋 분리: `feat(server): phase 050 assets store + routes` /
  `feat(ui): phase 050 assets workspace + 보관 chaining`.
  (주의: 기존 `package-lock.json` 버전 범프 변경은 이 페이즈 커밋에서 제외.)

## Done 기준

- Assets CRUD/검색 node:test 계약 + `test:inventory` 등록.
- 히스토리·Assets 분리 동작 스크린샷 → `assets/050/`.

상태: **done** (2026-07-13)

## Diff-Level Record

아래 수치는 각 커밋의 `git show --numstat` 기준이다. 050은 서버 기반, UI
워크스페이스, 최종 리뷰 수정의 세 sub-commit으로 분리되었으며 합계는 45개
file-touch, **+1,723 / -31**이다(커밋 간 동일 파일의 중복 touch 포함).

### 050-A — 서버 기반 (`45ba1ee`)

`feat(server): phase 050 assets library — SQLite store + /api/assets routes + contracts`
— **11 files, +937 / -10**.

| 파일 | 상태 | + | - | diff 역할 |
|---|---:|---:|---:|---|
| `docs/API.md` | M | 23 | 0 | Assets REST 계약 문서화 |
| `docs/migration/runtime-test-inventory.md` | M | 3 | 1 | 신규 계약 테스트 인벤토리 등록 |
| `lib/assetLifecycle.ts` | M | 2 | 2 | generated 경로 검증 재사용을 위한 export 조정 |
| `lib/assetsStore.ts` | A | 427 | 0 | asset/folder/tag CRUD, 필터, 커서 페이지네이션 |
| `lib/db.ts` | M | 40 | 3 | DB v6 및 assets 3개 테이블/인덱스 migration |
| `routes/assets.ts` | A | 203 | 0 | assets/folders/tags REST route와 입력 검증 |
| `routes/index.ts` | M | 2 | 0 | assets route 등록 |
| `structure/01-file-function-map.md` | M | 2 | 2 | 서버 파일 맵 동기화 |
| `tests/assets-routes-contract.test.ts` | A | 118 | 0 | HTTP 상태·경로 제한·CRUD 계약 |
| `tests/assets-store-contract.test.ts` | A | 115 | 0 | 저장소 CRUD·필터·폴더 무결성·cursor 계약 |
| `tests/inflight-persistence.test.ts` | M | 2 | 2 | DB schema version 기대값 v6 동기화 |
| **합계** |  | **937** | **10** | |

핵심 diff는 `assetsStore.ts`(+427)와 `routes/assets.ts`(+203)에 집중된다.
`db.ts`가 DDL을 중앙 소유하고, 두 신규 계약 테스트(+233)가 저장소 및 HTTP
경계를 각각 고정한다.

### 050-B — UI 워크스페이스 (`0a95636`)

`feat(ui): phase 050 assets workspace — #assets mode, folder tree, virtualized grid, 보관 chaining`
— **26 files, +640 / -13**.

| 파일 | 상태 | + | - | diff 역할 |
|---|---:|---:|---:|---|
| `structure/01-file-function-map.md` | M | 4 | 4 | UI 파일 맵 동기화 |
| `structure/03-server-api.md` | M | 22 | 0 | Assets API SoT 반영 |
| `structure/04-frontend-architecture.md` | M | 11 | 1 | assets mode/slice 구조 반영 |
| `ui/src/App.tsx` | M | 9 | 2 | lazy workspace mount 및 workspace-only 패널 정책 |
| `ui/src/components/GalleryImageTile.tsx` | M | 9 | 0 | 타일의 보관 chaining 진입점 |
| `ui/src/components/MobileAppBar.tsx` | M | 1 | 0 | assets mode 분기 |
| `ui/src/components/MobileComposeSheet.tsx` | M | 1 | 0 | assets mode에서 compose 숨김 |
| `ui/src/components/MobileSettingsToggle.tsx` | M | 1 | 1 | workspace-only mode 처리 |
| `ui/src/components/NavRail.tsx` | M | 12 | 0 | `#assets` 해시·아이콘·rail 항목 |
| `ui/src/components/ResultActions.tsx` | M | 14 | 0 | 결과 뷰의 보관 액션 |
| `ui/src/components/Sidebar.tsx` | M | 1 | 0 | assets mode에서 sidebar 숨김 |
| `ui/src/components/assets/AssetsFolderTree.tsx` | A | 93 | 0 | 계층 폴더 탐색/CRUD |
| `ui/src/components/assets/AssetsGrid.tsx` | A | 81 | 0 | virtualized assets grid |
| `ui/src/components/assets/AssetsWorkspace.tsx` | A | 36 | 0 | 트리·검색·kind/tag 필터 조립 |
| `ui/src/i18n/en.json` | M | 31 | 1 | 영문 assets/chaining 문구 |
| `ui/src/i18n/ko.json` | M | 31 | 1 | 국문 assets/chaining 문구 |
| `ui/src/lib/api-assets.ts` | A | 61 | 0 | Assets DTO와 API client |
| `ui/src/lib/api.ts` | M | 5 | 0 | assets client export |
| `ui/src/lib/resultChaining.ts` | M | 16 | 1 | `saveToAssets` 5번째 chaining action |
| `ui/src/main.tsx` | M | 1 | 0 | assets stylesheet 진입점 |
| `ui/src/store/storeAssetsImpl.ts` | A | 82 | 0 | 목록/폴더 CRUD 및 저장 slice |
| `ui/src/store/storePersistence.ts` | M | 1 | 0 | persisted assets mode 보존 |
| `ui/src/store/storeTypes.ts` | M | 32 | 0 | assets state/action 타입 |
| `ui/src/store/useAppStore.ts` | M | 22 | 1 | assets slice 조합 및 chaining 배선 |
| `ui/src/styles/assets-workspace.css` | A | 62 | 0 | workspace/tree/grid 레이아웃 |
| `ui/src/types.ts` | M | 1 | 1 | `UIMode`에 assets 추가 |
| **합계** |  | **640** | **13** | |

신규 UI의 중심은 FolderTree(+93), Grid(+81), Workspace(+36), API client(+61),
store slice(+82), CSS(+62)다. 나머지 diff는 `assets` 모드를 기존 폐쇄형 분기와
persist 경계에 연결하고, Gallery/Result에서 `saveToAssets`를 호출하도록 잇는다.

### 050-C — 최종 리뷰 수정 (`cbcf9e6`)

`fix(assets): phase 050 final-review fold-in — list-race guard, first-save reconcile, directory rejection, grid width + contracts`
— **8 files, +146 / -8**.

| 파일 | 상태 | + | - | diff 역할 |
|---|---:|---:|---:|---|
| `docs/migration/runtime-test-inventory.md` | M | 2 | 1 | 신규 UI-store 계약 테스트 등록 |
| `routes/assets.ts` | M | 2 | 2 | `lstatSync().isFile()`로 디렉터리 등록 거부 |
| `tests/assets-routes-contract.test.ts` | M | 2 | 0 | 디렉터리 거부 회귀 계약 |
| `tests/assets-ui-store-contract.test.ts` | A | 117 | 0 | stale 응답·첫 저장·필터 적합성 계약 |
| `tests/card-news-frontend-contract.test.js` | M | 1 | 1 | Vite import-meta 타입 처리와 계약 fixture 정렬 |
| `tests/vite-import-meta.d.ts` | A | 5 | 0 | UI store 계약 테스트용 Vite import-meta 선언 |
| `ui/src/components/assets/AssetsGrid.tsx` | M | 5 | 1 | virtual row/grid width 보정 |
| `ui/src/store/storeAssetsImpl.ts` | M | 12 | 3 | monotonic request generation 및 첫-save reconciliation |
| **합계** |  | **146** | **8** | |

리뷰에서 발견된 네 경계를 작은 fix commit으로 접었다. 목록 요청 generation은
늦게 도착한 이전 필터 응답을 폐기하고, 최초 보관은 현재 필터에 맞는 asset을
즉시 reconcile한다. 서버는 generated 경로 안의 디렉터리도 거부하며, grid는
virtual row의 실제 폭을 열 수에 맞춘다. 신규 계약 테스트(+117)가 이 세 store
시나리오를 고정하고 route 계약이 파일 타입 거부를 보강한다.

## 클로즈아웃 기록

- 커밋: `45ba1ee`(서버: db v6 + assetsStore + /api/assets + 계약 테스트),
  `0a95636`(UI: assets 모드 배선 + 워크스페이스 + 보관 체이닝 + SoT 문서),
  `cbcf9e6`(최종 리뷰 반영: 목록 레이스 가드·첫 저장 반영·디렉터리 거부·
  그리드 폭 보정 + 계약 테스트 3건 추가).
- sol 파견 7회: 탐사 2(스토리지 관례·UI 배선) → 계획 감사 1(GO-WITH-FIXES 5,
  전부 접힘) → 테스트/스토어/컴포넌트 워커 3 → WP2 재감사(GO-WITH-FIXES 2)
  → 최종 신선 리뷰어 1(GO-WITH-FIXES 4, 전부 수용·수정).
- 게이트: typecheck / typecheck:tests / npm test **1149 pass 0 fail** /
  test:inventory / ui build 전부 exit 0 (fresh).
- 렌더·활성화 증거: `assets/050/` 스크린샷 6장(워크스페이스·폴더 생성·보관
  토스트·비디오 자산 그리드·검색 빈 상태·모바일 390) + 승격 POST(video kind),
  검색 필터 전환, 2단계 삭제 후 파일 잔존(HEAD 200), 폴더 왕복.
- 잔여(후속 페이즈로): 자산 뷰어(GalleryModal 재사용은 별도 설계 필요),
  모바일 폴더 관리(현재 칩 필터만), 히스토리 스트립 오버레이 확장 없음(의도),
  inflight 폴링이 assets 모드에서 classic 스코프로 도는 것(무해, 문서화).
