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
  // 1스테이지 진행 상태
  finalBossSpawned: boolean
  finalBossDefeated: boolean
  miniBossCount: number        // 이번 판에 소환된 중간보스 수
  stageClearRewardGranted: boolean

  setCurrentScene: (scene: GameScene) => void
  setGameTime: (time: number) => void
  setKillCount: (count: number) => void
  addKill: () => void
  addDamage: (damage: number) => void
  setFinalBossSpawned: (v: boolean) => void
  setFinalBossDefeated: (v: boolean) => void
  setMiniBossCount: (n: number) => void
  setStageClearRewardGranted: (v: boolean) => void
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
  finalBossSpawned: false,
  finalBossDefeated: false,
  miniBossCount: 0,
  stageClearRewardGranted: false,

  setCurrentScene: (scene) => set({ currentScene: scene }),
  setGameTime: (time) => set({ gameTime: time }),
  setKillCount: (count) => set({ killCount: count }),
  addKill: () => set((state) => ({ killCount: state.killCount + 1 })),
  addDamage: (damage) => set((state) => ({ totalDamageDealt: state.totalDamageDealt + damage })),
  setFinalBossSpawned: (v) => set({ finalBossSpawned: v }),
  setFinalBossDefeated: (v) => set({ finalBossDefeated: v }),
  setMiniBossCount: (n) => set({ miniBossCount: n }),
  setStageClearRewardGranted: (v) => set({ stageClearRewardGranted: v }),
  resetGameStats: () => set({
    gameTime: 0,
    killCount: 0,
    totalDamageDealt: 0,
    currentStage: 1,
    bossPhase: 0,
    storyEventTriggered: false,
    finalBossSpawned: false,
    finalBossDefeated: false,
    miniBossCount: 0,
    stageClearRewardGranted: false,
  }),
}))
