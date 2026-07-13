---
created: 2026-07-12
tags: [ima2-gen, phase, contrast, wcag, deboxing]
---

# Phase 026 — 색 대조 AA 정합 + 박스 분할 완화

사용자 지시(2026-07-12)로 020/025 뒤에 삽입된 phase. cxc-dev-uiux-design
(판단) + cxc-dev-frontend(§7 접근성 게이트, FE-CONVERGENCE-01) 대조 적용.

## 진단 (WCAG 계산 근거)

- `--text-faint #55555f` = 2.0~2.7:1 — 전면 AA 미달인데 의미 라벨 18곳에
  사용(설정 eyebrow, PROVIDER 헤더, 모델 섹션 타이틀, 내비 힌트 등).
- `--text-muted #7e7e8c` = 4.23/3.75 (surface2/3) — 상승면 AA 미달.
- `.settings-row`가 border+bg 박스 → 셸>섹션>카드>행 4중 중첩,
  QuotaCard 내부 박스-인-박스, 사이드바 노드 힌트 박스.

## 조치

1. `--text-muted` #7e7e8c → **#90909d** (surface3에서 4.76:1, 전면 AA 클리어).
2. faint를 **장식/비활성/플레이스홀더 전용**으로 재정의하고, 의미 라벨
   18곳을 muted로 승격 (Bohr 감사 전수 분류 26곳 기준: 의미 18 승격,
   장식 4 유지, 에이전트 CSS 4 스킵).
3. `image-model-select__subsection-title`의 `opacity: 0.7` 제거(합성 대조
   무효화 방지).
4. 디박스: `.settings-row`/`.settings-note` border+bg 제거 → 형제 간
   `--hairline-soft` 디바이더. `.quota-card` 동일 처치. `.sidebar__node-hint`
   플랫 텍스트화. 레이아웃 계약(grid/order/gap)은 보존.
5. 유지 결정: provider-card(그룹 유일 카드), 입력/셀렉트 경계
   (FE-A11Y-POLISH-01), 시맨틱 상태 컨테이너, 노드 오버레이 힌트.
   우측 패널/컴포저/갤러리/프롬프트 빌더 디박스는 명시적 이연.
6. 정책 명문화: 에이전트 레인은 **파일 불가침, 토큰은 전역 상속**(010 선례).

## Done — 2026-07-12 충족

- 대조 재계산: muted 6.23/5.82/5.37/4.76 (bg/surface/2/3) 전면 AA 통과.
- npm test 1133 pass 0 fail + ui build green.
- 실화면 검수 → `assets/026/settings-after.png` (쿼터 플랫, 헤더 가독,
  카드 위계 단일화 확인).

상태: **done** (2026-07-12)

## Diff-Level Record

- 커밋: `690073e`
- 비교 범위: `7c01ab7..690073e`
- 통계: **9 files, +33 / −37** (`git diff --stat 7c01ab7..690073e`)

| 파일 | + | − | diff-level 역할 |
|---|---:|---:|---|
| `ui/src/index.css` | 1 | 1 | `--text-muted` 토큰을 `#7e7e8c` → `#90909d`로 상향 |
| `ui/src/styles/canvas-accordion.css` | 6 | 11 | settings row/note 박스를 flat row + divider로 전환 |
| `ui/src/styles/canvas-viewer.css` | 11 | 9 | 의미 label의 faint 사용을 muted로 승격하고 연관 간격 보정 |
| `ui/src/styles/composer-flow.css` | 1 | 1 | 의미 text의 muted 토큰 사용 |
| `ui/src/styles/node-workspace.css` | 2 | 4 | sidebar node hint 박스를 inline text로 평탄화 |
| `ui/src/styles/prompt-builder-messages.css` | 2 | 2 | message 라벨의 faint → muted 승격 |
| `ui/src/styles/prompt-builder.css` | 2 | 2 | prompt builder 의미 label의 faint → muted 승격 |
| `ui/src/styles/provider-controls.css` | 3 | 3 | provider control 라벨/메타 대조 상향 |
| `ui/src/styles/quota-card.css` | 5 | 4 | surface card를 borderless flat quota row + divider로 전환 |

### Before → After Patterns

- `--text-muted: #7e7e8c` → `--text-muted: #90909d`; surface-3 기준
  3.75:1 → 4.76:1로 의미 텍스트의 AA 대조를 회복.
- 의미 label에 `--text-faint` 및 subsection `opacity: 0.7` →
  `--text-muted` 직접 사용; faint는 장식/비활성/플레이스홀더로 한정.
- `.settings-row`/`.settings-note` border + background + radius →
  `padding: 14px 2px` flat row + `--hairline-soft` sibling divider.
- `.quota-card` surface-2 박스 → provider 계층 안의 borderless flat row + divider.
- `.sidebar__node-hint` 별도 hint box → inline text; provider card, input/select,
  semantic state container는 필요한 경계로 유지.
