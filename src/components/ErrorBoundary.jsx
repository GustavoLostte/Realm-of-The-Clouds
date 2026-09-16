import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error?.message || String(error))
    console.error('ErrorBoundary details:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <div style={{
          padding: '24px',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid #ef4444',
          borderRadius: '12px',
          color: '#f87171',
          textAlign: 'center',
          margin: '20px auto',
          maxWidth: '550px',
          zIndex: 9999
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <img src="/assets/hud_icons/icon_warning.webp" alt="Atención" style={{ width: 22, height: 22 }} />
            Ocurrió un error en esta ventana
          </h3>
          <p style={{ margin: '0 0 15px 0', fontSize: '0.85rem', color: '#cbd5e1' }}>
            {this.state.error?.message || (typeof this.state.error === 'string' ? this.state.error : 'Error inesperado al renderizar el componente.')}
          </p>
          {import.meta.env?.DEV && this.state.error?.stack && (
            <pre style={{
              textAlign: 'left',
              fontSize: '0.72rem',
              background: 'rgba(0,0,0,0.5)',
              padding: '8px',
              borderRadius: '6px',
              overflowX: 'auto',
              maxHeight: '120px',
              color: '#fca5a5',
              marginBottom: '15px'
            }}>
              {this.state.error.stack}
            </pre>
          )}
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null })
              this.props.onReset?.()
            }}
            style={{
              padding: '8px 16px',
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Reintentar
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
