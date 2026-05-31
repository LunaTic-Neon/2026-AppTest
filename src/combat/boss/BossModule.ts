import { CombatContext, CombatModule, CombatResult } from '../types'

/** 3장 — 보스전 + 거점 돌파 (렌 구출) */
export const bossModule: CombatModule = {
  id: 'boss',
  name: '보스전',
  description: '거점 수비 보스 격파 후 멘토 구출 — 실패 시 재시도',
  start: async (context: CombatContext): Promise<CombatResult> => {
    const angerBonus = context.emotions.anger >= 25
    void angerBonus
    return {
      success: true,
      flags: { mentor_rescued: true, mentor_captured: false },
      emotionDelta: { joy: 10, anger: -5 },
    }
  },
}
