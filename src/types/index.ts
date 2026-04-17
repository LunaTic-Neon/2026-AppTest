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
  rotation: number
  // Dash state (optional)
  dashTimeRemaining?: number
  dashVelocity?: Vector2
  dashCooldownMs?: number
  dashDuration?: number
  dashSpeed?: number
  dashLastAt?: number
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
}

export interface Projectile extends Vector2 {
  velocity: Vector2
  radius: number
  damage: number
  lifetime: number
  maxLifetime: number
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
  type: 'damage' | 'speed' | 'attackSpeed' | 'health' | 'weapon'
  value: number
}

export type GameScene = 'menu' | 'playing' | 'paused' | 'levelUp' | 'gameover' | 'story'

export interface JoystickState {
  isActive: boolean
  angle: number
  magnitude: number
}
