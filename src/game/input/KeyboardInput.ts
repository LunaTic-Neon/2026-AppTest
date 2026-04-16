import { Vector2 } from '../../types'

export class KeyboardInput {
  private keys: Map<string, boolean> = new Map()
  private movementVector: Vector2 = { x: 0, y: 0 }

  constructor() {
    this.setupEventListeners()
  }

  private setupEventListeners() {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase()
      this.keys.set(key, true)
      this.updateMovementVector()
    })

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase()
      this.keys.set(key, false)
      this.updateMovementVector()
    })
  }

  private updateMovementVector() {
    let x = 0
    let y = 0

    // WASD 키
    if (this.keys.get('w') || this.keys.get('arrowup')) y -= 1
    if (this.keys.get('s') || this.keys.get('arrowdown')) y += 1
    if (this.keys.get('a') || this.keys.get('arrowleft')) x -= 1
    if (this.keys.get('d') || this.keys.get('arrowright')) x += 1

    // 벡터 정규화
    if (x !== 0 || y !== 0) {
      const magnitude = Math.hypot(x, y)
      this.movementVector.x = x / magnitude
      this.movementVector.y = y / magnitude
    } else {
      this.movementVector.x = 0
      this.movementVector.y = 0
    }
  }

  public getMovementVector(): Vector2 {
    return { ...this.movementVector }
  }

  public isKeyPressed(key: string): boolean {
    return this.keys.get(key.toLowerCase()) || false
  }
}
