# Legacy — 생존 슈터 (VN 전환 이전)

VN 전환(2026) 이전의 탑다운 생존 슈터 코드입니다.
현재 [`App.tsx`](../App.tsx)에서는 사용하지 않습니다.

## 포함

- `game/` — GameLoop, CanvasRenderer, EnemySpawner 등
- `LevelUpScreen.tsx`, `StageClearScreen.tsx`, `StoryDialogScreen.tsx`

## 관련 Store (src/store/)

- `gameStore.ts`, `playerStore.ts`, `enemyStore.ts`, `upgradeStore.ts`

재활용 시 챕터별 전투 모듈(`src/combat/`)과 Emotion Sync 연동을 새로 설계하세요.
