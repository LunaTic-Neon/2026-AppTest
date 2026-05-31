import { Scenario } from '../../types/scenario'

/** 프롤로그 — 자각과 생존 (약 5~10분 분량) */
export const PROLOGUE_SCENARIO: Scenario = {
  id: 'prologue',
  title: 'PROLOGUE',
  subtitle: '자각과 생존',
  startNodeId: 'beat1_open',
  nodes: {
    // Beat 1: 폐허 각성
    beat1_open: {
      id: 'beat1_open',
      type: 'dialogue',
      speakerId: 'narrator',
      text: '아스포델. 상층부에서 버려진 폐허 도시.\n차가운 금속 냄새와 습한 먼지 사이, 엘라는 쓰레기 더미 위에서 눈을 떴다.',
      nextNodeId: 'beat1_ella1',
    },
    beat1_ella1: {
      id: 'beat1_ella1',
      type: 'dialogue',
      speakerId: 'ella',
      text: '…….',
      nextNodeId: 'beat1_ella2',
    },
    beat1_ella2: {
      id: 'beat1_ella2',
      type: 'dialogue',
      speakerId: 'ella',
      text: '으음… 여긴 어디…지. 으…….\n아무것도 기억이 안 나.',
      nextNodeId: 'beat1_system',
      effects: { emotion: { sadness: 5 } },
    },
    beat1_system: {
      id: 'beat1_system',
      type: 'dialogue',
      speakerId: 'system',
      text: '[장비] 전원 인가. 기본 프로토콜만 가동 중.\n[장비] 사용자 생체 신호: 불안정. 기억 섹터: 손상.',
      nextNodeId: 'beat2_gear',
    },

    // Beat 2: 보급형 장비
    beat2_gear: {
      id: 'beat2_gear',
      type: 'dialogue',
      speakerId: 'narrator',
      text: '팔뚝에 낡은 보호구가 박혀 있다. 화면에는 「보급형 장비 v0.3」이라는 글자만 희미하게 떠 있다.',
      nextNodeId: 'beat2_ella',
    },
    beat2_ella: {
      id: 'beat2_ella',
      type: 'dialogue',
      speakerId: 'ella',
      text: '……양산형 보급 장비인가. \n그래도 작동은 되네.',
      nextNodeId: 'beat2_narrator',
    },
    beat2_narrator: {
      id: 'beat2_narrator',
      type: 'dialogue',
      speakerId: 'narrator',
      text: '평범한 장비 같아 보인다.\n그런 채로, 폐허의 바람만 등 뒤로 스친다.',
      nextNodeId: 'beat3_alert',
    },

    // Beat 3: 수색대 — 렌 구출
    beat3_alert: {
      id: 'beat3_alert',
      type: 'dialogue',
      speakerId: 'narrator',
      text: '멀리서 발소리가 난다. 세력군 수색대의 손전등이 쓰레기 사이를 훑는다.',
      nextNodeId: 'beat3_soldier',
    },
    beat3_soldier: {
      id: 'beat3_soldier',
      type: 'dialogue',
      speakerId: 'soldier',
      text: '생체반응 확인. 생존자 — 아니, 미등록 개체. 확보해.',
      nextNodeId: 'beat3_ella',
      effects: { emotion: { anger: 3 } },
    },
    beat3_ella: {
      id: 'beat3_ella',
      type: 'dialogue',
      speakerId: 'ella',
      text: '……젠장.\n잡히면 딱 봐도 곤란……',
      nextNodeId: 'beat3_ren',
    },
    beat3_ren: {
      id: 'beat3_ren',
      type: 'dialogue',
      speakerId: 'ren',
      text: '이쪽으로! 빨리 움직여!',
      nextNodeId: 'beat3_fight',
    },
    beat3_fight: {
      id: 'beat3_fight',
      type: 'dialogue',
      speakerId: 'narrator',
      text: '어둠 속에서 남자가 나타나, 수색병의 시선을 끌었다.\n엘라는 본능적으로 파편 사이로 몸을 숨겼고, 잠시 후—— 소란은 멀어졌다.',
      nextNodeId: 'beat3_ren2',
      effects: { flags: { met_mentor: true } },
    },
    beat3_ren2: {
      id: 'beat3_ren2',
      type: 'dialogue',
      speakerId: 'ren',
      text: '……일어나. 여기서 오래 있으면 또 온다.\n이름은?',
      nextNodeId: 'beat3_ella_name',
    },
    beat3_ella_name: {
      id: 'beat3_ella_name',
      type: 'dialogue',
      speakerId: 'ella',
      text: '……엘라. 기억나는 건 그 정도.',
      nextNodeId: 'beat3_ren3',
    },
    beat3_ren3: {
      id: 'beat3_ren3',
      type: 'dialogue',
      speakerId: 'ren',
      text: '렌이야. 아스포델에 오랜 생존자.\n너도 그럴 생각이면, 따라와.',
      nextNodeId: 'beat4_shelter',
    },

    // Beat 4: 은신처 — 선택지
    beat4_shelter: {
      id: 'beat4_shelter',
      type: 'dialogue',
      speakerId: 'narrator',
      text: '반지하 은신처. 녹슨 파이프와 오래된 매트리스. 렌은 엘라를 바라보며 말했다.',
      nextNodeId: 'beat4_ren_teach',
    },
    beat4_ren_teach: {
      id: 'beat4_ren_teach',
      type: 'dialogue',
      speakerId: 'ren',
      text: '여기서 살아남는 법은 간단해.\n빠른 판단으로 거침없이 행동하면 돼.\n너—— 혼자 버텨왔나?',
      nextNodeId: 'beat4_choice',
    },
    beat4_choice: {
      id: 'beat4_choice',
      type: 'choice',
      text: '렌의 질문에 어떻게 답할까?',
      choices: [
        {
          id: 'alone_nod',
          text: '기억 안나.',
          nextNodeId: 'beat4_alone',
          effects: { emotion: { sadness: 8 } },
        },
        {
          id: 'alone_dismiss',
          text: '그런 건 중요하지 않아.',
          nextNodeId: 'beat4_dismiss',
          effects: { emotion: { anger: 5 } },
        },
        {
          id: 'alone_ask',
          text: '……넌 왜 도와줬어?',
          nextNodeId: 'beat4_ask',
          effects: { emotion: { joy: 3 } },
        },
      ],
    },
    beat4_alone: {
      id: 'beat4_alone',
      type: 'dialogue',
      speakerId: 'ren',
      text: '그래. 대부분 그래.\n하지만 혼자만으론 오래 못 간다. 기억해 둬.',
      nextNodeId: 'beat4_ren_gear',
    },
    beat4_dismiss: {
      id: 'beat4_dismiss',
      type: 'dialogue',
      speakerId: 'ren',
      text: '……말하기 싫으면 말하지 마.\n대신 내 말은 들어. 감정은 전투에 쓸데없어.',
      nextNodeId: 'beat4_ren_gear',
    },
    beat4_ask: {
      id: 'beat4_ask',
      type: 'dialogue',
      speakerId: 'ren',
      text: '……이유? 살아남은 사람을 그냥 두진 않아.\n너, 이상하게—— 움직이는 방식이 달라.',
      nextNodeId: 'beat4_ren_gear',
    },
    beat4_ren_gear: {
      id: 'beat4_ren_gear',
      type: 'dialogue',
      speakerId: 'ren',
      text: '저 장비, 보급형처럼 보이지만 뭔가 이질감이 들어.\n조심해. 세력군은 이상 신호에 민감하거든.',
      nextNodeId: 'beat5_hook',
    },

    // Beat 5: Hook → 1장
    beat5_hook: {
      id: 'beat5_hook',
      type: 'dialogue',
      speakerId: 'ren',
      text: '내일 아침, 생필품을 구하러 나가야 해.\n너도 같이 가자. 움직이는 법은 그때 알려 줄 테니까.',
      nextNodeId: 'beat5_ella',
    },
    beat5_ella: {
      id: 'beat5_ella',
      type: 'dialogue',
      speakerId: 'ella',
      text: '……알겠어.\n생각은 살아남고 나서 하지 뭐.',
      nextNodeId: 'beat5_narrator',
    },
    beat5_narrator: {
      id: 'beat5_narrator',
      type: 'dialogue',
      speakerId: 'narrator',
      text: '폐허의 밤은 길었다.\n엘라는 모르고 있었다—— 내일의 만남이 끼칠 영향을.',
      nextNodeId: 'prologue_end',
    },
    prologue_end: {
      id: 'prologue_end',
      type: 'end',
      effects: {
        flags: { tutorial_complete: true, met_mentor: true },
      },
    },
  },
}
