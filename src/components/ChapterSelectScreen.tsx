import { CHAPTER_LIST } from '../config/scenarios'
import { ChapterId } from '../types/scenario'
import { useStoryStore } from '../store/storyStore'

interface Props {
  onSelect: (chapterId: ChapterId) => void
  onBack: () => void
}

export default function ChapterSelectScreen({ onSelect, onBack }: Props) {
  const completedScenes = useStoryStore((s) => s.completedScenes)

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-2xl">
        <div className="flex items-center mb-8">
          <button
            className="mr-4 text-slate-400 hover:text-white transition text-2xl"
            onClick={onBack}
          >
            ←
          </button>
          <h2 className="text-3xl font-bold text-white">챕터 선택</h2>
        </div>

        <div className="space-y-3">
          {CHAPTER_LIST.map((ch) => {
            const cleared = completedScenes.includes(ch.id)
            const locked = !ch.available

            return (
              <button
                key={ch.id}
                disabled={locked}
                className={`w-full rounded-xl p-5 text-left border-2 transition shadow-lg ${
                  locked
                    ? 'border-slate-700 bg-slate-900/50 opacity-50 cursor-not-allowed'
                    : cleared
                      ? 'border-emerald-500/70 bg-slate-900/90 hover:border-emerald-300'
                      : 'border-cyan-500/70 bg-slate-900/90 hover:border-cyan-300'
                }`}
                onClick={() => !locked && onSelect(ch.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl font-black text-white">{ch.label}</div>
                    <div className="text-sm text-slate-400">{ch.subtitle}</div>
                  </div>
                  {cleared && <span className="text-emerald-400 text-xl font-bold">✓</span>}
                  {locked && <span className="text-slate-500 text-sm">준비 중</span>}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
