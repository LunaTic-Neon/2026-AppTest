import { Player, Enemy, Projectile, Vector2 } from '../types'

export class CollisionDetection {
  static checkCircleCollision(a: Vector2, radiusA: number, b: Vector2, radiusB: number): boolean {
    const dx = a.x - b.x
    const dy = a.y - b.y
    const distance = Math.hypot(dx, dy)
    return distance < radiusA + radiusB
  }

  static checkPlayerEnemyCollision(player: Player, enemies: Enemy[]): Enemy | null {
    for (const enemy of enemies) {
      if (this.checkCircleCollision(player, player.radius, enemy, enemy.radius)) {
        return enemy
      }
    }
    return null
  }

  static checkProjectileEnemyCollisions(
    projectiles: Projectile[],
    enemies: Enemy[]
  ): Array<{ projectileIndex: number; enemyIndex: number }> {
    const collisions: Array<{ projectileIndex: number; enemyIndex: number }> = []

    for (let i = 0; i < projectiles.length; i++) {
      for (let j = 0; j < enemies.length; j++) {
        if (this.checkCircleCollision(projectiles[i], projectiles[i].radius, enemies[j], enemies[j].radius)) {
          collisions.push({ projectileIndex: i, enemyIndex: j })
        }
      }
    }

    return collisions
  }

  static getClosestEnemy(player: Player, enemies: Enemy[], detectionRange: number): Enemy | null {
    let closest: Enemy | null = null
    let closestDistance = detectionRange

    for (const enemy of enemies) {
      const dx = enemy.x - player.x
      const dy = enemy.y - player.y
      const distance = Math.hypot(dx, dy)

      if (distance < closestDistance) {
        closestDistance = distance
        closest = enemy
      }
    }

    return closest
  }
}
