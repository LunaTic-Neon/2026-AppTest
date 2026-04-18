export interface Vector2 {
  x: number
  y: number
}

export interface Player extends Vector2 {
  velocity: Vector2
  radius: number
  hp: number
  maxHp: number
  level: number
  exp: number
  maxExp: number
  attackPower: number
  attackSpeed: number
  moveSpeed: number
  projectileSpeed?: number
  rotation: number
  // Dash state (optional)
  dashTimeRemaining?: number
  dashVelocity?: Vector2
  dashCooldownMs?: number
  dashDuration?: number
  dashSpeed?: number
  dashLastAt?: number
  // number of projectiles fired per attack (for multi-shot upgrades)
  projectileCount?: number
  // piercing level: 0=none, 1=1pierce(2hit), 2=2pierce(3hit), 3=3pierce(4hit)
  piercingLevel?: number
}

export interface Enemy extends Vector2 {
  velocity: Vector2
  radius: number
  hp: number
  maxHp: number
  attackPower: number
  moveSpeed: number
  type: 'basic' | 'fast' | 'tank' | 'shooter'
  // shooter-specific (optional)
  attackCooldown?: number
  attackTimer?: number
  projectileSpeed?: number
  attackRange?: number
  id: string
  // boss flags/state
  isBoss?: boolean
  phaseIndex?: number
  phaseTimer?: number
  shootTimer?: number
  // 최종보스 전용 필드
  isFinalBoss?: boolean
  bossPattern?: 1 | 2 | 3
  patternTimer?: number
  patternPhase?: 'start' | 'active' | 'end' | 'cooldown'
  shieldHealth?: number
  shieldMaxHealth?: number
  shieldCountdown?: number
  invulnerable?: boolean
  patternBrightness?: number
  patternTeleportDelay?: number
  patternCentralizing?: boolean
  centralizeTimer?: number
}

export interface Projectile extends Vector2 {
  velocity: Vector2
  radius: number
  damage: number
  lifetime: number
  maxLifetime: number
  // piercing: remaining pierce hits (0 = no pierce)
  piercingCount?: number
  // track enemies already hit to prevent multi-hit
  hitEnemyIds?: string[]
}

export interface GameStats {
  gameTime: number
  killCount: number
  totalDamageDealt: number
}

export interface Upgrade {
  id: string
  name: string
  description: string
  type: 'damage' | 'speed' | 'attackSpeed' | 'health' | 'weapon' | 'projectileSpeed' | 'piercing'
  value: number
}

export type GameScene = 'menu' | 'playing' | 'paused' | 'levelUp' | 'gameover' | 'story' | 'stageClear'

export interface JoystickState {
  isActive: boolean
  angle: number
  magnitude: number
}
