/**
 * ErrorBoundary — catches render errors inside a slide or 3D scene.
 * Shows a minimal fallback so one bad slide doesn't kill the whole app.
 */
import { Component, type ReactNode, type ErrorInfo } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children:  ReactNode
  slideId?:  string
  /** Optional compact mode for use inside small containers (e.g. 3D canvas) */
  compact?:  boolean
}

interface State {
  error:   Error | null
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { error: null, hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { error, hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary] slide="${this.props.slideId}"`, error, info.componentStack)
  }

  reset = () => this.setState({ error: null, hasError: false })

  render() {
    if (!this.state.hasError) return this.props.children

    if (this.props.compact) {
      return (
        <div className="flex flex-col items-center justify-center w-full h-full gap-2 p-4">
          <AlertTriangle size={20} style={{ color: 'var(--accent-amber)' }} strokeWidth={1.5} />
          <span className="text-xs text-[var(--text-muted)] text-center font-code">
            3D scene error
          </span>
          <button onClick={this.reset} className="text-2xs text-[var(--accent-cyan)] underline">
            retry
          </button>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center w-full h-full gap-4 px-8">
        <div className="flex items-center gap-3">
          <AlertTriangle size={24} strokeWidth={1.5} style={{ color: 'var(--accent-amber)' }} />
          <div>
            <div className="text-sm font-bold text-[var(--text-primary)]">
              Slide render error
              {this.props.slideId && (
                <span className="ml-2 text-2xs font-code text-[var(--text-muted)]">
                  [{this.props.slideId}]
                </span>
              )}
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5 font-code">
              {this.state.error?.message ?? 'Unknown error'}
            </div>
          </div>
        </div>
        <button
          onClick={this.reset}
          className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold transition-colors"
          style={{
            background: 'var(--accent-cyan-bg)',
            color: 'var(--accent-cyan)',
            border: '1px solid var(--accent-cyan)',
          }}
        >
          <RefreshCw size={12} strokeWidth={2} />
          Retry slide
        </button>
        <details className="w-full max-w-lg">
          <summary className="text-2xs text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-secondary)]">
            Stack trace
          </summary>
          <pre className="mt-2 text-2xs font-code text-[var(--text-muted)] bg-[var(--surface-card)] rounded p-3 overflow-auto max-h-40 border border-[var(--surface-border)]">
            {this.state.error?.stack}
          </pre>
        </details>
      </div>
    )
  }
}
