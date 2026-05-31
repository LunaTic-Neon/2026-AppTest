export type CharacterId = 'ella' | 'ren' | 'yume' | 'zero' | 'system' | 'narrator' | 'soldier'

export type EmotionType = 'joy' | 'anger' | 'sadness' | 'love'

export type ChapterId = 'prologue' | 'interlude' | 'ch1' | 'ch2' | 'ch3' | 'ch4' | 'ch5'

export interface EmotionDelta {
  joy?: number
  anger?: number
  sadness?: number
  love?: number
  affectionYume?: number
}

export interface ScenarioEffects {
  flags?: Record<string, boolean>
  emotion?: EmotionDelta
}

export interface ScenarioChoice {
  id: string
  text: string
  nextNodeId: string
  effects?: ScenarioEffects
}

export interface ScenarioNode {
  id: string
  type: 'dialogue' | 'choice' | 'end'
  speakerId?: CharacterId
  text?: string
  nextNodeId?: string
  choices?: ScenarioChoice[]
  effects?: ScenarioEffects
}

export interface Scenario {
  id: ChapterId
  title: string
  subtitle: string
  nodes: Record<string, ScenarioNode>
  startNodeId: string
}

export type CombatModuleId = 'chase' | 'card' | 'boss' | 'final'
