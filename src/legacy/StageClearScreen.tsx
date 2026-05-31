import { useEffect, useMemo } from 'react'
import { useGameStore } from '../store/gameStore'
import { usePlayerStore } from '../store/playerStore'
import { useMetaProgressionStore } from '../store/metaProgressionStore'

interface Props {
  onReturnToMenu: () => void
  onRestart: () => void
}

export default function StageClearScreen({ onReturnToMenu, onRestart }: Props) {
  const gameStore = useGameStore()
  const playerStore = usePlayerStore()
  const metaStore = useMetaProgressionStore()

  const minutes = Math.floor(gameStore.gameTime / 60)
  const seconds = Math.floor(gameStore.gameTime % 60)

  // 금화 설계
  // 시간 보상: 3분(180s) 이하 = 2000G, 7분(420s) 이상 = 500G, 선형 감소
  // 처치 보상: 처치 수 직접 합산
  const goldAward = useMemo(() => {
    const clearTime = Math.max(1, gameStore.gameTime)
    const killCount = Math.max(0, gameStore.killCount)

    const MIN_TIME = 180  // 3분
    const MAX_TIME = 420  // 7분
    const GOLD_AT_MIN = 2000
    const GOLD_AT_MAX = 500

    let timeGold: number
    if (clearTime <= MIN_TIME) {
      timeGold = GOLD_AT_MIN
    } else if (clearTime >= MAX_TIME) {
      timeGold = GOLD_AT_MAX
    } else {
      timeGold = Math.round(
        GOLD_AT_MIN + ((clearTime - MIN_TIME) / (MAX_TIME - MIN_TIME)) * (GOLD_AT_MAX - GOLD_AT_MIN)
      )
    }

    return timeGold + killCount
  }, [gameStore.gameTime, gameStore.killCount])

  useEffect(() => {
    const state = useGameStore.getState()
    if (!state.stageClearRewardGranted) {
      useMetaProgressionStore.getState().addGold(goldAward)
      state.setStageClearRewardGranted(true)
    }
  }, [goldAward])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      {/* 별빛 효과 배경 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-pink-400 opacity-60 animate-ping"
            style={{
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 2 + 1}s`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative bg-slate-900 border-2 border-pink-500 rounded-2xl p-10 max-w-lg w-full mx-4 text-center shadow-2xl shadow-pink-500/30">
        {/* 클리어 타이틀 */}
        <div className="mb-2 text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400">
          CLEAR
        </div>
        <div className="mb-6 text-lg font-semibold text-pink-300">
          1-1 클리어!
        </div>

        {/* 결과 */}
        <div className="mb-8 grid grid-cols-3 gap-4 text-center">
          <div className="bg-slate-800 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">클리어 시간</p>
            <p className="text-xl font-bold text-white">
              {minutes}:{String(seconds).padStart(2, '0')}
            </p>
          </div>
          <div className="bg-slate-800 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">처치 수</p>
            <p className="text-xl font-bold text-white">{gameStore.killCount}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">최종 레벨</p>
            <p className="text-xl font-bold text-white">Lv.{playerStore.player.level}</p>
          </div>
        </div>

        <div className="mb-8 rounded-lg border border-amber-400/50 bg-amber-900/20 px-4 py-3 text-center">
          <p className="text-xs text-amber-300 mb-1">획득 금화</p>
          <p className="text-2xl font-black text-amber-300">+{goldAward.toLocaleString()} G</p>
          <p className="text-xs text-amber-200/80 mt-1">보유 금화 {metaStore.totalGold.toLocaleString()} G</p>
        </div>

        {/* 버튼 */}
        <div className="flex gap-4 justify-center">
          <button
            className="rounded-full bg-pink-500 px-8 py-3 font-bold text-white shadow-lg hover:bg-pink-400 transition"
            onClick={onRestart}
          >
            다시 하기
          </button>
          <button
            className="rounded-full bg-slate-700 px-8 py-3 font-bold text-white hover:bg-slate-600 transition"
            onClick={onReturnToMenu}
          >
            메인으로
          </button>
        </div>
      </div>
    </div>
  )
}
