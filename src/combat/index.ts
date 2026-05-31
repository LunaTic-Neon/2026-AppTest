import { CombatModuleId } from '../types/scenario'
import { CombatModule } from './types'
import { chaseModule } from './chase/ChaseModule'
import { cardModule } from './card/CardModule'
import { bossModule } from './boss/BossModule'
import { finalModule } from './final/FinalModule'

export const COMBAT_MODULES: Record<CombatModuleId, CombatModule> = {
  chase: chaseModule,
  card: cardModule,
  boss: bossModule,
  final: finalModule,
}

export function getCombatModule(id: CombatModuleId): CombatModule {
  return COMBAT_MODULES[id]
}

export * from './types'
