import { Player, Enemy, Projectile } from '../types'
import { CollisionDetection } from './CollisionDetection'
import { ProjectileSystem } from './Projectile'

export class AutoAttack {
  private attackCooldown: number = 0
  private detectionRange: number = 400
  private projectileSystem: ProjectileSystem

  constructor() {
    this.projectileSystem = new ProjectileSystem()
  }

  update(
    deltaTime: number,
    player: Player,
    enemies: Enemy[]
  ): Projectile[] {
    this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime)

    const projectiles = this.projectileSystem.getProjectiles()
    this.projectileSystem.update(deltaTime, 1920, 1080)

    if (this.attackCooldown <= 0 && enemies.length > 0) {
      const target = CollisionDetection.getClosestEnemy(player, enemies, this.detectionRange)

      if (target) {
        this.fireProjectile(player, target)
        this.attackCooldown = 1 / player.attackSpeed
      }
    }

    return projectiles
  }

  private fireProjectile(player: Player, target: Enemy): void {
    this.projectileSystem.createProjectile(
      player.x,
      player.y,
      target.x,
      target.y,
      player.attackPower,
      600
    )
  }

  checkCollisions(enemies: Enemy[]): Array<{ projectileIndex: number; enemyIndex: number }> {
    const projectiles = this.projectileSystem.getProjectiles()
    return CollisionDetection.checkProjectileEnemyCollisions(projectiles, enemies)
  }

  removeProjectileAt(index: number): void {
    this.projectileSystem.removeProjectile(index)
  }

  getProjectiles(): Projectile[] {
    return this.projectileSystem.getProjectiles()
  }

  reset(): void {
    this.attackCooldown = 0
    this.projectileSystem.reset()
  }
}
