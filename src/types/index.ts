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
}

export interface Enemy extends Vector2 {
  velocity: Vector2
  radius: number
  hp: number
  maxHp: number
  attackPower: number
  moveSpeed: number
  type: 'basic' | 'fast' | 'tank'
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

export type GameScene = 'menu' | 'playing' | 'paused' | 'levelup' | 'gameover' | 'story'

export interface JoystickState {
  isActive: boolean
  angle: number
  magnitude: number
}
