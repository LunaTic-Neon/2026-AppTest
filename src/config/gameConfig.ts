export const GAME_CONFIG = {
  canvas: {
    width: 1920,
    height: 1080,
  },
  player: {
    initialRadius: 15,
    initialHp: 450,
    initialAttackPower: 10,
    initialAttackSpeed: 1.5,
    initialMoveSpeed: 400,
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

export const EXP_CONFIG = {
  // initial multiplier applied to experience gained at game start
  initialMultiplier: 4.0,
  // multiplier at the end of decayDuration (won't go below this)
  minMultiplier: 0.8,
  // seconds over which multiplier linearly decays from initialMultiplier to minMultiplier
  decayDuration: 45,
} as const

/**
 * Returns an experience multiplier based on elapsed game time (seconds).
 * Starts at EXP_CONFIG.initialMultiplier and linearly decays to EXP_CONFIG.minMultiplier
 * over EXP_CONFIG.decayDuration seconds.
 */
export function getExpMultiplier(gameTimeSeconds: number) {
  const { initialMultiplier, minMultiplier, decayDuration } = EXP_CONFIG
  if (decayDuration <= 0) return minMultiplier
  const t = Math.min(1, Math.max(0, gameTimeSeconds / decayDuration))
  return initialMultiplier + (minMultiplier - initialMultiplier) * t
}
