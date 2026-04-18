import { create } from 'zustand'

interface MetaProgressionState {
  totalGold: number
  totalClears: number
  totalScrap: number
  totalData: number
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
      set(data)
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
        unlockedWeapons: state.unlockedWeapons,
        unlockedSkills: state.unlockedSkills,
        baseStats: state.baseStats,
        specialAbilities: state.specialAbilities,
      })
    )
  },
}))
