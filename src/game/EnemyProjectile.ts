import { Projectile } from '../types'

const GLOBAL_PROJECTILE_SPEED_SCALE = 0.7
const MAX_ENEMY_PROJECTILES = 250  // 성능: 보스 패턴 3 등 스파이크 방지

export class EnemyProjectileSystem {
  private projectiles: Projectile[] = []

  createProjectile(x: number, y: number, targetX: number, targetY: number, damage: number, speed: number): Projectile {
    // 최대 수 초과 시 가장 오래된 투사체 제거
    if (this.projectiles.length >= MAX_ENEMY_PROJECTILES) {
      this.projectiles.splice(0, 20)
    }
    const actualSpeed = speed * GLOBAL_PROJECTILE_SPEED_SCALE
    const dx = targetX - x
    const dy = targetY - y
    const distance = Math.hypot(dx, dy) || 1

    const vx = (dx / distance) * actualSpeed
    const vy = (dy / distance) * actualSpeed

    const projectile: Projectile = {
      x,
      y,
      velocity: { x: vx, y: vy },
      radius: 6,
      damage,
      lifetime: 0,
      maxLifetime: 5,
    }

    this.projectiles.push(projectile)

    return projectile
  }

  update(deltaTime: number, canvasWidth: number, canvasHeight: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i]
      p.x += p.velocity.x * deltaTime
      p.y += p.velocity.y * deltaTime
      p.lifetime += deltaTime

      const outOfBounds = p.x < -50 || p.x > canvasWidth + 50 || p.y < -50 || p.y > canvasHeight + 50
      if (p.lifetime > p.maxLifetime || outOfBounds) {
        this.projectiles.splice(i, 1)
      }
    }
  }

  getProjectiles() {
    return this.projectiles
  }

  removeProjectile(index: number) {
    this.projectiles.splice(index, 1)
  }

  reset() {
    this.projectiles = []
  }
}
