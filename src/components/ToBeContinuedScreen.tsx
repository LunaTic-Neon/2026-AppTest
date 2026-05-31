interface Props {
  chapterTitle: string
  onReturnToTitle: () => void
}

export default function ToBeContinuedScreen({ chapterTitle, onReturnToTitle }: Props) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 px-6 text-center">
      <p className="text-sm tracking-[0.3em] text-cyan-400 mb-4">{chapterTitle}</p>
      <h2 className="text-4xl font-black text-white mb-2 tracking-widest">To Be Continued</h2>
      <p className="text-slate-400 mb-10 max-w-md">
        다음 챕터는 준비 중입니다. 엘라의 이야기는 1장 「운명적 만남」에서 이어집니다.
      </p>
      <button
        className="rounded-full bg-cyan-500 px-8 py-3 text-lg font-bold text-slate-950 hover:bg-cyan-400 transition"
        onClick={onReturnToTitle}
      >
        타이틀로
      </button>
    </div>
  )
}
