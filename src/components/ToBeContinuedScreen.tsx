import { getNextChapterHint } from '../config/scenarios'
import { ChapterId } from '../types/scenario'

interface Props {
  chapterId: ChapterId
  chapterTitle: string
  onReturnToTitle: () => void
  onContinue?: () => void
}

export default function ToBeContinuedScreen({
  chapterId,
  chapterTitle,
  onReturnToTitle,
  onContinue,
}: Props) {
  const nextHint = getNextChapterHint(chapterId)

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 px-6 text-center">
      <p className="text-sm tracking-[0.3em] text-cyan-400 mb-4">{chapterTitle}</p>
      <h2 className="text-4xl font-black text-white mb-2 tracking-widest">Chapter Clear</h2>
      {nextHint && (
        <p className="text-slate-300 mb-10 max-w-md">{nextHint}</p>
      )}
      <div className="flex flex-col sm:flex-row gap-4">
        {onContinue && (
          <button
            className="rounded-full bg-cyan-500 px-8 py-3 text-lg font-bold text-slate-950 hover:bg-cyan-400 transition"
            onClick={onContinue}
          >
            다음 챕터
          </button>
        )}
        <button
          className="rounded-full border border-slate-500 bg-slate-800 px-8 py-3 text-lg font-bold text-white hover:bg-slate-700 transition"
          onClick={onReturnToTitle}
        >
          타이틀로
        </button>
      </div>
    </div>
  )
}
