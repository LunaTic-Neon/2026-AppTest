import { useEffect, useMemo, useState } from 'react'
import { Scenario, ScenarioNode } from '../types/scenario'
import { getSpeakerColor, getSpeakerName } from '../config/characters'
import { applyScenarioEffects } from '../engine/scenarioEffects'
import { useEmotionStore } from '../store/emotionStore'
import { useSaveStore } from '../store/saveStore'

interface Props {
  scenario: Scenario
  initialNodeId?: string
  onBack: () => void
  onComplete: () => void
}

interface LogEntry {
  speaker: string
  text: string
  color: string
}

export default function ScenarioPlayer({
  scenario,
  initialNodeId,
  onBack,
  onComplete,
}: Props) {
  const [nodeId, setNodeId] = useState(initialNodeId ?? scenario.startNodeId)
  const [visibleChars, setVisibleChars] = useState(0)
  const [autoPlay, setAutoPlay] = useState(false)
  const [showLog, setShowLog] = useState(false)
  const [ctrlHeld, setCtrlHeld] = useState(false)
  const [log, setLog] = useState<LogEntry[]>([])

  const syncPercent = useEmotionStore((s) => s.syncPercent)
  const saveGame = useSaveStore((s) => s.saveGame)

  const currentNode: ScenarioNode = scenario.nodes[nodeId]

  const displayText = useMemo(() => {
    if (currentNode.type === 'choice') return currentNode.text ?? '선택하세요.'
    return currentNode.text ?? ''
  }, [currentNode])

  const speakerId = currentNode.speakerId
  const speakerName = speakerId ? getSpeakerName(speakerId) : ''
  const speakerColor = speakerId ? getSpeakerColor(speakerId) : '#e2e8f0'

  const lineDone = visibleChars >= displayText.length
  const isChoice = currentNode.type === 'choice'
  const isEnd = currentNode.type === 'end'

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
    setVisibleChars(0)
  }, [nodeId])

  useEffect(() => {
    if (lineDone || isChoice || isEnd) return
    const speed = ctrlHeld ? 6 : 20
    const timer = window.setInterval(() => {
      setVisibleChars((prev) => Math.min(prev + 1, displayText.length))
    }, speed)
    return () => window.clearInterval(timer)
  }, [ctrlHeld, displayText.length, lineDone, isChoice, isEnd])

  useEffect(() => {
    if (!lineDone || isChoice || isEnd) return
    if (!autoPlay && !ctrlHeld) return
    const delay = ctrlHeld ? 90 : 700
    const timer = window.setTimeout(() => advanceFromDialogue(), delay)
    return () => window.clearTimeout(timer)
  }, [lineDone, autoPlay, ctrlHeld, isChoice, isEnd])

  const appendLog = (text: string, name: string, color: string) => {
    if (!text) return
    setLog((prev) => [...prev, { speaker: name, text, color }])
  }

  const advanceFromDialogue = () => {
    if (isEnd) {
      applyScenarioEffects(currentNode.effects)
      onComplete()
      return
    }

    if (isChoice) return

    if (!lineDone) {
      setVisibleChars(displayText.length)
      return
    }

    appendLog(displayText, speakerName || '나레이션', speakerColor)

    if (currentNode.effects) {
      applyScenarioEffects(currentNode.effects)
    }

    const nextId = currentNode.nextNodeId
    if (!nextId) {
      onComplete()
      return
    }

    const nextNode = scenario.nodes[nextId]
    if (nextNode?.type === 'end') {
      applyScenarioEffects(nextNode.effects)
      saveGame(scenario.id, nextId)
      onComplete()
      return
    }

    saveGame(scenario.id, nextId)
    setNodeId(nextId)
  }

  const handleChoice = (choiceId: string, nextNodeId: string, effects?: Parameters<typeof applyScenarioEffects>[0]) => {
    const choice = currentNode.choices?.find((c) => c.id === choiceId)
    if (choice) {
      appendLog(choice.text, '선택', '#fbbf24')
    }
    applyScenarioEffects(effects, currentNode.id, choiceId)
    saveGame(scenario.id, nextNodeId)
    setNodeId(nextNodeId)
  }

  const handleSkipAll = () => {
    applyScenarioEffects(currentNode.effects)
    onComplete()
  }

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <div className="absolute top-6 left-6 rounded-lg border border-cyan-400/40 bg-black/60 px-4 py-2 text-left">
        <div className="text-xs tracking-widest text-cyan-300">{scenario.title}</div>
        <div className="text-sm text-slate-300">{scenario.subtitle}</div>
      </div>

      <div className="absolute top-6 right-6 rounded-lg border border-violet-400/40 bg-black/60 px-4 py-2 text-right">
        <div className="text-xs text-violet-300 tracking-widest">EMOTION SYNC</div>
        <div className="text-lg font-bold text-violet-200">{syncPercent}%</div>
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
            {log.map((entry, i) => (
              <div key={`${entry.speaker}-${i}`} className="rounded bg-slate-900/80 px-3 py-2">
                <p className="text-xs font-semibold" style={{ color: entry.color }}>{entry.speaker}</p>
                <p className="text-sm text-slate-200 whitespace-pre-wrap">{entry.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isChoice && speakerName && (
        <div className="absolute left-0 bottom-[33vh] z-50 px-6">
          <div
            className="inline-block rounded-t-md border border-slate-500 border-b-0 bg-black/85 px-4 py-2"
            style={{ borderColor: `${speakerColor}66` }}
          >
            <span className="text-sm font-bold tracking-wide" style={{ color: speakerColor }}>
              {speakerName}
            </span>
          </div>
        </div>
      )}

      <div
        className="relative z-40 h-[33vh] min-h-[210px] w-full border-t border-slate-500 bg-black/80 px-6 py-5"
        onClick={isChoice ? undefined : advanceFromDialogue}
      >
        <div className="mb-3 flex items-center justify-end gap-2">
          <button
            className="rounded border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
            onClick={(e) => { e.stopPropagation(); setShowLog((p) => !p) }}
          >
            로그
          </button>
          <button
            className={`rounded border px-3 py-1.5 text-xs ${autoPlay ? 'border-cyan-300 bg-cyan-600 text-white' : 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700'}`}
            onClick={(e) => { e.stopPropagation(); setAutoPlay((p) => !p) }}
          >
            AUTO
          </button>
          <button
            className="rounded border border-rose-500/70 bg-rose-900/60 px-3 py-1.5 text-xs text-rose-100 hover:bg-rose-800/70"
            onClick={(e) => { e.stopPropagation(); handleSkipAll() }}
          >
            전체 스킵
          </button>
        </div>

        {isChoice ? (
          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            <p className="text-base text-slate-300 mb-3">{displayText}</p>
            {currentNode.choices?.map((choice) => (
              <button
                key={choice.id}
                className="block w-full rounded-lg border border-cyan-500/50 bg-slate-900/90 px-4 py-3 text-left text-slate-100 hover:border-cyan-300 hover:bg-slate-800 transition"
                onClick={() => handleChoice(choice.id, choice.nextNodeId, choice.effects)}
              >
                {choice.text}
              </button>
            ))}
          </div>
        ) : isEnd ? (
          <p className="text-lg text-slate-400 italic">— 장면 종료 —</p>
        ) : (
          <p className="text-lg leading-relaxed text-slate-100 break-keep whitespace-pre-wrap">
            {displayText.slice(0, visibleChars)}
            {!lineDone && (
              <span className="ml-0.5 inline-block h-5 w-[2px] animate-pulse bg-cyan-400 align-middle" />
            )}
          </p>
        )}

        <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-xs text-slate-400">
          <button
            className="rounded bg-slate-800 px-2 py-1 hover:bg-slate-700"
            onClick={(e) => { e.stopPropagation(); onBack() }}
          >
            챕터 선택으로
          </button>
          <div className="tracking-wide">
            {nodeId} · Ctrl 홀드 고속 스킵
          </div>
        </div>
      </div>
    </div>
  )
}
