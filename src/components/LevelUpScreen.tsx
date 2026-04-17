import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { usePlayerStore } from '../store/playerStore'
import { useUpgradeStore } from '../store/upgradeStore'
import { Upgrade } from '../types'

export default function LevelUpScreen() {
  const gameStore = useGameStore()
  const playerStore = usePlayerStore()
  const upgradeStore = useUpgradeStore()
  const [availableUpgrades] = useState<Upgrade[]>(() => upgradeStore.getRandomUpgrades(3))

  const handleSelectUpgrade = (upgrade: Upgrade) => {
    applyUpgrade(upgrade)
    gameStore.setCurrentScene('playing')
  }

  const applyUpgrade = (upgrade: Upgrade) => {
    const player = playerStore.player
    upgradeStore.applyUpgrade(upgrade)

    switch (upgrade.type) {
      case 'damage':
        playerStore.updateStats({
          attackPower: player.attackPower * upgrade.value,
        })
        break
      case 'speed':
        playerStore.updateStats({
          moveSpeed: player.moveSpeed * upgrade.value,
        })
        break
      case 'attackSpeed':
        playerStore.updateStats({
          attackSpeed: player.attackSpeed * upgrade.value,
        })
        break
      case 'health':
        const healAmount = player.maxHp * upgrade.value
        playerStore.updateStats({
          maxHp: player.maxHp + healAmount,
          hp: Math.min(player.hp + healAmount, player.maxHp + healAmount),
        })
        break
    }
  }

  return (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
  <div className="bg-slate-900 border-2 border-cyan-400 rounded-lg p-3 sm:p-4 max-w-lg w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-cyan-400 mb-2">
            레벨 {playerStore.player.level}
          </h1>
          <p className="text-gray-300 text-sm">업그레이드를 선택하세요</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {availableUpgrades.map((upgrade) => (
            <button
              key={upgrade.id}
              onClick={() => handleSelectUpgrade(upgrade)}
              className="group relative bg-slate-800 border-2 border-gray-600 hover:border-cyan-400 rounded-lg p-2 sm:p-3 transition-all duration-150 hover:shadow-md hover:shadow-cyan-400/20"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/10 to-transparent opacity-0 group-hover:opacity-100 rounded-lg transition-opacity" />

              <div className="relative">
                <h3 className="text-sm font-bold text-white mb-1 text-left">
                  {upgrade.name}
                </h3>
                <p className="text-xs text-gray-400 text-left mb-2">
                  {upgrade.description}
                </p>

                <div className="text-right">
                  <span className="text-cyan-400 font-semibold">
                    +{Math.round((upgrade.value - 1) * 100)}%
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="bg-slate-800 border border-gray-600 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">공격력</p>
              <p className="text-white font-semibold">{Math.round(playerStore.player.attackPower)}</p>
            </div>
            <div>
              <p className="text-gray-500">이동속도</p>
              <p className="text-white font-semibold">{Math.round(playerStore.player.moveSpeed)}</p>
            </div>
            <div>
              <p className="text-gray-500">공격속도</p>
              <p className="text-white font-semibold">{playerStore.player.attackSpeed.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-500">체력</p>
              <p className="text-white font-semibold">{Math.round(playerStore.player.hp)} / {Math.round(playerStore.player.maxHp)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
