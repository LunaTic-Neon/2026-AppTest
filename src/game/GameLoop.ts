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
    const enemyStore = useEnemyStore()

    if (gameStore.currentScene !== 'playing') {
      return
    }

    gameStore.setGameTime(gameStore.gameTime + deltaTime)

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
        enemyStore.addEnemy(enemy)
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
        enemyStore.removeEnemyById(enemy.id)
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

    const projectiles = this.autoAttack.update(deltaTime, player, enemies)

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
      this.renderer.renderProjectiles(this.autoAttack.getProjectiles())

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

      this.debugSystem.update(
        enemyStore.enemies.length,
        this.autoAttack.getProjectiles().length,
        x,
        y,
        hp,
        maxHp,
        level,
        gameStore.gameTime,
        gameStore.killCount,
        gameStore.totalDamageDealt,
        this.enemySpawner.getCurrentSpawnRate()
      )

      this.renderer.renderDebugPanel(this.debugSystem.getStats())
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
