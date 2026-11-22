import { useId, type ReactNode } from "react"
import "./settings-controls.css"

export interface SettingRowProps {
  title: string
  description?: string
  children: ReactNode
  htmlFor?: string
  error?: string
  pending?: boolean
}

export function SettingRow({ title, description, children, htmlFor, error, pending = false }: SettingRowProps) {
  const id = useId()
  return (
    <div className="setting-row" aria-busy={pending || undefined}>
      <div className="setting-row-copy">
        <label className="setting-row-title" htmlFor={htmlFor} id={`${id}-title`}>{title}</label>
        {description && <p className="setting-row-description" id={`${id}-description`}>{description}</p>}
      </div>
      <div className="setting-row-controls" role="group" aria-labelledby={`${id}-title`}
        aria-describedby={description ? `${id}-description` : undefined}>
        {children}
        {pending && <span className="setting-row-status" role="status">正在应用…</span>}
        {error && <p className="settings-control-error" role="alert">{error}</p>}
      </div>
    </div>
  )
}

export interface SettingSectionProps { title: string; description?: string; actions?: ReactNode; children: ReactNode }

export function SettingSection({ title, description, actions, children }: SettingSectionProps) {
  const id = useId()
  return (
    <section className="setting-section" aria-labelledby={id}>
      <header className="setting-section-header">
        <div className="setting-section-heading-row">
          <h2 id={id}>{title}</h2>
          {actions && <div className="setting-section-actions">{actions}</div>}
        </div>
        {description && <p>{description}</p>}
      </header>
      <div className="setting-section-body">{children}</div>
    </section>
  )
}
