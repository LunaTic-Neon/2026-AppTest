import { Enemy } from '../types'
import { GAME_CONFIG } from '../config/gameConfig'

export class EnemySpawner {
  private spawnRate: number = 0.35
  private timeSinceLastSpawn: number = 0
  private waveSize: number = 1
  private waveTimer: number = 0
  private gameTime: number = 0
  private bossTimer: number = 0
  // smooth growth parameters
  private readonly maxSpawnRate: number = 3.0
  private readonly spawnRateGrowthPerMinute: number = 0.5

  update(deltaTime: number): void {
    this.gameTime += deltaTime
    this.timeSinceLastSpawn += deltaTime
    this.waveTimer += deltaTime
    this.bossTimer += deltaTime

    this.updateDifficulty()
  }

  private updateDifficulty(): void {
  // Smooth continuous spawn rate growth with an upper bound.
  const minutes = this.gameTime / 60
  const growth = minutes * this.spawnRateGrowthPerMinute
  this.spawnRate = Math.min(0.35 + growth, this.maxSpawnRate)

  // Wave size increases gradually every 30s, capped at 5.
  const desiredWaveSize = 1 + Math.floor(this.gameTime / 30)
  this.waveSize = Math.min(desiredWaveSize, 5)

  // Keep waveTimer bounded to prevent large bursts from previous logic.
  if (this.waveTimer > 30) this.waveTimer = 30
  }

  shouldSpawn(): boolean {
    if (this.timeSinceLastSpawn < 0) {
      this.timeSinceLastSpawn = 0
    }
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
    const distance = 500 + Math.random() * 200

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
  // shooter-specific optional fields
  attackCooldown: (stats as any).attackCooldown,
  projectileSpeed: (stats as any).projectileSpeed,
  attackRange: (stats as any).attackRange,
  attackTimer: 0,
    }
  }

  private getRandomEnemyType(): 'basic' | 'fast' | 'tank' | 'shooter' {
    const rand = Math.random()
  if (rand < 0.6) return 'basic'
  if (rand < 0.8) return 'fast'
  if (rand < 0.95) return 'tank'
  return 'shooter'
  }

  private getEnemyStats(type: 'basic' | 'fast' | 'tank' | 'shooter') {
    const difficultyMultiplier = 1 + this.gameTime / 60
    const base = GAME_CONFIG.enemy

    switch (type) {
      case 'shooter':
        return {
          hp: base.basicHp * 0.9 * difficultyMultiplier,
          attackPower: base.basicAttackPower * 0.9 * difficultyMultiplier,
          moveSpeed: base.basicMoveSpeed * 0.8,
          // shooter-specific
          projectileSpeed: 500,
          attackRange: 500,
          attackCooldown: 1.2,
        }
      
      case 'fast':
        return {
          hp: base.basicHp * 0.7 * difficultyMultiplier,
          attackPower: base.basicAttackPower * 0.8 * difficultyMultiplier,
          moveSpeed: base.basicMoveSpeed * 1.5,
        }
      case 'tank':
        return {
          hp: base.basicHp * 1.5 * difficultyMultiplier,
          attackPower: base.basicAttackPower * 1.2 * difficultyMultiplier,
          moveSpeed: base.basicMoveSpeed * 0.8,
        }
      default:
        return {
          hp: base.basicHp * difficultyMultiplier,
          attackPower: base.basicAttackPower * difficultyMultiplier,
          moveSpeed: base.basicMoveSpeed,
        }
    }
  }

  getCurrentSpawnRate(): number {
    return this.spawnRate
  }

  reset(): void {
    this.spawnRate = 0.35
    this.timeSinceLastSpawn = 0
    this.waveSize = 1
    this.waveTimer = 0
    this.gameTime = 0
    this.bossTimer = 0
  }

  // call externally to check if it's time to spawn a boss
  shouldSpawnBoss(): boolean {
    return this.bossTimer >= 60
  }
  
  spawnBoss(playerX: number, playerY: number) {
    // reset timer exactly on spawn
    this.bossTimer = 0
    const angle = Math.random() * Math.PI * 2
    const distance = 600
    const x = playerX + Math.cos(angle) * distance
    const y = playerY + Math.sin(angle) * distance

    const hp = Math.max(1, Math.floor(GAME_CONFIG.enemy.basicHp * 6))
    const attackPower = GAME_CONFIG.enemy.basicAttackPower * 2
    const moveSpeed = 80

    const boss: Enemy = {
      id: `boss_${Date.now()}`,
      x,
      y,
      velocity: { x: 0, y: 0 },
      radius: GAME_CONFIG.enemy.basicRadius * 1.6, // smaller hex boss
      hp,
      maxHp: hp,
      attackPower,
      moveSpeed,
      type: 'tank',
      // boss markers & phase state
      isBoss: true,
      phaseIndex: 0,
      phaseTimer: 0,
      shootTimer: 0,
      // shooting params
      attackCooldown: 2.0,
      attackTimer: 0,
      projectileSpeed: 360,
      attackRange: 800,
    }

    return boss
  }
}
