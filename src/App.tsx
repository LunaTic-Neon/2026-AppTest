import { useEffect, useRef, useState } from 'react'
import { GameLoop } from './game/GameLoop'
import { useGameStore } from './store/gameStore'
import { usePlayerStore } from './store/playerStore'
import { useEnemyStore } from './store/enemyStore'
import { useMetaProgressionStore } from './store/metaProgressionStore'
import LevelUpScreen from './components/LevelUpScreen'
import StageClearScreen from './components/StageClearScreen'
import RuinedCityBackground from './components/RuinedCityBackground'
import StoryDialogScreen from './components/StoryDialogScreen'
import SettingsPanel from './components/SettingsPanel'
import { StageId, STAGE_STORY_MAP } from './config/storyDialogs'

// ── 메뉴 서브페이지 타입 ─────────────────────────────────────
type MenuPage = 'main' | 'story' | 'shop' | 'options'

// ── 메뉴 언어 텍스트 ──────────────────────────────────────
const MENU_TEXT = {
  ko: { subtitle: 'SURVIVE THE RUINS', play: '플레이', store: '스토어', settings: '설정', gold: '골드' },
  en: { subtitle: 'SURVIVE THE RUINS', play: 'PLAY', store: 'STORE', settings: 'SETTINGS', gold: 'GOLD' },
  ja: { subtitle: '廃境を生き延びろ', play: 'プレイ', store: 'ショップ', settings: '設定', gold: 'ゴールド' },
} as const

const SPEED_SHOP_ITEMS = [
  { scale: 1.1, cost: 900 },
  { scale: 1.2, cost: 1600 },
  { scale: 1.3, cost: 2500 },
  { scale: 1.5, cost: 4000 },
]

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<GameLoop | null>(null)
  const gameStore = useGameStore()
  const metaStore = useMetaProgressionStore()
  const [menuPage, setMenuPage] = useState<MenuPage>('main')
  const [selectedStage, setSelectedStage] = useState<StageId | null>(null)
  const [activeStage, setActiveStage] = useState<StageId | null>(null)
  const [prologueRewardMsg, setPrologueRewardMsg] = useState<string | null>(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  useEffect(() => {
    useMetaProgressionStore.getState().loadFromLocalStorage()

    if (!canvasRef.current) return

    gameLoopRef.current = new GameLoop(canvasRef.current)

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const currentScene = useGameStore.getState().currentScene
        if (currentScene === 'playing') {
          useGameStore.getState().setCurrentScene('paused')
          gameLoopRef.current?.stop()
        } else if (currentScene === 'paused') {
          useGameStore.getState().setCurrentScene('playing')
          gameLoopRef.current?.start()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      gameLoopRef.current?.destroy()
    }
  }, [])

  // 스테이지 클리어 시 클리어 기록
  useEffect(() => {
    if (gameStore.currentScene === 'stageClear' && activeStage && activeStage !== 'prologue') {
      useMetaProgressionStore.getState().markStageCleared(activeStage)
    }
  }, [gameStore.currentScene])

  const startGame = () => {
    usePlayerStore.getState().resetPlayer()
    useEnemyStore.getState().resetEnemies()
    useGameStore.getState().resetGameStats()
    gameLoopRef.current?.reset()
    useGameStore.getState().setCurrentScene('playing')
    gameLoopRef.current?.start()
  }

  const startStage = (stageId: StageId) => {
    setActiveStage(stageId)
    startGame()
  }

  const returnToMenu = () => {
    useGameStore.getState().setCurrentScene('menu')
    gameLoopRef.current?.stop()
    setMenuPage('main')
    setSelectedStage(null)
  }

  const continueGame = () => {
    useGameStore.getState().setCurrentScene('playing')
    gameLoopRef.current?.start()
  }

  const buyTimeScale = (scale: number, cost: number) => {
    const ok = useMetaProgressionStore.getState().purchaseTimeScale(scale, cost)
    if (ok) {
      useMetaProgressionStore.getState().setSelectedTimeScale(scale)
    }
  }

  const performDash = () => {
    const playerStore = usePlayerStore.getState()
    const player = playerStore.player
    const keyboard = gameLoopRef.current ? (gameLoopRef.current as any).renderer.getKeyboardInput() : null
    const joystick = gameLoopRef.current ? (gameLoopRef.current as any).renderer.getJoystickInput() : null
    let mv = { x: 0, y: 0 }
    if (keyboard) mv = keyboard.getMovementVector()
    if ((mv.x === 0 && mv.y === 0) && joystick) mv = joystick.getMovementVector()
    if (mv.x !== 0 || mv.y !== 0) {
      usePlayerStore.getState().tryDash(mv.x, mv.y)
    } else {
      const nx = Math.cos(player.rotation)
      const ny = Math.sin(player.rotation)
      usePlayerStore.getState().tryDash(nx, ny)
    }
  }

  const isPlaying = gameStore.currentScene === 'playing'
  const lang = metaStore.language ?? 'ko'
  const t = MENU_TEXT[lang]

  // ── 개발자 모드: 시간 조작 (프로덕션에서 제거 가능) ──────
  const devSetGameTime = (seconds: number) => {
    gameLoopRef.current?.devSyncTime(seconds)
  }

  return (
    <div className="w-full h-screen bg-primary overflow-hidden relative flex items-center justify-center">
      {isPlaying && (
        <button
          className="absolute top-4 left-4 z-20 inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/80 text-xl text-white shadow-lg border border-white/20 hover:bg-black"
          onClick={() => { useGameStore.getState().setCurrentScene('paused'); gameLoopRef.current?.stop() }}
          aria-label="Pause"
        >
          ⚙
        </button>
      )}

      {/* ── 개발자 모드: 시간 조작 버튼 (DEV_MODE 활성화 시만 표시) ── */}
      {isPlaying && (
        <div className="absolute bottom-4 left-4 z-20 flex gap-2">
          <button
            className="px-3 py-1 text-xs bg-yellow-600/80 text-white rounded hover:bg-yellow-600 transition"
            onClick={() => devSetGameTime(45)}
            title="45초: 중간보스 확인"
          >
            [DEV] 45s
          </button>
          <button
            className="px-3 py-1 text-xs bg-red-600/80 text-white rounded hover:bg-red-600 transition"
            onClick={() => devSetGameTime(175)}
            title="175초(2:55): 최종보스 직전"
          >
            [DEV] 2:55
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="block max-w-full max-h-full aspect-[16/9]"
        style={{ display: 'block', width: '100%', height: 'auto', margin: 0, padding: 0 }}
      />

      {/* ── 메인 메뉴 ───────────────────────────────────────── */}
      {gameStore.currentScene === 'menu' && menuPage === 'main' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center px-6">
          <RuinedCityBackground />
          <div className="absolute top-6 right-6 rounded-lg border border-amber-400/60 bg-black/50 px-4 py-2 text-sm font-semibold text-amber-300">
            GOLD {metaStore.totalGold.toLocaleString()}
          </div>

          {/* 타이틀 */}
          <h1 className="mb-2 text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-400">
            Ruin's City
          </h1>
          <p className="mb-12 text-slate-400 text-sm tracking-widest">{t.subtitle}</p>

          <div className="flex flex-col gap-4 w-56">
            <MenuButton onClick={() => setMenuPage('story')} primary>
              {t.play}
            </MenuButton>
            <MenuButton onClick={() => setMenuPage('shop')}>
              {t.store}
            </MenuButton>
            <MenuButton onClick={() => setMenuPage('options')}>
              {t.settings}
            </MenuButton>
          </div>
        </div>
      )}

      {/* ── 스토리 (스테이지 선택) ─────────────────────────── */}
      {gameStore.currentScene === 'menu' && menuPage === 'story' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center px-6">
          <RuinedCityBackground />
          <div className="w-full max-w-4xl">
            {/* 헤더 */}
            <div className="flex items-center mb-8">
              <button
                className="mr-4 text-slate-400 hover:text-white transition text-2xl"
                onClick={() => {
                  setSelectedStage(null)
                  setMenuPage('main')
                }}
              >
                ←
              </button>
              <h2 className="text-3xl font-bold text-white">PLAY</h2>
            </div>

            {/* 챕터 */}
            <div className="mb-4 text-xs text-cyan-400 font-semibold tracking-widest uppercase">
              Chapter 1 — 침략의 서막
            </div>

            {/* 스테이지 목록 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(
                [
                  { id: 'prologue', label: 'PROLOGUE', subtitle: '잔해의 도시', accent: 'amber' },
                  { id: '1-1', label: '1-1', subtitle: '전초기지', accent: 'cyan' },
                  { id: '1-2', label: '1-2', subtitle: '붕괴 고속도로', accent: 'violet' },
                  { id: '1-3', label: '1-3', subtitle: '침묵의 코어', accent: 'emerald' },
                ] as Array<{ id: StageId; label: string; subtitle: string; accent: 'amber' | 'cyan' | 'violet' | 'emerald' }>
              ).map((stage) => {
                const cleared = metaStore.clearedStages.includes(stage.id)
                return (
                  <button
                    key={stage.id}
                    className={`group relative rounded-xl p-5 text-center border-2 transition shadow-lg bg-slate-900/90 ${
                      stage.accent === 'amber'
                        ? 'border-amber-500/70 hover:border-amber-300 hover:shadow-amber-500/20'
                        : stage.accent === 'cyan'
                          ? 'border-cyan-500/70 hover:border-cyan-300 hover:shadow-cyan-500/20'
                          : stage.accent === 'violet'
                            ? 'border-violet-500/70 hover:border-violet-300 hover:shadow-violet-500/20'
                            : 'border-emerald-500/70 hover:border-emerald-300 hover:shadow-emerald-500/20'
                    }`}
                    onClick={() => setSelectedStage(stage.id)}
                  >
                    {cleared && (
                      <div className="absolute top-2 right-2 text-emerald-400 text-lg leading-none font-bold">✓</div>
                    )}
                    <div className="text-2xl font-black text-white group-hover:text-slate-100 transition">{stage.label}</div>
                    <div className="text-xs text-slate-400 mt-1">{stage.subtitle}</div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 스토리 대화창 ───────────────────────────────────── */}
      {gameStore.currentScene === 'menu' && menuPage === 'story' && selectedStage && (
        <div className="absolute inset-0 z-40">
          <RuinedCityBackground />
          <StoryDialogScreen
            stageTitle={STAGE_STORY_MAP[selectedStage].title}
            stageSubtitle={STAGE_STORY_MAP[selectedStage].subtitle}
            lines={STAGE_STORY_MAP[selectedStage].lines}
            onBack={() => setSelectedStage(null)}
            onComplete={() => {
              const stage = selectedStage
              setSelectedStage(null)
              if (stage === 'prologue') {
                useMetaProgressionStore.getState().markStageCleared('prologue')
                const isNew = useMetaProgressionStore.getState().grantPrologueReward()
                setPrologueRewardMsg(isNew ? '초회 보상: 금화 500개 획득!' : '프롤로그 클리어!')
                setTimeout(() => setPrologueRewardMsg(null), 3000)
              } else if (stage) {
                startStage(stage)
              }
            }}
          />
        </div>
      )}

      {/* ── 상점 (미구현) ───────────────────────────────────── */}
      {/* ── 프롤로그 보상 알림 ─────────────────────────────── */}
      {prologueRewardMsg && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="rounded-xl border-2 border-amber-400 bg-black/85 px-8 py-5 text-center shadow-2xl">
            <div className="text-4xl mb-2">🏆</div>
            <div className="text-amber-300 text-xl font-bold">{prologueRewardMsg}</div>
          </div>
        </div>
      )}

      {gameStore.currentScene === 'menu' && menuPage === 'shop' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center px-6">
          <RuinedCityBackground />
          <div className="w-full max-w-4xl">
            <div className="flex items-center mb-8">
              <button className="mr-4 text-slate-400 hover:text-white transition text-2xl" onClick={() => setMenuPage('main')}>←</button>
              <h2 className="text-3xl font-bold text-white">STORE</h2>
            </div>

            <div className="mb-5 rounded-lg border border-amber-400/60 bg-black/50 px-4 py-2 text-sm font-semibold text-amber-300 inline-flex">
              GOLD {metaStore.totalGold.toLocaleString()}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SPEED_SHOP_ITEMS.map((item, idx) => {
                const unlocked = metaStore.unlockedTimeScales.includes(item.scale)
                const prevItem = idx > 0 ? SPEED_SHOP_ITEMS[idx - 1] : null
                const prerequisiteMet = !prevItem || metaStore.unlockedTimeScales.includes(prevItem.scale)
                return (
                  <div key={item.scale} className="rounded-xl border border-cyan-500/50 bg-slate-900/90 p-5">
                    <div className="mb-2 text-xs text-cyan-300 tracking-wider">SYSTEM UPGRADE</div>
                    <div className="text-3xl font-black text-white mb-1">x{item.scale.toFixed(1)}</div>
                    <p className="text-sm text-slate-400 mb-4">게임 속도를 {item.scale.toFixed(1)}배로 설정 가능</p>
                    <div className="mb-4 text-amber-300 font-bold">{item.cost.toLocaleString()} G</div>
                    {unlocked ? (
                      <div className="rounded bg-emerald-700/70 px-4 py-2 text-center text-sm font-semibold text-emerald-100">구매 완료</div>
                    ) : !prerequisiteMet ? (
                      <div className="rounded bg-slate-700/70 px-4 py-2 text-center text-sm font-semibold text-slate-400">해금 조건: x{prevItem!.scale.toFixed(1)} 선구매</div>
                    ) : (
                      <button
                        className="w-full rounded bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-40"
                        disabled={metaStore.totalGold < item.cost}
                        onClick={() => buyTimeScale(item.scale, item.cost)}
                      >
                        {metaStore.totalGold < item.cost ? '골드 부족' : '구매'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 옵션 ────────────────────────────────────────────── */}
      {gameStore.currentScene === 'menu' && menuPage === 'options' && (
        <div className="absolute inset-0 z-30 overflow-y-auto px-6 py-8">
          <RuinedCityBackground />
          <div className="relative w-full max-w-xl mx-auto">
            <div className="flex items-center mb-8">
              <button className="mr-4 text-slate-400 hover:text-white transition text-2xl" onClick={() => setMenuPage('main')}>←</button>
              <h2 className="text-3xl font-bold text-white">SETTINGS</h2>
            </div>
            <SettingsPanel />
            <div className="mt-6">
              {!showResetConfirm ? (
                <button
                  className="w-full rounded border border-red-700 bg-red-900/40 px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-800/60 transition"
                  onClick={() => setShowResetConfirm(true)}
                >
                  게임 초기화
                </button>
              ) : (
                <div className="rounded border border-red-500 bg-red-950/80 px-4 py-4 text-sm text-red-300">
                  <p className="mb-3 font-semibold">⚠ 모든 진행 상황(골드, 구매 내역, 스테이지 클리어, 언어 등)이 초기화됩니다. 계속하시겠습니까?</p>
                  <div className="flex gap-3">
                    <button
                      className="flex-1 rounded bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-500 transition"
                      onClick={() => {
                        useMetaProgressionStore.getState().resetAllProgress()
                        setShowResetConfirm(false)
                      }}
                    >
                      확인 (초기화)
                    </button>
                    <button
                      className="flex-1 rounded bg-slate-700 px-4 py-2 font-bold text-white hover:bg-slate-600 transition"
                      onClick={() => setShowResetConfirm(false)}
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 레벨업 ──────────────────────────────────────────── */}
      {gameStore.currentScene === 'levelUp' && (
        <LevelUpScreen />
      )}

      {/* ── 스테이지 클리어 ─────────────────────────────────── */}
      {gameStore.currentScene === 'stageClear' && (
        <StageClearScreen
          onReturnToMenu={returnToMenu}
          onRestart={() => { setMenuPage('main'); startGame() }}
        />
      )}

      {/* ── 일시정지 ────────────────────────────────────────── */}
      {gameStore.currentScene === 'paused' && (
        <div className="absolute inset-0 z-40 overflow-y-auto bg-black/60 flex items-start justify-center py-4">
          <div className="bg-slate-900 border-2 border-cyan-400 rounded-lg p-4 sm:p-6 max-w-2xl w-full mx-4 text-center my-auto">
            <h2 className="text-xl font-bold text-white mb-3">일시정지</h2>
            <div className="flex gap-2 justify-center mb-3 flex-wrap">
              <button
                className="rounded bg-cyan-500 px-5 py-2 font-semibold text-slate-950 text-sm"
                onClick={continueGame}
              >
                계속하기
              </button>
              <button
                className="rounded bg-gray-700 px-5 py-2 font-semibold text-white text-sm"
                onClick={returnToMenu}
              >
                메인화면으로
              </button>
            </div>
            <SettingsPanel compact />
          </div>
        </div>
      )}

      {/* ── 대시 버튼 ───────────────────────────────────────── */}
      {gameStore.currentScene === 'playing' && (
        <div className="absolute bottom-12 right-12 z-30">
          <DashButton onClick={performDash} />
        </div>
      )}
    </div>
  )
}

export default App

// ── 공통 메뉴 버튼 ────────────────────────────────────────────
function MenuButton({ children, onClick, primary }: { children: React.ReactNode; onClick: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full py-4 rounded-full text-lg font-bold transition shadow-lg ${
        primary
          ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-cyan-500/30'
          : 'bg-slate-800 text-white border border-slate-600 hover:bg-slate-700'
      }`}
    >
      {children}
    </button>
  )
}

// ── 대시 버튼 ─────────────────────────────────────────────────
function DashButton({ onClick }: { onClick: () => void }) {
  const [progress, setProgress] = useState(1) // 1 = 완충, 0 = 쿨다운 직후
  const player = usePlayerStore((s) => s.player)

  useEffect(() => {
    let raf = 0
    const loop = () => {
      const now = Date.now()
      const last = (player as any).dashLastAt || 0
      const cd = (player as any).dashCooldownMs || 1500
      const elapsed = Math.max(0, now - last)
      setProgress(Math.min(1, elapsed / cd))
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [(player as any).dashLastAt, (player as any).dashCooldownMs])

  const ready = progress >= 1
  const SIZE = 64
  const STROKE = 5
  const r = (SIZE - STROKE) / 2
  const circ = 2 * Math.PI * r
  // strokeDashoffset: 0 = 완충(꽉참), circ = 비어있음
  const offset = circ * (1 - progress)

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      {/* 버튼 */}
      <div
        className="relative cursor-pointer"
        style={{ width: SIZE, height: SIZE }}
        onClick={ready ? onClick : undefined}
      >
        {/* 트랙 링 (어두운 배경) */}
        <svg
          width={SIZE} height={SIZE}
          className="absolute inset-0"
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* 배경 원 */}
          <circle
            cx={SIZE / 2} cy={SIZE / 2} r={r}
            stroke="#0e3a3a"
            strokeWidth={STROKE}
            fill="none"
          />
          {/* 진행 호 (시계방향 fill) */}
          <circle
            cx={SIZE / 2} cy={SIZE / 2} r={r}
            stroke={ready ? '#00e5ff' : '#0097a7'}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke 0.2s' }}
          />
        </svg>

        {/* 내부 버튼 원 */}
        <button
          aria-label="Dash"
          onClick={ready ? onClick : undefined}
          className="absolute rounded-full flex items-center justify-center transition-all duration-200"
          style={{
            inset: STROKE + 2,
            background: ready
              ? 'radial-gradient(circle at 40% 35%, #00e5ff 0%, #006670 100%)'
              : 'radial-gradient(circle at 40% 35%, #1a3a3a 0%, #0a1f1f 100%)',
            boxShadow: ready ? '0 0 14px 2px rgba(0,229,255,0.45)' : 'none',
          }}
        >
          {/* 대시 아이콘 */}
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path
              d="M4 11h14M13 6l5 5-5 5"
              stroke={ready ? '#ffffff' : '#3a6060'}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* 라벨 */}
      <span
        className="text-xs font-semibold tracking-widest uppercase"
        style={{ color: ready ? '#00e5ff' : '#2a5a5a', letterSpacing: '0.12em' }}
      >
        {ready ? 'DASH' : 'WAIT'}
      </span>
    </div>
  )
}
