import { CanvasRenderer } from './canvas/CanvasRenderer'
import { useGameStore } from '../store/gameStore'
import { usePlayerStore } from '../store/playerStore'
import { useEnemyStore } from '../store/enemyStore'
import { GAME_CONFIG, getExpMultiplier } from '../config/gameConfig'
import { Player } from '../types'
import { EnemySpawner } from './EnemySpawner'
import { AutoAttack } from './AutoAttack'
import { CollisionDetection } from './CollisionDetection'
import { EnemyProjectileSystem } from './EnemyProjectile'
// DebugSystem removed (unused) to avoid unused variable warnings

export class GameLoop {
  private renderer: CanvasRenderer
  private lastTime: number = 0
  private gameLoopId: number | null = null
  private isRunning: boolean = false
  private enemySpawner: EnemySpawner
  private autoAttack: AutoAttack
  private enemyProjectileSystem: EnemyProjectileSystem
  private lastPlayerLevel: number = 1

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new CanvasRenderer(canvas)
    this.enemySpawner = new EnemySpawner()
  this.autoAttack = new AutoAttack()
  this.enemyProjectileSystem = new EnemyProjectileSystem()
    this.setupEventListeners()
    this.enemySpawner.reset()
  }

  public reset() {
    this.enemySpawner.reset()
    this.autoAttack.reset()
  this.enemyProjectileSystem.reset()
  }

  private setupEventListeners() {
    window.addEventListener('resize', () => this.renderer.resize())
    // dash on Space
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        const playerStore = usePlayerStore.getState()
        const player = playerStore.player

        // prefer movement vector from keyboard/joystick
        const keyboard = this.renderer.getKeyboardInput()
        const joystick = this.renderer.getJoystickInput()
        let mv = keyboard.getMovementVector()
        if (mv.x === 0 && mv.y === 0) mv = joystick.getMovementVector()

        if (mv.x !== 0 || mv.y !== 0) {
          usePlayerStore.getState().tryDash(mv.x, mv.y)
        } else {
          // dash forward in facing direction
          const nx = Math.cos(player.rotation)
          const ny = Math.sin(player.rotation)
          usePlayerStore.getState().tryDash(nx, ny)
        }
      }
    })
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

    // Dash handling: if a dash is active, apply dash velocity and decrement timer.
    if (player.dashTimeRemaining && player.dashTimeRemaining > 0) {
      // apply dash movement directly to position with bounds clamping
      const dv = player.dashVelocity || { x: 0, y: 0 }
      const canvasSize = this.renderer.getCanvasSize()
      const padding = player.radius

      const targetX = Math.max(padding, Math.min(player.x + dv.x * deltaTime, canvasSize.width - padding))
      const targetY = Math.max(padding, Math.min(player.y + dv.y * deltaTime, canvasSize.height - padding))

      playerStore.setPlayerPosition(targetX, targetY)
      playerStore.setPlayerVelocity(dv.x, dv.y)

      // decrement timer via store helper
      usePlayerStore.getState().tickDash(deltaTime)

      // when finished, ensure velocity cleared
      if ((usePlayerStore.getState().player.dashTimeRemaining || 0) <= 0) {
        playerStore.setPlayerVelocity(0, 0)
      }
    } else {
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

    // spawn boss every 60 seconds
    if (this.enemySpawner.shouldSpawnBoss()) {
      const boss = this.enemySpawner.spawnBoss(player.x, player.y)
      enemies.push(boss)
    }
    
    for (const enemy of enemies) {
      // boss special behavior: hexagon charge + 6-way shooting
      if ((enemy as any).id?.startsWith('boss_')) {
        // set velocity towards player for charge
        const dx = player.x - enemy.x
        const dy = player.y - enemy.y
        const dist = Math.hypot(dx, dy) || 1
        // charge in short bursts
        const chargeSpeed = (enemy as any).chargeSpeed || enemy.moveSpeed * 3
        const chargeDuration = (enemy as any).chargeDuration || 1.2
        ;(enemy as any).chargeTimer = ((enemy as any).chargeTimer || 0) + deltaTime
        if ((enemy as any).chargeTimer <= chargeDuration) {
          enemy.velocity.x = (dx / dist) * chargeSpeed
          enemy.velocity.y = (dy / dist) * chargeSpeed
        } else {
          // slow down after charge
          enemy.velocity.x *= 0.9
          enemy.velocity.y *= 0.9
          if ((enemy as any).chargeTimer > chargeDuration + 1.0) {
            ;(enemy as any).chargeTimer = 0
          }
        }

        // hexagonal orbiting movement (small) for visual
        // small hex offset for visual (assign once per boss)
        let hexOffset = (enemy as any).hexOffset as number | undefined
        if (typeof hexOffset !== 'number') {
          hexOffset = Math.random() * Math.PI * 2;
          (enemy as any).hexOffset = hexOffset;
        }
        const t = this.enemySpawner.getCurrentSpawnRate() // reuse to vary
        enemy.x += Math.cos(t + hexOffset) * 0.01;
        enemy.y += Math.sin(t + hexOffset) * 0.01;

        // shooting: every attackCooldown fire 6-way pattern
        (enemy as any).attackTimer = ((enemy as any).attackTimer || 0) + deltaTime;
        const attackCooldown = (enemy as any).attackCooldown || 2.0
        if ((enemy as any).attackTimer >= attackCooldown) {
          (enemy as any).attackTimer = 0
          // fire 6 directions
          for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2
            this.enemyProjectileSystem.createProjectile(
              enemy.x,
              enemy.y,
              enemy.x + Math.cos(angle) * 100,
              enemy.y + Math.sin(angle) * 100,
              enemy.attackPower,
              (enemy as any).projectileSpeed || 400
            )
          }
        }
      }

      const dx = player.x - enemy.x
      const dy = player.y - enemy.y
      const distance = Math.hypot(dx, dy)

      if (distance > 0) {
        enemy.velocity.x = (dx / distance) * enemy.moveSpeed
        enemy.velocity.y = (dy / distance) * enemy.moveSpeed
      }

      enemy.x += enemy.velocity.x * deltaTime
      enemy.y += enemy.velocity.y * deltaTime

      // shooter attack logic
      if (enemy.type === 'shooter') {
        enemy.attackTimer = (enemy.attackTimer || 0) + deltaTime
        const attackRange = enemy.attackRange || 400
        const attackCooldown = enemy.attackCooldown || 1.2
        if (Math.hypot(player.x - enemy.x, player.y - enemy.y) <= attackRange) {
          if ((enemy.attackTimer || 0) >= attackCooldown) {
            // fire a projectile at player
            this.enemyProjectileSystem.createProjectile(enemy.x, enemy.y, player.x, player.y, enemy.attackPower, enemy.projectileSpeed || 500)
            enemy.attackTimer = 0
          }
        }
      }
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

          const baseExp = Math.max(10, Math.floor(enemy.maxHp / 2))
          const multiplier = getExpMultiplier(gameStore.gameTime)
          const expGained = Math.max(1, Math.floor(baseExp * multiplier))
          playerStore.addPlayerExp(expGained)

          enemies.splice(enemyIndex, 1)
        }
      }
    }

    const collidingEnemy = CollisionDetection.checkPlayerEnemyCollision(player, enemies)
    if (collidingEnemy) {
      playerStore.setPlayerHP(player.hp - collidingEnemy.attackPower * 0.016)
    }

    // Update enemy projectiles and check collisions against player
    this.enemyProjectileSystem.update(GAME_CONFIG.gameplay.deltaTimeMax, this.renderer.getCanvasSize().width, this.renderer.getCanvasSize().height)
    const enemyProjectiles = this.enemyProjectileSystem.getProjectiles()
    for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
      const p = enemyProjectiles[i]
      if (CollisionDetection.checkCircleCollision(player, player.radius, p, p.radius)) {
        playerStore.setPlayerHP(player.hp - p.damage)
        this.enemyProjectileSystem.removeProjectile(i)
      }
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
  this.renderer.renderProjectiles(this.enemyProjectileSystem.getProjectiles())

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
