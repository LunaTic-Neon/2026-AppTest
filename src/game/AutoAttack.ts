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
    enemies: Enemy[],
    mouseX?: number,
    mouseY?: number,
    isMouseClicking?: boolean
  ): Projectile[] {
    this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime)

    const projectiles = this.projectileSystem.getProjectiles()
    this.projectileSystem.update(deltaTime, 1920, 1080)

    // 마우스 클릭으로 공격
    if (isMouseClicking && mouseX !== undefined && mouseY !== undefined && this.attackCooldown <= 0) {
      this.fireProjectileToMouse(player, mouseX, mouseY)
      this.attackCooldown = 1 / player.attackSpeed
    }
    // 근처 적 자동 공격
    else if (this.attackCooldown <= 0 && enemies.length > 0) {
      const target = CollisionDetection.getClosestEnemy(player, enemies, this.detectionRange)

      if (target) {
        this.fireProjectile(player, target)
        this.attackCooldown = 1 / player.attackSpeed
      }
    }

    return projectiles
  }

  private fireProjectile(player: Player, target: Enemy): void {
    const count = Math.min(player.projectileCount || 1, 5)
    const baseAngle = Math.atan2(target.y - player.y, target.x - player.x)
    const spread = 0.25 // radians total spread

    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1)
      const angle = baseAngle + (t - 0.5) * spread
      const tx = player.x + Math.cos(angle) * 10
      const ty = player.y + Math.sin(angle) * 10
      const vx = Math.cos(angle) * 600
      const vy = Math.sin(angle) * 600

      this.projectileSystem.createProjectile(
        tx,
        ty,
        tx + vx,
        ty + vy,
        player.attackPower,
        600
      )
    }
  }

  private fireProjectileToMouse(player: Player, mouseX: number, mouseY: number): void {
    const count = Math.min(player.projectileCount || 1, 5)
    const baseAngle = Math.atan2(mouseY - player.y, mouseX - player.x)
    const spread = 0.25

    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1)
      const angle = baseAngle + (t - 0.5) * spread
      const tx = player.x + Math.cos(angle) * 10
      const ty = player.y + Math.sin(angle) * 10
      const vx = Math.cos(angle) * 600
      const vy = Math.sin(angle) * 600

      this.projectileSystem.createProjectile(
        tx,
        ty,
        tx + vx,
        ty + vy,
        player.attackPower,
        600
      )
    }
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
