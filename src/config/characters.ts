import { CharacterId } from '../types/scenario'

export interface CharacterProfile {
  id: CharacterId
  name: string
  color: string
}

export const CHARACTERS: Record<CharacterId, CharacterProfile> = {
  ella: { id: 'ella', name: '엘라', color: '#7dd3fc' },
  ren: { id: 'ren', name: '렌', color: '#94a3b8' },
  yume: { id: 'yume', name: '유메', color: '#f9a8d4' },
  zero: { id: 'zero', name: 'Dr. 제로', color: '#c4b5fd' },
  system: { id: 'system', name: '시스템', color: '#67e8f9' },
  narrator: { id: 'narrator', name: '', color: '#e2e8f0' },
  soldier: { id: 'soldier', name: '수색병', color: '#f87171' },
}

export function getSpeakerName(id: CharacterId): string {
  return CHARACTERS[id]?.name ?? id
}

export function getSpeakerColor(id: CharacterId): string {
  return CHARACTERS[id]?.color ?? '#fbbf24'
}
