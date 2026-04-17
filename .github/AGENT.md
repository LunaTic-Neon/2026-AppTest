이 문서는 AI 에이전트가 이 저장소를 빠르게 파악하고 생산적으로 작업할 수 있도록 최소한의 핵심 정보를 정리한 요약입니다.

프로젝트 한줄 요약
- Roguelike Survival: 탑다운 캔버스 기반 아레나 생존 게임(React UI + imperative game loop).

핵심 아키텍처(한눈에)
- GameLoop (요약): `src/game/GameLoop.ts` — requestAnimationFrame 기반의 메인 루프(업데이트, 렌더, 씬 전환).
- 렌더링/Input: `src/game/canvas/CanvasRenderer.ts` — 캔버스 크기/스케일링, 렌더, 입력 어댑터(조이스틱/키보드/마우스).
- 상태관리: `zustand` 사용, 각 도메인별 스토어:
  - `src/store/gameStore.ts` (씬, 게임시간, 처치 등)
  - `src/store/playerStore.ts` (플레이어 상태, 대시 API)
  - `src/store/enemyStore.ts` (적 목록)
- 전투/공격: `src/game/AutoAttack.ts`(플레이어 공격)& `src/game/Projectile.ts`(플레이어 투사체)
- 적 원거리 탄막: `src/game/EnemyProjectile.ts` + `EnemySpawner`의 `shooter` 타입

중요한 컨벤션 & 패턴
- React는 UI(메뉴, 레벨업 모달 등) 전용. 실시간 게임 로직은 `GameLoop`(비-리액티브)에서 직접 zustand 스토어를 읽고 수정합니다. 따라서 변경 시 `useStore.getState()` 사용 위치를 같이 업데이트해야 합니다.
- 입력 우선순위: 키보드 이동 우선 -> 키보드가 없으면 조이스틱 (`GameLoop.updatePlayerMovement`).
- 캔버스 해상도/좌표계는 `src/config/gameConfig.ts`의 `canvas` 값(기본 1920×1080)에 의존합니다. 스케일러 로직(`CanvasRenderer.setupCanvas`)을 변경할 때 주의.
- 게임 밸런스 포인트: 적 스폰( `src/game/EnemySpawner.ts` ), 적 스탯(`getEnemyStats`), 경험치 곡선(`src/config/gameConfig.ts:getExpMultiplier`)이 핵심입니다.

실행 / 개발 워크플로
- 로컬 개발: `npm install` → `npm run dev` (Vite). 기본 URL: http://localhost:5173/
- 빌드: `npm run build` (typecheck + vite build)
- 미리보기: `npm run preview`

디버깅 팁 (빠르게 상태 들여다보기)
- 콘솔에서 스토어 접근: 예) `usePlayerStore.getState()` 로 플레이어 상태를 확인/수정 가능(단, 그 상태를 바꾸면 GameLoop와 UI가 기대하는 형태를 유지해야 함).
- 캔버스 내 디버그: `D` 키로 debug overlay 토글(프레임/엔티티 카운트 등).

구체적 수정 예시(바로 찾을 파일)
- 적 파라미터 변경: `src/game/EnemySpawner.ts#getEnemyStats`
- 스폰 빈도/웨이브: `src/game/EnemySpawner.ts`의 `spawnRate` 관련 로직
- 발사체(플레이어): `src/game/AutoAttack.ts`, `src/game/Projectile.ts`
- 적 원거리 발사체: `src/game/EnemyProjectile.ts` (생성/업데이트/삭제)
- 레벨업 UI 수정: `src/components/LevelUpScreen.tsx`
- HUD/경험치바: `src/game/canvas/CanvasRenderer.ts::renderExperienceBar`

제약/주의사항
- 스토어 API 이름(예: `resetPlayer`, `updateEnemies`, `addPlayerExp`)은 여러 파일에서 직접 호출됩니다. 함수 시그니처 변경은 전역적인 영향이 큽니다.
- GameLoop는 imperative 코드이므로 React 라이프사이클과 별도로 동작합니다. React 상태로 루프를 직접 옮기지 마세요.

원할 경우
- 특정 작업(예: '새 적 유형 추가' 또는 '경험치 곡선 튜닝')을 명시해 주시면, 관련 파일과 변경 포인트를 바로 패치하고 간단한 테스트 가이드를 남기겠습니다.

핵심 파일 목록(빠른 링크)
- `src/game/GameLoop.ts`
- `src/game/EnemySpawner.ts`
- `src/game/AutoAttack.ts`
- `src/game/EnemyProjectile.ts`
- `src/game/canvas/CanvasRenderer.ts`
- `src/store/playerStore.ts`, `src/store/enemyStore.ts`, `src/store/gameStore.ts`
- `src/components/LevelUpScreen.tsx`, `src/App.tsx`

이 파일에 추가할 정보가 있거나 다른 형식(예: `.github/copilot-instructions.md` 병합)이 필요하면 알려주세요.
