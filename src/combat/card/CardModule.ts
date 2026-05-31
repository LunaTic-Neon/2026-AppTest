import { CombatContext, CombatModule, CombatResult } from '../types'

/** 2장 — 카드형 전술 (Dr. 제로 연구실) */
export const cardModule: CombatModule = {
  id: 'card',
  name: '카드형 전술',
  description: '유메의 전술 제안 + 감정 카드로 적 패턴 대응',
  start: async (context: CombatContext): Promise<CombatResult> => {
    const sadnessBonus = context.emotions.sadness >= 20
    void sadnessBonus
    return {
      success: true,
      flags: { ch2_lab_cleared: true },
      emotionDelta: { sadness: 3 },
    }
  },
}
