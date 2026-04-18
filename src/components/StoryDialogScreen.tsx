import { useEffect, useMemo, useState } from 'react'
import { StoryLine } from '../config/storyDialogs'

interface Props {
  stageTitle: string
  stageSubtitle: string
  lines: StoryLine[]
  onBack: () => void
  onComplete: () => void
}

export default function StoryDialogScreen({
  stageTitle,
  stageSubtitle,
  lines,
  onBack,
  onComplete,
}: Props) {
  const [lineIndex, setLineIndex] = useState(0)
  const [visibleChars, setVisibleChars] = useState(0)
  const [autoPlay, setAutoPlay] = useState(false)
  const [showLog, setShowLog] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [ctrlHeld, setCtrlHeld] = useState(false)

  const currentLine = lines[lineIndex]
  const lineDone = visibleChars >= currentLine.text.length

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control') setCtrlHeld(true)
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control') setCtrlHeld(false)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  useEffect(() => {
    if (lineDone) return

    const speed = ctrlHeld ? 6 : 20
    const timer = window.setInterval(() => {
      setVisibleChars((prev) => Math.min(prev + 1, currentLine.text.length))
    }, speed)

    return () => window.clearInterval(timer)
  }, [ctrlHeld, currentLine.text.length, lineDone])

  useEffect(() => {
    if (!lineDone) return
    if (!autoPlay && !ctrlHeld) return

    const delay = ctrlHeld ? 90 : 700
    const timer = window.setTimeout(() => {
      moveNext()
    }, delay)

    return () => window.clearTimeout(timer)
  }, [lineDone, autoPlay, ctrlHeld])

  const moveNext = () => {
    if (!lineDone) {
      setVisibleChars(currentLine.text.length)
      return
    }

    if (lineIndex >= lines.length - 1) {
      onComplete()
      return
    }

    setLineIndex((prev) => prev + 1)
    setVisibleChars(0)
  }

  const movePrev = () => {
    if (lineIndex <= 0) return
    setLineIndex((prev) => prev - 1)
    setVisibleChars(0)
  }

  const viewedLog = useMemo(() => lines.slice(0, lineIndex + 1), [lineIndex, lines])

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <div className="absolute top-6 left-6 rounded-lg border border-cyan-400/40 bg-black/60 px-4 py-2 text-left">
        <div className="text-xs tracking-widest text-cyan-300">{stageTitle}</div>
        <div className="text-sm text-slate-300">{stageSubtitle}</div>
      </div>

      {showLog && (
        <div className="absolute top-20 right-6 z-50 w-[min(560px,90vw)] rounded-xl border border-slate-500 bg-black/85 p-4 text-left">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold tracking-widest text-cyan-300">DIALOG LOG</h3>
            <button
              className="rounded bg-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-600"
              onClick={() => setShowLog(false)}
            >
              닫기
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {viewedLog.map((line, i) => (
              <div key={`${line.speaker}-${i}`} className="rounded bg-slate-900/80 px-3 py-2">
                <p className="text-xs font-semibold text-amber-300">{line.speaker}</p>
                <p className="text-sm text-slate-200">{line.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showSettings && (
        <div className="absolute top-20 left-6 z-50 w-[min(420px,88vw)] rounded-xl border border-slate-500 bg-black/85 p-4 text-left">
          <h3 className="text-sm font-bold tracking-widest text-cyan-300 mb-2">STORY SETTINGS</h3>
          <p className="text-sm text-slate-300 mb-1">Ctrl 홀드: 빠른 스킵</p>
          <p className="text-sm text-slate-300 mb-1">AUTO: 대사를 자동으로 진행</p>
          <p className="text-sm text-slate-500">세부 설정은 추후 확장 예정입니다.</p>
        </div>
      )}

      <div className="absolute left-0 bottom-[33vh] z-50 px-6">
        <div className="inline-block rounded-t-md border border-slate-500 border-b-0 bg-black/85 px-4 py-2">
          <span className="text-sm font-bold tracking-wide text-amber-300">{currentLine.speaker}</span>
        </div>
      </div>

      <div
        className="relative z-40 h-[33vh] min-h-[210px] w-full border-t border-slate-500 bg-black/80 px-6 py-5"
        onClick={moveNext}
      >
        <div className="mb-3 flex items-center justify-end gap-2">
          <button
            className="rounded border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
            onClick={(e) => {
              e.stopPropagation()
              setShowLog((prev) => !prev)
            }}
          >
            로그
          </button>
          <button
            className={`rounded border px-3 py-1.5 text-xs ${autoPlay ? 'border-cyan-300 bg-cyan-600 text-white' : 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700'}`}
            onClick={(e) => {
              e.stopPropagation()
              setAutoPlay((prev) => !prev)
            }}
          >
            AUTO
          </button>
          <button
            className="rounded border border-rose-500/70 bg-rose-900/60 px-3 py-1.5 text-xs text-rose-100 hover:bg-rose-800/70"
            onClick={(e) => {
              e.stopPropagation()
              onComplete()
            }}
          >
            전체 스킵
          </button>
          <button
            className="rounded border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
            onClick={(e) => {
              e.stopPropagation()
              setShowSettings((prev) => !prev)
            }}
          >
            설정
          </button>
        </div>

        <p className="text-lg leading-relaxed text-slate-100 break-keep">
          {currentLine.text.slice(0, visibleChars)}
          {!lineDone && <span className="ml-0.5 inline-block h-5 w-[2px] animate-pulse bg-cyan-400 align-middle" />}
        </p>

        <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <button
              className="rounded bg-slate-800 px-2 py-1 hover:bg-slate-700 disabled:opacity-40"
              onClick={(e) => {
                e.stopPropagation()
                movePrev()
              }}
              disabled={lineIndex === 0}
            >
              이전
            </button>
            <button
              className="rounded bg-slate-800 px-2 py-1 hover:bg-slate-700"
              onClick={(e) => {
                e.stopPropagation()
                moveNext()
              }}
            >
              다음
            </button>
            <button
              className="rounded bg-slate-800 px-2 py-1 hover:bg-slate-700"
              onClick={(e) => {
                e.stopPropagation()
                onBack()
              }}
            >
              스테이지 선택으로
            </button>
          </div>
          <div className="tracking-wide">
            {lineIndex + 1} / {lines.length} · Ctrl 홀드 고속 스킵
          </div>
        </div>
      </div>
    </div>
  )
}
