import React, { useState, useEffect, useRef } from 'react'
import { Bell, CheckCircle2, AlertTriangle, Info, Sparkles, X, Trash2, Coins, Gem, Trophy } from 'lucide-react'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n'
import './NotificationBell.css'

export function NotificationBell({
  notifications = [],
  onClearNotifications,
}) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const lastCountRef = useRef(notifications.length)
  const popoverRef = useRef(null)

  // Track unread counts when new notifications arrive
  useEffect(() => {
    if (notifications.length > lastCountRef.current) {
      const diff = notifications.length - lastCountRef.current
      setUnreadCount((prev) => prev + diff)
    }
    lastCountRef.current = notifications.length
  }, [notifications.length])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target) && !e.target.closest('#hud-notification-bell-btn')) {
        setIsOpen(false)
      }
    }
    document.addEventListener('pointerdown', handleClickOutside)
    return () => document.removeEventListener('pointerdown', handleClickOutside)
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
      if (!prev) {
        setUnreadCount(0)
        window.dispatchEvent(new CustomEvent('close-dropdowns', { detail: 'NotificationBell' }))
      }
      return !prev
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
    if (text.includes('arena') || text.includes('victoria') || text.includes('corona') || text.includes('trofeos')) {
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

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Ahora'
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 10) return 'Ahora'
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m`
    return `${Math.floor(minutes / 60)}h`
  }

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

      {/* Floating Notifications Popover */}
      {isOpen && (
        <div className="notification-popover-panel" role="region" aria-label="Notificaciones">
          <div className="popover-header">
            <div className="popover-title-row">
              <Bell size={16} className="popover-header-icon" />
              <span className="popover-title">{t('notifications.bellTitle') || 'Recompensas & Avisos'}</span>
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
                {notifications.slice().reverse().map((item) => (
                  <li key={item.id} className={`popover-item ${item.type || 'info'}`}>
                    <div className="popover-item-icon">
                      {getNotificationIcon(item.type, item.message)}
                    </div>
                    <div className="popover-item-body">
                      <p className="popover-item-msg">{item.message}</p>
                      <span className="popover-item-time">{formatTimeAgo(item.timestamp)}</span>
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
