import { CanvasRenderer } from './canvas/CanvasRenderer'
import { useGameStore } from '../store/gameStore'
import { usePlayerStore } from '../store/playerStore'
import { useEnemyStore } from '../store/enemyStore'
import { GAME_CONFIG } from '../config/gameConfig'
import { Player } from '../types'

export class GameLoop {
  private renderer: CanvasRenderer
  private lastTime: number = 0
  private gameLoopId: number | null = null
  private isRunning: boolean = false

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new CanvasRenderer(canvas)
    this.setupEventListeners()
  }

  private setupEventListeners() {
    window.addEventListener('resize', () => this.renderer.resize())
  }

  public start() {
    if (this.isRunning) return

    this.isRunning = true
    this.lastTime = Date.now()

    const gameLoop = (currentTime: number) => {
      const deltaTime = Math.min((currentTime - this.lastTime) / 1000, GAME_CONFIG.gameplay.deltaTimeMax)
      this.lastTime = currentTime

      this.update(deltaTime)
      this.render()

      this.gameLoopId = requestAnimationFrame(gameLoop)
    }

    this.gameLoopId = requestAnimationFrame(gameLoop)
  }

  public stop() {
    if (this.gameLoopId !== null) {
      cancelAnimationFrame(this.gameLoopId)
      this.gameLoopId = null
    }
    this.isRunning = false
  }

  private update(deltaTime: number) {
    const gameStore = useGameStore()
    const playerStore = usePlayerStore()

    if (gameStore.currentScene !== 'playing') {
      return
    }

    gameStore.setGameTime(gameStore.gameTime + deltaTime)

    const joystickInput = this.renderer.getJoystickInput()
    const movementVector = joystickInput.getMovementVector()

    const player = playerStore.player
    const moveSpeed = player.moveSpeed

    if (movementVector.x !== 0 || movementVector.y !== 0) {
      playerStore.setPlayerVelocity(
        movementVector.x * moveSpeed,
        movementVector.y * moveSpeed
      )

      const rotation = Math.atan2(movementVector.y, movementVector.x)
      playerStore.setPlayerRotation(rotation)
    } else {
      playerStore.setPlayerVelocity(0, 0)
    }

    this.updatePlayerPosition(playerStore.player, deltaTime)
  }

  private updatePlayerPosition(player: Player, deltaTime: number) {
    const playerStore = usePlayerStore()
    const canvasSize = this.renderer.getCanvasSize()

    let newX = player.x + player.velocity.x * deltaTime
    let newY = player.y + player.velocity.y * deltaTime

    const padding = player.radius

    newX = Math.max(padding, Math.min(newX, canvasSize.width - padding))
    newY = Math.max(padding, Math.min(newY, canvasSize.height - padding))

    playerStore.setPlayerPosition(newX, newY)
  }

  private render() {
    const gameStore = useGameStore()
    const playerStore = usePlayerStore()
    const enemyStore = useEnemyStore()

    this.renderer.clear()

    if (gameStore.currentScene === 'playing') {
      this.renderer.renderPlayer(playerStore.player)
      this.renderer.renderEnemies(enemyStore.enemies)

      const { hp, maxHp, level, exp, maxExp } = playerStore.player

      this.renderer.renderHUD(
        gameStore.gameTime,
        gameStore.killCount,
        hp,
        maxHp,
        level,
        exp,
        maxExp
      )
    }

    this.renderer.renderJoystick()
  }

  public getCanvasSize() {
    return this.renderer.getCanvasSize()
  }

  public destroy() {
    this.stop()
    this.renderer.destroy()
  }
}
