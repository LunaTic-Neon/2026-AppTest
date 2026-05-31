# Ruin's City

아스포델(Asphodel) — 기억을 잃은 사이보그 **엘라**가 폐허 도시에서 자신의 정체성을 찾아가는 **비주얼노벨(60~70%) + 상황별 미니게임(30~40%)** 입니다.

## 게임 특징

- 5장 완결 스토리 (목표 6~10시간)
- Emotion Sync — 기쁨·화남·슬픔·사랑(히든) 감정이 전투·엔딩에 연동
- 여여 로맨스 (엘라 × 카나데)
- 3종 엔딩: 일반 / 로맨스 / 진(真)
- PC 단독, Steam 출시 목표

## 현재 playable (MVP)

- 타이틀 → 새 게임 / 이어하기 / 설정
- **프롤로그** 시나리오 (선택지, Emotion Sync HUD, 자동 세이브)
- To Be Continued → 1장 준비 중

## 조작 (VN)

- 클릭: 대사 진행
- Ctrl 홀드: 고속 스킵
- AUTO: 자동 진행
- Esc: 뒤로 (챕터 선택 / 타이틀)

## 실행

```bash
npm install
npm run dev
```

## Electron (Steam 대비)

```bash
# 터미inal 1
npm run dev

# 터미널 2
npm run electron
```

자세한 Steam 연동: [docs/steam-setup.md](docs/steam-setup.md)

## 기획 문서

- [캐릭터 시트](docs/design/characters.md)
- [5장 스토리 매트릭스](docs/design/story-matrix.md)
- [Emotion Sync & 엔딩](docs/design/emotion-sync.md)
- [VN MVP 스펙](docs/design/vn-mvp-spec.md)

## 프로젝트 구조

```
src/
  App.tsx                 # VN 플로우 (타이틀·챕터·시나리오)
  components/
    ScenarioPlayer.tsx    # 대화·선택지·Sync HUD
  config/scenarios/       # 장별 시나리오 데이터
  store/                  # story, emotion, save
  combat/                 # 장별 전투 모듈 (스텁 → 후속 구현)
  legacy/                 # 이전 생존 슈터 코드
electron/                 # PC 래퍼
```

## 기술 스택

- React 18, TypeScript, Vite, Zustand, Tailwind CSS
- Electron (Steam 래핑용)

## 빌드

```bash
npm run build
npm run preview
```
