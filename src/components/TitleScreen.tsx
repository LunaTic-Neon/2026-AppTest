interface Props {
  onNewGame: () => void
  onContinue: () => void
  onSettings: () => void
  hasSave: boolean
}

export default function TitleScreen({ onNewGame, onContinue, onSettings, hasSave }: Props) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center px-6">
      <h1 className="mb-2 text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-400">
        Ruin&apos;s City
      </h1>
      <p className="mb-2 text-slate-400 text-sm tracking-widest">아스포델 — Asphodel</p>
      <p className="mb-12 text-slate-500 text-xs">폐허 속에서 깨어난 엘라의 이야기</p>

      <div className="flex flex-col gap-4 w-56">
        <MenuButton onClick={onNewGame} primary>
          새 게임
        </MenuButton>
        <MenuButton onClick={onContinue} disabled={!hasSave}>
          {hasSave ? '이어하기' : '이어하기 (없음)'}
        </MenuButton>
        <MenuButton onClick={onSettings}>
          설정
        </MenuButton>
      </div>
    </div>
  )
}

function MenuButton({
  children,
  onClick,
  primary,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  primary?: boolean
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-4 rounded-full text-lg font-bold transition shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${
        primary
          ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-cyan-500/30'
          : 'bg-slate-800 text-white border border-slate-600 hover:bg-slate-700'
      }`}
    >
      {children}
    </button>
  )
}
