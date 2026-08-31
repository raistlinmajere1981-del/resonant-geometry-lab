import { type ReactNode, useId } from 'react'
import { Icon } from './Icon'
import './PanelHelp.css'

type PanelHelpProps = {
  children: ReactNode
  label?: string
}

export function PanelHelp({ children, label = 'Panel help' }: PanelHelpProps) {
  const tooltipId = useId()

  return (
    <span className="panel-help">
      <button
        aria-describedby={tooltipId}
        aria-label={label}
        className="panel-help-trigger"
        type="button"
      >
        <Icon name="help" size={15} />
      </button>
      <span className="panel-help-tooltip" id={tooltipId} role="tooltip">
        {children}
      </span>
    </span>
  )
}
