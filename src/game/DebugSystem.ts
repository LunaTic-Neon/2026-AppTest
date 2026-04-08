export interface DebugStats {
  fps: number
  totalEnemies: number
  totalProjectiles: number
  playerX: number
  playerY: number
  playerHP: number
  playerMaxHP: number
  playerLevel: number
  gameTime: number
  killCount: number
  spawnRate: number
  totalDamage: number
}

export class DebugSystem {
  private frameCount: number = 0
  private lastFpsTime: number = Date.now()
  private fps: number = 0
  private stats: DebugStats = {
    fps: 0,
    totalEnemies: 0,
    totalProjectiles: 0,
    playerX: 0,
    playerY: 0,
    playerHP: 100,
    playerMaxHP: 100,
    playerLevel: 1,
    gameTime: 0,
    killCount: 0,
    spawnRate: 0,
    totalDamage: 0,
  }

  public update(
    totalEnemies: number,
    totalProjectiles: number,
    playerX: number,
    playerY: number,
    playerHP: number,
    playerMaxHP: number,
    playerLevel: number,
    gameTime: number,
    killCount: number,
    totalDamage: number,
    spawnRate: number
  ) {
    this.frameCount++
    const now = Date.now()
    if (now - this.lastFpsTime >= 1000) {
      this.fps = this.frameCount
      this.frameCount = 0
      this.lastFpsTime = now
    }

    this.stats = {
      fps: this.fps,
      totalEnemies,
      totalProjectiles,
      playerX,
      playerY,
      playerHP,
      playerMaxHP,
      playerLevel,
      gameTime,
      killCount,
      spawnRate,
      totalDamage,
    }
  }

  public getStats(): DebugStats {
    return this.stats
  }
}
