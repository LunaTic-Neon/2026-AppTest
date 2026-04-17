import { useEffect, useRef, useState } from 'react'
import { GameLoop } from './game/GameLoop'
import { useGameStore } from './store/gameStore'
import { usePlayerStore } from './store/playerStore'
import { useEnemyStore } from './store/enemyStore'
import LevelUpScreen from './components/LevelUpScreen'

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<GameLoop | null>(null)
  const gameStore = useGameStore()

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

      {gameStore.currentScene === 'menu' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 text-center px-6">
          <h1 className="mb-6 text-5xl font-extrabold text-white">Roguelike Survival</h1>
          <p className="mb-10 max-w-xl text-lg text-slate-200">
            Click START to enter the arena. Use WASD or joystick to move, left click to shoot.
          </p>
          <button
            className="rounded-full bg-cyan-500 px-10 py-4 text-lg font-semibold text-slate-950 shadow-2xl shadow-cyan-500/30 transition hover:bg-cyan-400"
            onClick={startGame}
          >
            START
          </button>
        </div>
      )}

      {gameStore.currentScene === 'levelUp' && (
        <LevelUpScreen />
      )}

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

      {/* Dash button bottom-right */}
      {gameStore.currentScene === 'playing' && (
        <div className="absolute bottom-12 right-12 z-30">
          <DashButton onClick={performDash} />
        </div>
      )}
    </div>
  )
}

export default App

function DashButton({ onClick }: { onClick: () => void }) {
  const [progress, setProgress] = useState(1)
  const player = usePlayerStore((s) => s.player)

  useEffect(() => {
    let raf = 0
    const loop = () => {
      const now = Date.now()
      const last = player.dashLastAt || 0
      const cd = player.dashCooldownMs || 2000
      const elapsed = Math.max(0, now - last)
      const p = Math.min(1, elapsed / cd)
      setProgress(p)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [player.dashLastAt, player.dashCooldownMs])

  const size = 48
  const stroke = 4
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  const strokeOpacity = 0.35 + 0.65 * progress

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* background ring */}
      <svg width={size} height={size} className="absolute top-0 left-0">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#0b7270"
          strokeWidth={stroke}
          fill="transparent"
        />
      </svg>

      {/* foreground sweep (on top) */}
      <svg width={size} height={size} className="absolute top-0 left-0 pointer-events-none">
        <defs>
          <linearGradient id="dashGrad" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity={Math.max(0.2, strokeOpacity)} />
            <stop offset="100%" stopColor="#06f" stopOpacity={Math.max(0.6, strokeOpacity)} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#dashGrad)"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          strokeLinecap="round"
          fill="transparent"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>

      <button
        onClick={onClick}
        className="relative rounded-full bg-cyan-700 w-11 h-11 flex items-center justify-center shadow-lg"
        aria-label="Dash"
      >
        <span className="text-white text-base">⇢</span>
      </button>
    </div>
  )
}
