import { ScenarioEffects } from '../types/scenario'
import { useEmotionStore } from '../store/emotionStore'
import { useStoryStore } from '../store/storyStore'

export function applyScenarioEffects(effects?: ScenarioEffects, choiceKey?: string, choiceId?: string): void {
  if (!effects) return

  if (effects.flags) {
    Object.entries(effects.flags).forEach(([flag, value]) => {
      useStoryStore.getState().setStoryFlag(flag, value)
    })
  }

  if (effects.emotion) {
    useEmotionStore.getState().applyDelta(effects.emotion)
  }

  if (choiceKey && choiceId) {
    useStoryStore.getState().recordChoice(choiceKey, choiceId)
  }
}
