# VN MVP 스펙

## 범위

| 포함 | 제외 |
|------|------|
| 타이틀 → 프롤로그 시나리오 | Canvas 전투 |
| 타이핑·로그·AUTO·스킵 | 레벨업 카드 |
| 선택지 UI + 플래그 반영 | 골드·배속 상점 |
| 화자별 색상 | 1~5장 본편 |
| 세이브/로드 1슬롯 | Steam 빌드 (스�affold만) |
| 프롤로그 end → To Be Continued | |

## 화면 흐름

```
TitleScreen
  ├─ 새 게임 → ChapterSelect (prologue) → ScenarioPlayer → ToBeContinued
  ├─ 이어하기 → SaveLoad (슬롯 1)
  └─ 설정 → SettingsPanel
```

## ScenarioPlayer (StoryDialogScreen 확장)

- **입력:** `Scenario` 객체 (노드 그래프)
- **노드 타입:** `dialogue` | `choice` | `end`
- **dialogue:** speakerId → 이름·색상, text, nextNodeId
- **choice:** choices[] → recordChoice, emotion/affection effects, nextNodeId
- **end:** completeScene, To Be Continued

## Store 연동

| Store | 역할 |
|-------|------|
| `storyStore` | sceneId, flags, choices, completedScenes |
| `emotionStore` | joy/anger/sadness/love, syncPercent, affection |
| `saveStore` | slot 1 직렬화/복원 (story + emotion + meta audio) |
| `metaProgressionStore` | audio, language, cleared chapters |

## 세이브 데이터 (slot 1)

```typescript
{
  version: 1,
  savedAt: ISO string,
  story: { currentSceneId, currentNodeId, completedScenes, playerChoices, storyFlags },
  emotion: { joy, anger, sadness, love, affectionKanade, syncPercent },
  meta: { audioSettings, language }
}
```

## 화자 색상 (`characters.ts`)

| ID | 이름 | 색상 |
|----|------|------|
| `ella` | 엘라 | `#7dd3fc` |
| `ren` | 렌 | `#94a3b8` |
| `kanade` | 카나데 | `#f9a8d4` |
| `zero` | 닥터 제로 | `#c4b5fd` |
| `system` | 시스템 | `#67e8f9` |
| `narrator` | 나레이션 | `#e2e8f0` |

## 프롤로그 Beat (5)

1. 폐허 각성 — 기억 없음
2. 장비 인식 — 보급형 착각
3. 수색대 조우 — 렌 구출
4. 은신처 — 생존 법칙 (선택지 1)
5. Hook — 내일 생필품 (1장 연결)

## 후속 (MVP+)

- `ch1`~`ch5` 시나리오 데이터
- `combat/` 모듈 연결 (scenario node `combat` 타입)
- Electron + Steamworks
