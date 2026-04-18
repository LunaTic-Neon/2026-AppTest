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

export const STAGE_STORIES: StageStory[] = [
  {
    id: 'prologue',
    title: 'PROLOGUE',
    subtitle: '잔해의 도시',
    lines: [
      { speaker: '시스템', text: 'Ruin\'s City 접속 완료. 생존 기록 동기화를 시작합니다.' },
      { speaker: '관제', text: '도심 전역이 붕괴했어요. 남은 통신망은 북서 구역 하나뿐입니다.' },
      { speaker: '주인공', text: '들린다. 길을 열어. 여기서 끝낼 생각은 없다.' },
    ],
  },
  {
    id: '1-1',
    title: 'STAGE 1-1',
    subtitle: '전초기지',
    lines: [
      { speaker: '관제', text: '1-1 전초기지 확인. 적 열 신호가 빠르게 늘고 있어요.' },
      { speaker: '주인공', text: '중앙 도로를 관통한다. 접근 경로를 표시해.' },
      { speaker: '관제', text: '표시 완료. 대화를 끝내면 즉시 전투를 개시합니다.' },
    ],
  },
  {
    id: '1-2',
    title: 'STAGE 1-2',
    subtitle: '붕괴 고속도로',
    lines: [
      { speaker: '관제', text: '고속도로 상층부가 붕괴 중입니다. 시야가 매우 불안정해요.' },
      { speaker: '주인공', text: '속도를 올린다. 끊긴 구간은 도약으로 넘는다.' },
      { speaker: '시스템', text: '경로 시뮬레이션 완료. 대화 종료 시 임무를 시작합니다.' },
    ],
  },
  {
    id: '1-3',
    title: 'STAGE 1-3',
    subtitle: '침묵의 코어',
    lines: [
      { speaker: '관제', text: '코어 구역은 신호가 거의 없습니다. 함정 가능성 높음.' },
      { speaker: '주인공', text: '침묵은 곧 매복이다. 먼저 들어가서 끌어낸다.' },
      { speaker: '시스템', text: '최종 검증 완료. 모든 대화를 넘기면 출격합니다.' },
    ],
  },
]

export const STAGE_STORY_MAP = Object.fromEntries(
  STAGE_STORIES.map((story) => [story.id, story])
) as Record<StageId, StageStory>
