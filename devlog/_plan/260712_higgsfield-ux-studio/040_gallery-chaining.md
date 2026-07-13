---
created: 2026-07-12
tags: [ima2-gen, phase, gallery, chaining]
---

# Phase 040 — 갤러리 체이닝 + 가상화 (서버 무변경)

스펙: `004_gallery-chaining.md` 4-1·4-3. 전부 기존 서버 경로(XMP 복원,
I2V 프레임 소스, 참조 슬롯)의 재배선이라 UI-only로 끝난다. 기능 추가처럼
보이지만 신규 API가 없어서 이 위치.

## 범위

1. 체이닝 액션 공용 모듈(`resultChaining.ts`) + 타일 호버 오버레이:
   영상으로 / 편집 / 참조로 / 다시 굽기. 모바일 탭 → 액션 시트.
2. `GalleryImageTile`·`HistoryStrip`·`ResultActions`·뷰어가 같은 액션
   정의 공유.
3. 갤러리/피드 가상화 + 비디오 썸네일 IntersectionObserver 게이트.
4. 리니지 대비: 체이닝으로 생성되는 결과물 XMP에 `parentId` 기록
   (필드만, 뷰 없음 — 090 미결정 원장 참조).

## Done 기준

- 체이닝 4액션 컨텍스트 이동 계약 테스트.
- 1,000타일 스크롤 프로파일 수치 기록(전/후) → `assets/040/`.

상태: **done** (2026-07-13 — 체이닝 4액션+가상화+sol 8항목 감사, 1133 테스트 green)

## Diff-Level Record

커밋: `4ca3d55` (`4ca3d55c62308ee8e923ecc2d2ab951cf00a1841`);
비교 범위 `6be0d4b..4ca3d55` — **8 files, +415 / -24**.

| 파일 | Diff | 변경 기록 |
|---|---:|---|
| `ui/src/lib/resultChaining.ts` | +116 / -0 | `CHAINING_ACTIONS` 공용 registry와 `animate`, `edit`, `useAsRef`, `rebake` 4액션; availability predicate 및 toast 처리 |
| `ui/src/components/GalleryImageTile.tsx` | +78 / -0 | 갤러리 item 위에 공용 chaining action icon overlay 추가 |
| `ui/src/components/GalleryModal.tsx` | +56 / -0 | `useLazyGalleryTiles`, `IntersectionObserver`, `visibleKeys`, 200% root margin 및 미지원 fallback |
| `ui/src/components/HistoryStrip.tsx` | +75 / -22 | 전체 item 렌더 -> viewport/window 기반 virtualization으로 렌더 범위 제한 |
| `ui/src/styles/gallery-modal.css` | +71 / -1 | tile action overlay, placeholder/lazy 상태 스타일 |
| `ui/src/i18n/en.json` | +9 / -0 | chaining action 영문 label/toast |
| `ui/src/i18n/ko.json` | +9 / -0 | chaining action 한글 label/toast |
| `tests/gallery-navigation-ux-contract.test.js` | +1 / -1 | 갤러리 navigation 계약을 새 tile/chaining 구조에 맞게 갱신 |

Before -> After:

- 결과별 후속 동작이 각 화면에 흩어짐 -> `CHAINING_ACTIONS` 한곳에서 4개 액션의 표시 가능성과 실행을 정의.
- 갤러리 타일은 보기 전에도 모두 실체 DOM으로 렌더 -> `IntersectionObserver`가 근접한 placeholder만 실제 `GalleryImageTile`로 승격.
- HistoryStrip이 전체 history를 한 번에 렌더 -> 현재 viewport 주변 window만 렌더하는 virtualization.
- 결과 확인이 소비의 종착점 -> 타일 overlay에서 영상화, 편집, 참조 추가, 다시 굽기로 즉시 이어지는 작업 출발점.
