import { create } from 'zustand'
import { Upgrade } from '../types'

interface UpgradeState {
  unlockedUpgrades: Upgrade[]
  activeUpgrades: Upgrade[]
  availableUpgrades: Upgrade[]

  setUnlockedUpgrades: (upgrades: Upgrade[]) => void
  addUnlockedUpgrade: (upgrade: Upgrade) => void
  setActiveUpgrades: (upgrades: Upgrade[]) => void
  applyUpgrade: (upgrade: Upgrade) => void
  getRandomUpgrades: (count: number) => Upgrade[]
  resetUpgrades: () => void
}

const DEFAULT_UPGRADES: Upgrade[] = [
  {
    id: 'damage_1',
    name: '공격력 증가',
    description: '공격력이 20% 증가합니다',
    type: 'damage',
    value: 1.2,
  },
  {
    id: 'speed_1',
    name: '이동속도 증가',
    description: '이동속도가 15% 증가합니다',
    type: 'speed',
    value: 1.15,
  },
  {
    id: 'attackspeed_1',
    name: '공격속도 증가',
    description: '공격속도가 20% 증가합니다',
    type: 'attackSpeed',
    value: 1.2,
  },
  {
    id: 'health_1',
    name: '최대 체력 증가',
    description: '최대 체력이 20% 증가하고 해당량만큼 회복합니다',
    type: 'health',
    value: 0.2,
  },
  {
    id: 'projectileSpeed_1',
    name: '탄막 속도 증가',
    description: '플레이어 탄막 속도가 15% 증가합니다',
    type: 'projectileSpeed',
    value: 1.15,
  },
  {
    id: 'weapon_multishot',
    name: '탄막 강화',
    description: '탄막이 +1발 증가합니다 (최대 5발)',
    type: 'weapon',
    value: 1,
  },
  {
    id: 'piercing',
    name: '관통',
    description: '탄막이 적을 관통합니다 (최대 3단계)',
    type: 'piercing',
    value: 1,
  },
]

export const useUpgradeStore = create<UpgradeState>((set, get) => ({
  unlockedUpgrades: DEFAULT_UPGRADES,
  activeUpgrades: [],
  availableUpgrades: DEFAULT_UPGRADES,

  setUnlockedUpgrades: (upgrades) =>
    set({ unlockedUpgrades: upgrades, availableUpgrades: upgrades }),

  addUnlockedUpgrade: (upgrade) =>
    set((state) => ({
      unlockedUpgrades: [...state.unlockedUpgrades, upgrade],
      availableUpgrades: [...state.availableUpgrades, upgrade],
    })),

  setActiveUpgrades: (upgrades) => set({ activeUpgrades: upgrades }),

  applyUpgrade: (upgrade) =>
    set((state) => ({
      activeUpgrades: [...state.activeUpgrades, upgrade],
    })),

  getRandomUpgrades: (count) => {
    const available = get().availableUpgrades
    // shuffle copy
    const result: Upgrade[] = []
    const availableCopy = [...available]

    for (let i = 0; i < count && availableCopy.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * availableCopy.length)
      result.push(availableCopy[randomIndex])
      availableCopy.splice(randomIndex, 1)
    }

    return result
  },

  resetUpgrades: () =>
    set({
      unlockedUpgrades: DEFAULT_UPGRADES,
      activeUpgrades: [],
      availableUpgrades: DEFAULT_UPGRADES,
    }),
}))
