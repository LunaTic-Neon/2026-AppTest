import { create } from 'zustand'
import { Player } from '../types'
import { GAME_CONFIG } from '../config/gameConfig'

interface PlayerState {
  player: Player
  // dash control
  tryDash: (dirX: number, dirY: number) => void
  tickDash: (deltaTime: number) => void
  setPlayerPosition: (x: number, y: number) => void
  setPlayerVelocity: (vx: number, vy: number) => void
  setPlayerRotation: (rotation: number) => void
  setPlayerHP: (hp: number) => void
  addPlayerExp: (exp: number) => void
  levelUp: () => void
  updateStats: (stats: Partial<Omit<Player, 'x' | 'y' | 'velocity' | 'rotation' | 'radius'>>) => void
  resetPlayer: () => void
}

const INITIAL_PLAYER: Player = {
  x: 960,
  y: 540,
  velocity: { x: 0, y: 0 },
  radius: GAME_CONFIG.player.initialRadius,
  hp: GAME_CONFIG.player.initialHp,
  maxHp: GAME_CONFIG.player.initialHp,
  level: 1,
  exp: 0,
  maxExp: 80, // faster leveling (was 100)
  attackPower: GAME_CONFIG.player.initialAttackPower,
  attackSpeed: GAME_CONFIG.player.initialAttackSpeed,
  moveSpeed: GAME_CONFIG.player.initialMoveSpeed,
  projectileSpeed: 600,
  rotation: 0,
  dashTimeRemaining: 0,
  dashVelocity: { x: 0, y: 0 },
  dashCooldownMs: 1000,
  dashDuration: 0.18,
  dashSpeed: 900,
  projectileCount: 1, // default single shot
}

export const usePlayerStore = create<PlayerState>((set) => ({
  player: INITIAL_PLAYER,

  tryDash: (dirX: number, dirY: number) =>
    set((state) => {
      const now = Date.now()
  const cd = (state.player as any).dashLastAt || 0
  const cooldownMs = (state.player as any).dashCooldownMs || 2000
      if (now - cd < cooldownMs) return { player: state.player }

      const magnitude = Math.hypot(dirX, dirY) || 1
      const nx = dirX / magnitude
      const ny = dirY / magnitude

      // set dash velocity and timer for smooth dash (applied per-frame)
      const dashSpeed = (state.player as any).dashSpeed || 1200
      const dashDuration = (state.player as any).dashDuration || 0.18

      return {
        player: {
          ...state.player,
          dashTimeRemaining: dashDuration,
          dashVelocity: { x: nx * dashSpeed, y: ny * dashSpeed },
          dashLastAt: now,
        } as any,
      }
    }),
  tickDash: (deltaTime: number) =>
    set((state) => {
      const remaining = Math.max(0, (state.player.dashTimeRemaining || 0) - deltaTime)
      const playerUpdate: any = { ...state.player, dashTimeRemaining: remaining }
      if (remaining <= 0) {
        playerUpdate.dashVelocity = { x: 0, y: 0 }
      }
      return { player: playerUpdate }
    }),

  setPlayerPosition: (x, y) =>
    set((state) => ({
      player: { ...state.player, x, y },
    })),

  setPlayerVelocity: (vx, vy) =>
    set((state) => ({
      player: { ...state.player, velocity: { x: vx, y: vy } },
    })),

  setPlayerRotation: (rotation) =>
    set((state) => ({
      player: { ...state.player, rotation },
    })),

  setPlayerHP: (hp) =>
    set((state) => ({
      player: { ...state.player, hp: Math.max(0, Math.min(hp, state.player.maxHp)) },
    })),

  addPlayerExp: (exp) =>
    set((state) => {
      const newExp = state.player.exp + exp
      if (newExp >= state.player.maxExp) {
        const remainingExp = newExp - state.player.maxExp
        return {
          player: {
            ...state.player,
            level: state.player.level + 1,
            exp: remainingExp,
            maxExp: Math.floor(state.player.maxExp * 1.18), // increased growth
          },
        }
      }

      return {
        player: {
          ...state.player,
          exp: newExp,
        },
      }
    }),

  levelUp: () =>
    set((state) => ({
      player: {
        ...state.player,
        level: state.player.level + 1,
        exp: 0,
  maxExp: Math.floor(state.player.maxExp * 1.18),
      },
    })),

  updateStats: (stats) =>
    set((state) => ({
      player: { ...state.player, ...stats },
    })),

  resetPlayer: () => set({ player: INITIAL_PLAYER }),
}))
