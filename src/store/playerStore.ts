import { create } from 'zustand'
import { Player } from '../types'
import { GAME_CONFIG } from '../config/gameConfig'

interface PlayerState {
  player: Player
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
  maxExp: 100,
  attackPower: GAME_CONFIG.player.initialAttackPower,
  attackSpeed: GAME_CONFIG.player.initialAttackSpeed,
  moveSpeed: GAME_CONFIG.player.initialMoveSpeed,
  rotation: 0,
}

export const usePlayerStore = create<PlayerState>((set) => ({
  player: INITIAL_PLAYER,

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
            maxExp: state.player.maxExp * 1.15,
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
        maxExp: state.player.maxExp * 1.15,
      },
    })),

  updateStats: (stats) =>
    set((state) => ({
      player: { ...state.player, ...stats },
    })),

  resetPlayer: () => set({ player: INITIAL_PLAYER }),
}))
