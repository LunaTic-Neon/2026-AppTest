import { create } from 'zustand'
import { useEmotionStore } from './emotionStore'
import { useStoryStore } from './storyStore'
import { useMetaProgressionStore } from './metaProgressionStore'
import { ChapterId } from '../types/scenario'

const SAVE_KEY = 'ruins-city-save-slot-1'
const SAVE_VERSION = 1

export interface SaveData {
  version: number
  savedAt: string
  story: {
    currentChapterId: ChapterId | null
    currentNodeId: string | null
    completedScenes: string[]
    playerChoices: Record<string, string>
    storyFlags: Record<string, boolean>
  }
  emotion: {
    joy: number
    anger: number
    sadness: number
    love: number
    affectionYume: number
    syncPercent: number
  }
  meta: {
    audioSettings: {
      master: number
      bgm: number
      sfx: number
      voice: number
    }
    language: 'ko' | 'en' | 'ja'
    clearedChapters: string[]
  }
}

interface SaveState {
  hasSave: boolean
  lastSavedAt: string | null

  checkSave: () => void
  saveGame: (chapterId: ChapterId, nodeId: string) => boolean
  loadGame: () => SaveData | null
  applySave: (data: SaveData) => void
  deleteSave: () => void
  startNewGame: () => void
}

function buildSaveData(chapterId: ChapterId, nodeId: string): SaveData {
  const story = useStoryStore.getState()
  const emotion = useEmotionStore.getState()
  const meta = useMetaProgressionStore.getState()

  return {
    version: SAVE_VERSION,
    savedAt: new Date().toISOString(),
    story: {
      currentChapterId: chapterId,
      currentNodeId: nodeId,
      completedScenes: [...story.completedScenes],
      playerChoices: { ...story.playerChoices },
      storyFlags: { ...story.storyFlags },
    },
    emotion: {
      joy: emotion.joy,
      anger: emotion.anger,
      sadness: emotion.sadness,
      love: emotion.love,
      affectionYume: emotion.affectionYume,
      syncPercent: emotion.syncPercent,
    },
    meta: {
      audioSettings: { ...meta.audioSettings },
      language: meta.language,
      clearedChapters: [...meta.clearedStages],
    },
  }
}

export const useSaveStore = create<SaveState>((set) => ({
  hasSave: false,
  lastSavedAt: null,

  checkSave: () => {
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      if (!raw) {
        set({ hasSave: false, lastSavedAt: null })
        return
      }
      const data = JSON.parse(raw) as SaveData
      set({ hasSave: true, lastSavedAt: data.savedAt })
    } catch {
      set({ hasSave: false, lastSavedAt: null })
    }
  },

  saveGame: (chapterId, nodeId) => {
    try {
      const data = buildSaveData(chapterId, nodeId)
      localStorage.setItem(SAVE_KEY, JSON.stringify(data))
      useMetaProgressionStore.getState().saveToLocalStorage()
      set({ hasSave: true, lastSavedAt: data.savedAt })
      return true
    } catch {
      return false
    }
  },

  loadGame: () => {
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      if (!raw) return null
      const data = JSON.parse(raw) as SaveData & {
        emotion?: { affectionKanade?: number; affectionYume?: number }
      }
      if (data.emotion?.affectionKanade != null && data.emotion.affectionYume == null) {
        data.emotion.affectionYume = data.emotion.affectionKanade
      }
      return data
    } catch {
      return null
    }
  },

  applySave: (data) => {
    useStoryStore.getState().hydrate({
      completedScenes: data.story.completedScenes,
      playerChoices: data.story.playerChoices,
      storyFlags: data.story.storyFlags,
    })
    useEmotionStore.getState().hydrate(data.emotion)
    const meta = useMetaProgressionStore.getState()
    meta.setLanguage(data.meta.language)
    Object.entries(data.meta.audioSettings).forEach(([ch, val]) => {
      meta.setAudioVolume(ch as 'master' | 'bgm' | 'sfx' | 'voice', val)
    })
    data.meta.clearedChapters.forEach((id) => meta.markStageCleared(id))
    meta.saveToLocalStorage()
  },

  deleteSave: () => {
    localStorage.removeItem(SAVE_KEY)
    set({ hasSave: false, lastSavedAt: null })
  },

  startNewGame: () => {
    useStoryStore.getState().resetStory()
    useEmotionStore.getState().resetEmotions()
  },
}))

export type { SaveData as GameSaveData }
