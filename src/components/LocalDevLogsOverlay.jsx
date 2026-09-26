import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { 
  Bug, 
  AlertTriangle, 
  AlertOctagon, 
  Info, 
  X, 
  Trash2, 
  Copy, 
  Check, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Terminal, 
  Zap, 
  Maximize2, 
  Minimize2,
  Move
} from 'lucide-react'
import './LocalDevLogsOverlay.css'

// Check if we are running in local development or local preview
const isLocalDevEnv = () => {
  if (typeof window === 'undefined') return false
  if (import.meta.env?.DEV) return true
  const host = window.location.hostname
  const protocol = window.location.protocol
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    protocol.startsWith('tauri') ||
    host.endsWith('.local') ||
    window.localStorage?.getItem('force_dev_logs') === 'true'
  )
}

// Global buffer so logs captured before component mounts are not lost
const LOG_BUFFER_LIMIT = 250
let globalLogs = []
let globalListeners = new Set()

const notifyListeners = () => {
  globalListeners.forEach((listener) => listener([...globalLogs]))
}

const formatArgument = (arg) => {
  if (arg === null) return 'null'
  if (arg === undefined) return 'undefined'
  if (arg instanceof Error) {
    return `${arg.name}: ${arg.message}${arg.stack ? `\n${arg.stack}` : ''}`
  }
  if (typeof arg === 'object') {
    try {
      return JSON.stringify(arg, null, 2)
    } catch {
      return Object.prototype.toString.call(arg)
    }
  }
  return String(arg)
}

const addLogEntry = (type, message, details = null, source = null) => {
  const timestamp = new Date()
  const timeStr = timestamp.toLocaleTimeString() + '.' + String(timestamp.getMilliseconds()).padStart(3, '0')
  
  // Deduplicate rapid consecutive errors (e.g. inside requestAnimationFrame loop)
  const last = globalLogs[globalLogs.length - 1]
  if (last && last.type === type && last.message === message) {
    last.repeats = (last.repeats || 1) + 1
    last.lastSeen = timeStr
    notifyListeners()
    return
  }

  const newEntry = {
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    type, // 'error' | 'warn' | 'log'
    message: String(message),
    details: details ? String(details) : null,
    source: source ? String(source) : null,
    time: timeStr,
    timestamp: timestamp.getTime(),
    repeats: 1
  }

  globalLogs.push(newEntry)
  if (globalLogs.length > LOG_BUFFER_LIMIT) {
    globalLogs.shift()
  }

  notifyListeners()
}

// Setup Global Error & Console Interceptors ONCE
let interceptorsInitialized = false
const initializeInterceptors = () => {
  if (interceptorsInitialized || typeof window === 'undefined') return
  interceptorsInitialized = true

  // 1. Unhandled JavaScript Runtime Errors
  window.addEventListener('error', (event) => {
    // Check if it's a resource loading error (e.g., <img>, <audio>, <video>)
    if (event.target && (event.target.tagName === 'IMG' || event.target.tagName === 'AUDIO' || event.target.tagName === 'VIDEO' || event.target.tagName === 'SCRIPT')) {
      const src = event.target.src || event.target.currentSrc || 'recurso desconocido'
      if (typeof src === 'string' && src.startsWith('data:image')) return
      addLogEntry(
        'error', 
        `Error al cargar recurso (${event.target.tagName}): ${src}`, 
        null, 
        event.target.tagName
      )
      return
    }

    const message = event.message || (event.error ? event.error.message : 'Error desconocido de Javascript')
    const stack = event.error ? event.error.stack : null
    const source = event.filename ? `${event.filename}:${event.lineno}:${event.colno}` : null

    addLogEntry('error', message, stack, source)
  }, true) // use capture to catch resource 404 errors

  // 2. Unhandled Promise Rejections (e.g., async fetch 404, audio play() failure)
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    let message = 'Promesa rechazada no capturada (Unhandled Rejection)'
    let stack = null

    if (reason instanceof Error) {
      message = reason.message
      stack = reason.stack
    } else if (typeof reason === 'string') {
      message = reason
    } else if (reason) {
      try {
        message = JSON.stringify(reason)
      } catch {
        message = String(reason)
      }
    }

    addLogEntry('error', `[Unhandled Promise] ${message}`, stack)
  })

  // 3. Proxy console.error
  const originalConsoleError = console.error
  console.error = function (...args) {
    originalConsoleError.apply(console, args)
    const formatted = args.map(formatArgument).join(' ')
    // Extract stack if first/any arg has it
    let stack = null
    const errArg = args.find(a => a instanceof Error)
    if (errArg && errArg.stack) {
      stack = errArg.stack
    }
    addLogEntry('error', formatted, stack)
  }

  // 4. Proxy console.warn
  const originalConsoleWarn = console.warn
  console.warn = function (...args) {
    originalConsoleWarn.apply(console, args)
    const formatted = args.map(formatArgument).join(' ')
    addLogEntry('warn', formatted)
  }

  // 5. Proxy console.info
  const originalConsoleInfo = console.info
  console.info = function (...args) {
    originalConsoleInfo.apply(console, args)
    const formatted = args.map(formatArgument).join(' ')
    addLogEntry('log', formatted)
  }
}

// Auto-run interceptors immediately
if (typeof window !== 'undefined') {
  initializeInterceptors()
}

export function LocalDevLogsOverlay() {
  const isEnabled = useMemo(() => isLocalDevEnv(), [])
  const [isOpen, setIsOpen] = useState(false)
  const [logs, setLogs] = useState(() => [...globalLogs])
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'error' | 'warn' | 'log'
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedIds, setExpandedIds] = useState({})
  const [copied, setCopied] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  const [pillPos, setPillPos] = useState({ x: 16, y: 56 }) // top-left under menu
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0, moved: false })
  const logListEndRef = useRef(null)

  // Subscribe to log updates
  useEffect(() => {
    if (!isEnabled) return
    const updateLogs = (newLogs) => setLogs(newLogs)
    globalListeners.add(updateLogs)
    return () => globalListeners.delete(updateLogs)
  }, [isEnabled])

  // Keyboard shortcut: Toggle with F2 or Backtick (`)
  useEffect(() => {
    if (!isEnabled) return
    const handleKeyDown = (e) => {
      // Toggle console with F2 or Alt+L
      if (e.key === 'F2' || (e.altKey && (e.key === 'l' || e.key === 'L'))) {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
      // Close with Escape
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isEnabled, isOpen])

  // Auto-scroll when new logs arrive and drawer is open
  useEffect(() => {
    if (isOpen && autoScroll && logListEndRef.current) {
      logListEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, isOpen, autoScroll])

  // Aggregate counters
  const counts = useMemo(() => {
    let err = 0
    let warn = 0
    let log = 0
    logs.forEach(item => {
      if (item.type === 'error') err += (item.repeats || 1)
      else if (item.type === 'warn') warn += (item.repeats || 1)
      else log += (item.repeats || 1)
    })
    return { err, warn, log, total: err + warn + log }
  }, [logs])

  // Filtered log list
  const filteredLogs = useMemo(() => {
    return logs.filter(item => {
      if (activeTab !== 'all' && item.type !== activeTab) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesMsg = item.message.toLowerCase().includes(q)
        const matchesDetails = item.details && item.details.toLowerCase().includes(q)
        const matchesSource = item.source && item.source.toLowerCase().includes(q)
        if (!matchesMsg && !matchesDetails && !matchesSource) return false
      }
      return true
    })
  }, [logs, activeTab, searchQuery])

  // Toggle stack trace view
  const toggleExpand = (id) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Clear logs
  const handleClearLogs = () => {
    globalLogs = []
    setLogs([])
  }

  // Copy logs to clipboard
  const handleCopyLogs = () => {
    const reportHeader = [
      `=== REALM OF KINGDOM - LOGS LOCALES (${new Date().toLocaleString()}) ===`,
      `Ambiente: ${window.location.href}`,
      `Resumen: ${counts.err} Errores | ${counts.warn} Advertencias | ${counts.log} Logs`,
      `--------------------------------------------------\n`
    ].join('\n')

    const reportEntries = filteredLogs.map((l) => {
      const tag = l.type.toUpperCase()
      const rep = l.repeats > 1 ? ` (x${l.repeats})` : ''
      let text = `[${l.time}] [${tag}]${rep} ${l.message}`
      if (l.source) text += `\n  Origen: ${l.source}`
      if (l.details) text += `\n  Detalles/Stack:\n${l.details}`
      return text
    }).join('\n\n')

    const fullText = `${reportHeader}${reportEntries}`
    navigator.clipboard?.writeText(fullText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      // Fallback
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // Test error trigger
  const handleTriggerTestLogs = () => {
    console.warn('[Test Debug] Esto es una advertencia de prueba para el visor de logs.')
    console.error(new Error('[Test Debug] Error de prueba generado para verificar el visor local.'))
  }

  // Dragging handlers for the floating badge
  const handlePointerDown = (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return // left click only
    setIsDragging(true)
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: pillPos.x,
      initialY: pillPos.y,
      moved: false
    }
  }

  const handlePointerMove = useCallback((e) => {
    if (!isDragging) return
    const dx = e.clientX - dragStartRef.current.startX
    const dy = e.clientY - dragStartRef.current.startY
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragStartRef.current.moved = true
    }
    const maxX = Math.max(window.innerWidth - 180, 20)
    const maxY = Math.max(window.innerHeight - 60, 20)
    const nextX = Math.min(Math.max(dragStartRef.current.initialX + dx, 10), maxX)
    const nextY = Math.min(Math.max(dragStartRef.current.initialY + dy, 10), maxY)
    setPillPos({ x: nextX, y: nextY })
  }, [isDragging])

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
      return () => {
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerup', handlePointerUp)
      }
    }
  }, [isDragging, handlePointerMove, handlePointerUp])

  const handlePillClick = () => {
    if (dragStartRef.current.moved) {
      // Was a drag, do not open
      return
    }
    setIsOpen(prev => !prev)
  }

  if (!isEnabled) {
    return null
  }

  const hasErrors = counts.err > 0
  const hasWarnings = counts.warn > 0 && !hasErrors

  return (
    <>
      {/* Floating Collapsible Log Trigger Pill */}
      <div 
        className={`dev-logs-floating-pill ${hasErrors ? 'pill-has-errors' : ''} ${hasWarnings ? 'pill-has-warnings' : ''} ${isOpen ? 'pill-active' : ''}`}
        style={{ left: `${pillPos.x}px`, top: `${pillPos.y}px` }}
        onPointerDown={handlePointerDown}
        onClick={handlePillClick}
        title="Consola de Logs Local (Presiona F2 o haz clic para abrir/cerrar. Arrastra para mover)"
      >
        <div className="pill-drag-handle" title="Arrastrar">
          <Move size={12} className="pill-drag-icon" />
        </div>
        
        <div className="pill-status-dot" />
        
        <span className="pill-title">
          {hasErrors ? <AlertOctagon size={14} className="pill-icon-err" /> : <Bug size={14} className="pill-icon-bug" />}
          <span>Logs</span>
        </span>

        <div className="pill-counters">
          {counts.err > 0 && (
            <span className="pill-badge pill-badge-err" title="Errores">{counts.err}</span>
          )}
          {counts.warn > 0 && (
            <span className="pill-badge pill-badge-warn" title="Advertencias">{counts.warn}</span>
          )}
          {counts.err === 0 && counts.warn === 0 && (
            <span className="pill-badge pill-badge-ok">0</span>
          )}
        </div>
      </div>

      {/* Expanded Dev Console Modal / Drawer */}
      {isOpen && (
        <div className="dev-logs-modal-overlay">
          <div className="dev-logs-modal-container">
            {/* Modal Header */}
            <div className="dev-logs-header">
              <div className="dev-logs-title-wrap">
                <div className="dev-logs-live-badge">
                  <span className="live-dot" /> LIVE DEV CONSOLE
                </div>
                <span className="dev-logs-subtitle">Errores & Alertas de Juego (F2 para ocultar)</span>
              </div>

              <div className="dev-logs-header-actions">
                <button 
                  className="dev-logs-btn dev-logs-btn-test" 
                  onClick={handleTriggerTestLogs}
                  title="Generar log y error de prueba"
                >
                  <Zap size={14} /> Probar
                </button>

                <button 
                  className={`dev-logs-btn dev-logs-btn-copy ${copied ? 'copied' : ''}`}
                  onClick={handleCopyLogs}
                  title="Copiar reporte al portapapeles"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
                </button>

                <button 
                  className="dev-logs-btn dev-logs-btn-clear" 
                  onClick={handleClearLogs}
                  title="Limpiar todos los logs"
                >
                  <Trash2 size={14} /> Limpiar
                </button>

                <button 
                  className="dev-logs-btn dev-logs-btn-close" 
                  onClick={() => setIsOpen(false)}
                  title="Cerrar ventana"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Sub-Header / Filters Bar */}
            <div className="dev-logs-filter-bar">
              <div className="dev-logs-tabs">
                <button 
                  className={`dev-logs-tab ${activeTab === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveTab('all')}
                >
                  Todos ({counts.total})
                </button>
                <button 
                  className={`dev-logs-tab tab-err ${activeTab === 'error' ? 'active' : ''}`}
                  onClick={() => setActiveTab('error')}
                >
                  <AlertOctagon size={13} /> Errores ({counts.err})
                </button>
                <button 
                  className={`dev-logs-tab tab-warn ${activeTab === 'warn' ? 'active' : ''}`}
                  onClick={() => setActiveTab('warn')}
                >
                  <AlertTriangle size={13} /> Advertencias ({counts.warn})
                </button>
                <button 
                  className={`dev-logs-tab tab-log ${activeTab === 'log' ? 'active' : ''}`}
                  onClick={() => setActiveTab('log')}
                >
                  <Info size={13} /> Info ({counts.log})
                </button>
              </div>

              <div className="dev-logs-search-wrap">
                <Search size={14} className="search-icon" />
                <input 
                  type="text" 
                  className="dev-logs-search-input"
                  placeholder="Filtrar por texto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Log Entries Viewport */}
            <div className="dev-logs-viewport">
              {filteredLogs.length === 0 ? (
                <div className="dev-logs-empty-state">
                  <div className="empty-icon-wrap">
                    <Check size={28} />
                  </div>
                  <h4>No hay logs que coincidan</h4>
                  <p>
                    {logs.length === 0 
                      ? 'No se ha detectado ningún error en esta sesión. ¡El juego corre sin problemas!' 
                      : 'No hay entradas con el filtro o búsqueda seleccionada.'}
                  </p>
                </div>
              ) : (
                <div className="dev-logs-list">
                  {filteredLogs.map((entry) => {
                    const isExpanded = Boolean(expandedIds[entry.id])
                    const hasDetails = Boolean(entry.details || entry.source)

                    return (
                      <div key={entry.id} className={`dev-log-row dev-log-${entry.type}`}>
                        <div className="dev-log-main-line">
                          {/* Timestamp */}
                          <span className="dev-log-time">{entry.time}</span>

                          {/* Level Tag */}
                          <span className={`dev-log-type-tag tag-${entry.type}`}>
                            {entry.type === 'error' && <AlertOctagon size={12} />}
                            {entry.type === 'warn' && <AlertTriangle size={12} />}
                            {entry.type === 'log' && <Info size={12} />}
                            {entry.type.toUpperCase()}
                          </span>

                          {/* Repeated Counter */}
                          {entry.repeats > 1 && (
                            <span className="dev-log-repeats-badge">
                              x{entry.repeats}
                            </span>
                          )}

                          {/* Message Content */}
                          <span className="dev-log-message">
                            {entry.message}
                          </span>

                          {/* Expand Details Trigger */}
                          {hasDetails && (
                            <button 
                              className="dev-log-toggle-btn"
                              onClick={() => toggleExpand(entry.id)}
                              title={isExpanded ? 'Ocultar Stack / Detalles' : 'Ver Stack / Detalles'}
                            >
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              <span>{isExpanded ? 'Ocultar' : 'Detalles'}</span>
                            </button>
                          )}
                        </div>

                        {/* Collapsible Stack / Details */}
                        {isExpanded && hasDetails && (
                          <div className="dev-log-details-block">
                            {entry.source && (
                              <div className="dev-log-source-item">
                                <strong>Origen:</strong> <code>{entry.source}</code>
                              </div>
                            )}
                            {entry.details && (
                              <pre className="dev-log-stack-trace">
                                {entry.details}
                              </pre>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  <div ref={logListEndRef} />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="dev-logs-footer">
              <div className="footer-left">
                <label className="autoscroll-toggle">
                  <input 
                    type="checkbox" 
                    checked={autoScroll} 
                    onChange={(e) => setAutoScroll(e.target.checked)} 
                  />
                  <span>Auto-scroll</span>
                </label>
                <span className="footer-stats">
                  Mostrando {filteredLogs.length} de {counts.total} entradas
                </span>
              </div>
              <div className="footer-right">
                <span className="footer-tip">Tip: Atajo <code>F2</code> para abrir/cerrar rápido</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
