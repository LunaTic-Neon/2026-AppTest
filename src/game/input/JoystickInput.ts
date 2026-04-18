import { JoystickState, Vector2 } from '../../types'
import { JOYSTICK_CONFIG, GAME_CONFIG } from '../../config/gameConfig'

export class JoystickInput {
  private touchId: number | null = null
  private basePos: Vector2 = { x: 0, y: 0 }
  private currentPos: Vector2 = { x: 0, y: 0 }
  public state: JoystickState = {
    isActive: false,
    angle: 0,
    magnitude: 0,
  }

  private canvasWidth: number
  private canvasHeight: number

  constructor(canvas: HTMLCanvasElement) {
    this.canvasWidth = GAME_CONFIG.canvas.width
    this.canvasHeight = GAME_CONFIG.canvas.height
    this.setupEventListeners(canvas)
  }

  private setupEventListeners(canvas: HTMLCanvasElement) {
    canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false })
    canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false })
    canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false })
  }

  private handleTouchStart(e: TouchEvent) {
    e.preventDefault()

    if (this.touchId !== null) return

    const touch = e.touches[0]
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
    const x = ((touch.clientX - rect.left) / rect.width) * this.canvasWidth
    const y = ((touch.clientY - rect.top) / rect.height) * this.canvasHeight

    const joystickCenterX = this.canvasWidth - JOYSTICK_CONFIG.offsetX
    const joystickCenterY = this.canvasHeight - JOYSTICK_CONFIG.offsetY

    const dist = Math.hypot(x - joystickCenterX, y - joystickCenterY)

    if (dist < JOYSTICK_CONFIG.radius) {
      this.touchId = touch.identifier
      this.basePos = { x: joystickCenterX, y: joystickCenterY }
      this.currentPos = { x, y }
      this.state.isActive = true
      this.updateJoystickState()
    }
  }

  private handleTouchMove(e: TouchEvent) {
    e.preventDefault()

    if (this.touchId === null) return

    let activeTouchFound = false

    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i]
      if (touch.identifier === this.touchId) {
        const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
        this.currentPos = {
          x: ((touch.clientX - rect.left) / rect.width) * this.canvasWidth,
          y: ((touch.clientY - rect.top) / rect.height) * this.canvasHeight,
        }
        activeTouchFound = true
        break
      }
    }

    if (!activeTouchFound) {
      this.handleTouchEnd(e)
      return
    }

    this.updateJoystickState()
  }

  private handleTouchEnd(e: TouchEvent) {
    if (this.touchId === null) return

    let touchExists = false

    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === this.touchId) {
        touchExists = true
        break
      }
    }

    if (!touchExists) {
      this.touchId = null
      this.state.isActive = false
      this.state.angle = 0
      this.state.magnitude = 0
    }
  }

  private updateJoystickState() {
    const dx = this.currentPos.x - this.basePos.x
    const dy = this.currentPos.y - this.basePos.y

    const distance = Math.hypot(dx, dy)
    const maxDistance = JOYSTICK_CONFIG.radius

    this.state.magnitude = Math.min(distance / maxDistance, 1)
    this.state.angle = Math.atan2(dy, dx)
  }

  public getMovementVector(): Vector2 {
    if (!this.state.isActive || this.state.magnitude === 0) {
      return { x: 0, y: 0 }
    }

    return {
      x: Math.cos(this.state.angle) * this.state.magnitude,
      y: Math.sin(this.state.angle) * this.state.magnitude,
    }
  }

  public destroy() {
    this.touchId = null
    this.state.isActive = false
  }
}
