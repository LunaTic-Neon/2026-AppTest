import { create } from 'zustand'
import { EmotionType } from '../types/scenario'

const EMOTION_MAX = 100

export interface EmotionState {
  joy: number
  anger: number
  sadness: number
  love: number
  affectionYume: number
  syncPercent: number

  applyDelta: (delta: Partial<Record<EmotionType | 'affectionYume', number>>) => void
  setSyncPercent: (value: number) => void
  recalculateSync: () => void
  resetEmotions: () => void
  hydrate: (data: Partial<Pick<EmotionState, 'joy' | 'anger' | 'sadness' | 'love' | 'affectionYume' | 'syncPercent'>>) => void
}

const clamp = (v: number) => Math.max(0, Math.min(EMOTION_MAX, v))

const INITIAL = {
  joy: 0,
  anger: 0,
  sadness: 0,
  love: 0,
  affectionYume: 0,
  syncPercent: 0,
}

function computeSync(joy: number, anger: number, sadness: number, love: number): number {
  const weighted = (joy + anger + sadness + love * 2) / 5
  return Math.round(clamp(weighted))
}

export const useEmotionStore = create<EmotionState>((set, get) => ({
  ...INITIAL,

  applyDelta: (delta) => {
    set((state) => {
      const joy = clamp(state.joy + (delta.joy ?? 0))
      const anger = clamp(state.anger + (delta.anger ?? 0))
      const sadness = clamp(state.sadness + (delta.sadness ?? 0))
      const love = clamp(state.love + (delta.love ?? 0))
      const affectionYume = clamp(state.affectionYume + (delta.affectionYume ?? 0))
      const syncPercent = Math.max(state.syncPercent, computeSync(joy, anger, sadness, love))
      return { joy, anger, sadness, love, affectionYume, syncPercent }
    })
  },

  setSyncPercent: (value) => set({ syncPercent: clamp(value) }),

  recalculateSync: () => {
    const { joy, anger, sadness, love, syncPercent } = get()
    set({ syncPercent: Math.max(syncPercent, computeSync(joy, anger, sadness, love)) })
  },

  resetEmotions: () => set(INITIAL),

  hydrate: (data) =>
    set((state) => ({
      joy: data.joy ?? state.joy,
      anger: data.anger ?? state.anger,
      sadness: data.sadness ?? state.sadness,
      love: data.love ?? state.love,
      affectionYume: data.affectionYume ?? state.affectionYume,
      syncPercent: data.syncPercent ?? state.syncPercent,
    })),
}))
