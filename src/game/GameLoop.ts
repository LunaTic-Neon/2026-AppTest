import { CanvasRenderer } from './canvas/CanvasRenderer'
import { useGameStore } from '../store/gameStore'
import { usePlayerStore } from '../store/playerStore'
import { useEnemyStore } from '../store/enemyStore'
import { useMetaProgressionStore } from '../store/metaProgressionStore'
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

// 동시에 유지할 일반 적 기본 최대 수 (보스 제외)
const MAX_NORMAL_ENEMIES = 110

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
        // 포커스된 버튼의 기본 click 동작을 막아 DEV 버튼이 재실행되는 버그 방지
        e.preventDefault()
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
    const metaStore = useMetaProgressionStore.getState()

    if (gameStore.currentScene !== 'playing') return

    const timeScale = metaStore.selectedTimeScale || 1.0
    const scaledDeltaTime = deltaTime * timeScale

    const newGameTime = gameStore.gameTime + scaledDeltaTime
    gameStore.setGameTime(newGameTime)

    this.updatePlayerMovement(playerStore, scaledDeltaTime)
    this.updateEnemies(enemyStore, playerStore, gameStore, scaledDeltaTime)
    this.updateCombat(enemyStore, playerStore, gameStore, scaledDeltaTime)
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

    // ── 일반 적 스폰 (시간 기반으로 상한 완화: 후반에도 꾸준히 등장) ─────
    const dynamicNormalCap = Math.min(MAX_NORMAL_ENEMIES + Math.floor(gameStore.gameTime / 30) * 15, 220)
    if (normalCount < dynamicNormalCap && this.enemySpawner.shouldSpawn()) {
      const newEnemies = this.enemySpawner.spawn(player.x, player.y)
      const levelScale = 1 + (player.level || 1) * 0.05
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

      // ── 최종보스 행동: 회피 + 패턴 쿨다운 + 패턴 실행 ───────
      if (isFinalBossEnemy) {
        const fb = enemy as any

        // ── 초기화 ──────────────────────────────────────────
        if (!fb.fbInitialized) {
          fb.fbInitialized = true
          fb.bossPattern = this.selectBossPattern()
          fb.patternTimer = 0
          fb.patternPhase = 'start'
          fb.inPatternCooldown = false
          fb.patternCooldownTimer = 0
          fb.idleShotTimer = 0
          fb.idleShotCooldown = 1.5
          fb.fbDodgeCd = 0
          fb.fbDodging = false
          fb.fbDodgeTimer = 0
          fb.fbDodgeVel = { x: 0, y: 0 }
        }

        // ── 패턴 쿨다운 또는 패턴 실행 ─────────────────────
        if (fb.inPatternCooldown) {
          fb.patternCooldownTimer -= deltaTime

          // 패턴 비활성 구간에도 가끔 3연발 원거리 견제
          fb.idleShotTimer += deltaTime
          if (fb.idleShotTimer >= fb.idleShotCooldown) {
            fb.idleShotTimer = 0
            fb.idleShotCooldown = 1.2 + Math.random() * 1.0

            const baseAngle = Math.atan2(player.y - enemy.y, player.x - enemy.x)
            const spreads = [-0.2, 0, 0.2]
            for (const offset of spreads) {
              const angle = baseAngle + offset
              this.enemyProjectileSystem.createProjectile(
                enemy.x,
                enemy.y,
                enemy.x + Math.cos(angle) * 160,
                enemy.y + Math.sin(angle) * 160,
                enemy.attackPower,
                enemy.projectileSpeed || 460
              )
            }
          }

          if (fb.patternCooldownTimer <= 0) {
            fb.inPatternCooldown = false
            fb.bossPattern = this.selectBossPattern()
            fb.patternTimer = 0
            fb.patternPhase = 'start'
          }
        } else {
          const cp: number = fb.bossPattern
          if (cp === 1) this.updateBossPattern1(enemy, player, deltaTime)
          else if (cp === 2) this.updateBossPattern2(enemy, deltaTime)
          else if (cp === 3) this.updateBossPattern3(enemy, player, deltaTime)

          if (this.isPatternFinished(enemy)) {
            // 패턴 1: 3초 쿨다운, 패턴 2/3: 5초 쿨다운
            if (cp === 3) {
              // 패턴 3 종료 즉시 무적/색상 상태를 해제해 다음 패턴 전에도 기본색 복귀
              fb.invulnerable = false
            }
            fb.inPatternCooldown = true
            fb.patternCooldownTimer = cp === 1 ? 3.0 : 5.0
          }
        }

        // ── 회피 대시 (탄환 회피 기믹 유지) ────────────────
        // 패턴 2 active(막 생성 중) / 패턴 3 centralizing·active(무적 발사 중)는 제외
        const dodgeAllowed =
          !fb.invulnerable &&
          !(fb.bossPattern === 2 && fb.patternPhase === 'active') &&
          !(fb.bossPattern === 3 && (fb.patternPhase === 'centralizing' || fb.patternPhase === 'active'))

        if (dodgeAllowed) {
          if (fb.fbDodgeCd > 0) fb.fbDodgeCd -= deltaTime

          if (!fb.fbDodging && fb.fbDodgeCd <= 0) {
            for (const proj of this.autoAttack.getProjectiles()) {
              const dist = Math.hypot(proj.x - enemy.x, proj.y - enemy.y)
              if (dist < FINAL_BOSS_DODGE_RANGE) {
                const toPx = player.x - enemy.x
                const toPy = player.y - enemy.y
                const len = Math.hypot(toPx, toPy) || 1
                const sign = Math.random() < 0.5 ? 1 : -1
                fb.fbDodgeVel = {
                  x: (-toPy / len) * sign * FINAL_BOSS_DODGE_SPEED,
                  y: (toPx / len) * sign * FINAL_BOSS_DODGE_SPEED,
                }
                fb.fbDodging = true
                fb.fbDodgeTimer = 0
                fb.fbDodgeCd = FINAL_BOSS_DODGE_COOLDOWN
                break
              }
            }
          }

          if (fb.fbDodging) {
            fb.fbDodgeTimer += deltaTime
            enemy.velocity.x = fb.fbDodgeVel.x
            enemy.velocity.y = fb.fbDodgeVel.y
            if (fb.fbDodgeTimer >= FINAL_BOSS_DODGE_DURATION) {
              fb.fbDodging = false
              enemy.velocity.x = 0
              enemy.velocity.y = 0
            }
          }
        }

        // ── 이동 (대시 중이 아닌 경우) ──────────────────────
        if (!fb.fbDodging) {
          const isStationary =
            fb.invulnerable ||
            (fb.bossPattern === 2 && fb.patternPhase === 'active') ||
            (fb.bossPattern === 3 && fb.patternPhase === 'active')
          const isCentralizing =
            fb.bossPattern === 3 && fb.patternPhase === 'centralizing'

          if (isStationary || isCentralizing) {
            // centralizing은 updateBossPattern3에서 직접 위치를 설정하므로 velocity만 0으로
            enemy.velocity.x = 0
            enemy.velocity.y = 0
          } else {
            const dx = player.x - enemy.x
            const dy = player.y - enemy.y
            const dist = Math.hypot(dx, dy) || 1
            enemy.velocity.x = (dx / dist) * enemy.moveSpeed
            enemy.velocity.y = (dy / dist) * enemy.moveSpeed
          }
        }
      }
      // ── 중간보스 행동: 도약 + 2단 탄막 ──────────────────
      else if (isBossEnemy) {
        const LEAP_DURATION = 0.726
        const LEAP_REST = 0.594
        const LEAP_SPEED = MINI_BOSS_LEAP_SPEED
        const MID_SHOT_T = 0.33
        const END_SHOT_T = 0.66

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

    // 잡몹 겹침 완화: 보스/최종보스 제외하고 가까우면 살짝 밀어냄
    for (let i = 0; i < enemies.length; i++) {
      const a: any = enemies[i]
      if (a.isBoss || a.isFinalBoss) continue
      for (let j = i + 1; j < enemies.length; j++) {
        const b: any = enemies[j]
        if (b.isBoss || b.isFinalBoss) continue

        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.hypot(dx, dy) || 0.0001
        const minDist = (a.radius + b.radius) * 0.9
        if (dist >= minDist) continue

        const overlap = minDist - dist
        const nx = dx / dist
        const ny = dy / dist
        const push = overlap * 0.5

        a.x -= nx * push
        a.y -= ny * push
        b.x += nx * push
        b.y += ny * push
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
    // 최종보스 공격력 = 일반 적 공격력 기준 60% (3분 시점 기준)
    const normalAttackAtBossTime = GAME_CONFIG.enemy.basicAttackPower * (0.6 + FINAL_BOSS_SPAWN_TIME / 30) * 0.9
    const attackPower = normalAttackAtBossTime * 0.6

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
    // 패턴 1: 0~0.5s 밝기 증가 → 0.5s 원점대칭 순간이동 → 0.8s 12방향 방사형 탄환 → 2s 종료
    const TELEPORT_AT = 0.5
    const SHOOT_AT = 0.8
    const END_AT = 2.0

    if (boss.patternPhase === 'start') {
      boss.p1TeleportDone = false
      boss.p1ShootDone = false
      boss.patternBrightness = 0
      boss.patternTimer = 0
      boss.patternPhase = 'active'
    }

    boss.patternTimer += deltaTime

    if (boss.patternPhase === 'active') {
      // 밝기: 0→1로 선형 증가 (0~TELEPORT_AT 구간)
      if (boss.patternTimer < TELEPORT_AT) {
        boss.patternBrightness = boss.patternTimer / TELEPORT_AT
      } else {
        boss.patternBrightness = 0
      }

      // 순간이동: 플레이어 기준 원점대칭 (한 번만 실행)
      if (!boss.p1TeleportDone && boss.patternTimer >= TELEPORT_AT) {
        boss.p1TeleportDone = true
        const canvas = this.renderer.getCanvasSize()
        const radius = boss.radius || 0
        const mirroredX = 2 * player.x - boss.x
        const mirroredY = 2 * player.y - boss.y
        boss.x = Math.max(radius, Math.min(mirroredX, canvas.width - radius))
        boss.y = Math.max(radius, Math.min(mirroredY, canvas.height - radius))
      }

      // 12방향 방사형 탄환 발사 (한 번만 실행)
      if (!boss.p1ShootDone && boss.patternTimer >= SHOOT_AT) {
        boss.p1ShootDone = true
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

      if (boss.patternTimer >= END_AT) {
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
    // 패턴 3: 중앙 이동(0.5s) → 12면 중 8면 초당 5번 10초간 발사
    // 발사 중 처음 5초만 코팅 무적(색 변화), 이후 5초는 피격 가능
    const CENTRALIZE_DURATION = 0.5
    const SHOOT_DURATION = 10.0
    const SHOOT_RATE = 5
    const INVULNERABLE_WINDOW = 5.0

    if (boss.patternPhase === 'start') {
      boss.invulnerable = false
      boss.centralizeTimer = 0
      boss.patternTimer = 0
      boss.p3ShootTimer = 0
      // 시작 위치 저장 (매 프레임 갱신되면 안 됨)
      boss.centralizeStartX = boss.x
      boss.centralizeStartY = boss.y
      boss.patternPhase = 'centralizing'
      // 12면 중 8개 랜덤 선택
      const allSides = Array.from({ length: 12 }, (_v, i) => i)
      const pickedSides: number[] = []
      for (let i = 0; i < 8; i++) {
        const idx = Math.floor(Math.random() * allSides.length)
        pickedSides.push(allSides[idx])
        allSides.splice(idx, 1)
      }
      boss.activeSides = pickedSides
    }

    if (boss.patternPhase === 'centralizing') {
      boss.centralizeTimer += deltaTime
      const progress = Math.min(1, boss.centralizeTimer / CENTRALIZE_DURATION)
      const centerX = 960
      const centerY = 540
      // 저장한 시작 위치에서 중앙으로 선형 이동
      boss.x = boss.centralizeStartX + (centerX - boss.centralizeStartX) * progress
      boss.y = boss.centralizeStartY + (centerY - boss.centralizeStartY) * progress
      boss.velocity = { x: 0, y: 0 }

      if (progress >= 1) {
        boss.x = centerX
        boss.y = centerY
        boss.patternTimer = 0
        boss.p3ShootTimer = 0
        boss.patternPhase = 'active'
      }
    } else if (boss.patternPhase === 'active') {
      boss.patternTimer += deltaTime
      boss.p3ShootTimer += deltaTime
      boss.velocity = { x: 0, y: 0 }
      boss.invulnerable = boss.patternTimer < INVULNERABLE_WINDOW

      const shotInterval = 1.0 / SHOOT_RATE
      if (boss.p3ShootTimer >= shotInterval) {
        boss.p3ShootTimer -= shotInterval
        // 활성화된 면 중 매 발사마다 랜덤 1개 선택
        const sideIdx = Math.floor(Math.random() * boss.activeSides.length)
        const selectedSide = boss.activeSides[sideIdx]
        const baseSideAngle = (selectedSide / 12) * Math.PI * 2
        // 해당 면 기준 8방향 방사형
        for (let i = 0; i < 8; i++) {
          const angle = baseSideAngle + (i / 8) * Math.PI * 2
          this.enemyProjectileSystem.createProjectile(
            boss.x, boss.y,
            boss.x + Math.cos(angle) * 150,
            boss.y + Math.sin(angle) * 150,
            boss.attackPower,
            boss.projectileSpeed || 460
          )
        }
      }

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
    gameStore: any,
    deltaTime: number
  ) {
    const player = playerStore.player
    const enemies = enemyStore.enemies
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

        // 이미 이 투사체에 맞은 적이면 스킵 (관통 중복 방지)
        const hitIds = projectile.hitEnemyIds
        if (hitIds && hitIds.includes(enemy.id)) continue

        let damage = projectile.damage

        // 패턴 3 무적 코팅 상태에서는 피해 무효
        if ((enemy as any).isFinalBoss && (enemy as any).invulnerable) {
          this.autoAttack.removeProjectileAt(projectileIndex)
          continue
        }

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

        // 관통 처리: piercingCount > 0이면 투사체 유지, 해당 적 기록
        const piercingCount = projectile.piercingCount ?? 0
        if (piercingCount > 0) {
          projectile.piercingCount = piercingCount - 1
          if (!projectile.hitEnemyIds) projectile.hitEnemyIds = []
          projectile.hitEnemyIds.push(enemy.id)
        } else {
          this.autoAttack.removeProjectileAt(projectileIndex)
        }

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
    const isDashing = (player.dashTimeRemaining || 0) > 0
    if (!isDashing && collidingEnemy) {
      playerStore.setPlayerHP(player.hp - collidingEnemy.attackPower * 0.016)
    }

    this.enemyProjectileSystem.update(
      deltaTime,
      this.renderer.getCanvasSize().width,
      this.renderer.getCanvasSize().height
    )
    const enemyProjectiles = this.enemyProjectileSystem.getProjectiles()
    for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
      const p = enemyProjectiles[i]
      if (!CollisionDetection.checkCircleCollision(player, player.radius, p, p.radius)) continue
      if (isDashing) continue // 대쉬 중 탄막 통과
      playerStore.setPlayerHP(player.hp - p.damage)
      this.enemyProjectileSystem.removeProjectile(i)
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
      this.renderer.renderProjectiles(this.enemyProjectileSystem.getProjectiles(), true)

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

      // 중간보스 체력바 (모든 중간보스)
      const miniBosses = enemyStore.enemies.filter(
        (e) => (e as any).isBoss && !(e as any).isFinalBoss
      )
      miniBosses.forEach((miniBoss) => {
        this.renderer.renderBossHealthBar(miniBoss.x, miniBoss.y, miniBoss.radius, miniBoss.hp, miniBoss.maxHp)
      })

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

  // ── 개발자 모드: 시간 점프 ────────────────────────────────
  // DEV_MODE 전용 – 삭제하려면 이 메서드와 App.tsx의 devSetGameTime 호출만 제거
  public devSyncTime(seconds: number) {
    useGameStore.getState().setGameTime(seconds)
    this.enemySpawner.devSyncTime(seconds)
    // 최종보스 스폰 플래그 동기화
    if (seconds >= FINAL_BOSS_SPAWN_TIME) {
      this.finalBossSpawned = true
      useGameStore.getState().setFinalBossSpawned(true)
    } else {
      this.finalBossSpawned = false
      useGameStore.getState().setFinalBossSpawned(false)
      useGameStore.getState().setFinalBossDefeated(false)
    }
  }

  public destroy() {
    this.stop()
    this.renderer.destroy()
  }
}
