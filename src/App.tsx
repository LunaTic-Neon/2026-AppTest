import { useEffect, useRef } from 'react'
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
          useGameStore.getState().setCurrentScene('menu')
          gameLoopRef.current?.stop()
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

  const isPlaying = gameStore.currentScene === 'playing'

  return (
    <div className="w-full h-screen bg-primary overflow-hidden relative">
      {isPlaying && (
        <button
          className="absolute top-4 left-4 z-20 inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/80 text-xl text-white shadow-lg border border-white/20 hover:bg-black"
          onClick={returnToMenu}
          aria-label="Open menu"
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
    </div>
  )
}

export default App
