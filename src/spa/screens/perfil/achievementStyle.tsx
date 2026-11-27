import type { ReactNode } from 'react'
import { Award, Lock, Medal, Shield, Star, Trophy } from 'lucide-react'
import type { Achievement } from '../../data/types'

export const ACHIEVEMENT_ICONS: Record<Achievement['icon'], ReactNode> = {
  trophy: <Trophy />,
  medal: <Medal />,
  lock: <Lock />,
  star: <Star />,
  shield: <Shield />,
  award: <Award />,
}

/** Colores de la caja del icono, la etiqueta y la barra de cada logro. */
export function achievementTones({ state, icon }: Achievement) {
  if (state === 'bloqueado') return { box: 'locked', tag: 'locked', bar: 'grey' } as const
  if (icon === 'medal') return { box: 'blue', tag: state === 'desbloqueado' ? 'green' : 'blue', bar: 'blue' } as const
  if (icon === 'star') return { box: 'peach', tag: state === 'desbloqueado' ? 'green' : 'peach', bar: 'orange' } as const
  return { box: 'yellow', tag: state === 'desbloqueado' ? 'green' : 'blue', bar: 'yellow' } as const
}

export function achievementLabel({ state, progress }: Achievement): string {
  if (state === 'desbloqueado') return 'Desbloqueado'
  if (state === 'bloqueado') return 'Bloqueado'
  return `${Math.round(progress * 100)} % completado`
}
