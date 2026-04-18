import { create } from 'zustand'

interface MetaProgressionState {
  totalGold: number
  totalClears: number
  totalScrap: number
  totalData: number
  language: 'ko' | 'en' | 'ja'
  prologueRewarded: boolean
  clearedStages: string[]
  audioSettings: {
    master: number
    bgm: number
    sfx: number
    voice: number
  }
  unlockedTimeScales: number[]
  selectedTimeScale: number
  unlockedWeapons: string[]
  unlockedSkills: string[]
  baseStats: {
    startingHp: number
    baseDamage: number
    baseSpeed: number
  }
  specialAbilities: {
    preSelectCard: boolean
    doubleExp: boolean
  }

  addGold: (amount: number) => void
  addScrap: (amount: number) => void
  addData: (amount: number) => void
  setLanguage: (lang: 'ko' | 'en' | 'ja') => void
  grantPrologueReward: () => boolean
  markStageCleared: (stageId: string) => void
  resetAllProgress: () => void
  setAudioVolume: (channel: 'master' | 'bgm' | 'sfx' | 'voice', value: number) => void
  unlockTimeScale: (scale: number) => void
  setSelectedTimeScale: (scale: number) => void
  purchaseTimeScale: (scale: number, cost: number) => boolean
  unlockWeapon: (weaponId: string) => void
  unlockSkill: (skillId: string) => void
  upgradeBaseStat: (stat: 'startingHp' | 'baseDamage' | 'baseSpeed', amount: number) => void
  activateAbility: (ability: 'preSelectCard' | 'doubleExp') => void
  loadFromLocalStorage: () => void
  saveToLocalStorage: () => void
}

const INITIAL_STATE = {
  totalGold: 0,
  totalClears: 0,
  totalScrap: 0,
  totalData: 0,
  language: 'ko' as 'ko' | 'en' | 'ja',
  prologueRewarded: false,
  clearedStages: [] as string[],
  audioSettings: {
    master: 0.8,
    bgm: 0.7,
    sfx: 0.8,
    voice: 0.8,
  },
  unlockedTimeScales: [1.0],
  selectedTimeScale: 1.0,
  unlockedWeapons: [],
  unlockedSkills: [],
  baseStats: {
    startingHp: 0,
    baseDamage: 0,
    baseSpeed: 0,
  },
  specialAbilities: {
    preSelectCard: false,
    doubleExp: false,
  },
}

export const useMetaProgressionStore = create<MetaProgressionState>((set, get) => ({
  ...INITIAL_STATE,

  addGold: (amount) => {
    const gain = Math.max(0, Math.floor(amount))
    set((state) => ({
      totalGold: state.totalGold + gain,
      totalClears: state.totalClears + 1,
    }))
    get().saveToLocalStorage()
  },

  addScrap: (amount) =>
    set((state) => ({
      totalScrap: state.totalScrap + amount,
    })),

  addData: (amount) =>
    set((state) => ({
      totalData: state.totalData + amount,
    })),

  setLanguage: (lang) => {
    set({ language: lang })
    get().saveToLocalStorage()
  },

  grantPrologueReward: () => {
    const state = get()
    if (state.prologueRewarded) return false
    set((prev) => ({
      prologueRewarded: true,
      totalGold: prev.totalGold + 500,
    }))
    get().saveToLocalStorage()
    return true
  },

  markStageCleared: (stageId) => {
    set((state) => ({
      clearedStages: state.clearedStages.includes(stageId)
        ? state.clearedStages
        : [...state.clearedStages, stageId],
    }))
    get().saveToLocalStorage()
  },

  resetAllProgress: () => {
    localStorage.removeItem('metaProgression')
    set({ ...INITIAL_STATE })
  },

  setAudioVolume: (channel, value) => {
    const clamped = Math.max(0, Math.min(1, value))
    set((state) => ({
      audioSettings: {
        ...state.audioSettings,
        [channel]: clamped,
      },
    }))
    get().saveToLocalStorage()
  },

  unlockTimeScale: (scale) => {
    set((state) => {
      if (state.unlockedTimeScales.includes(scale)) return state
      return {
        unlockedTimeScales: [...state.unlockedTimeScales, scale].sort((a, b) => a - b),
      }
    })
    get().saveToLocalStorage()
  },

  setSelectedTimeScale: (scale) => {
    set((state) => {
      if (!state.unlockedTimeScales.includes(scale)) return state
      return { selectedTimeScale: scale }
    })
    get().saveToLocalStorage()
  },

  purchaseTimeScale: (scale, cost) => {
    const state = get()
    if (state.unlockedTimeScales.includes(scale)) return true
    if (state.totalGold < cost) return false

    set((prev) => ({
      totalGold: prev.totalGold - cost,
      unlockedTimeScales: [...prev.unlockedTimeScales, scale].sort((a, b) => a - b),
    }))
    get().saveToLocalStorage()
    return true
  },

  unlockWeapon: (weaponId) =>
    set((state) => ({
      unlockedWeapons: state.unlockedWeapons.includes(weaponId)
        ? state.unlockedWeapons
        : [...state.unlockedWeapons, weaponId],
    })),

  unlockSkill: (skillId) =>
    set((state) => ({
      unlockedSkills: state.unlockedSkills.includes(skillId)
        ? state.unlockedSkills
        : [...state.unlockedSkills, skillId],
    })),

  upgradeBaseStat: (stat, amount) =>
    set((state) => ({
      baseStats: {
        ...state.baseStats,
        [stat]: state.baseStats[stat] + amount,
      },
    })),

  activateAbility: (ability) =>
    set((state) => ({
      specialAbilities: {
        ...state.specialAbilities,
        [ability]: true,
      },
    })),

  loadFromLocalStorage: () => {
    const saved = localStorage.getItem('metaProgression')
    if (saved) {
      const data = JSON.parse(saved)
      const unlockedTimeScales = Array.isArray(data.unlockedTimeScales)
        ? Array.from(new Set([1.0, ...data.unlockedTimeScales]))
            .map((v) => Number(v))
            .filter((v) => !Number.isNaN(v))
            .sort((a, b) => a - b)
        : [1.0]

      const selectedTimeScale = unlockedTimeScales.includes(Number(data.selectedTimeScale))
        ? Number(data.selectedTimeScale)
        : 1.0

      set({
        ...INITIAL_STATE,
        ...data,
        language: (data.language === 'ko' || data.language === 'en' || data.language === 'ja') ? data.language : 'ko',
        prologueRewarded: !!data.prologueRewarded,
        clearedStages: Array.isArray(data.clearedStages) ? data.clearedStages : [],
        audioSettings: {
          ...INITIAL_STATE.audioSettings,
          ...(data.audioSettings || {}),
        },
        unlockedTimeScales,
        selectedTimeScale,
      })
    }
  },

  saveToLocalStorage: () => {
    const state = get()
    localStorage.setItem(
      'metaProgression',
      JSON.stringify({
        totalGold: state.totalGold,
        totalClears: state.totalClears,
        totalScrap: state.totalScrap,
        totalData: state.totalData,
        language: state.language,
        prologueRewarded: state.prologueRewarded,
        clearedStages: state.clearedStages,
        audioSettings: state.audioSettings,
        unlockedTimeScales: state.unlockedTimeScales,
        selectedTimeScale: state.selectedTimeScale,
        unlockedWeapons: state.unlockedWeapons,
        unlockedSkills: state.unlockedSkills,
        baseStats: state.baseStats,
        specialAbilities: state.specialAbilities,
      })
    )
  },
}))
