import type { ReactNode } from 'react'
import { BarChart3, Flame, Lightbulb, Plus } from 'lucide-react'

/** Textos de la landing, tal como están en el diseño. */
export const NAV = [
  { id: 'como-funciona', label: 'Cómo funciona' },
  { id: 'funcionalidades', label: 'Funcionalidades' },
  { id: 'competiciones', label: 'Competiciones' },
  { id: 'ranking', label: 'Ranking' },
  { id: 'faq', label: 'FAQ' },
]

export const DEMO_OPTIONS = ['Holanda', 'España', 'Alemania', 'Uruguay']

export const FIGURES = [
  { value: '20s', label: 'Por pregunta' },
  { value: '1', label: 'Reto diario' },
  { value: '7+', label: 'Competiciones' },
]

export const STEPS = [
  { title: 'Elige tu competición', text: 'LaLiga, Premier, Champions… Recibirás retos de tu liga cada semana.' },
  { title: 'Ajusta el nivel', text: 'Elige la dificultad y cuántas pistas quieres tener disponibles al día.' },
  { title: 'Responde en 20 segundos', text: 'Acierta, suma puntos y mantén viva tu racha día tras día.' },
]

export const FEATURES: Array<{ title: string; text: string; icon: ReactNode }> = [
  { title: 'Rachas', text: 'Juega cada día y no rompas la cadena.', icon: <Flame /> },
  { title: 'Pistas', text: '¿Atascado? Usa una pista y salva el reto.', icon: <Lightbulb /> },
  { title: 'Ranking global', text: 'Compite con aficionados de todo el mundo.', icon: <BarChart3 /> },
  { title: 'Retos propios', text: 'Crea retos personalizados para tu grupo.', icon: <Plus /> },
]

export const LEAGUES = [
  'LaLiga',
  'Premier League',
  'Serie A',
  'Bundesliga',
  'Ligue 1',
  'Champions · UEFA · Conference',
  'Competiciones internacionales',
]

export const SAMPLE_RANKING = [
  { rank: 1, name: 'CRACK_99', points: 2480 },
  { rank: 2, name: 'LA_PULGA_FAN', points: 2315 },
  { rank: 3, name: 'TIKITAKA', points: 2190 },
  { rank: 12, name: 'TÚ', points: 1240 },
]

export const FAQ = [
  { question: '¿Es gratis?', answer: 'Sí, puedes empezar a jugar gratis y recibir un reto nuevo cada día.' },
  {
    question: '¿Cuánto tiempo tengo para responder?',
    answer: '20 segundos por pregunta. Cuanto antes aciertes, más puntos sumas.',
  },
  {
    question: '¿Puedo cambiar de competición?',
    answer: 'Sí. Cambia tu liga, la dificultad y las pistas cuando quieras desde tu perfil.',
  },
]
