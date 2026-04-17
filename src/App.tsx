import { useEffect, useRef, useState } from 'react'
import { GameLoop } from './game/GameLoop'
import { useGameStore } from './store/gameStore'
import { usePlayerStore } from './store/playerStore'
import { useEnemyStore } from './store/enemyStore'
import LevelUpScreen from './components/LevelUpScreen'
import StageClearScreen from './components/StageClearScreen'

// ── 메뉴 서브페이지 타입 ─────────────────────────────────────
type MenuPage = 'main' | 'story' | 'shop' | 'options'

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<GameLoop | null>(null)
  const gameStore = useGameStore()
  const [menuPage, setMenuPage] = useState<MenuPage>('main')

  useEffect(() => {
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

  const startGame = () => {
    usePlayerStore.getState().resetPlayer()
    useEnemyStore.getState().resetEnemies()
    useGameStore.getState().resetGameStats()
    gameLoopRef.current?.reset()
    useGameStore.getState().setCurrentScene('playing')
    gameLoopRef.current?.start()
  }

  const returnToMenu = () => {
    useGameStore.getState().setCurrentScene('menu')
    gameLoopRef.current?.stop()
    setMenuPage('main')
  }

  const continueGame = () => {
    useGameStore.getState().setCurrentScene('playing')
    gameLoopRef.current?.start()
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

  return (
    <div className="w-full h-screen bg-primary overflow-hidden relative">
      {isPlaying && (
        <button
          className="absolute top-4 left-4 z-20 inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/80 text-xl text-white shadow-lg border border-white/20 hover:bg-black"
          onClick={() => { useGameStore.getState().setCurrentScene('paused'); gameLoopRef.current?.stop() }}
          aria-label="Pause"
        >
          ⚙
        </button>
      )}

      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        style={{ display: 'block', margin: 0, padding: 0 }}
      />

      {/* ── 메인 메뉴 ───────────────────────────────────────── */}
      {gameStore.currentScene === 'menu' && menuPage === 'main' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 text-center px-6">
          {/* 타이틀 */}
          <h1 className="mb-2 text-6xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-400">
            NEXUS
          </h1>
          <p className="mb-12 text-slate-400 text-sm tracking-widest">ROGUELIKE SURVIVAL</p>

          <div className="flex flex-col gap-4 w-56">
            <MenuButton onClick={() => setMenuPage('story')} primary>
              스토리
            </MenuButton>
            <MenuButton onClick={() => setMenuPage('shop')}>
              상점
            </MenuButton>
            <MenuButton onClick={() => setMenuPage('options')}>
              옵션
            </MenuButton>
          </div>
        </div>
      )}

      {/* ── 스토리 (스테이지 선택) ─────────────────────────── */}
      {gameStore.currentScene === 'menu' && menuPage === 'story' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 px-6">
          <div className="w-full max-w-xl">
            {/* 헤더 */}
            <div className="flex items-center mb-8">
              <button
                className="mr-4 text-slate-400 hover:text-white transition text-2xl"
                onClick={() => setMenuPage('main')}
              >
                ←
              </button>
              <h2 className="text-3xl font-bold text-white">스토리</h2>
            </div>

            {/* 챕터 */}
            <div className="mb-4 text-xs text-cyan-400 font-semibold tracking-widest uppercase">
              Chapter 1 — 침략의 서막
            </div>

            {/* 스테이지 목록 */}
            <div className="grid grid-cols-3 gap-4">
              {/* 1-1 해금 */}
              <button
                className="group relative bg-slate-800 border-2 border-cyan-500 rounded-xl p-5 text-center hover:border-cyan-300 hover:shadow-lg hover:shadow-cyan-500/20 transition"
                onClick={startGame}
              >
                <div className="text-2xl font-black text-cyan-400 group-hover:text-cyan-200 transition">1-1</div>
                <div className="text-xs text-slate-400 mt-1">전초기지</div>
                <div className="mt-2 text-xs text-cyan-600">▶ 시작</div>
              </button>

              {/* 1-2 잠금 */}
              {[2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-slate-900 border-2 border-slate-700 rounded-xl p-5 text-center opacity-50 cursor-not-allowed"
                >
                  <div className="text-2xl font-black text-slate-600">1-{n}</div>
                  <div className="text-xs text-slate-600 mt-1">잠금</div>
                  <div className="mt-2 text-xs text-slate-700">🔒</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 상점 (미구현) ───────────────────────────────────── */}
      {gameStore.currentScene === 'menu' && menuPage === 'shop' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 px-6">
          <div className="w-full max-w-xl">
            <div className="flex items-center mb-8">
              <button className="mr-4 text-slate-400 hover:text-white transition text-2xl" onClick={() => setMenuPage('main')}>←</button>
              <h2 className="text-3xl font-bold text-white">상점</h2>
            </div>
            <div className="text-center text-slate-500 py-20 border-2 border-dashed border-slate-700 rounded-xl">
              <div className="text-5xl mb-4">🛒</div>
              <p className="text-lg">준비 중입니다</p>
            </div>
          </div>
        </div>
      )}

      {/* ── 옵션 (미구현) ───────────────────────────────────── */}
      {gameStore.currentScene === 'menu' && menuPage === 'options' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 px-6">
          <div className="w-full max-w-xl">
            <div className="flex items-center mb-8">
              <button className="mr-4 text-slate-400 hover:text-white transition text-2xl" onClick={() => setMenuPage('main')}>←</button>
              <h2 className="text-3xl font-bold text-white">옵션</h2>
            </div>
            <div className="text-center text-slate-500 py-20 border-2 border-dashed border-slate-700 rounded-xl">
              <div className="text-5xl mb-4">⚙️</div>
              <p className="text-lg">준비 중입니다</p>
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
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="bg-slate-900 border-2 border-cyan-400 rounded-lg p-8 max-w-md w-full mx-4 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">일시정지</h2>
            <div className="flex gap-4 justify-center">
              <button
                className="rounded bg-cyan-500 px-6 py-3 font-semibold text-slate-950"
                onClick={continueGame}
              >
                계속하기
              </button>
              <button
                className="rounded bg-gray-700 px-6 py-3 font-semibold text-white"
                onClick={returnToMenu}
              >
                메인화면으로
              </button>
            </div>
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
