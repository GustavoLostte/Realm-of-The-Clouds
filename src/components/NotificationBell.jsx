import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Bell, CheckCircle2, AlertTriangle, Info, Sparkles, X, Trash2, Coins, Gem, Trophy } from 'lucide-react'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n'
import './NotificationBell.css'

export function NotificationBell({
  notifications = [],
  onClearNotifications,
  isOpen: controlledIsOpen,
  onOpenChange,
}) {
  const { t } = useTranslation()
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const isControlled = controlledIsOpen !== undefined
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen

  const setIsOpen = (next) => {
    const val = typeof next === 'function' ? next(isOpen) : next
    if (isControlled) {
      onOpenChange?.(val)
    } else {
      setInternalIsOpen(val)
    }
  }

  const [unreadCount, setUnreadCount] = useState(0)
  const lastCountRef = useRef(notifications.length)
  const popoverRef = useRef(null)

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return (
        window.innerWidth <= 768 ||
        window.innerHeight <= 520 ||
        (window.innerWidth <= 960 && (window.matchMedia?.('(pointer: coarse)')?.matches || 'ontouchstart' in window))
      )
    }
    return false
  })

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        window.innerWidth <= 768 ||
        window.innerHeight <= 520 ||
        (window.innerWidth <= 960 && (window.matchMedia?.('(pointer: coarse)')?.matches || 'ontouchstart' in window))
      )
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    window.addEventListener('orientationchange', checkMobile)
    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('orientationchange', checkMobile)
    }
  }, [])

  // Track unread counts when new notifications arrive
  useEffect(() => {
    if (notifications.length > lastCountRef.current) {
      const diff = notifications.length - lastCountRef.current
      setUnreadCount((prev) => prev + diff)
    }
    lastCountRef.current = notifications.length
  }, [notifications.length])

  // Close on outside click (only for desktop popover)
  useEffect(() => {
    if (!isOpen || isMobile) return
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target) && !e.target.closest('#hud-notification-bell-btn')) {
        setIsOpen(false)
      }
    }
    document.addEventListener('pointerdown', handleClickOutside)
    return () => document.removeEventListener('pointerdown', handleClickOutside)
  }, [isOpen, isMobile])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        soundManager?.playClick?.()
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Listen for global dropdown close events
  useEffect(() => {
    const handleCloseDropdowns = (e) => {
      if (e.detail !== 'NotificationBell') {
        setIsOpen(false)
      }
    }
    window.addEventListener('close-dropdowns', handleCloseDropdowns)
    return () => window.removeEventListener('close-dropdowns', handleCloseDropdowns)
  }, [])

  const handleToggle = () => {
    soundManager?.playClick?.()
    setIsOpen((prev) => {
      const next = !prev
      if (next) {
        setUnreadCount(0)
        window.dispatchEvent(new CustomEvent('close-dropdowns', { detail: 'NotificationBell' }))
      }
      return next
    })
  }

  const getNotificationIcon = (type, message = '') => {
    const text = message.toLowerCase()
    if (text.includes('oro') || text.includes('gold')) {
      return <Coins size={16} className="notif-type-icon gold" />
    }
    if (text.includes('gema') || text.includes('cristal') || text.includes('gem')) {
      return <Gem size={16} className="notif-type-icon gems" />
    }
    if (text.includes('celestial') || text.includes('fragmento') || text.includes('shard')) {
      return <Sparkles size={16} className="notif-type-icon shards" />
    }
    if (text.includes('arena') || text.includes('victoria') || text.includes('corona') || text.includes('trofeos') || text.includes('duelo')) {
      return <Trophy size={16} className="notif-type-icon pvp" />
    }
    if (type === 'success') {
      return <CheckCircle2 size={16} className="notif-type-icon success" />
    }
    if (type === 'warning') {
      return <AlertTriangle size={16} className="notif-type-icon warning" />
    }
    return <Info size={16} className="notif-type-icon info" />
  }

  const getCategoryColor = (type, message = '') => {
    const text = message.toLowerCase()
    if (text.includes('oro') || text.includes('gold')) return 'gold'
    if (text.includes('gema') || text.includes('cristal') || text.includes('gem')) return 'gems'
    if (text.includes('celestial') || text.includes('fragmento') || text.includes('shard')) return 'shards'
    if (text.includes('arena') || text.includes('victoria') || text.includes('corona') || text.includes('trofeos') || text.includes('duelo')) return 'pvp'
    if (type === 'success') return 'success'
    if (type === 'warning') return 'warning'
    if (type === 'error') return 'error'
    return 'info'
  }

  const getCategoryLabel = (type, message = '') => {
    const text = message.toLowerCase()
    if (text.includes('oro') || text.includes('gold')) return 'Oro'
    if (text.includes('gema') || text.includes('cristal') || text.includes('gem')) return 'Gemas'
    if (text.includes('celestial') || text.includes('fragmento') || text.includes('shard')) return 'Fragmentos'
    if (text.includes('arena') || text.includes('victoria') || text.includes('corona') || text.includes('trofeos') || text.includes('duelo')) return 'Arena'
    if (type === 'success') return 'Éxito'
    if (type === 'warning') return 'Aviso'
    if (type === 'error') return 'Alerta'
    return 'Reino'
  }

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Ahora'
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 10) return 'Ahora'
    if (seconds < 60) return `Hace ${seconds}s`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `Hace ${minutes}m`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `Hace ${hours}h`
    const days = Math.floor(hours / 24)
    return `Hace ${days}d`
  }

  // Ensure newest notifications are always at the top
  const sortedNotifications = [...notifications].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))

  return (
    <div className="notification-bell-wrapper" ref={popoverRef}>
      {/* Round Notification Bell Button */}
      <button
        id="hud-notification-bell-btn"
        className={`notification-bell-btn ${unreadCount > 0 ? 'has-unread ring-anim' : ''} ${isOpen ? 'active' : ''}`}
        onClick={handleToggle}
        title={t('notifications.bellTooltip') || 'Registro de Reclamaciones y Notificaciones'}
        aria-label="Campana de notificaciones"
        aria-expanded={isOpen}
      >
        <Bell size={20} className="bell-svg-icon" />
        {unreadCount > 0 && (
          <span className="bell-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Mobile Modal Dialog (Portal to document.body) */}
      {isOpen && isMobile && typeof document !== 'undefined' && createPortal(
        <div 
          className="notification-modal-backdrop" 
          onClick={() => {
            soundManager?.playClick?.()
            setIsOpen(false)
          }}
          role="dialog"
          aria-modal="true"
          aria-label={t('notifications.bellTitle') || 'Recompensas & Avisos'}
        >
          <div 
            className="notification-modal-card" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="notif-modal-header">
              <div className="notif-modal-title-wrap">
                <div className="notif-modal-icon-badge">
                  <Bell size={18} className="notif-modal-header-icon" />
                </div>
                <div className="notif-modal-title-col">
                  <div className="notif-modal-title-row">
                    <h2 className="notif-modal-title">{t('notifications.bellTitle') || 'Recompensas & Avisos'}</h2>
                    {notifications.length > 0 && (
                      <span className="notif-count-pill">{notifications.length}</span>
                    )}
                  </div>
                  <span className="notif-modal-subtitle">
                    {t('notifications.historyHint') || 'Registro de actividades y cosechas del reino'}
                  </span>
                </div>
              </div>

              <div className="notif-modal-actions">
                {notifications.length > 0 && (
                  <button
                    className="notif-btn-clear"
                    onClick={() => {
                      soundManager?.playClick?.()
                      onClearNotifications?.()
                    }}
                    title="Limpiar historial"
                    aria-label="Limpiar historial"
                  >
                    <Trash2 size={14} />
                    <span className="notif-btn-clear-text">Limpiar</span>
                  </button>
                )}
                <button
                  className="notif-btn-close"
                  onClick={() => {
                    soundManager?.playClick?.()
                    setIsOpen(false)
                  }}
                  aria-label="Cerrar"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="notif-modal-body">
              {notifications.length === 0 ? (
                <div className="notif-empty-state">
                  <div className="notif-empty-halo">
                    <Sparkles size={24} className="notif-empty-sparkle" />
                  </div>
                  <h3 className="notif-empty-title">{t('notifications.noHistory') || 'Sin avisos recientes'}</h3>
                  <p className="notif-empty-desc">
                    {t('notifications.historyHint') || 'Aquí verás todo lo que coseches, reclames y consigas en tus aventuras.'}
                  </p>
                </div>
              ) : (
                <ul className="notif-list">
                  {sortedNotifications.map((item) => (
                    <li key={item.id} className={`notif-card-item ${item.type || 'info'}`}>
                      <div className={`notif-card-icon-wrap ${getCategoryColor(item.type, item.message)}`}>
                        {getNotificationIcon(item.type, item.message)}
                      </div>
                      <div className="notif-card-content">
                        <div className="notif-card-top-row">
                          <span className={`notif-card-badge ${getCategoryColor(item.type, item.message)}`}>
                            {getCategoryLabel(item.type, item.message)}
                          </span>
                          <span className="notif-card-time">{formatTimeAgo(item.timestamp)}</span>
                        </div>
                        <p className="notif-card-message">{item.message}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Modal Footer */}
            {notifications.length > 0 && (
              <div className="notif-modal-footer">
                <span className="notif-footer-summary">
                  {notifications.length} {notifications.length === 1 ? 'notificación guardada' : 'notificaciones guardadas'}
                </span>
                <button
                  className="notif-footer-close-btn"
                  onClick={() => {
                    soundManager?.playClick?.()
                    setIsOpen(false)
                  }}
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Desktop Floating Notifications Popover */}
      {isOpen && !isMobile && (
        <div className="notification-popover-panel" role="region" aria-label="Notificaciones">
          <div className="popover-header">
            <div className="popover-title-row">
              <Bell size={16} className="popover-header-icon" />
              <span className="popover-title">{t('notifications.bellTitle') || 'Recompensas & Avisos'}</span>
              {notifications.length > 0 && (
                <span className="notif-count-pill small">{notifications.length}</span>
              )}
            </div>
            <div className="popover-actions">
              {notifications.length > 0 && (
                <button
                  className="popover-clear-btn"
                  onClick={() => {
                    soundManager?.playClick?.()
                    onClearNotifications?.()
                  }}
                  title="Limpiar historial"
                  aria-label="Limpiar historial"
                >
                  <Trash2 size={14} />
                </button>
              )}
              <button
                className="popover-close-btn"
                onClick={() => {
                  soundManager?.playClick?.()
                  setIsOpen(false)
                }}
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="popover-content">
            {notifications.length === 0 ? (
              <div className="popover-empty">
                <Sparkles size={24} className="empty-sparkle" />
                <p className="empty-text">{t('notifications.noHistory') || 'No hay reclamaciones recientes'}</p>
                <span className="empty-sub">{t('notifications.historyHint') || 'Aquí verás todo lo que coseches, reclames y consigas'}</span>
              </div>
            ) : (
              <ul className="popover-list">
                {sortedNotifications.map((item) => (
                  <li key={item.id} className={`popover-item ${item.type || 'info'}`}>
                    <div className="popover-item-icon">
                      {getNotificationIcon(item.type, item.message)}
                    </div>
                    <div className="popover-item-body">
                      <div className="popover-item-header-meta">
                        <span className={`notif-category-mini ${getCategoryColor(item.type, item.message)}`}>
                          {getCategoryLabel(item.type, item.message)}
                        </span>
                        <span className="popover-item-time">{formatTimeAgo(item.timestamp)}</span>
                      </div>
                      <p className="popover-item-msg">{item.message}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
