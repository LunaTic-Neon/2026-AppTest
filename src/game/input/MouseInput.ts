import { GAME_CONFIG } from '../../config/gameConfig'

export class MouseInput {
  private mouseX: number = 0
  private mouseY: number = 0
  private isClicking: boolean = false

  constructor(canvas: HTMLCanvasElement) {
    canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e))
    canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e))
    canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e))
    canvas.addEventListener('mouseleave', (e) => this.handleMouseLeave(e))
  }

  private handleMouseMove(e: MouseEvent) {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
    this.mouseX = ((e.clientX - rect.left) / rect.width) * GAME_CONFIG.canvas.width
    this.mouseY = ((e.clientY - rect.top) / rect.height) * GAME_CONFIG.canvas.height
  }

  private handleMouseDown(e: MouseEvent) {
    // 좌클릭만 감지 (button: 0 = 좌, 1 = 휠, 2 = 우)
    if (e.button === 0) {
      this.isClicking = true
    }
  }

  private handleMouseUp(e: MouseEvent) {
    // 좌클릭만 처리
    if (e.button === 0) {
      this.isClicking = false
    }
  }

  private handleMouseLeave(_e: MouseEvent) {
    this.isClicking = false
  }

  public getMousePosition(): { x: number; y: number } {
    return { x: this.mouseX, y: this.mouseY }
  }

  public isMouseClicking(): boolean {
    return this.isClicking
  }

  public getDirectionToMouse(playerX: number, playerY: number): { x: number; y: number } {
    const dx = this.mouseX - playerX
    const dy = this.mouseY - playerY
    const distance = Math.hypot(dx, dy)

    if (distance === 0) {
      return { x: 0, y: 0 }
    }

    return {
      x: dx / distance,
      y: dy / distance,
    }
  }
}
