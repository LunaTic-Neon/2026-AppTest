import { Enemy } from '../types'
import { GAME_CONFIG } from '../config/gameConfig'

// 중간보스 도약 속도 (GameLoop에서 참조)
export const MINI_BOSS_LEAP_SPEED = 720

export class EnemySpawner {
  private spawnRate: number = 1.2           // 초기 스폰률
  private timeSinceLastSpawn: number = 0
  private waveSize: number = 1
  private waveTimer: number = 0
  private gameTime: number = 0
  private miniBossTimer: number = 0         // 중간보스 주기 타이머
  private miniBossCount: number = 0         // 이번 판 소환된 중간보스 수
  private readonly maxMiniBoss: number = 3  // 최대 3회

  // smooth growth parameters
  private readonly maxSpawnRate: number = 7.0
  private readonly spawnRateGrowthPerMinute: number = 1.4

  update(deltaTime: number): void {
    this.gameTime += deltaTime
    this.timeSinceLastSpawn += deltaTime
    this.waveTimer += deltaTime
    this.miniBossTimer += deltaTime

    this.updateDifficulty()
  }

  private updateDifficulty(): void {
    const minutes = this.gameTime / 60
    const growth = minutes * this.spawnRateGrowthPerMinute
    this.spawnRate = Math.min(1.2 + growth, this.maxSpawnRate)

    // Wave size: 20초마다 +1, 최대 6
    const desiredWaveSize = 1 + Math.floor(this.gameTime / 20)
    this.waveSize = Math.min(desiredWaveSize, 6)

    if (this.waveTimer > 20) this.waveTimer = 20
  }

  shouldSpawn(): boolean {
    if (this.timeSinceLastSpawn < 0) this.timeSinceLastSpawn = 0
    return this.timeSinceLastSpawn >= 1 / this.spawnRate
  }

  spawn(playerX: number, playerY: number): Enemy[] {
    this.timeSinceLastSpawn = 0
    const enemies: Enemy[] = []
    const spawnCount = this.waveTimer < 2 ? this.waveSize : 1
    for (let i = 0; i < spawnCount; i++) {
      enemies.push(this.createEnemy(playerX, playerY))
    }
    return enemies
  }

  private createEnemy(playerX: number, playerY: number): Enemy {
    const angle = Math.random() * Math.PI * 2
    const distance = 1100 + Math.random() * 300  // 화면 밖

    const x = playerX + Math.cos(angle) * distance
    const y = playerY + Math.sin(angle) * distance

    const type = this.getRandomEnemyType()
    const stats = this.getEnemyStats(type)

    return {
      id: `enemy_${Date.now()}_${Math.random()}`,
      x,
      y,
      velocity: { x: 0, y: 0 },
      radius: GAME_CONFIG.enemy.basicRadius,
      hp: stats.hp,
      maxHp: stats.hp,
      attackPower: stats.attackPower,
      moveSpeed: stats.moveSpeed,
      type,
      attackCooldown: (stats as any).attackCooldown,
      projectileSpeed: (stats as any).projectileSpeed,
      attackRange: (stats as any).attackRange,
      attackTimer: 0,
    }
  }

  private getRandomEnemyType(): 'basic' | 'fast' | 'tank' | 'shooter' {
    const rand = Math.random()
    if (rand < 0.55) return 'basic'
    if (rand < 0.75) return 'fast'
    if (rand < 0.90) return 'tank'
    return 'shooter'
  }

  private getEnemyStats(type: 'basic' | 'fast' | 'tank' | 'shooter') {
    // 극초반 낮게 시작, 시간에 따라 선형 증가
    // 0s→0.6배, 60s→2.6배, 180s→6.6배
    const difficultyMultiplier = 0.6 + this.gameTime / 30
    const base = GAME_CONFIG.enemy

    switch (type) {
      case 'shooter':
        return {
          hp: base.basicHp * 0.9 * difficultyMultiplier,
          attackPower: base.basicAttackPower * 0.9 * difficultyMultiplier,
          moveSpeed: base.basicMoveSpeed * 0.85,
          projectileSpeed: 520,
          attackRange: 520,
          attackCooldown: 1.1,
        }
      case 'fast':
        return {
          hp: base.basicHp * 0.7 * difficultyMultiplier,
          attackPower: base.basicAttackPower * 0.8 * difficultyMultiplier,
          moveSpeed: base.basicMoveSpeed * 1.7,
        }
      case 'tank':
        return {
          hp: base.basicHp * 1.8 * difficultyMultiplier,
          attackPower: base.basicAttackPower * 1.2 * difficultyMultiplier,
          moveSpeed: base.basicMoveSpeed * 0.675,
        }
      default:
        return {
          hp: base.basicHp * difficultyMultiplier,
          attackPower: base.basicAttackPower * difficultyMultiplier,
          moveSpeed: base.basicMoveSpeed * 1.05,
        }
    }
  }

  getCurrentSpawnRate(): number {
    return this.spawnRate
  }

  // ── 중간보스 (50초마다, 최대 3회) ──────────────────────────
  shouldSpawnMiniBoss(): boolean {
    if (this.miniBossCount >= this.maxMiniBoss) return false
    return this.miniBossTimer >= 50.0
  }

  spawnMiniBoss(playerX: number, playerY: number): Enemy {
    // 오버플로우 보정
    this.miniBossTimer -= 50.0
    if (this.miniBossTimer < 0) this.miniBossTimer = 0
    this.miniBossCount++

    const angle = Math.random() * Math.PI * 2
    const distance = 700
    const x = playerX + Math.cos(angle) * distance
    const y = playerY + Math.sin(angle) * distance

    // 중간보스 체력 = 기본 18배 * 3배 = 54배
    const hp = Math.max(1, Math.floor(GAME_CONFIG.enemy.basicHp * 54))
    const attackPower = GAME_CONFIG.enemy.basicAttackPower * 3.0

    const boss: Enemy = {
      id: `boss_${Date.now()}`,
      x,
      y,
      velocity: { x: 0, y: 0 },
      radius: GAME_CONFIG.enemy.basicRadius * 1.8,
      hp,
      maxHp: hp,
      attackPower,
      moveSpeed: 65,
      type: 'tank',
      isBoss: true,
      phaseIndex: 0,
      phaseTimer: 0,
      shootTimer: 0,
      attackCooldown: 1.8,
      attackTimer: 0,
      projectileSpeed: 336,
      attackRange: 800,
    }

    return boss
  }

  getMiniBossCount(): number {
    return this.miniBossCount
  }

  reset(): void {
    this.spawnRate = 1.2
    this.timeSinceLastSpawn = 0
    this.waveSize = 1
    this.waveTimer = 0
    this.gameTime = 0
    this.miniBossTimer = 0
    this.miniBossCount = 0
  }
}
