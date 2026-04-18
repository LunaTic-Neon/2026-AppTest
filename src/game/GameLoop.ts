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
    for (const enemy of enemies) {
      const isBossEnemy = (enemy as any).id?.startsWith('boss_')
      const isFinalBossEnemy = (enemy as any).isFinalBoss === true

      // ── 최종보스 행동: 패턴 시스템 ──────────────────────────
      if (isFinalBossEnemy) {
        // 초기화
        if (!(enemy as any).bossPattern) {
          ;(enemy as any).bossPattern = this.selectBossPattern()
          ;(enemy as any).patternTimer = 0
          ;(enemy as any).patternPhase = 'start'
        }

        const currentPattern = (enemy as any).bossPattern

        // 패턴 업데이트
        if (currentPattern === 1) {
          this.updateBossPattern1(enemy, player, deltaTime)
        } else if (currentPattern === 2) {
          this.updateBossPattern2(enemy, deltaTime)
        } else if (currentPattern === 3) {
          this.updateBossPattern3(enemy, player, deltaTime)
        }

        // 패턴 종료 시 다음 패턴으로
        if (this.isPatternFinished(enemy)) {
          ;(enemy as any).bossPattern = this.selectBossPattern()
          ;(enemy as any).patternTimer = 0
          ;(enemy as any).patternPhase = 'start'
        }

        // 무적이 아닐 때만 플레이어 쪽으로 이동
        if (!(enemy as any).invulnerable && (enemy as any).patternPhase !== 'active') {
          const dx = player.x - enemy.x
          const dy = player.y - enemy.y
          const dist = Math.hypot(dx, dy) || 1
          enemy.velocity.x = (dx / dist) * enemy.moveSpeed
          enemy.velocity.y = (dy / dist) * enemy.moveSpeed
        } else {
          enemy.velocity.x = 0
          enemy.velocity.y = 0
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

    const hp = Math.max(1, Math.floor(GAME_CONFIG.enemy.basicHp * 250))
    const attackPower = GAME_CONFIG.enemy.basicAttackPower * 5.0

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
      bossPattern: 1,
      patternTimer: 0,
      patternPhase: 'start',
      shieldHealth: 0,
      shieldMaxHealth: 0,
      shieldCountdown: 0,
      invulnerable: false,
      patternBrightness: 0,
      projectileSpeed: 460,
      attackRange: 9999,
    }
  }

  private selectBossPattern(): 1 | 2 | 3 {
    const roll = Math.random() * 100
    if (roll < 70) return 1
    if (roll < 80) return 2
    return 3
  }

  private updateBossPattern1(boss: any, player: Player, deltaTime: number) {
    // 패턴 1: 밝기 변화 → 0.5초 뒤 순간이동 → 12방향 방사형 탄환
    const PHASE_BRIGHTNESS = 0.3
    const PHASE_TELEPORT = 1.2
    const PHASE_SHOOT = 1.8

    if (boss.patternPhase === 'start') {
      boss.patternBrightness = 0
      boss.patternTimer = 0
      boss.patternPhase = 'active'
    }

    boss.patternTimer += deltaTime

    if (boss.patternPhase === 'active') {
      // 밝기 변화 (0~0.3초)
      if (boss.patternTimer < PHASE_BRIGHTNESS) {
        boss.patternBrightness = boss.patternTimer / PHASE_BRIGHTNESS
      }
      // 순간이동 (0.3~0.8초)
      else if (boss.patternTimer < PHASE_TELEPORT) {
        boss.patternBrightness = 1.0
        if (boss.patternTimer < PHASE_TELEPORT && boss.patternTimer - deltaTime < PHASE_TELEPORT) {
          // 순간이동 실행 (0.5초 타이밍)
          if (Math.abs(boss.patternTimer - 0.8) < deltaTime) {
            const dist = Math.hypot(boss.x - player.x, boss.y - player.y)
            const angle = Math.atan2(boss.y - player.y, boss.x - player.x)
            boss.x = player.x + Math.cos(angle) * dist
            boss.y = player.y + Math.sin(angle) * dist
          }
        }
      }
      // 탄환 발사 (0.8~1.8초)
      else if (boss.patternTimer < PHASE_SHOOT) {
        boss.patternBrightness = 0
        if (boss.patternTimer - deltaTime < 0.85 && boss.patternTimer >= 0.85) {
          // 12방향 방사형 발사
          for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2
            this.enemyProjectileSystem.createProjectile(
              boss.x, boss.y,
              boss.x + Math.cos(angle) * 150,
              boss.y + Math.sin(angle) * 150,
              boss.attackPower,
              boss.projectileSpeed || 460
            )
          }
        }
      }
      // 패턴 종료
      else {
        boss.patternPhase = 'end'
      }
    }
  }

  private updateBossPattern2(boss: any, deltaTime: number) {
    // 패턴 2: 움직임 정지 → 파란 막 생성 → 5초 카운트다운 → 막 체력 감지 → 회복 또는 사라짐
    const SHIELD_DURATION = 5.0

    if (boss.patternPhase === 'start') {
      boss.shieldCountdown = SHIELD_DURATION
      boss.shieldMaxHealth = Math.floor(boss.maxHp * 0.4)
      boss.shieldHealth = boss.shieldMaxHealth
      boss.velocity = { x: 0, y: 0 }
      boss.patternTimer = 0
      boss.patternPhase = 'active'
    }

    boss.patternTimer += deltaTime
    boss.shieldCountdown -= deltaTime

    if (boss.patternPhase === 'active') {
      // 5초 카운트다운 중
      if (boss.shieldCountdown > 0) {
        // 막이 모두 파괴되면 사라짐
        if (boss.shieldHealth <= 0) {
          boss.patternPhase = 'end'
        }
      }
      // 5초 경과 → 못 파괴했으면 회복
      else {
        if (boss.shieldHealth > 0) {
          // 회복량: 최대 체력의 30%
          boss.hp += boss.maxHp * 0.3
          if (boss.hp > boss.maxHp) boss.hp = boss.maxHp
        }
        boss.patternPhase = 'end'
      }
    }
  }

  private updateBossPattern3(boss: any, _player: Player, deltaTime: number) {
    // 패턴 3: 무적 → 중앙 이동 → 12면 중 8면에서 초당 5번씩 10초간 발사
    const CENTRALIZE_DURATION = 0.5
    const SHOOT_DURATION = 10.0
    const SHOOT_RATE = 5 // 초당 발사 횟수
    const SAFE_SIDES = 8 // 12면 중 8면

    if (boss.patternPhase === 'start') {
      boss.invulnerable = true
      boss.centralizeTimer = 0
      boss.patternTimer = 0
      boss.patternPhase = 'centralizing'
      // 12면 중 8개 랜덤 선택
      const allSides = Array.from({ length: 12 }, (_, i) => i)
      const safeSides = []
      for (let i = 0; i < SAFE_SIDES; i++) {
        const idx = Math.floor(Math.random() * allSides.length)
        safeSides.push(allSides[idx])
        allSides.splice(idx, 1)
      }
      boss.safeSides = safeSides
    }

    if (boss.patternPhase === 'centralizing') {
      boss.centralizeTimer += deltaTime
      const progress = Math.min(1, boss.centralizeTimer / CENTRALIZE_DURATION)
      // 보스 원래 위치에서 중앙으로 이동 (중앙 = 960, 540)
      const centerX = 960
      const centerY = 540
      const startX = boss.x
      const startY = boss.y
      boss.x = startX + (centerX - startX) * progress
      boss.y = startY + (centerY - startY) * progress

      if (progress >= 1) {
        boss.patternTimer = 0
        boss.patternPhase = 'active'
      }
    } else if (boss.patternPhase === 'active') {
      boss.patternTimer += deltaTime

      // 초당 5번 발사 로직
      const shotInterval = 1.0 / SHOOT_RATE
      const currentShot = Math.floor(boss.patternTimer / shotInterval)
      const nextShotTime = (currentShot + 1) * shotInterval

      if (Math.abs(boss.patternTimer - nextShotTime) < deltaTime) {
        // 12면 중 8개 면에서만 발사 (랜덤)
        const sideIdx = Math.floor(Math.random() * boss.safeSides.length)
        const selectedSide = boss.safeSides[sideIdx]

        // 해당 면에서 방사형 발사 (8방향)
        const baseSideAngle = (selectedSide / 12) * Math.PI * 2
        for (let i = 0; i < 8; i++) {
          const angleOffset = (i / 8) * Math.PI * 2
          const angle = baseSideAngle + angleOffset
          this.enemyProjectileSystem.createProjectile(
            boss.x, boss.y,
            boss.x + Math.cos(angle) * 150,
            boss.y + Math.sin(angle) * 150,
            boss.attackPower,
            boss.projectileSpeed || 460
          )
        }
      }

      // 10초 후 패턴 종료
      if (boss.patternTimer >= SHOOT_DURATION) {
        boss.invulnerable = false
        boss.patternPhase = 'end'
      }
    }
  }

  private isPatternFinished(boss: any): boolean {
    return boss.patternPhase === 'end'
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

        let damage = projectile.damage

        // 패턴 2: 막에 먼저 피해를 입힘
        if ((enemy as any).isFinalBoss && (enemy as any).bossPattern === 2 && (enemy as any).shieldHealth !== undefined && (enemy as any).shieldHealth > 0) {
          const shieldDamage = Math.min(damage, (enemy as any).shieldHealth)
          ;(enemy as any).shieldHealth -= shieldDamage
          gameStore.addDamage(shieldDamage)
          damage -= shieldDamage
          // 막이 남아있으면 보스에게 피해 없음
          if ((enemy as any).shieldHealth > 0) {
            this.autoAttack.removeProjectileAt(projectileIndex)
            continue
          }
        }

        // 보스에게 직접 피해
        enemy.hp -= damage
        gameStore.addDamage(damage)

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
        this.renderer.renderFinalBossHealthBar(finalBoss.hp, finalBoss.maxHp, finalBoss)
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
