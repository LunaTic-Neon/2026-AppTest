/**
 * @deprecated VN 전환 이전 생존 슈터용 스토리 데이터.
 * 신규 시나리오는 src/config/scenarios/ 를 사용하세요.
 */
export type StageId = 'prologue' | '1-1' | '1-2' | '1-3'

export interface StoryLine {
  speaker: string
  text: string
}

export interface StageStory {
  id: StageId
  title: string
  subtitle: string
  lines: StoryLine[]
}

/** @deprecated */
export const STAGE_STORIES: StageStory[] = []

/** @deprecated */
export const STAGE_STORY_MAP = {} as Record<StageId, StageStory>
