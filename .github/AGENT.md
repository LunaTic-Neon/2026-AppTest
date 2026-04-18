# AGENT.md — Ruin's City

> 이 파일은 AI 에이전트용 작업 가이드입니다. 코드를 수정하기 전에 먼저 읽고, 중요한 변경 뒤에는 반드시 갱신합니다.
> 마지막 업데이트: 2026-04-18

## 목적

- 이 프로젝트는 React UI와 별도 GameLoop가 공존하는 구조라서, 처음 들어온 에이전트가 흐름을 잘못 잡기 쉽습니다.
- 이 문서는 현재 구조, 자주 수정되는 위치, 최근에 바뀐 중요한 기능만 짧게 정리합니다.
- 수치가 자주 바뀌는 밸런스 값은 가능한 한 “어디를 보면 되는지” 위주로 적고, 오래된 숫자 나열은 최소화합니다.

## 작업 규칙

- 중요 로직, UI 흐름, 메타 저장 구조, 밸런스 축 변경 시 이 파일의 `최근 중요 변경 로그`를 갱신합니다.
- 숫자 하나만 바뀐 수준이 아니라 플레이 감각이나 저장 데이터에 영향이 있으면 기록합니다.
- 작업 검증으로 `npm run build`를 돌렸다면 로그에 함께 적습니다.

## 최근 중요 변경 로그

### 2026-04-18

- 메타 진행도 확장:
  - 언어 설정 `ko/en/ja`
  - 스테이지 클리어 체크 표시용 `clearedStages`
  - 프롤로그 초회 보상 플래그 `prologueRewarded`
  - 전체 진행 초기화 액션 추가
- 설정/상점/배속:
  - 설정 패널에 볼륨 직접 숫자 입력 추가
  - 배속 해금/선택 시스템 확장, 현재 `x1.0 / x1.1 / x1.2 / x1.3 / x1.5`
  - 상점에서 상위 배속은 이전 배속 구매 후 해금
- 스토리/메뉴 흐름:
  - 프롤로그는 게임 시작 없이 스토리만 재생
  - 프롤로그 첫 완료 시 1회 한정 500 골드 지급
  - 스테이지 선택 타일에 클리어 체크 표시
  - `Esc`로 설정/상점/스토리 화면에서 메인 메뉴 복귀 가능
- 플레이 감각/밸런스:
  - 대시 중 플레이어 무적 및 시각적 어둡게 처리
  - 적 탄막은 대시 중 플레이어를 관통하고 사라지지 않음
  - 첫 중간보스 HP 하향, 세 번째 중간보스 HP 상향
  - 일반 적 공격력 소폭 하향, 중간보스/최종보스 공격력 비율 재조정
  - 잡몹끼리 과도하게 겹치지 않도록 분리 로직 추가
  - 플레이어 초기 공격속도는 초당 발사 횟수 기준 `1.5`
- HUD/렌더링:
  - 조준점 빨간 원형 십자선으로 변경
  - 우측 상단 HUD를 `Time / Kill / Level / HP` 형식으로 정리
  - 플레이어 하단 체력바와 HUD 체력바의 경고 색상 기준 통일

검증:

- `npm run build` 통과

## 프로젝트 개요

Ruin's City는 React + TypeScript + Canvas 기반의 탑다운 생존 슈터입니다.

- 실시간 게임 로직은 `src/game/GameLoop.ts`가 담당합니다.
- React는 메뉴, 오버레이, 설정, 스토리 UI를 담당합니다.
- 상태 관리는 Zustand를 사용합니다.
- 영구 진행도는 `metaProgressionStore`를 통해 `localStorage`에 저장합니다.

## 가장 중요한 구조

### 1. React와 GameLoop는 역할이 다릅니다

- React:
  - 메뉴 화면
  - 상점 / 설정 / 스토리 / 레벨업 / 스테이지 클리어 UI
  - `App.tsx`에서 GameLoop 생명주기 관리
- GameLoop:
  - 이동
  - 공격
  - 적 스폰
  - 보스 패턴
  - 충돌 판정
  - 캔버스 렌더 호출

중요 원칙:

- 실시간 전투 로직은 React state로 옮기지 않습니다.
- `GameLoop` 내부에서는 훅이 아니라 `useXxxStore.getState()`를 사용합니다.
- 화면 전환은 store 상태를 통해 연결하고, 직접 컴포넌트 간 임시 상태로 우회하지 않습니다.

### 2. 현재 진입점

- 메뉴/씬 제어: `src/App.tsx`
- 메인 루프: `src/game/GameLoop.ts`
- 렌더링: `src/game/canvas/CanvasRenderer.ts`
- 메타 저장: `src/store/metaProgressionStore.ts`
- 레벨업 카드 정의: `src/store/upgradeStore.ts`
- 적 스폰/기본 밸런스: `src/game/EnemySpawner.ts`

## 현재 사용자 기준 핵심 기능

- 메인 메뉴 배경에 폐허 도시 비주얼 사용
- 스토리 선택 화면에서 `PROLOGUE`, `1-1`, `1-2`, `1-3` 선택 가능
- 프롤로그는 스토리만 보고 종료되며 첫 완료 시 500 골드 지급
- 각 스테이지는 스토리 대화 후 게임 시작
- 설정에서 볼륨, 언어, 해금된 배속 선택 가능
- 상점에서 배속 업그레이드 구매 가능
- 일시정지 화면에서도 설정 패널 사용
- 중간보스 다수 등장 가능, 각 개체 체력바 표시
- 최종보스는 별도 패턴과 상단 전용 체력바 사용

## 저장 데이터 주의점

`src/store/metaProgressionStore.ts`는 아래 성격의 데이터를 저장합니다.

- 골드
- 언어 설정
- 배속 해금/선택 상태
- 프롤로그 초회 보상 지급 여부
- 클리어한 스테이지 목록
- 기타 메타 진행 관련 값

이 스토어 구조를 바꿀 때는 아래를 같이 확인합니다.

- `INITIAL_STATE`
- `loadFromLocalStorage()`의 마이그레이션 처리
- `saveToLocalStorage()` 직렬화 항목
- 설정 초기화 동작

## 자주 수정되는 위치

### 게임 감각 / 밸런스

- 플레이어 기본값: `src/config/gameConfig.ts`
- 적 기본 스탯/스폰 증가율: `src/game/EnemySpawner.ts`
- 보스/중간보스 행동 템포: `src/game/GameLoop.ts`
- 레벨업 카드 수치: `src/store/upgradeStore.ts`
- 레벨업 적용 방식: `src/components/LevelUpScreen.tsx`

### UI / 흐름

- 메뉴, 상점, 설정, 스토리, `Esc` 동작: `src/App.tsx`
- 설정 패널 내용: `src/components/SettingsPanel.tsx`
- 스테이지 클리어 결과 UI: `src/components/StageClearScreen.tsx`
- 스토리 대화 UI: `src/components/StoryDialogScreen.tsx`

### 캔버스 표현

- HUD, 조준점, 플레이어/적 렌더링: `src/game/canvas/CanvasRenderer.ts`

## 입력 규칙

- 이동: 키보드 우선, 필요 시 조이스틱 대체
- 공격: 마우스 좌클릭
- 대시: Space 또는 UI 버튼
- `Esc`:
  - 플레이 중: 일시정지
  - 일시정지 중: 재개
  - 메뉴의 설정/상점/스토리: 메인 메뉴 복귀
- `D`: 디버그 오버레이 토글

## 문서화 원칙

이 파일에는 아래만 남깁니다.

- 새로운 AI가 실수하기 쉬운 구조적 정보
- 저장 데이터/씬 흐름처럼 망가지면 복구 비용이 큰 정보
- 최근에 바뀐 중요한 기능 요약

반대로 아래는 길게 적지 않습니다.

- 자주 바뀌는 세부 밸런스 숫자 전부
- 코드만 보면 바로 알 수 있는 단순 설명
- 과거 상태를 그대로 보존한 오래된 로그 나열

## 작업 후 최소 확인

- 로직/UI를 건드렸으면 가능하면 `npm run build`
- 저장 구조를 바꿨으면 `metaProgressionStore.ts`의 load/save 둘 다 확인
- 메뉴 흐름을 바꿨으면 `Esc`, 상점, 설정, 스토리, 일시정지까지 직접 흐름 점검
  usePlayerStore.getState().setPlayerHP(999)
  // 예시: 씬 전환
  useGameStore.getState().setCurrentScene('levelUp')
  ```
- `DebugSystem.ts`의 `DebugStats` 인터페이스로 overlay에 새 지표를 추가할 수 있습니다.

---

## 제약 & 주의사항

1. **스토어 API 시그니처 변경 금지** — `resetPlayer`, `updateEnemies`, `addPlayerExp` 등은 여러 파일에서 직접 호출됩니다.
2. **GameLoop는 React 외부** — `requestAnimationFrame` 루프이므로 React 라이프사이클과 독립적입니다. React 상태(`useState`)로 게임 루프를 제어하지 마세요.
3. **캔버스 좌표계** — `GAME_CONFIG.canvas`(1920×1080) 기준입니다. 적 스폰 위치 계산 등도 이 값에 의존합니다.
4. **투사체 속도 스케일** — `GLOBAL_PROJECTILE_SPEED_SCALE = 0.7`이 `Projectile.ts`와 `EnemyProjectile.ts` 양쪽에 분리 선언되어 있습니다. 둘 다 수정해야 일관성이 유지됩니다.
5. **`metaProgressionStore`의 localStorage** — `loadFromLocalStorage()` / `saveToLocalStorage()`를 명시적으로 호출해야 영구 저장됩니다. 자동 저장이 아닙니다.

---

## 새 기능 추가 체크리스트

### 새 적 타입 추가
1. `src/types/index.ts` — `Enemy.type` 유니온에 추가
2. `src/game/EnemySpawner.ts` — `getRandomEnemyType()`, `getEnemyStats()` 케이스 추가
3. `src/game/canvas/CanvasRenderer.ts` — `renderEnemy()` switch 케이스 추가

### 새 업그레이드 추가
1. `src/types/index.ts` — `Upgrade.type` 유니온에 추가 (필요 시)
2. `src/store/upgradeStore.ts` — `DEFAULT_UPGRADES`에 항목 추가
3. `src/components/LevelUpScreen.tsx` — `applyUpgrade()` switch 케이스 추가

### 새 씬 추가
1. `src/types/index.ts` — `GameScene` 유니온에 추가
2. `src/store/gameStore.ts` — 관련 상태/액션 추가
3. `src/App.tsx` — 씬 조건부 렌더링 추가
4. `src/game/GameLoop.ts` — 필요 시 씬 전환 트리거 추가

