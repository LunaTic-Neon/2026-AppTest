import { CanvasRenderer } from './canvas/CanvasRenderer'
import { useGameStore } from '../store/gameStore'
import { usePlayerStore } from '../store/playerStore'
import { useEnemyStore } from '../store/enemyStore'
import { GAME_CONFIG } from '../config/gameConfig'
import { Player } from '../types'
import { EnemySpawner } from './EnemySpawner'
import { AutoAttack } from './AutoAttack'
import { CollisionDetection } from './CollisionDetection'
import { DebugSystem } from './DebugSystem'

export class GameLoop {
  private renderer: CanvasRenderer
  private lastTime: number = 0
  private gameLoopId: number | null = null
  private isRunning: boolean = false
  private enemySpawner: EnemySpawner
  private autoAttack: AutoAttack
  private debugSystem: DebugSystem
  private lastPlayerLevel: number = 1

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new CanvasRenderer(canvas)
    this.enemySpawner = new EnemySpawner()
    this.autoAttack = new AutoAttack()
    this.debugSystem = new DebugSystem()
    this.setupEventListeners()
    this.enemySpawner.reset()
  }

  public reset() {
    this.enemySpawner.reset()
    this.autoAttack.reset()
  }

  private setupEventListeners() {
    window.addEventListener('resize', () => this.renderer.resize())
  }

  public start() {
    if (this.isRunning) return

    this.isRunning = true
    this.lastTime = performance.now()

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
    const gameStore = useGameStore.getState()
    const playerStore = usePlayerStore.getState()
    const enemyStore = useEnemyStore.getState()

    if (gameStore.currentScene !== 'playing') {
      return
    }

    const newGameTime = gameStore.gameTime + deltaTime
    gameStore.setGameTime(newGameTime)

    this.updatePlayerMovement(playerStore, deltaTime)
    this.updateEnemies(enemyStore, playerStore, gameStore, deltaTime)
    this.updateCombat(enemyStore, playerStore, gameStore)
    this.checkLevelUp(playerStore, gameStore)
  }

  private checkLevelUp(playerStore: any, gameStore: any) {
    const currentLevel = playerStore.player.level
    if (currentLevel > this.lastPlayerLevel) {
      this.lastPlayerLevel = currentLevel
      gameStore.setCurrentScene('levelUp')
    }
  }

  private updatePlayerMovement(playerStore: any, deltaTime: number) {
    const joystickInput = this.renderer.getJoystickInput()
    const keyboardInput = this.renderer.getKeyboardInput()
    
    let movementVector = keyboardInput.getMovementVector()
    
    // 키보드 입력이 없으면 조이스틱 입력 사용
    if (movementVector.x === 0 && movementVector.y === 0) {
      movementVector = joystickInput.getMovementVector()
    }

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

  private updateEnemies(
    enemyStore: any,
    playerStore: any,
    _gameStore: any,
    deltaTime: number
  ) {
    const player = playerStore.player
    const enemies = [...enemyStore.enemies]

    this.enemySpawner.update(deltaTime)

    if (this.enemySpawner.shouldSpawn()) {
      const newEnemies = this.enemySpawner.spawn(player.x, player.y)
      newEnemies.forEach((enemy) => {
        enemies.push(enemy)
      })
    }

    for (const enemy of enemies) {
      const dx = player.x - enemy.x
      const dy = player.y - enemy.y
      const distance = Math.hypot(dx, dy)

      if (distance > 0) {
        enemy.velocity.x = (dx / distance) * enemy.moveSpeed
        enemy.velocity.y = (dy / distance) * enemy.moveSpeed
      }

      enemy.x += enemy.velocity.x * deltaTime
      enemy.y += enemy.velocity.y * deltaTime
    }

    const canvasSize = this.renderer.getCanvasSize()
    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i]
      if (enemy.x < -100 || enemy.x > canvasSize.width + 100 ||
          enemy.y < -100 || enemy.y > canvasSize.height + 100) {
        enemies.splice(i, 1)
      }
    }

    enemyStore.updateEnemies(enemies)
  }

  private updateCombat(
    enemyStore: any,
    playerStore: any,
    gameStore: any
  ) {
    const player = playerStore.player
    const enemies = enemyStore.enemies
    const deltaTime = GAME_CONFIG.gameplay.deltaTimeMax

    // 마우스 입력 가져오기
    const mouseInput = this.renderer.getMouseInput()
    const mousePos = mouseInput.getMousePosition()
    const isMouseClicking = mouseInput.isMouseClicking()

    const projectiles = this.autoAttack.update(
      deltaTime,
      player,
      enemies,
      mousePos.x,
      mousePos.y,
      isMouseClicking
    )

    const collisions = this.autoAttack.checkCollisions(enemies)

    const sortedCollisions = collisions.sort((a, b) => b.projectileIndex - a.projectileIndex)

    for (const { projectileIndex, enemyIndex } of sortedCollisions) {
      if (enemyIndex < enemies.length && projectileIndex < projectiles.length) {
        const projectile = projectiles[projectileIndex]
        const enemy = enemies[enemyIndex]

        enemy.hp -= projectile.damage
        gameStore.addDamage(projectile.damage)

        this.autoAttack.removeProjectileAt(projectileIndex)

        if (enemy.hp <= 0) {
          enemyStore.removeEnemyById(enemy.id)
          gameStore.addKill()

          const expGained = Math.max(10, Math.floor(enemy.maxHp / 2))
          playerStore.addPlayerExp(expGained)

          enemies.splice(enemyIndex, 1)
        }
      }
    }

    const collidingEnemy = CollisionDetection.checkPlayerEnemyCollision(player, enemies)
    if (collidingEnemy) {
      playerStore.setPlayerHP(player.hp - collidingEnemy.attackPower * 0.016)
    }
  }

  private updatePlayerPosition(player: Player, deltaTime: number) {
    const playerStore = usePlayerStore.getState()
    const canvasSize = this.renderer.getCanvasSize()

    let newX = player.x + player.velocity.x * deltaTime
    let newY = player.y + player.velocity.y * deltaTime

    const padding = player.radius

    newX = Math.max(padding, Math.min(newX, canvasSize.width - padding))
    newY = Math.max(padding, Math.min(newY, canvasSize.height - padding))

    playerStore.setPlayerPosition(newX, newY)
  }

  private render() {
    const gameStore = useGameStore.getState()
    const playerStore = usePlayerStore.getState()
    const enemyStore = useEnemyStore.getState()

    const { x, y } = playerStore.player
    this.renderer.clear(x, y)

    if (gameStore.currentScene === 'playing') {
      this.renderer.renderPlayer(playerStore.player)
      this.renderer.renderEnemies(enemyStore.enemies)
      this.renderer.renderProjectiles(this.autoAttack.getProjectiles())

      const mouseInput = this.renderer.getMouseInput()
      const mousePos = mouseInput.getMousePosition()
      const isMouseClicking = mouseInput.isMouseClicking()
      this.renderer.renderAimCursor(mousePos.x, mousePos.y, isMouseClicking)

      const { hp, maxHp, level, exp, maxExp, x, y } = playerStore.player

      this.renderer.renderHUD(
        gameStore.gameTime,
        gameStore.killCount,
        hp,
        maxHp,
        level,
        exp,
        maxExp
      )

      // 플레이어 위에 체력바
      this.renderer.renderPlayerHealthBar(x, y, hp, maxHp)

      // 하단에 경험치바
      this.renderer.renderExperienceBar(exp, maxExp)
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
