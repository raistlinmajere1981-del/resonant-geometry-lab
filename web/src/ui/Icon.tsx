export type IconName =
  | 'select'
  | 'circle'
  | 'pan'
  | 'open'
  | 'info'
  | 'help'
  | 'fit'
  | 'trash'

type IconProps = {
  name: IconName
  size?: number
}

export function Icon({ name, size = 18 }: IconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
  }

  switch (name) {
    case 'select':
      return (
        <svg {...common}>
          <path d="M5 3.8 18.2 12l-6.1 1.3-2.8 5.6L5 3.8Z" />
        </svg>
      )
    case 'circle':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="7.2" />
          <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'pan':
      return (
        <svg {...common}>
          <path d="M7.8 11.3V7.5a1.4 1.4 0 0 1 2.8 0v3.1" />
          <path d="M10.6 10.4V5.9a1.4 1.4 0 0 1 2.8 0v4.5" />
          <path d="M13.4 10.6V7.1a1.4 1.4 0 0 1 2.8 0v4.6" />
          <path d="M16.2 11.5V9.2a1.4 1.4 0 0 1 2.8 0v4.5c0 4-2.4 6.5-6.2 6.5h-.7c-2.1 0-3.5-.7-4.8-2.2l-3-3.6a1.5 1.5 0 0 1 2.1-2.1l1.4 1.1" />
        </svg>
      )
    case 'open':
      return (
        <svg {...common}>
          <path d="M3.8 7.4h6l1.8 2h8.6" />
          <path d="M4.5 6.2h5l1.7 1.9h7.3a1.5 1.5 0 0 1 1.4 1.9l-2 7.1a1.7 1.7 0 0 1-1.7 1.3H5.8a1.7 1.7 0 0 1-1.7-1.5L3 7.9a1.6 1.6 0 0 1 1.5-1.7Z" />
        </svg>
      )
    case 'info':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.2" />
          <path d="M12 10.8v5" />
          <circle cx="12" cy="7.8" r=".9" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'help':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.2" />
          <path d="M9.8 9.2a2.3 2.3 0 1 1 3.4 2c-.8.4-1.2.9-1.2 1.8v.4" />
          <circle cx="12" cy="16.8" r=".9" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'fit':
      return (
        <svg {...common}>
          <path d="M9 4.5H4.5V9" />
          <path d="M15 4.5h4.5V9" />
          <path d="M9 19.5H4.5V15" />
          <path d="M15 19.5h4.5V15" />
        </svg>
      )
    case 'trash':
      return (
        <svg {...common}>
          <path d="M5.5 7.2h13" />
          <path d="M9.1 7.2V4.8h5.8v2.4" />
          <path d="m7.2 7.2.7 11.4h8.2l.7-11.4" />
          <path d="M10.1 10.4v5" />
          <path d="M13.9 10.4v5" />
        </svg>
      )
  }
}
