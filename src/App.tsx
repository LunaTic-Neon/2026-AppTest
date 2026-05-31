import { useEffect, useState } from 'react'
import RuinedCityBackground from './components/RuinedCityBackground'
import TitleScreen from './components/TitleScreen'
import ChapterSelectScreen from './components/ChapterSelectScreen'
import ScenarioPlayer from './components/ScenarioPlayer'
import ToBeContinuedScreen from './components/ToBeContinuedScreen'
import SettingsPanel from './components/SettingsPanel'
import { getScenario } from './config/scenarios'
import { ChapterId } from './types/scenario'
import { useMetaProgressionStore } from './store/metaProgressionStore'
import { useStoryStore } from './store/storyStore'
import { useSaveStore } from './store/saveStore'

type AppScreen = 'title' | 'chapterSelect' | 'scenario' | 'continued' | 'settings'

function App() {
  const [screen, setScreen] = useState<AppScreen>('title')
  const [activeChapter, setActiveChapter] = useState<ChapterId | null>(null)
  const [resumeNodeId, setResumeNodeId] = useState<string | undefined>(undefined)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const hasSave = useSaveStore((s) => s.hasSave)
  const checkSave = useSaveStore((s) => s.checkSave)
  const loadGame = useSaveStore((s) => s.loadGame)
  const applySave = useSaveStore((s) => s.applySave)
  const startNewGame = useSaveStore((s) => s.startNewGame)
  const completeScene = useStoryStore((s) => s.completeScene)
  const markStageCleared = useMetaProgressionStore((s) => s.markStageCleared)

  useEffect(() => {
    useMetaProgressionStore.getState().loadFromLocalStorage()
    checkSave()
  }, [checkSave])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (screen === 'settings') {
          setScreen('title')
          setShowResetConfirm(false)
        } else if (screen === 'chapterSelect') {
          setScreen('title')
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [screen])

  const handleNewGame = () => {
    startNewGame()
    setResumeNodeId(undefined)
    setScreen('chapterSelect')
  }

  const handleContinue = () => {
    const data = loadGame()
    if (!data?.story.currentChapterId || !data.story.currentNodeId) return
    applySave(data)
    setActiveChapter(data.story.currentChapterId)
    setResumeNodeId(data.story.currentNodeId)
    setScreen('scenario')
  }

  const handleChapterSelect = (chapterId: ChapterId) => {
    const scenario = getScenario(chapterId)
    if (!scenario) return
    setActiveChapter(chapterId)
    setResumeNodeId(undefined)
    setScreen('scenario')
  }

  const handleScenarioComplete = () => {
    if (!activeChapter) return
    completeScene(activeChapter)
    markStageCleared(activeChapter)
    useMetaProgressionStore.getState().saveToLocalStorage()
    setScreen('continued')
  }

  const handleReturnToTitle = () => {
    setActiveChapter(null)
    setResumeNodeId(undefined)
    setScreen('title')
    checkSave()
  }

  const activeScenario = activeChapter ? getScenario(activeChapter) : undefined

  return (
    <div className="w-full h-screen bg-primary overflow-hidden relative flex items-center justify-center">
      <RuinedCityBackground />

      {screen === 'title' && (
        <TitleScreen
          hasSave={hasSave}
          onNewGame={handleNewGame}
          onContinue={handleContinue}
          onSettings={() => setScreen('settings')}
        />
      )}

      {screen === 'chapterSelect' && (
        <ChapterSelectScreen
          onBack={() => setScreen('title')}
          onSelect={handleChapterSelect}
        />
      )}

      {screen === 'scenario' && activeScenario && (
        <ScenarioPlayer
          scenario={activeScenario}
          initialNodeId={resumeNodeId}
          onBack={() => {
            setActiveChapter(null)
            setResumeNodeId(undefined)
            setScreen('chapterSelect')
          }}
          onComplete={handleScenarioComplete}
        />
      )}

      {screen === 'continued' && activeChapter && (
        <ToBeContinuedScreen
          chapterTitle={activeScenario?.subtitle ?? activeChapter}
          onReturnToTitle={handleReturnToTitle}
        />
      )}

      {screen === 'settings' && (
        <div className="absolute inset-0 z-30 overflow-y-auto px-6 py-8">
          <div className="relative w-full max-w-xl mx-auto">
            <div className="flex items-center mb-8">
              <button
                className="mr-4 text-slate-400 hover:text-white transition text-2xl"
                onClick={() => setScreen('title')}
              >
                ←
              </button>
              <h2 className="text-3xl font-bold text-white">설정</h2>
            </div>
            <div className="rounded-xl border border-slate-600 bg-slate-900/90 p-3 sm:p-4">
              <SettingsPanel />
              <div className="mt-3 flex justify-end">
                {!showResetConfirm ? (
                  <button
                    className="rounded border border-red-700 bg-red-900/40 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-800/60 transition"
                    onClick={() => setShowResetConfirm(true)}
                  >
                    게임 초기화
                  </button>
                ) : (
                  <div className="w-full rounded border border-red-500 bg-red-950/80 px-4 py-4 text-sm text-red-300">
                    <p className="mb-3 font-semibold">
                      모든 진행 상황(세이브, 스토리 플래그, 클리어 기록)이 초기화됩니다.
                    </p>
                    <div className="flex gap-3">
                      <button
                        className="flex-1 rounded bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-500 transition"
                        onClick={() => {
                          useMetaProgressionStore.getState().resetAllProgress()
                          useSaveStore.getState().deleteSave()
                          startNewGame()
                          setShowResetConfirm(false)
                          checkSave()
                        }}
                      >
                        확인 (초기화)
                      </button>
                      <button
                        className="flex-1 rounded bg-slate-700 px-4 py-2 font-bold text-white hover:bg-slate-600 transition"
                        onClick={() => setShowResetConfirm(false)}
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
