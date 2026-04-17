import { Projectile } from '../types'

export class EnemyProjectileSystem {
  private projectiles: Projectile[] = []

  createProjectile(x: number, y: number, targetX: number, targetY: number, damage: number, speed: number): Projectile {
    const dx = targetX - x
    const dy = targetY - y
    const distance = Math.hypot(dx, dy) || 1

    const vx = (dx / distance) * speed
    const vy = (dy / distance) * speed

    const projectile: Projectile = {
      x,
      y,
      velocity: { x: vx, y: vy },
      radius: 6,
      damage,
      lifetime: 0,
      maxLifetime: 10,
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
