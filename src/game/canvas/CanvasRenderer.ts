import { Player, Enemy, Projectile } from '../../types'
import { GAME_CONFIG, JOYSTICK_CONFIG } from '../../config/gameConfig'
import { GAME_COLORS } from '../../config/constants'
import { JoystickInput } from '../input/JoystickInput'
import { DebugStats } from '../DebugSystem'

export class CanvasRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private joystickInput: JoystickInput
  private showDebug: boolean = true

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.setupCanvas()
    this.joystickInput = new JoystickInput(canvas)
    this.setupDebugToggle()
  }

  private setupDebugToggle() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'd' || e.key === 'D') {
        this.showDebug = !this.showDebug
      }
    })
  }

  private setupCanvas() {
    const dpr = window.devicePixelRatio || 1
    this.canvas.width = GAME_CONFIG.canvas.width * dpr
    this.canvas.height = GAME_CONFIG.canvas.height * dpr
    this.ctx.scale(dpr, dpr)
  }

  public getCanvasSize() {
    return {
      width: GAME_CONFIG.canvas.width,
      height: GAME_CONFIG.canvas.height,
    }
  }

  public getJoystickInput(): JoystickInput {
    return this.joystickInput
  }

  public clear() {
    this.ctx.fillStyle = GAME_COLORS.background
    this.ctx.fillRect(0, 0, GAME_CONFIG.canvas.width, GAME_CONFIG.canvas.height)
  }

  public renderPlayer(player: Player) {
    const { x, y, radius, rotation } = player

    this.ctx.save()
    this.ctx.translate(x, y)
    this.ctx.rotate(rotation)

    this.ctx.fillStyle = GAME_COLORS.player
    this.ctx.beginPath()
    this.ctx.arc(0, 0, radius, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.strokeStyle = '#00FF88'
    this.ctx.lineWidth = 2
    this.ctx.beginPath()
    this.ctx.arc(0, 0, radius, 0, Math.PI * 2)
    this.ctx.stroke()

    this.ctx.fillStyle = '#00FF88'
    this.ctx.beginPath()
    this.ctx.arc(radius - 3, 0, 3, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.restore()
  }

  public renderEnemy(enemy: Enemy) {
    const { x, y, radius } = enemy

    this.ctx.fillStyle = GAME_COLORS.enemy
    this.ctx.beginPath()
    this.ctx.arc(x, y, radius, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.strokeStyle = '#FF0000'
    this.ctx.lineWidth = 2
    this.ctx.beginPath()
    this.ctx.arc(x, y, radius, 0, Math.PI * 2)
    this.ctx.stroke()
  }

  public renderEnemies(enemies: Enemy[]) {
    for (const enemy of enemies) {
      this.renderEnemy(enemy)
    }
  }

  public renderProjectile(projectile: Projectile) {
    const { x, y, radius } = projectile

    this.ctx.fillStyle = GAME_COLORS.projectile
    this.ctx.beginPath()
    this.ctx.arc(x, y, radius, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.strokeStyle = '#FFAA00'
    this.ctx.lineWidth = 1
    this.ctx.beginPath()
    this.ctx.arc(x, y, radius, 0, Math.PI * 2)
    this.ctx.stroke()

    this.ctx.shadowColor = GAME_COLORS.projectile
    this.ctx.shadowBlur = 8
  }

  public renderProjectiles(projectiles: Projectile[]) {
    for (const projectile of projectiles) {
      this.renderProjectile(projectile)
    }
  }

  public renderJoystick() {
    const centerX = GAME_CONFIG.canvas.width - JOYSTICK_CONFIG.offsetX
    const centerY = GAME_CONFIG.canvas.height - JOYSTICK_CONFIG.offsetY

    this.ctx.fillStyle = 'rgba(0, 217, 255, 0.1)'
    this.ctx.beginPath()
    this.ctx.arc(centerX, centerY, JOYSTICK_CONFIG.radius, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.strokeStyle = 'rgba(0, 217, 255, 0.3)'
    this.ctx.lineWidth = 2
    this.ctx.beginPath()
    this.ctx.arc(centerX, centerY, JOYSTICK_CONFIG.radius, 0, Math.PI * 2)
    this.ctx.stroke()

    if (this.joystickInput.state.isActive) {
      const knobX = centerX + Math.cos(this.joystickInput.state.angle) * JOYSTICK_CONFIG.innerRadius * this.joystickInput.state.magnitude
      const knobY = centerY + Math.sin(this.joystickInput.state.angle) * JOYSTICK_CONFIG.innerRadius * this.joystickInput.state.magnitude

      this.ctx.fillStyle = 'rgba(0, 217, 255, 0.6)'
      this.ctx.beginPath()
      this.ctx.arc(knobX, knobY, JOYSTICK_CONFIG.innerRadius, 0, Math.PI * 2)
      this.ctx.fill()

      this.ctx.strokeStyle = 'rgba(0, 217, 255, 1)'
      this.ctx.lineWidth = 2
      this.ctx.beginPath()
      this.ctx.arc(knobX, knobY, JOYSTICK_CONFIG.innerRadius, 0, Math.PI * 2)
      this.ctx.stroke()
    } else {
      this.ctx.fillStyle = 'rgba(0, 217, 255, 0.3)'
      this.ctx.beginPath()
      this.ctx.arc(centerX, centerY, JOYSTICK_CONFIG.innerRadius, 0, Math.PI * 2)
      this.ctx.fill()
    }
  }

  public renderHUD(gameTime: number, killCount: number, playerHP: number, maxHP: number, playerLevel: number, playerExp: number, maxExp: number) {
    this.ctx.font = 'bold 24px Arial'
    this.ctx.fillStyle = GAME_COLORS.ui
    this.ctx.textAlign = 'left'

    this.ctx.fillText(`생존시간: ${Math.floor(gameTime)}초`, 20, 40)
    this.ctx.fillText(`처치: ${killCount}`, 20, 70)
    this.ctx.fillText(`레벨: ${playerLevel}`, 20, 100)

    const hpBarWidth = 200
    const hpBarHeight = 20
    const hpPercent = playerHP / maxHP

    this.ctx.fillStyle = '#333333'
    this.ctx.fillRect(20, 130, hpBarWidth, hpBarHeight)

    this.ctx.fillStyle = playerHP > maxHP * 0.25 ? '#00FF00' : '#FF0000'
    this.ctx.fillRect(20, 130, hpBarWidth * hpPercent, hpBarHeight)

    this.ctx.strokeStyle = GAME_COLORS.ui
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(20, 130, hpBarWidth, hpBarHeight)

    const expBarWidth = 200
    const expBarHeight = 10
    const expPercent = playerExp / maxExp

    this.ctx.fillStyle = '#333333'
    this.ctx.fillRect(20, 160, expBarWidth, expBarHeight)

    this.ctx.fillStyle = '#FFD700'
    this.ctx.fillRect(20, 160, expBarWidth * expPercent, expBarHeight)

    this.ctx.strokeStyle = GAME_COLORS.ui
    this.ctx.lineWidth = 1
    this.ctx.strokeRect(20, 160, expBarWidth, expBarHeight)
  }

  public resize() {
    const dpr = window.devicePixelRatio || 1
    this.canvas.width = GAME_CONFIG.canvas.width * dpr
    this.canvas.height = GAME_CONFIG.canvas.height * dpr
    this.ctx.scale(dpr, dpr)
  }

  public renderDebugPanel(stats: DebugStats) {
    if (!this.showDebug) return

    const panelX = 20
    const panelY = 20
    const lineHeight = 20
    const padding = 10

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    this.ctx.fillRect(panelX - padding, panelY - padding, 280, 220)

    this.ctx.strokeStyle = 'rgba(0, 217, 255, 0.5)'
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(panelX - padding, panelY - padding, 280, 220)

    this.ctx.font = '12px monospace'
    this.ctx.fillStyle = '#00D9FF'

    const lines = [
      `FPS: ${stats.fps}`,
      `게임시간: ${Math.floor(stats.gameTime)}초`,
      `처치: ${stats.killCount}`,
      `레벨: ${stats.playerLevel}`,
      ``,
      `적: ${stats.totalEnemies}`,
      `투사체: ${stats.totalProjectiles}`,
      ``,
      `플레이어 X: ${Math.round(stats.playerX)}`,
      `플레이어 Y: ${Math.round(stats.playerY)}`,
      `체력: ${Math.round(stats.playerHP)} / ${Math.round(stats.playerMaxHP)}`,
      ``,
      `총 데미지: ${Math.round(stats.totalDamage)}`,
    ]

    lines.forEach((line, index) => {
      this.ctx.fillText(line, panelX, panelY + lineHeight * (index + 1))
    })

    this.ctx.font = '11px monospace'
    this.ctx.fillStyle = '#00AA88'
    this.ctx.fillText('[D] 디버그 토글', panelX, panelY + lineHeight * (lines.length + 2))
  }

  public isDebugVisible(): boolean {
    return this.showDebug
  }

  public destroy() {
    this.joystickInput.destroy()
  }
}
