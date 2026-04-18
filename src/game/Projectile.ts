import { Projectile } from '../types'

const GLOBAL_PROJECTILE_SPEED_SCALE = 0.7

export class ProjectileSystem {
  private projectiles: Projectile[] = []
  private nextProjectileId: number = 0

  createProjectile(x: number, y: number, targetX: number, targetY: number, damage: number, speed: number, piercingCount: number = 0): Projectile {
    const actualSpeed = speed * GLOBAL_PROJECTILE_SPEED_SCALE
    const dx = targetX - x
    const dy = targetY - y
    const distance = Math.hypot(dx, dy)

    const vx = (dx / distance) * actualSpeed
    const vy = (dy / distance) * actualSpeed

    const projectile: Projectile = {
      x,
      y,
      velocity: { x: vx, y: vy },
      radius: 5,
      damage,
      lifetime: 0,
      maxLifetime: 5,
      piercingCount,
      hitEnemyIds: [],
    }

    this.projectiles.push(projectile)
    this.nextProjectileId++

    return projectile
  }

  update(deltaTime: number, canvasWidth: number, canvasHeight: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i]

      p.x += p.velocity.x * deltaTime
      p.y += p.velocity.y * deltaTime
      p.lifetime += deltaTime

      const isOutOfBounds =
        p.x < -50 ||
        p.x > canvasWidth + 50 ||
        p.y < -50 ||
        p.y > canvasHeight + 50

      if (p.lifetime > p.maxLifetime || isOutOfBounds) {
        this.projectiles.splice(i, 1)
      }
    }
  }

  getProjectiles(): Projectile[] {
    return this.projectiles
  }

  removeProjectile(index: number): void {
    this.projectiles.splice(index, 1)
  }

  reset(): void {
    this.projectiles = []
    this.nextProjectileId = 0
  }
}
