export const GAME_CONFIG = {
  canvas: {
    width: 1920,
    height: 1080,
  },
  player: {
    initialRadius: 15,
    initialHp: 100,
    initialAttackPower: 10,
    initialAttackSpeed: 1,
    initialMoveSpeed: 200,
  },
  enemy: {
    basicRadius: 12,
    basicHp: 20,
    basicAttackPower: 5,
    basicMoveSpeed: 80,
  },
  gameplay: {
    deltaTimeMax: 0.016,
  },
} as const

export const JOYSTICK_CONFIG = {
  radius: 60,
  innerRadius: 30,
  offsetX: 100,
  offsetY: -100,
} as const
