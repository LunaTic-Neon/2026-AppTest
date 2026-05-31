import { Scenario } from '../../types/scenario'

/** 인터루드 — 생존 훈련 + 일상 (시간 경과) */
export const INTERLUDE_SCENARIO: Scenario = {
  id: 'interlude',
  title: 'INTERLUDE',
  subtitle: '배우고, 견디고',
  startNodeId: 'intro',
  nodes: {
    intro: {
      id: 'intro',
      type: 'dialogue',
      speakerId: 'narrator',
      text: '그다음 날부터, 렌은 엘라에게 아스포델의 생존 법칙을 하나씩 가르쳤다.',
      nextNodeId: 'ren_move',
    },
    ren_move: {
      id: 'ren_move',
      type: 'dialogue',
      speakerId: 'ren',
      text: '먼저 이동. 발소리를 줄이고, 시선을 피하고, 쓰러진 구조물을 발판으로 쓰는 법.\n너—— 물리를 몸으로 이해하는 타입이군.',
      nextNodeId: 'ella_move',
    },
    ella_move: {
      id: 'ella_move',
      type: 'dialogue',
      speakerId: 'ella',
      text: '……이 정도는, 금방 익숙해져.',
      nextNodeId: 'tutorial_chase',
    },

    tutorial_chase: {
      id: 'tutorial_chase',
      type: 'dialogue',
      speakerId: 'narrator',
      text: '【훈련 · 도주】\n폐허 골목에서 가상의 추격을 반복했다. 갈림길, 함정, 시야 차단—— 판단이 늦으면 바로 잡힌다.',
      nextNodeId: 'ren_chase',
    },
    ren_chase: {
      id: 'ren_chase',
      type: 'dialogue',
      speakerId: 'ren',
      text: '도망칠 때는 멀리 가는 게 아니야. 상대의 시야에서 사라지는 게 목표다.\n머리를 쓰면, 다리보다 먼저 살아남아.',
      nextNodeId: 'tutorial_card',
    },

    tutorial_card: {
      id: 'tutorial_card',
      type: 'dialogue',
      speakerId: 'narrator',
      text: '【훈련 · 전술】\n낡은 단말기로 적 패턴 시뮬레이션을 돌렸다. 공격·방어·유인—— 순서를 바꾸면 결과가 달라진다.',
      nextNodeId: 'ren_card',
    },
    ren_card: {
      id: 'ren_card',
      type: 'dialogue',
      speakerId: 'ren',
      text: '힘으로 밀어붙이지 마. 상황을 읽고, 한 수 늦게 치는 게 이기는 법이야.\n카드 한 장 한 장이, 살아남는 시간이거든.',
      nextNodeId: 'tutorial_boss',
    },

    tutorial_boss: {
      id: 'tutorial_boss',
      type: 'dialogue',
      speakerId: 'narrator',
      text: '【훈련 · 보스】\n은신처 지하의 폐쇄 구역. 렌이 남긴 기록용 드론을 상대로, 집중 공격과 회피를 반복했다.',
      nextNodeId: 'ren_boss',
    },
    ren_boss: {
      id: 'ren_boss',
      type: 'dialogue',
      speakerId: 'ren',
      text: '강한 적 앞에선 버티지 마. 패턴을 보고, 틈만 노려.\n……너, 이상하게 그 틈을 잘 찾아.',
      nextNodeId: 'ella_gear',
    },
    ella_gear: {
      id: 'ella_gear',
      type: 'dialogue',
      speakerId: 'ella',
      text: '장비 덕분인가. ……아니, 몸이 먼저 움직이는 것 같기도 하고.',
      nextNodeId: 'timeskip',
    },

    timeskip: {
      id: 'timeskip',
      type: 'dialogue',
      speakerId: 'narrator',
      text: '——\n\n날들이 흘렀다.\n\n아침에는 잿빛 하늘 아래 물을 길어 오고, 낮에는 부품을 뜯어 쓰고, 밤에는 수색등이 멀어질 때까지 숨죽여 기다렸다.',
      nextNodeId: 'daily1',
      effects: { emotion: { joy: 3 } },
    },
    daily1: {
      id: 'daily1',
      type: 'dialogue',
      speakerId: 'ren',
      text: '오늘도 무사히 돌아왔군. ……괜찮아, 점점 익숙해지고 있어.',
      nextNodeId: 'ella_daily',
    },
    ella_daily: {
      id: 'ella_daily',
      type: 'dialogue',
      speakerId: 'ella',
      text: '익숙해지는 게 좋은 건지는 모르겠어.\n그래도—— 여기서 숨 쉬는 법은, 조금 알 것 같아.',
      nextNodeId: 'daily2',
    },
    daily2: {
      id: 'daily2',
      type: 'dialogue',
      speakerId: 'narrator',
      text: '평범한 생활. 그것이 아스포델에서는 사치였지만, 엘라에게는 낯선 안도감이 되어 갔다.\n\n그리고 어느 날——',
      nextNodeId: 'ren_supply',
    },
    ren_supply: {
      id: 'ren_supply',
      type: 'dialogue',
      speakerId: 'ren',
      text: '저장 식량이 바닥났어. 필터도 하나 남지 않았고.\n오늘, 바깥으로 나가야 해. 생필품을.',
      nextNodeId: 'ella_supply',
    },
    ella_supply: {
      id: 'ella_supply',
      type: 'dialogue',
      speakerId: 'ella',
      text: '……알겠어. 혼자 가?',
      nextNodeId: 'ren_solo',
    },
    ren_solo: {
      id: 'ren_solo',
      type: 'dialogue',
      speakerId: 'ren',
      text: '아니. 네가 앞장서. 나는 뒤에서 길을 막을게.\n지금까지 배운 대로 하면 돼.',
      nextNodeId: 'hook_ch1',
    },
    hook_ch1: {
      id: 'hook_ch1',
      type: 'dialogue',
      speakerId: 'narrator',
      text: '폐허의 거리로 발을 내디딘 그날.\n엘라는 아직 몰랐다—— 그 길에서, 처음으로 누군가를 위해 몸을 던지게 될 줄을.',
      nextNodeId: 'interlude_end',
    },
    interlude_end: {
      id: 'interlude_end',
      type: 'end',
      effects: {
        flags: { tutorial_complete: true, daily_life_complete: true },
      },
    },
  },
}
