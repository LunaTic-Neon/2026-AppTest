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

    // 수평선 전체를 단일 path로 배칭
    this.ctx.beginPath()
    for (let i = -gridSize; i < GAME_CONFIG.canvas.height + gridSize; i += gridSize) {
      this.ctx.moveTo(0, i - offsetY)
      this.ctx.lineTo(GAME_CONFIG.canvas.width, i - offsetY)
    }
    this.ctx.stroke()

    // 수직선 전체를 단일 path로 배칭
    this.ctx.beginPath()
    for (let i = -gridSize; i < GAME_CONFIG.canvas.width + gridSize; i += gridSize) {
      this.ctx.moveTo(i - offsetX, 0)
      this.ctx.lineTo(i - offsetX, GAME_CONFIG.canvas.height)
    }
    this.ctx.stroke()
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

    // ── 최종보스: 패턴별 렌더링 ────────────────────────────
    if ((enemy as any).isFinalBoss) {
      const size = radius * 2
      const sides = 12
      const angleOffset = -Math.PI / 2
      const time = Date.now() / 1000
      const pattern = (enemy as any).bossPattern
      const phase = (enemy as any).patternPhase
      const activePattern = phase === 'active' || phase === 'start' || phase === 'centralizing' ? pattern : 0

      this.ctx.save()

      // 패턴 3: 무적 상태 (색상 코팅)
      if ((enemy as any).invulnerable) {
        this.ctx.globalAlpha = 0.7
      }

      // 외부 글로우
      if (activePattern === 1) {
        // 패턴 1: 밝기 변화
        const brightness = (enemy as any).patternBrightness || 0
        this.ctx.shadowColor = `rgba(255, 0, 128, ${0.3 + brightness * 0.7})`
        this.ctx.shadowBlur = 24 + brightness * 20
      } else if (activePattern === 2) {
        // 패턴 2: 파란색 기본
        this.ctx.shadowColor = '#0080FF'
        this.ctx.shadowBlur = 24
      } else {
        // 기본 색상 (패턴 종료 후 즉시 복귀)
        this.ctx.shadowColor = '#FF4DC4'
        this.ctx.shadowBlur = 20
      }

      // 보스 몸체
      let fillColor = '#3D0030'
      if (activePattern === 2) {
        fillColor = '#003D3D'
      } else if (activePattern === 3) {
        if ((enemy as any).invulnerable) {
          const coatPulse = 0.5 + 0.5 * Math.sin(time * 10)
          const g = Math.floor(120 + coatPulse * 90)
          fillColor = `rgb(20, ${g}, 60)`
        } else {
          fillColor = '#1A3D1A'
        }
      }
      this.ctx.fillStyle = fillColor
      this.ctx.beginPath()
      for (let i = 0; i < sides; i++) {
        const a = angleOffset + (i / sides) * Math.PI * 2
        const vx = x + Math.cos(a) * size
        const vy = y + Math.sin(a) * size
        if (i === 0) this.ctx.moveTo(vx, vy)
        else this.ctx.lineTo(vx, vy)
      }
      this.ctx.closePath()
      this.ctx.fill()

      // 내부 회전 문양
      let strokeColor = '#FF0080'
      if (activePattern === 2) {
        strokeColor = '#0080FF'
      } else if (activePattern === 3) {
        strokeColor = (enemy as any).invulnerable ? '#33FFCC' : '#00FF00'
      }
      this.ctx.strokeStyle = strokeColor
      this.ctx.lineWidth = 2
      this.ctx.beginPath()
      for (let i = 0; i < sides; i++) {
        const a = angleOffset + (i / sides) * Math.PI * 2 + time * 0.6
        const vx = x + Math.cos(a) * size
        const vy = y + Math.sin(a) * size
        if (i === 0) this.ctx.moveTo(vx, vy)
        else this.ctx.lineTo(vx, vy)
      }
      this.ctx.closePath()
      this.ctx.stroke()

      // 테두리
      let borderColor = '#FF4DC4'
      if (activePattern === 2) {
        borderColor = '#00BFFF'
      } else if (activePattern === 3) {
        borderColor = (enemy as any).invulnerable ? '#66FFE0' : '#00FF00'
      }
      this.ctx.strokeStyle = borderColor
      this.ctx.lineWidth = 3
      this.ctx.beginPath()
      for (let i = 0; i < sides; i++) {
        const a = angleOffset + (i / sides) * Math.PI * 2
        const vx = x + Math.cos(a) * size
        const vy = y + Math.sin(a) * size
        if (i === 0) this.ctx.moveTo(vx, vy)
        else this.ctx.lineTo(vx, vy)
      }
      this.ctx.closePath()
      this.ctx.stroke()

      // 패턴 2: 막 렌더링
      if (activePattern === 2 && (enemy as any).shieldHealth !== undefined) {
        const shieldRadius = size * 1.3
        this.ctx.strokeStyle = '#0080FF'
        this.ctx.lineWidth = 4
        this.ctx.globalAlpha = 0.5
        this.ctx.beginPath()
        this.ctx.arc(x, y, shieldRadius, 0, Math.PI * 2)
        this.ctx.stroke()
        this.ctx.globalAlpha = 1.0
      }

      this.ctx.restore()

      // BOSS 레이블
      this.ctx.font = 'bold 16px Arial'
      if (activePattern === 2) {
        this.ctx.fillStyle = '#00BFFF'
      } else if (activePattern === 3) {
        this.ctx.fillStyle = '#00FF00'
      } else {
        this.ctx.fillStyle = '#FF4DC4'
      }
      this.ctx.textAlign = 'center'
      this.ctx.fillText('★ BOSS ★', x, y - size - 10)
      return
    }

    switch (type) {
      case 'shooter': {
        const size = radius * 2.2
        const sides = 5
        const angleOffset = -Math.PI / 2
        this.ctx.fillStyle = '#9B5CF6' // purple-ish for shooter
        this.ctx.beginPath()
        for (let i = 0; i < sides; i++) {
          const a = angleOffset + (i / sides) * Math.PI * 2
          const vx = x + Math.cos(a) * size
          const vy = y + Math.sin(a) * size
          if (i === 0) this.ctx.moveTo(vx, vy)
          else this.ctx.lineTo(vx, vy)
        }
        this.ctx.closePath()
        this.ctx.fill()

        this.ctx.strokeStyle = '#FFFFFF'
        this.ctx.lineWidth = 2
        this.ctx.stroke()
        break
      }
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
        // boss will be drawn as a hexagon if flagged
        if ((enemy as any).isBoss) {
          const size = radius * 2
          const sides = 6
          const angleOffset = -Math.PI / 2
          this.ctx.fillStyle = '#8B0000'
          this.ctx.beginPath()
          for (let i = 0; i < sides; i++) {
            const a = angleOffset + (i / sides) * Math.PI * 2
            const vx = x + Math.cos(a) * size
            const vy = y + Math.sin(a) * size
            if (i === 0) this.ctx.moveTo(vx, vy)
            else this.ctx.lineTo(vx, vy)
          }
          this.ctx.closePath()
          this.ctx.fill()

          this.ctx.strokeStyle = '#FFD700'
          this.ctx.lineWidth = 2
          this.ctx.stroke()

          // 중간보스 레이블
        } else {
          const size = radius * 2
          this.ctx.fillStyle = '#8B0000'
          this.ctx.fillRect(x - size, y - size, size * 2, size * 2)

          this.ctx.strokeStyle = '#FFD700'
          this.ctx.lineWidth = 3
          this.ctx.strokeRect(x - size, y - size, size * 2, size * 2)
        }
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

  /** @deprecated 개별 호출 대신 renderProjectiles 배치 버전을 사용하세요 */
  public renderProjectile(projectile: Projectile) {
    const { x, y, radius } = projectile
    this.ctx.fillStyle = GAME_COLORS.projectile
    this.ctx.beginPath()
    this.ctx.arc(x, y, radius, 0, Math.PI * 2)
    this.ctx.fill()
  }

  /**
   * 투사체 배치 렌더링 — beginPath/fill 1회로 전체 투사체를 그림.
   * shadowBlur 를 쓰지 않아 GPU 블러 패스 오버헤드 제거.
   */
  public renderProjectiles(projectiles: Projectile[], isEnemy = false) {
    if (projectiles.length === 0) return
    this.ctx.save()
    this.ctx.shadowBlur = 0  // 누출 방지

    // 내부 원 (fill) — 단일 패스
    this.ctx.fillStyle = isEnemy ? '#FF4444' : GAME_COLORS.projectile
    this.ctx.beginPath()
    for (const p of projectiles) {
      this.ctx.moveTo(p.x + p.radius, p.y)
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
    }
    this.ctx.fill()

    // 테두리 (stroke) — 단일 패스
    this.ctx.strokeStyle = isEnemy ? '#FF8888' : '#FFAA00'
    this.ctx.lineWidth = 1
    this.ctx.beginPath()
    for (const p of projectiles) {
      this.ctx.moveTo(p.x + p.radius, p.y)
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
    }
    this.ctx.stroke()

    this.ctx.restore()
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

  public renderHUD(gameTime: number, killCount: number, _playerHP: number, _maxHP: number, playerLevel: number, _playerExp: number, _maxExp: number) {
  const canvasWidth = GAME_CONFIG.canvas.width
    
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
    const barWidth = 76
    const barHeight = 10
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

  public renderBossHealthBar(bossX: number, bossY: number, bossRadius: number, bossHP: number, bossMaxHP: number) {
    // 중간보스 바로 아래에 체력바 표시
    const barWidth = 120
    const barHeight = 8
    const hpPercent = Math.max(0, Math.min(1, bossHP / bossMaxHP))

    const x = bossX - barWidth / 2
    const y = bossY + bossRadius * 2 + 10

    this.ctx.fillStyle = '#222222'
    this.ctx.fillRect(x, y, barWidth, barHeight)

    this.ctx.fillStyle = '#FF4444'
    this.ctx.fillRect(x, y, barWidth * hpPercent, barHeight)

    // border
    this.ctx.strokeStyle = '#FFD700'
    this.ctx.lineWidth = 1
    this.ctx.strokeRect(x, y, barWidth, barHeight)
  }

  // ── 최종보스 체력바 (화면 상단 중앙, 넓고 화려하게) ────────
  public renderFinalBossHealthBar(hp: number, maxHp: number, boss?: any) {
    const canvasWidth = GAME_CONFIG.canvas.width
    const barWidth = 600
    const barHeight = 18
    const barX = (canvasWidth - barWidth) / 2
    const barY = 18
    const hpPercent = Math.max(0, Math.min(1, hp / maxHp))
    const phase = boss?.patternPhase
    const activePattern = phase === 'active' || phase === 'start' || phase === 'centralizing' ? boss?.bossPattern : 0

    // 레이블
    let labelColor = '#FF4DC4'
    if (activePattern === 2) {
      labelColor = '#00BFFF'
    } else if (activePattern === 3) {
      labelColor = '#00FF00'
    }

    this.ctx.font = 'bold 14px Arial'
    this.ctx.fillStyle = labelColor
    this.ctx.textAlign = 'center'
    this.ctx.fillText('★ BOSS ★', canvasWidth / 2, barY - 6)

    // 배경
    this.ctx.fillStyle = '#1A0015'
    this.ctx.fillRect(barX, barY, barWidth, barHeight)

    // 체력 (그라디언트)
    const grad = this.ctx.createLinearGradient(barX, 0, barX + barWidth, 0)
    if (activePattern === 2) {
      grad.addColorStop(0, '#0080FF')
      grad.addColorStop(1, '#00BFFF')
    } else if (activePattern === 3) {
      grad.addColorStop(0, '#00FF00')
      grad.addColorStop(1, '#00FF80')
    } else {
      grad.addColorStop(0, '#FF0080')
      grad.addColorStop(1, '#FF4DC4')
    }
    this.ctx.fillStyle = grad
    this.ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight)

    // 테두리
    this.ctx.strokeStyle = labelColor
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(barX, barY, barWidth, barHeight)

    // HP 수치
    this.ctx.font = '12px Arial'
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.fillText(`${Math.ceil(hp)} / ${maxHp}`, canvasWidth / 2, barY + barHeight - 3)

    // 패턴 2: 막 체력바 및 카운트다운
    if (activePattern === 2 && boss?.shieldMaxHealth !== undefined) {
      const shieldPercent = Math.max(0, Math.min(1, boss.shieldHealth / boss.shieldMaxHealth))
      const shieldBarY = barY + 35
      const shieldBarWidth = 300
      const shieldBarX = (canvasWidth - shieldBarWidth) / 2
      const shieldBarHeight = 16

      // 막 레이블
      this.ctx.font = 'bold 12px Arial'
      this.ctx.fillStyle = '#00BFFF'
      this.ctx.textAlign = 'center'
      this.ctx.fillText('SHIELD', canvasWidth / 2, shieldBarY - 8)

      // 막 체력바 배경
      this.ctx.fillStyle = '#0A1A2E'
      this.ctx.fillRect(shieldBarX, shieldBarY, shieldBarWidth, shieldBarHeight)

      // 막 체력 (파란색)
      this.ctx.fillStyle = '#0080FF'
      this.ctx.fillRect(shieldBarX, shieldBarY, shieldBarWidth * shieldPercent, shieldBarHeight)

      // 막 체력바 테두리
      this.ctx.strokeStyle = '#00BFFF'
      this.ctx.lineWidth = 2
      this.ctx.strokeRect(shieldBarX, shieldBarY, shieldBarWidth, shieldBarHeight)

      // 카운트다운 표시
      const countdown = Math.max(0, Math.ceil(boss.shieldCountdown || 0))
      this.ctx.font = 'bold 24px Arial'
      this.ctx.fillStyle = countdown > 2 ? '#00BFFF' : '#FF4444'
      this.ctx.textAlign = 'center'
      this.ctx.fillText(`${countdown}s`, canvasWidth / 2, shieldBarY + 55)
    }

    // 패턴 3: 무적 표시
    if (activePattern === 3 && boss?.invulnerable) {
      this.ctx.font = 'bold 20px Arial'
      this.ctx.fillStyle = '#00FF00'
      this.ctx.textAlign = 'center'
      this.ctx.fillText('INVULNERABLE', canvasWidth / 2, barY + 50)
    }
  }

  // ── 최종보스 등장 카운트다운 (3분 전까지) ─────────────────
  public renderBossCountdown(remaining: number) {
    if (remaining <= 0) return
    const canvasWidth = GAME_CONFIG.canvas.width
    const minutes = Math.floor(remaining / 60)
    const seconds = Math.floor(remaining % 60)
    const text = `BOSS ${minutes}:${String(seconds).padStart(2, '0')}`

    // 30초 이하이면 붉게 강조
    const isUrgent = remaining <= 30
    this.ctx.font = `bold ${isUrgent ? 22 : 18}px Arial`
    this.ctx.fillStyle = isUrgent ? '#FF4444' : '#FFD700'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(text, canvasWidth / 2, 40)
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
    this.ctx.setTransform(1, 0, 0, 1, 0, 0)
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
