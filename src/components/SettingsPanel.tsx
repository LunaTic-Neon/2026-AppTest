import { useState } from 'react'
import { useMetaProgressionStore } from '../store/metaProgressionStore'

const SPEED_OPTIONS = [1.0, 1.1, 1.2, 1.3, 1.5]

const LANG_OPTIONS = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
] as const

interface Props {
  compact?: boolean
}

export default function SettingsPanel({ compact = false }: Props) {
  const metaStore = useMetaProgressionStore()
  const [editingVolume, setEditingVolume] = useState<'master' | 'bgm' | 'sfx' | 'voice' | null>(null)
  const [editingValue, setEditingValue] = useState('')

  const onVolumeChange = (channel: 'master' | 'bgm' | 'sfx' | 'voice', value: number) => {
    metaStore.setAudioVolume(channel, value / 100)
  }

  const startEditing = (key: 'master' | 'bgm' | 'sfx' | 'voice', currentValue: number) => {
    setEditingVolume(key)
    setEditingValue(String(Math.round(currentValue * 100)))
  }

  const commitEditing = (key: 'master' | 'bgm' | 'sfx' | 'voice') => {
    const num = parseInt(editingValue, 10)
    if (!isNaN(num)) {
      onVolumeChange(key, Math.max(0, Math.min(100, num)))
    }
    setEditingVolume(null)
  }

  const volumeRows: Array<{ key: 'master' | 'bgm' | 'sfx' | 'voice'; label: string; value: number }> = [
    { key: 'master', label: '마스터 볼륨', value: metaStore.audioSettings.master },
    { key: 'bgm', label: '배경음', value: metaStore.audioSettings.bgm },
    { key: 'sfx', label: '효과음', value: metaStore.audioSettings.sfx },
    { key: 'voice', label: '보이스', value: metaStore.audioSettings.voice },
  ]

  return (
    <div className={`rounded-xl border border-slate-600 bg-slate-900/90 ${compact ? 'p-4' : 'p-6'}`}>
      <h3 className={`font-bold tracking-wide text-white ${compact ? 'text-lg mb-3' : 'text-2xl mb-4'}`}>설정</h3>

      <div className="space-y-3 mb-6">
        {volumeRows.map((row) => (
          <div key={row.key}>
            <div className="mb-1 flex items-center justify-between text-sm text-slate-300">
              <span>{row.label}</span>
              {editingVolume === row.key ? (
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="w-16 rounded bg-slate-700 text-white text-right px-1 text-sm border border-cyan-400 outline-none"
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onBlur={() => commitEditing(row.key)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEditing(row.key)
                    if (e.key === 'Escape') setEditingVolume(null)
                  }}
                  autoFocus
                />
              ) : (
                <span
                  className="cursor-pointer hover:text-cyan-300 transition select-none"
                  title="클릭하여 직접 입력"
                  onClick={() => startEditing(row.key, row.value)}
                >
                  {Math.round(row.value * 100)}%
                </span>
              )}
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(row.value * 100)}
              onChange={(e) => onVolumeChange(row.key, Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>
        ))}
      </div>

      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm text-slate-300">게임 배속</p>
          <p className="text-sm text-cyan-300">현재 x{metaStore.selectedTimeScale.toFixed(1)}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {SPEED_OPTIONS.map((speed) => {
            const unlocked = metaStore.unlockedTimeScales.includes(speed)
            const selected = metaStore.selectedTimeScale === speed

            return (
              <button
                key={speed}
                className={`rounded border px-3 py-2 text-sm font-semibold transition ${
                  selected
                    ? 'border-cyan-300 bg-cyan-500/20 text-cyan-200'
                    : unlocked
                      ? 'border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700'
                      : 'border-slate-700 bg-slate-900 text-slate-500 cursor-not-allowed'
                }`}
                onClick={() => {
                  if (unlocked) metaStore.setSelectedTimeScale(speed)
                }}
                disabled={!unlocked}
                title={unlocked ? `x${speed.toFixed(1)} 적용` : '상점에서 배속을 구매하면 해금됩니다'}
              >
                {unlocked ? `x${speed.toFixed(1)}` : `🔒 x${speed.toFixed(1)}`}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <p className="text-sm text-slate-300 mb-2">언어 / Language</p>
        <div className="flex gap-2">
          {LANG_OPTIONS.map((opt) => (
            <button
              key={opt.code}
              className={`rounded border px-3 py-2 text-sm font-semibold transition ${
                metaStore.language === opt.code
                  ? 'border-cyan-300 bg-cyan-500/20 text-cyan-200'
                  : 'border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700'
              }`}
              onClick={() => metaStore.setLanguage(opt.code)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
