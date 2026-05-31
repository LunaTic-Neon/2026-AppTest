import { EmotionType } from '../types/scenario'

export interface CombatContext {
  chapterId: string
  emotions: Record<EmotionType, number>
  syncPercent: number
  storyFlags: Record<string, boolean>
}

export interface CombatResult {
  success: boolean
  flags?: Record<string, boolean>
  emotionDelta?: Partial<Record<EmotionType, number>>
}

export interface CombatModule {
  id: string
  name: string
  description: string
  /** 실제 Canvas/React 구현은 후속 작업 */
  start: (context: CombatContext) => Promise<CombatResult>
}
