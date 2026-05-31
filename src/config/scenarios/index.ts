import { ChapterId, Scenario } from '../../types/scenario'
import { PROLOGUE_SCENARIO } from './prologue'
import { INTERLUDE_SCENARIO } from './interlude'
import { CH1_SCENARIO } from './ch1'

export const SCENARIOS: Record<ChapterId, Scenario | undefined> = {
  prologue: PROLOGUE_SCENARIO,
  interlude: INTERLUDE_SCENARIO,
  ch1: CH1_SCENARIO,
  ch2: undefined,
  ch3: undefined,
  ch4: undefined,
  ch5: undefined,
}

export const CHAPTER_LIST: Array<{
  id: ChapterId
  label: string
  subtitle: string
  requires?: ChapterId
}> = [
  { id: 'prologue', label: 'PROLOGUE', subtitle: '자각과 생존' },
  { id: 'interlude', label: 'INTERLUDE', subtitle: '배우고, 견디고', requires: 'prologue' },
  { id: 'ch1', label: 'CHAPTER 1', subtitle: '운명적 만남', requires: 'interlude' },
  { id: 'ch2', label: 'CHAPTER 2', subtitle: '금기된 기술', requires: 'ch1' },
  { id: 'ch3', label: 'CHAPTER 3', subtitle: '아스포델의 반격', requires: 'ch2' },
  { id: 'ch4', label: 'CHAPTER 4', subtitle: '상층부 진격', requires: 'ch3' },
  { id: 'ch5', label: 'CHAPTER 5', subtitle: '감정의 폭발', requires: 'ch4' },
]

export function getScenario(chapterId: ChapterId): Scenario | undefined {
  return SCENARIOS[chapterId]
}

/** 클리어한 챕터 기준으로 플레이 가능 여부 */
export function isChapterUnlocked(chapterId: ChapterId, completedScenes: string[]): boolean {
  const chapter = CHAPTER_LIST.find((c) => c.id === chapterId)
  if (!chapter) return false
  if (!chapter.requires) return true
  return completedScenes.includes(chapter.requires)
}

/** 시나리오 데이터가 구현된 챕터인지 */
export function isChapterPlayable(chapterId: ChapterId): boolean {
  return SCENARIOS[chapterId] != null
}

export function getNextChapterHint(completedId: ChapterId): string | null {
  const idx = CHAPTER_LIST.findIndex((c) => c.id === completedId)
  if (idx < 0 || idx >= CHAPTER_LIST.length - 1) return null
  const next = CHAPTER_LIST[idx + 1]
  if (!isChapterPlayable(next.id)) {
    return `${next.label} 「${next.subtitle}」는 준비 중입니다.`
  }
  return `${next.label} 「${next.subtitle}」에서 이어집니다.`
}
