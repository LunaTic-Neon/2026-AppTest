import { CanvasRenderer } from './canvas/CanvasRenderer'
import { useGameStore } from '../store/gameStore'
import { usePlayerStore } from '../store/playerStore'
import { useEnemyStore } from '../store/enemyStore'
import { GAME_CONFIG, getExpMultiplier } from '../config/gameConfig'
import { Player } from '../types'
import { EnemySpawner, MINI_BOSS_LEAP_SPEED } from './EnemySpawner'
import { AutoAttack } from './AutoAttack'
import { CollisionDetection } from './CollisionDetection'
import { EnemyProjectileSystem } from './EnemyProjectile'

// ── 최종보스 상수 ────────────────────────────────────────────
const FINAL_BOSS_SPAWN_TIME = 180   // 3분 (초)
const FINAL_BOSS_DODGE_RANGE = 180  // 탄환 감지 범위
const FINAL_BOSS_DODGE_SPEED = 620  // 회피 대시 속도
const FINAL_BOSS_DODGE_DURATION = 0.28 // 대시 지속 시간
const FINAL_BOSS_DODGE_COOLDOWN = 1.6  // 대시 쿨다운

// 동시에 유지할 일반 적 최대 수 (보스 제외)
const MAX_NORMAL_ENEMIES = 80

export class GameLoop {
  private renderer: CanvasRenderer
  private lastTime: number = 0
  private gameLoopId: number | null = null
  private isRunning: boolean = false
  private enemySpawner: EnemySpawner
  private autoAttack: AutoAttack
  private enemyProjectileSystem: EnemyProjectileSystem
  private lastPlayerLevel: number = 1
  // 최종보스 스폰 여부
  private finalBossSpawned: boolean = false

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
    this.finalBossSpawned = false
    this.lastPlayerLevel = 1
  }

  private setupEventListeners() {
    window.addEventListener('resize', () => this.renderer.resize())
    // dash on Space
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        const playerStore = usePlayerStore.getState()
        const player = playerStore.player

        const keyboard = this.renderer.getKeyboardInput()
        const joystick = this.renderer.getJoystickInput()
        let mv = keyboard.getMovementVector()
        if (mv.x === 0 && mv.y === 0) mv = joystick.getMovementVector()

        if (mv.x !== 0 || mv.y !== 0) {
          usePlayerStore.getState().tryDash(mv.x, mv.y)
        } else {
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

    if (gameStore.currentScene !== 'playing') return

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
    if (movementVector.x === 0 && movementVector.y === 0) {
      movementVector = joystickInput.getMovementVector()
    }

    const player = playerStore.player
    const moveSpeed = player.moveSpeed

    if (player.dashTimeRemaining && player.dashTimeRemaining > 0) {
      const dv = player.dashVelocity || { x: 0, y: 0 }
      const canvasSize = this.renderer.getCanvasSize()
      const padding = player.radius

      const targetX = Math.max(padding, Math.min(player.x + dv.x * deltaTime, canvasSize.width - padding))
      const targetY = Math.max(padding, Math.min(player.y + dv.y * deltaTime, canvasSize.height - padding))

      playerStore.setPlayerPosition(targetX, targetY)
      playerStore.setPlayerVelocity(dv.x, dv.y)
      usePlayerStore.getState().tickDash(deltaTime)

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
    gameStore: any,
    deltaTime: number
  ) {
    const player = playerStore.player
    const enemies = [...enemyStore.enemies]

    // 일반 적(보스 제외) 수 계산
    const normalCount = enemies.filter(
      (e: any) => !e.isBoss && !e.isFinalBoss
    ).length

    this.enemySpawner.update(deltaTime)

    // ── 일반 적 스폰 (최대 수 제한) ─────────────────────────
    if (normalCount < MAX_NORMAL_ENEMIES && this.enemySpawner.shouldSpawn()) {
      const newEnemies = this.enemySpawner.spawn(player.x, player.y)
      const levelScale = 1 + (player.level || 1) * 0.06
      newEnemies.forEach((enemy) => {
        enemy.hp = Math.max(1, Math.floor(enemy.hp * levelScale))
        enemy.maxHp = Math.max(1, Math.floor(enemy.maxHp * levelScale))
        enemy.attackPower = enemy.attackPower * levelScale
        enemy.moveSpeed = enemy.moveSpeed * (1 + (player.level || 1) * 0.02)
        enemies.push(enemy)
      })
    }

    // ── 중간보스 스폰 (50초, 최대 3회) ─────────────────────
    if (this.enemySpawner.shouldSpawnMiniBoss()) {
      const miniBoss = this.enemySpawner.spawnMiniBoss(player.x, player.y)
      enemies.push(miniBoss)
      gameStore.setMiniBossCount(this.enemySpawner.getMiniBossCount())
    }

    // ── 최종보스 스폰 (3분) ─────────────────────────────────
    if (!this.finalBossSpawned && gameStore.gameTime >= FINAL_BOSS_SPAWN_TIME) {
      this.finalBossSpawned = true
      gameStore.setFinalBossSpawned(true)
      const finalBoss = this.spawnFinalBoss(player.x, player.y)
      enemies.push(finalBoss)
    }

    // ── 적 행동 업데이트 ─────────────────────────────────────
    const playerProjectiles = this.autoAttack.getProjectiles()

    for (const enemy of enemies) {
      const isBossEnemy = (enemy as any).id?.startsWith('boss_')
      const isFinalBossEnemy = (enemy as any).isFinalBoss === true

      // ── 최종보스 행동: 회피 대시 + 3방향 탄막 ────────────
      if (isFinalBossEnemy) {
        // 초기화
        if ((enemy as any).fbDodgeCd === undefined) {
          ;(enemy as any).fbDodgeCd = 0
          ;(enemy as any).fbDodging = false
          ;(enemy as any).fbDodgeTimer = 0
          ;(enemy as any).fbDodgeVel = { x: 0, y: 0 }
          ;(enemy as any).fbShootTimer = 0
        }

        // 쿨다운 감소
        if ((enemy as any).fbDodgeCd > 0) {
          ;(enemy as any).fbDodgeCd -= deltaTime
        }

        // 회피 판정: 가장 가까운 플레이어 탄환이 감지 범위 내에 있을 때
        if (!(enemy as any).fbDodging && (enemy as any).fbDodgeCd <= 0) {
          for (const proj of playerProjectiles) {
            const dist = Math.hypot(proj.x - enemy.x, proj.y - enemy.y)
            if (dist < FINAL_BOSS_DODGE_RANGE) {
              // 플레이어 방향의 수직 방향으로 대시 (좌우 랜덤)
              const toPx = player.x - enemy.x
              const toPy = player.y - enemy.y
              const len = Math.hypot(toPx, toPy) || 1
              const sign = Math.random() < 0.5 ? 1 : -1
              const perpX = (-toPy / len) * sign
              const perpY = (toPx / len) * sign
              ;(enemy as any).fbDodgeVel = { x: perpX * FINAL_BOSS_DODGE_SPEED, y: perpY * FINAL_BOSS_DODGE_SPEED }
              ;(enemy as any).fbDodging = true
              ;(enemy as any).fbDodgeTimer = 0
              ;(enemy as any).fbDodgeCd = FINAL_BOSS_DODGE_COOLDOWN
              break
            }
          }
        }

        // 대시 진행
        if ((enemy as any).fbDodging) {
          ;(enemy as any).fbDodgeTimer += deltaTime
          const dv = (enemy as any).fbDodgeVel as { x: number; y: number }
          enemy.velocity.x = dv.x
          enemy.velocity.y = dv.y
          if ((enemy as any).fbDodgeTimer >= FINAL_BOSS_DODGE_DURATION) {
            ;(enemy as any).fbDodging = false
            enemy.velocity.x = 0
            enemy.velocity.y = 0
          }
        } else {
          // 천천히 플레이어 추적
          const dx = player.x - enemy.x
          const dy = player.y - enemy.y
          const dist = Math.hypot(dx, dy) || 1
          enemy.velocity.x = (dx / dist) * enemy.moveSpeed
          enemy.velocity.y = (dy / dist) * enemy.moveSpeed
        }

        // 3방향 탄막
        ;(enemy as any).fbShootTimer += deltaTime
        const fbCooldown = (enemy as any).attackCooldown || 1.0
        if ((enemy as any).fbShootTimer >= fbCooldown) {
          ;(enemy as any).fbShootTimer = 0
          const baseAngle = Math.atan2(player.y - enemy.y, player.x - enemy.x)
          for (let i = -1; i <= 1; i++) {
            const angle = baseAngle + (i * Math.PI) / 8
            this.enemyProjectileSystem.createProjectile(
              enemy.x, enemy.y,
              enemy.x + Math.cos(angle) * 100,
              enemy.y + Math.sin(angle) * 100,
              enemy.attackPower,
              (enemy as any).projectileSpeed || 460
            )
          }
        }
      }
      // ── 중간보스 행동: 도약 + 2단 탄막 ──────────────────
      else if (isBossEnemy) {
        const LEAP_DURATION = 0.55
        const LEAP_REST = 0.45
        const LEAP_SPEED = MINI_BOSS_LEAP_SPEED
        const MID_SHOT_T = 0.25
        const END_SHOT_T = 0.50

        if (!(enemy as any).leapPhase) {
          ;(enemy as any).leapPhase = 'rest'
          ;(enemy as any).leapTimer = 0
          ;(enemy as any).shotsFired = 0
          ;(enemy as any).leapVelocity = { x: 0, y: 0 }
        }

        ;(enemy as any).leapTimer += deltaTime

        if ((enemy as any).leapPhase === 'rest') {
          const dx = player.x - enemy.x
          const dy = player.y - enemy.y
          const dist = Math.hypot(dx, dy) || 1
          enemy.velocity.x = (dx / dist) * 60
          enemy.velocity.y = (dy / dist) * 60

          if ((enemy as any).leapTimer >= LEAP_REST) {
            const ldx = player.x - enemy.x
            const ldy = player.y - enemy.y
            const ldist = Math.hypot(ldx, ldy) || 1
            ;(enemy as any).leapVelocity = { x: (ldx / ldist) * LEAP_SPEED, y: (ldy / ldist) * LEAP_SPEED }
            ;(enemy as any).leapPhase = 'leaping'
            ;(enemy as any).leapTimer = 0
            ;(enemy as any).shotsFired = 0
          }
        } else {
          const lv = (enemy as any).leapVelocity as { x: number; y: number }
          const progress = (enemy as any).leapTimer / LEAP_DURATION
          const speedMult = 1 - progress * 0.4
          enemy.velocity.x = lv.x * speedMult
          enemy.velocity.y = lv.y * speedMult

          const fired: number = (enemy as any).shotsFired

          // 도약 중간 탄막: 플레이어 방향 5방향 부채꼴
          if (fired === 0 && (enemy as any).leapTimer >= MID_SHOT_T) {
            const dx = player.x - enemy.x
            const dy = player.y - enemy.y
            const baseAngle = Math.atan2(dy, dx)
            for (let i = -2; i <= 2; i++) {
              const angle = baseAngle + (i * Math.PI) / 10
              this.enemyProjectileSystem.createProjectile(
                enemy.x, enemy.y,
                enemy.x + Math.cos(angle) * 100,
                enemy.y + Math.sin(angle) * 100,
                enemy.attackPower,
                (enemy as any).projectileSpeed || 336
              )
            }
            ;(enemy as any).shotsFired = 1
          }

          // 도약 끝 탄막: 8방향 방사형
          if (fired === 1 && (enemy as any).leapTimer >= END_SHOT_T) {
            for (let i = 0; i < 8; i++) {
              const angle = (i / 8) * Math.PI * 2
              this.enemyProjectileSystem.createProjectile(
                enemy.x, enemy.y,
                enemy.x + Math.cos(angle) * 100,
                enemy.y + Math.sin(angle) * 100,
                enemy.attackPower,
                (enemy as any).projectileSpeed || 304
              )
            }
            ;(enemy as any).shotsFired = 2
          }

          if ((enemy as any).leapTimer >= LEAP_DURATION) {
            ;(enemy as any).leapPhase = 'rest'
            ;(enemy as any).leapTimer = 0
            enemy.velocity.x = 0
            enemy.velocity.y = 0
          }
        }
      }
      // ── 일반 적 이동 ─────────────────────────────────────
      else {
        const dx = player.x - enemy.x
        const dy = player.y - enemy.y
        const distance = Math.hypot(dx, dy)
        if (distance > 0) {
          enemy.velocity.x = (dx / distance) * enemy.moveSpeed
          enemy.velocity.y = (dy / distance) * enemy.moveSpeed
        }
      }

      enemy.x += enemy.velocity.x * deltaTime
      enemy.y += enemy.velocity.y * deltaTime

      // shooter 원거리 공격
      if (enemy.type === 'shooter' && !isBossEnemy && !isFinalBossEnemy) {
        enemy.attackTimer = (enemy.attackTimer || 0) + deltaTime
        const attackRange = enemy.attackRange || 400
        const attackCooldown = enemy.attackCooldown || 1.2
        if (Math.hypot(player.x - enemy.x, player.y - enemy.y) <= attackRange) {
          if ((enemy.attackTimer || 0) >= attackCooldown) {
            this.enemyProjectileSystem.createProjectile(
              enemy.x, enemy.y, player.x, player.y,
              enemy.attackPower, enemy.projectileSpeed || 500
            )
            enemy.attackTimer = 0
          }
        }
      }
    }

    // 화면 밖 제거
    const canvasSize = this.renderer.getCanvasSize()
    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i]
      if (enemy.x < -1600 || enemy.x > canvasSize.width + 1600 ||
          enemy.y < -1600 || enemy.y > canvasSize.height + 1600) {
        enemies.splice(i, 1)
      }
    }

    enemyStore.updateEnemies(enemies)
  }

  // ── 최종보스 생성 ────────────────────────────────────────
  private spawnFinalBoss(playerX: number, playerY: number) {
    const angle = Math.random() * Math.PI * 2
    const distance = 700
    const x = playerX + Math.cos(angle) * distance
    const y = playerY + Math.sin(angle) * distance

    const hp = Math.max(1, Math.floor(GAME_CONFIG.enemy.basicHp * 120))
    const attackPower = GAME_CONFIG.enemy.basicAttackPower * 4.0

    return {
      id: `finalboss_${Date.now()}`,
      x,
      y,
      velocity: { x: 0, y: 0 },
      radius: GAME_CONFIG.enemy.basicRadius * 2.8,
      hp,
      maxHp: hp,
      attackPower,
      moveSpeed: 55,
      type: 'tank' as const,
      isBoss: false,
      isFinalBoss: true,
      attackCooldown: 0.9,
      attackTimer: 0,
      projectileSpeed: 460,
      attackRange: 9999,
    }
  }

  private updateCombat(
    enemyStore: any,
    playerStore: any,
    gameStore: any
  ) {
    const player = playerStore.player
    const enemies = enemyStore.enemies
    const deltaTime = GAME_CONFIG.gameplay.deltaTimeMax

    const mouseInput = this.renderer.getMouseInput()
    const mousePos = mouseInput.getMousePosition()
    const isMouseClicking = mouseInput.isMouseClicking()

    const projectiles = this.autoAttack.update(
      deltaTime, player, enemies,
      mousePos.x, mousePos.y, isMouseClicking
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
          // 최종보스 처치 → 스테이지 클리어
          if ((enemy as any).isFinalBoss) {
            gameStore.setFinalBossDefeated(true)
            gameStore.setCurrentScene('stageClear')
          }

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

    this.enemyProjectileSystem.update(
      GAME_CONFIG.gameplay.deltaTimeMax,
      this.renderer.getCanvasSize().width,
      this.renderer.getCanvasSize().height
    )
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
        gameStore.gameTime, gameStore.killCount,
        hp, maxHp, level, exp, maxExp
      )

      this.renderer.renderPlayerHealthBar(x, y, hp, maxHp)

      // 중간보스 체력바
      const miniBoss = enemyStore.enemies.find(
        (e) => (e as any).isBoss && !(e as any).isFinalBoss
      )
      if (miniBoss) {
        this.renderer.renderBossHealthBar(miniBoss.x, miniBoss.y, miniBoss.radius, miniBoss.hp, miniBoss.maxHp)
      }

      // 최종보스 체력바 (화면 하단 중앙)
      const finalBoss = enemyStore.enemies.find((e) => (e as any).isFinalBoss)
      if (finalBoss) {
        this.renderer.renderFinalBossHealthBar(finalBoss.hp, finalBoss.maxHp)
      }

      this.renderer.renderExperienceBar(exp, maxExp)

      // 3분 카운트다운 (최종보스 등장 전)
      if (!this.finalBossSpawned) {
        const remaining = Math.max(0, FINAL_BOSS_SPAWN_TIME - gameStore.gameTime)
        this.renderer.renderBossCountdown(remaining)
      }
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
