import { create } from 'zustand'
import { GameScene } from '../types'

interface GameState {
  currentScene: GameScene
  gameTime: number
  killCount: number
  totalDamageDealt: number
  currentStage: number
  bossPhase: number
  storyEventTriggered: boolean

  setCurrentScene: (scene: GameScene) => void
  setGameTime: (time: number) => void
  setKillCount: (count: number) => void
  addKill: () => void
  addDamage: (damage: number) => void
  resetGameStats: () => void
}

export const useGameStore = create<GameState>((set) => ({
  currentScene: 'menu',
  gameTime: 0,
  killCount: 0,
  totalDamageDealt: 0,
  currentStage: 1,
  bossPhase: 0,
  storyEventTriggered: false,

  setCurrentScene: (scene) => set({ currentScene: scene }),
  setGameTime: (time) => set({ gameTime: time }),
  setKillCount: (count) => set({ killCount: count }),
  addKill: () => set((state) => ({ killCount: state.killCount + 1 })),
  addDamage: (damage) => set((state) => ({ totalDamageDealt: state.totalDamageDealt + damage })),
  resetGameStats: () => set({
    gameTime: 0,
    killCount: 0,
    totalDamageDealt: 0,
    currentStage: 1,
    bossPhase: 0,
    storyEventTriggered: false,
  }),
}))
