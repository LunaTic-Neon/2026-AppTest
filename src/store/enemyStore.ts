import { create } from 'zustand'
import { Enemy } from '../types'

interface EnemyState {
  enemies: Enemy[]
  addEnemy: (enemy: Enemy) => void
  removeEnemyById: (id: string) => void
  updateEnemies: (enemies: Enemy[]) => void
  resetEnemies: () => void
  getEnemyCount: () => number
}

export const useEnemyStore = create<EnemyState>((set, get) => ({
  enemies: [],

  addEnemy: (enemy) =>
    set((state) => ({
      enemies: [...state.enemies, enemy],
    })),

  removeEnemyById: (id) =>
    set((state) => ({
      enemies: state.enemies.filter((enemy) => enemy.id !== id),
    })),

  updateEnemies: (enemies) => set({ enemies }),

  resetEnemies: () => set({ enemies: [] }),

  getEnemyCount: () => get().enemies.length,
}))
