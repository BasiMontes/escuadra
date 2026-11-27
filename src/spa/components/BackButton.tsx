import { ArrowLeft } from 'lucide-react'
import styles from './BackButton.module.css'

export function BackButton({ onClick, 'data-testid': testId }: { onClick: () => void; 'data-testid': string }) {
  return (
    <button type="button" className={styles.back} onClick={onClick} aria-label="Volver" data-testid={testId}>
      <ArrowLeft aria-hidden="true" />
    </button>
  )
}
