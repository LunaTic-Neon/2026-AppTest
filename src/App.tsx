import { useEffect, useRef } from 'react'
import { GameLoop } from './game/GameLoop'
import { useGameStore } from './store/gameStore'
import { usePlayerStore } from './store/playerStore'

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<GameLoop | null>(null)
  const gameStore = useGameStore()
  const playerStore = usePlayerStore()

  useEffect(() => {
    if (!canvasRef.current) return

    gameLoopRef.current = new GameLoop(canvasRef.current)

    gameStore.setCurrentScene('playing')
    playerStore.resetPlayer()

    gameLoopRef.current.start()

    return () => {
      gameLoopRef.current?.destroy()
    }
  }, [])

  return (
    <div className="w-full h-screen bg-primary overflow-hidden">
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        style={{ display: 'block', margin: 0, padding: 0 }}
      />
    </div>
  )
}

export default App
