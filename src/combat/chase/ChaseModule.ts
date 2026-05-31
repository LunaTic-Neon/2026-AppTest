import { CombatContext, CombatModule, CombatResult } from '../types'

/** 1장 — 도주/추격 (유메 구출) */
export const chaseModule: CombatModule = {
  id: 'chase',
  name: '도주/추격',
  description: '세력군 추격에서 경로 선택·회피·단기 교전으로 탈출',
  start: async (context: CombatContext): Promise<CombatResult> => {
    const joyBonus = context.emotions.joy >= 30 ? { extraRoutes: 1 } : {}
    void joyBonus
    return {
      success: true,
      flags: { ch1_escape_complete: true },
      emotionDelta: { anger: 5 },
    }
  },
}
