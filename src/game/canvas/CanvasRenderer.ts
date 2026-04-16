import { Player, Enemy, Projectile } from '../../types'
import { GAME_CONFIG, JOYSTICK_CONFIG } from '../../config/gameConfig'
import { GAME_COLORS } from '../../config/constants'
import { JoystickInput } from '../input/JoystickInput'
import { KeyboardInput } from '../input/KeyboardInput'
import { MouseInput } from '../input/MouseInput'
import { DebugStats } from '../DebugSystem'

export class CanvasRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private joystickInput: JoystickInput
  private keyboardInput: KeyboardInput
  private mouseInput: MouseInput
  private showDebug: boolean = true

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.setupCanvas()
    this.joystickInput = new JoystickInput(canvas)
    this.keyboardInput = new KeyboardInput()
    this.mouseInput = new MouseInput(canvas)
    this.setupDebugToggle()
    // 우클릭 메뉴 비활성화 (게임용)
    canvas.addEventListener('contextmenu', (e) => e.preventDefault())
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

  public getKeyboardInput(): KeyboardInput {
    return this.keyboardInput
  }

  public getMouseInput(): MouseInput {
    return this.mouseInput
  }

  public clear(playerX: number = 0, playerY: number = 0) {
    // 배경 채우기
    this.ctx.fillStyle = GAME_COLORS.background
    this.ctx.fillRect(0, 0, GAME_CONFIG.canvas.width, GAME_CONFIG.canvas.height)

    // 격자 배경 그리기 (플레이어 위치에 따라 스크롤)
    const gridSize = 80
    const offsetX = playerX % gridSize
    const offsetY = playerY % gridSize

    this.ctx.strokeStyle = 'rgba(0, 217, 255, 0.1)'
    this.ctx.lineWidth = 1

    // 수평선
    for (let i = -gridSize; i < GAME_CONFIG.canvas.height + gridSize; i += gridSize) {
      this.ctx.beginPath()
      this.ctx.moveTo(0, i - offsetY)
      this.ctx.lineTo(GAME_CONFIG.canvas.width, i - offsetY)
      this.ctx.stroke()
    }

    // 수직선
    for (let i = -gridSize; i < GAME_CONFIG.canvas.width + gridSize; i += gridSize) {
      this.ctx.beginPath()
      this.ctx.moveTo(i - offsetX, 0)
      this.ctx.lineTo(i - offsetX, GAME_CONFIG.canvas.height)
      this.ctx.stroke()
    }
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
    const { x, y, radius, type } = enemy

    switch (type) {
      case 'fast': {
        const size = radius * 2
        this.ctx.fillStyle = '#FFAA00'
        this.ctx.beginPath()
        this.ctx.moveTo(x, y - size)
        this.ctx.lineTo(x - size, y + size)
        this.ctx.lineTo(x + size, y + size)
        this.ctx.closePath()
        this.ctx.fill()

        this.ctx.strokeStyle = '#FFFFFF'
        this.ctx.lineWidth = 2
        this.ctx.stroke()
        break
      }
      case 'tank': {
        const size = radius * 2
        this.ctx.fillStyle = '#8B0000'
        this.ctx.fillRect(x - size, y - size, size * 2, size * 2)

        this.ctx.strokeStyle = '#FFD700'
        this.ctx.lineWidth = 3
        this.ctx.strokeRect(x - size, y - size, size * 2, size * 2)
        break
      }
      default: {
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
    }
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

  public renderAimCursor(x: number, y: number, active: boolean) {
    if (!active) return

    const size = 18
    this.ctx.save()
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)'
    this.ctx.lineWidth = 2

    this.ctx.beginPath()
    this.ctx.arc(x, y, size, 0, Math.PI * 2)
    this.ctx.stroke()

    this.ctx.beginPath()
    this.ctx.moveTo(x - size * 0.7, y)
    this.ctx.lineTo(x + size * 0.7, y)
    this.ctx.moveTo(x, y - size * 0.7)
    this.ctx.lineTo(x, y + size * 0.7)
    this.ctx.stroke()

    this.ctx.restore()
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
    const canvasWidth = GAME_CONFIG.canvas.width
    const canvasHeight = GAME_CONFIG.canvas.height
    
    // 우측 상단 정보 패널 (생존시간, 처치, 레벨만)
    const panelX = canvasWidth - 280
    const panelY = 20
    const panelWidth = 260
    const panelHeight = 120
    const padding = 15

    // 반투명 배경
    this.ctx.fillStyle = 'rgba(10, 10, 30, 0.8)'
    this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight)

    // 테두리
    this.ctx.strokeStyle = GAME_COLORS.ui
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight)

    // 텍스트
    this.ctx.font = 'bold 20px Arial'
    this.ctx.fillStyle = GAME_COLORS.ui
    this.ctx.textAlign = 'left'

    let currentY = panelY + padding + 20

    // 시간을 절댓값으로 표시 (음수 방지)
    const displayTime = Math.max(0, Math.floor(gameTime))
    this.ctx.fillText(`⏱ ${displayTime}s`, panelX + padding, currentY)
    currentY += 30

    this.ctx.fillText(`💀 ${killCount}`, panelX + padding, currentY)
    currentY += 30

    this.ctx.fillText(`⭐ ${playerLevel}`, panelX + padding, currentY)
  }

  public renderPlayerHealthBar(playerX: number, playerY: number, playerHP: number, maxHP: number) {
    // 플레이어 바로 아래에 작은 체력바
    const barWidth = 60
    const barHeight = 8
    const hpPercent = playerHP / maxHP

    // 배경
    this.ctx.fillStyle = '#333333'
    this.ctx.fillRect(playerX - barWidth / 2, playerY + 35, barWidth, barHeight)

    // 체력
    this.ctx.fillStyle = playerHP > maxHP * 0.25 ? '#00FF00' : '#FF0000'
    this.ctx.fillRect(playerX - barWidth / 2, playerY + 35, barWidth * hpPercent, barHeight)

    // 테두리
    this.ctx.strokeStyle = GAME_COLORS.ui
    this.ctx.lineWidth = 1
    this.ctx.strokeRect(playerX - barWidth / 2, playerY + 35, barWidth, barHeight)
  }

  public renderExperienceBar(playerExp: number, maxExp: number) {
    // 화면 하단 경험치바 (작은 크기)
    const canvasWidth = GAME_CONFIG.canvas.width
    const canvasHeight = GAME_CONFIG.canvas.height
    const padding = 20
    const barHeight = 16
    const barWidth = 400

    const expBarX = (canvasWidth - barWidth) / 2
    const expBarY = canvasHeight - padding - barHeight
    const expPercent = playerExp / maxExp

    // 배경
    this.ctx.fillStyle = '#333333'
    this.ctx.fillRect(expBarX, expBarY, barWidth, barHeight)

    // 경험치
    this.ctx.fillStyle = '#FFD700'
    this.ctx.fillRect(expBarX, expBarY, barWidth * expPercent, barHeight)

    // 테두리
    this.ctx.strokeStyle = GAME_COLORS.ui
    this.ctx.lineWidth = 1
    this.ctx.strokeRect(expBarX, expBarY, barWidth, barHeight)
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
