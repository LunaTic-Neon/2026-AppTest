import { CombatContext, CombatModule, CombatResult } from '../types'

/** 5장 — Emotion Sync 100% 최종전 */
export const finalModule: CombatModule = {
  id: 'final',
  name: '최종전',
  description: 'Sync 100% 각성 후 최종 보스 — 엔딩 분기 연동',
  start: async (context: CombatContext): Promise<CombatResult> => {
    const loveUnlocked = context.emotions.love >= 20
    const syncReady = context.syncPercent >= 100
    return {
      success: syncReady,
      flags: {
        sync_100: syncReady,
        final_boss_defeated: syncReady,
        love_route_ready: loveUnlocked,
      },
      emotionDelta: loveUnlocked ? { love: 5 } : undefined,
    }
  },
}
