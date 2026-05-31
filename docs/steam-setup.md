# Steam 출시 준비 가이드

## 1. Electron 래핑

```bash
npm run build
npm run electron
```

프로덕션 패키징: `electron-builder` 또는 Steam용 depots 설정.

## 2. Steamworks SDK

1. [Steamworks 파트너](https://partner.steamgames.com/) 앱 등록
2. App ID 발급 후 `steam_appid.txt` (개발용)
3. `steamworks.js` 또는 Greenworks로 업적·Cloud Save 연동
4. 업적 예시: 프롤로그 클리어, 3종 엔딩, Sync 100%

## 3. 세이브

- 현재: `localStorage` (슬롯 1) — [`saveStore.ts`](../src/store/saveStore.ts)
- Steam Cloud: 세이브 JSON을 Steam Remote Storage와 동기화

## 4. 빌드 체크리스트

- [ ] 1920×1080 UI 검증
- [ ] 오프라인 단독 실행
- [ ] Depots: Windows x64
- [ ] ESRB/연령 등급 (로맨스·폭력성)

## 5. package.json 스크립트

- `npm run electron` — 개발 (Vite + Electron)
- `npm run electron:build` — dist + Electron 실행
