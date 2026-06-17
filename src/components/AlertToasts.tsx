import { useEffect } from 'react'
import { useAlertWatcher, type AlertToast } from '../hooks/useAlertWatcher'

const AUTO_DISMISS_MS: Record<AlertToast['kind'], number> = {
  lot: 8000,
  mesure: 8000,
  indisponible: 12000,
  stale: 12000,
}

const ICONS: Record<AlertToast['kind'], string> = {
  lot: '📦',
  mesure: '🌡️',
  indisponible: '🔌',
  stale: '📡',
}

export default function AlertToasts() {
  const { toasts, dismiss } = useAlertWatcher()

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map(toast => (
        <ToastItem key={toast.id} id={toast.id} kind={toast.kind} pays={toast.pays} title={toast.title} message={toast.message} onDismiss={dismiss} />
      ))}
    </div>
  )
}

interface ToastItemProps {
  id: string
  kind: AlertToast['kind']
  pays: string
  title: string
  message: string
  onDismiss: (id: string) => void
}

function ToastItem({ id, kind, pays, title, message, onDismiss }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), AUTO_DISMISS_MS[kind])
    return () => clearTimeout(timer)
  }, [id, kind, onDismiss])

  return (
    <div className={`toast toast-${kind}`}>
      <div className="toast-icon">{ICONS[kind]}</div>
      <div className="toast-body">
        <div className="toast-title">{title}</div>
        <div className="toast-message">{message}</div>
        <div className="toast-pays">{pays}</div>
      </div>
      <button className="toast-close" aria-label="Fermer" onClick={() => onDismiss(id)}>×</button>
    </div>
  )
}
