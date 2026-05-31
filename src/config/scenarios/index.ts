import { ChapterId, Scenario } from '../../types/scenario'
import { PROLOGUE_SCENARIO } from './prologue'

export const SCENARIOS: Record<ChapterId, Scenario | undefined> = {
  prologue: PROLOGUE_SCENARIO,
  ch1: undefined,
  ch2: undefined,
  ch3: undefined,
  ch4: undefined,
  ch5: undefined,
}

export const CHAPTER_LIST: Array<{
  id: ChapterId
  label: string
  subtitle: string
  available: boolean
}> = [
  { id: 'prologue', label: 'PROLOGUE', subtitle: '자각과 생존', available: true },
  { id: 'ch1', label: 'CHAPTER 1', subtitle: '운명적 만남', available: false },
  { id: 'ch2', label: 'CHAPTER 2', subtitle: '금기된 기술', available: false },
  { id: 'ch3', label: 'CHAPTER 3', subtitle: '아스포델의 반격', available: false },
  { id: 'ch4', label: 'CHAPTER 4', subtitle: '상층부 진격', available: false },
  { id: 'ch5', label: 'CHAPTER 5', subtitle: '감정의 폭발', available: false },
]

export function getScenario(chapterId: ChapterId): Scenario | undefined {
  return SCENARIOS[chapterId]
}
