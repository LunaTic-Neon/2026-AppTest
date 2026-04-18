# AGENT.md — Ruin's City

> AI 에이전트 전용 레포지토리 가이드. 코드 수정 전 이 파일을 먼저 읽으세요.
> 마지막 업데이트: 2026-04-18

## 변경 기록 규칙 (필수)

- 앞으로 **중요 로직/밸런스/UI 변경 시 반드시 이 파일에 기록**합니다.
- 기록 형식은 아래 `최근 중요 변경 로그`에 날짜/요약/수정 파일/검증 결과를 추가합니다.
- 새 AI 에이전트는 작업 시작 전에 이 파일과 최근 로그를 먼저 확인합니다.

## 최근 중요 변경 로그

### 2026-04-18 (세션 업데이트)

- 설정 기능 구현:
  - `마스터/배경음/효과음/보이스` 볼륨 슬라이더 추가
  - 메뉴 `SETTINGS`와 게임 중 `일시정지`에서 동일 설정 패널 사용
- 배속 시스템 구현:
  - 배속 옵션: `x1.0 / x1.1 / x1.2 / x1.3`
  - `STORE`에서 배속 업그레이드 구매 가능
  - 미구매 배속은 `SETTINGS`에서 잠금 표시
  - 구매 후 `SETTINGS` 및 일시정지 설정에서 즉시 선택 가능
  - 선택 배속은 `GameLoop` 전투/이동/스폰/시간 경과 전체에 반영
- 보스 패턴 1 안정화:
  - 플레이어 기준 대칭 순간이동 시 보스 좌표를 캔버스 내부로 clamp
  - 해상도/캔버스 크기에 맞춰 화면 밖 이탈 방지
- 중간보스 패턴 템포 조정:
  - 도약/탄막 주기를 기존 대비 10% 느리게 조정

수정 파일:
- `src/store/metaProgressionStore.ts`
- `src/components/SettingsPanel.tsx`
- `src/App.tsx`
- `src/game/GameLoop.ts`

검증:
- `npm run build` 통과

---

## 프로젝트 한줄 요약

**Ruin's City** — 탑다운 캔버스 기반 아레나 생존 게임.  
React는 UI 전용, 실제 게임 로직은 imperative GameLoop 클래스가 담당합니다.

**기술 스택:** React 18 + TypeScript + Vite + Zustand + Tailwind CSS + HTML5 Canvas

---

## 디렉토리 구조 & 역할

```
src/
├── App.tsx                     # React 루트: 씬 라우팅, 메뉴 UI, GameLoop 생명주기
├── main.tsx                    # ReactDOM 진입점
├── index.css                   # Tailwind 기본 스타일
│
├── types/index.ts              # 전역 타입 정의 (Vector2, Player, Enemy, Projectile 등)
│
├── config/
│   ├── constants.ts            # MOBILE_BREAKPOINTS, GAME_COLORS
│   └── gameConfig.ts           # GAME_CONFIG(해상도·초기값), JOYSTICK_CONFIG, EXP_CONFIG
│                                 + getExpMultiplier() 경험치 배율 함수
│
├── store/                      # Zustand 스토어 (도메인별)
│   ├── gameStore.ts            # 씬·게임시간·킬수·스테이지·보스 플래그
│   ├── playerStore.ts          # 플레이어 상태 + 대시 로직
│   ├── enemyStore.ts           # 적 배열 CRUD
│   ├── upgradeStore.ts         # 업그레이드 목록 + applyUpgrade
│   ├── metaProgressionStore.ts # 영구 재화(Scrap/Data), 해금 정보, localStorage 동기화
│   └── storyStore.ts           # 스토리 씬 진행, 선택지, 플래그
│
├── game/
│   ├── GameLoop.ts             # ★ 메인 루프 (update → render, 씬 전환 트리거)
│   ├── EnemySpawner.ts         # 적 스폰률·웨이브·중간보스·최종보스 스폰 판정
│   ├── AutoAttack.ts           # 플레이어 자동/마우스 공격, 발사체 관리
│   ├── Projectile.ts           # 플레이어 투사체 시스템 (ProjectileSystem)
│   ├── EnemyProjectile.ts      # 적 투사체 시스템 (EnemyProjectileSystem)
│   ├── CollisionDetection.ts   # 원 충돌 감지 유틸 (static 메서드)
│   ├── DebugSystem.ts          # FPS·엔티티 카운트 디버그 overlay
│   ├── canvas/
│   │   └── CanvasRenderer.ts   # 캔버스 DPR 설정, 모든 렌더 메서드, 입력 어댑터 보관
│   └── input/
│       ├── KeyboardInput.ts    # WASD + 화살표 키 → movementVector
│       ├── JoystickInput.ts    # 모바일 터치 조이스틱 → movementVector
│       └── MouseInput.ts       # 마우스 위치·좌클릭 상태 추적
│
└── components/
    ├── LevelUpScreen.tsx       # 레벨업 업그레이드 선택 모달
    └── StageClearScreen.tsx    # 스테이지 클리어 결과 화면
```

---

## 핵심 아키텍처 패턴

### React ↔ GameLoop 분리 원칙

| 영역 | 담당 | 주의 |
|------|------|------|
| 메뉴·HUD·모달 UI | React 컴포넌트 (`App.tsx`, `components/`) | React 상태 사용 가능 |
| 실시간 게임 로직 | `GameLoop` 및 하위 클래스 | `useXxxStore.getState()` 로 직접 읽기/쓰기 |
| 씬 전환 트리거 | `GameLoop`가 감지 → `gameStore.setCurrentScene()` | React는 씬 값 구독만 함 |

**중요:** React 컴포넌트 안에서 GameLoop 내부 상태를 직접 조작하지 마세요.  
`App.tsx`가 `gameLoopRef.current?.start()` / `stop()` / `reset()` 만 호출합니다.

---

## 씬(Scene) 흐름

```
menu
 └─(startGame)──→ playing
                    ├─(ESC)──────────→ paused ──(ESC / resume)──→ playing
                    ├─(레벨업 감지)──→ levelUp ──(업그레이드 선택)──→ playing
                    ├─(HP=0)─────────→ gameover
                    └─(최종보스 처치)→ stageClear
```

- `GameScene` 타입: `'menu' | 'playing' | 'paused' | 'levelUp' | 'gameover' | 'story' | 'stageClear'`
- `GameLoop.update()`는 `currentScene !== 'playing'` 이면 조기 리턴합니다.

---

## Zustand 스토어 API 요약

### gameStore
| 상태/액션 | 타입 | 설명 |
|-----------|------|------|
| `currentScene` | `GameScene` | 현재 씬 |
| `gameTime` | `number` | 경과 초 |
| `killCount` | `number` | 킬 수 |
| `finalBossSpawned / Defeated` | `boolean` | 최종보스 플래그 |
| `miniBossCount` | `number` | 중간보스 소환 횟수(최대 3) |
| `resetGameStats()` | — | 게임 통계 초기화 |

### playerStore
| 상태/액션 | 설명 |
|-----------|------|
| `player` | `Player` 객체 전체 |
| `tryDash(dirX, dirY)` | 대시 시도 (쿨다운 체크 포함) |
| `tickDash(dt)` | 대시 타이머 감소 (GameLoop에서 매 프레임 호출) |
| `addPlayerExp(exp)` | 경험치 추가 + 레벨업 자동 처리 |
| `updateStats(partial)` | 플레이어 스탯 일부 덮어쓰기 |
| `resetPlayer()` | 초기 상태로 복원 |

### enemyStore
| 액션 | 설명 |
|------|------|
| `updateEnemies(list)` | 전체 적 배열 교체 (매 프레임) |
| `removeEnemyById(id)` | 특정 적 제거 |
| `resetEnemies()` | 전체 초기화 |

### upgradeStore
- `DEFAULT_UPGRADES`: 6가지 고정 업그레이드 (damage/speed/attackSpeed/health/projectileSpeed/weapon)
- `getRandomUpgrades(n)`: 중복 없이 n개 무작위 추출
- `applyUpgrade(u)`: `activeUpgrades`에 추가 (실제 스탯 변경은 `LevelUpScreen`이 담당)

---

## 적(Enemy) 시스템

### 적 타입별 특성
| 타입 | HP 배율 | 공격력 배율 | 속도 배율 | 특이사항 |
|------|---------|------------|---------|---------|
| `basic` | 1.0× | 1.0× | 1.05× | 기본 근접 |
| `fast` | 0.7× | 0.8× | 1.7× | 고속 돌진 |
| `tank` | 1.8× | 1.2× | 0.675× | 고체력 저속 |
| `shooter` | 0.9× | 0.9× | 0.85× | 원거리 투사체, 사거리 520 |

- **difficultyMultiplier** = `0.6 + gameTime / 30` (0초=0.6배, 60초=2.6배, 180초=6.6배)
- **최대 일반 적 동시 존재**: `MAX_NORMAL_ENEMIES = 80`
- **중간보스(Mini Boss)**: 50초마다 1회, 최대 3회 소환. `MINI_BOSS_LEAP_SPEED = 720`
- **최종보스(Final Boss)**: `gameTime >= 180`초(3분)에 1회 소환. 도지 AI 탑재.
  - 도지 범위: 180px, 속도: 620, 지속시간: 0.28s, 쿨다운: 1.6s

### 스폰 파라미터
```
초기 spawnRate: 1.2 /초
최대 spawnRate: 7.0 /초
증가율: 분당 +1.4
웨이브 사이즈: 1 + floor(gameTime / 20), 최대 6
```

---

## 전투 시스템

### 플레이어 공격 (AutoAttack)
- **자동 공격**: 탐지 범위(400px) 내 가장 가까운 적을 자동 조준
- **마우스 공격**: 좌클릭 시 마우스 방향으로 발사 (자동 공격보다 우선)
- **다중 발사체**: `projectileCount`(1~5발), spread각도 0.25rad (2발일 때 0.15rad)
- `attackCooldown = 1 / player.attackSpeed`

### 투사체 공통
- `GLOBAL_PROJECTILE_SPEED_SCALE = 0.7` (플레이어·적 공통 적용)
- `maxLifetime = 10초`, 캔버스 경계 ±50px 벗어나면 제거

### 대시
- Space 키 또는 `tryDash()` 호출
- 쿨다운: `dashCooldownMs = 1500ms`
- 지속시간: `dashDuration = 0.18s`, 속도: `dashSpeed = 900`

---

## 입력 시스템

| 입력 | 파일 | 우선순위 |
|------|------|---------|
| 키보드 (WASD / ↑↓←→) | `KeyboardInput.ts` | 1순위 |
| 터치 조이스틱 | `JoystickInput.ts` | 2순위 (키보드 없을 때) |
| 마우스 클릭 (공격) | `MouseInput.ts` | 좌클릭만 감지 |
| Space | `GameLoop.setupEventListeners` | 대시 트리거 |
| Escape | `App.tsx handleKeyDown` | pause/resume |
| D 키 | `CanvasRenderer.setupDebugToggle` | 디버그 overlay 토글 |

---

## 캔버스 & 렌더링

- **해상도**: `1920 × 1080` (DPR 적용으로 Retina 대응)
- **배경**: `#1a1a2e` + 플레이어 위치 스크롤 격자 (80px 간격)
- **적 렌더링**: 타입별 도형 (basic=사각형, fast=삼각형, tank=육각형, shooter=오각형, boss=12각형 회전 문양)

---

## 게임 밸런스 핵심 파라미터 (수정 포인트)

| 변경 목적 | 파일 | 위치 |
|-----------|------|------|
| 플레이어 초기 스탯 | `src/config/gameConfig.ts` | `GAME_CONFIG.player` |
| 경험치 증가 곡선 | `src/config/gameConfig.ts` | `EXP_CONFIG`, `getExpMultiplier()` |
| 적 타입별 스탯 | `src/game/EnemySpawner.ts` | `getEnemyStats()` |
| 적 스폰 속도/웨이브 | `src/game/EnemySpawner.ts` | `updateDifficulty()` |
| 레벨업 업그레이드 목록 | `src/store/upgradeStore.ts` | `DEFAULT_UPGRADES` |
| 업그레이드 효과 적용 | `src/components/LevelUpScreen.tsx` | `applyUpgrade()` |
| 최종보스 스폰 타이밍 | `src/game/GameLoop.ts` | `FINAL_BOSS_SPAWN_TIME` |
| 대시 수치 | `src/store/playerStore.ts` | `INITIAL_PLAYER` 의 dash 필드들 |

---

## 개발 워크플로

```bash
npm install      # 의존성 설치
npm run dev      # Vite 개발 서버 (http://localhost:5173)
npm run build    # TypeScript 체크 + Vite 빌드
npm run preview  # 빌드 결과 미리보기
```

---

## 디버깅 팁

- **`D` 키**: 캔버스 디버그 overlay 토글 (FPS, 적 수, 투사체 수, 플레이어 좌표 등)
- **브라우저 콘솔에서 스토어 직접 접근**:
  ```js
  // 예시: 플레이어 HP 강제 변경
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

