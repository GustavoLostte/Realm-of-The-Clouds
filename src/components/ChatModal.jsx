import React, { useState, useRef, useEffect } from 'react'
import { MessageSquare, Send, Globe, Shield, ScrollText, X } from 'lucide-react'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n'
import './ChatModal.css'

export function ChatModal({
  isOpen,
  onClose,
  playerName = 'Soberano',
}) {
  const { t } = useTranslation()
  const [activeChannel, setActiveChannel] = useState('global')
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef(null)

  const [messages, setMessages] = useState({
    global: [
      {
        id: 'g1',
        sender: 'Lord_Aurelius',
        avatar: '👑',
        vip: 'VIP 3',
        text: '¡Reclutando miembros activos para la Alianza del Fénix celestial!',
        time: 'Hace 5m',
        isMe: false,
      },
      {
        id: 'g2',
        sender: 'Reina_Valeria',
        avatar: '🏹',
        vip: 'VIP 5',
        text: '¿Alguien sabe dónde cae la runa de velocidad para el Archimago astral?',
        time: 'Hace 3m',
        isMe: false,
      },
      {
        id: 'g3',
        sender: 'ShadowHunter',
        avatar: '🗡️',
        vip: null,
        text: 'En la mazmorra de la cripta abisal, nivel 4. ¡Acabo de conseguir dos!',
        time: 'Hace 1m',
        isMe: false,
      },
    ],
    alliance: [
      {
        id: 'a1',
        sender: 'Gran_Mariscal',
        avatar: '🛡️',
        vip: 'LÍDER',
        text: '¡El Vórtice Astral ha renovado los duelos diarios! Preparen sus escuadras.',
        time: 'Hace 12m',
        isMe: false,
      },
      {
        id: 'a2',
        sender: 'ArqueroCeleste',
        avatar: '⚔️',
        vip: null,
        text: 'Murallas y torres del feudo reforzadas al 100%.',
        time: 'Hace 4m',
        isMe: false,
      },
    ],
    system: [
      {
        id: 's1',
        sender: 'SISTEMA',
        avatar: '📜',
        vip: 'OFICIAL',
        text: '¡El comandante Gustavo alcanzó el Rango Diamante en el Vórtice Astral!',
        time: 'Hace 10m',
        isSystem: true,
      },
      {
        id: 's2',
        sender: 'SISTEMA',
        avatar: '✨',
        vip: 'EVENTO',
        text: '¡Evento de bonificación de cosecha activado por las próximas 2 horas!',
        time: 'Hace 2m',
        isSystem: true,
      },
    ],
  })

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [isOpen, activeChannel, messages])

  if (!isOpen) return null

  const handleSend = (e) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    soundManager?.playClick?.()

    const newMsg = {
      id: `msg_${Date.now()}`,
      sender: playerName,
      avatar: '🛡️',
      vip: 'TÚ',
      text: inputValue.trim(),
      time: 'Ahora',
      isMe: true,
    }

    setMessages((prev) => ({
      ...prev,
      [activeChannel]: [...prev[activeChannel], newMsg],
    }))

    setInputValue('')
  }

  const currentList = messages[activeChannel] || []

  return (
    <div className="chat-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="chat-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="chat-modal-header">
          <div className="chat-header-title-box">
            <div className="chat-header-icon-wrap">
              <MessageSquare size={22} />
            </div>
            <div>
              <h2 className="chat-modal-title">{t('chat.title') || 'Chat del Reino'}</h2>
              <p className="chat-modal-subtitle">
                {t('chat.subtitle') || 'Comunicaciones en tiempo real entre comandantes'}
              </p>
            </div>
          </div>
          <button 
            className="chat-modal-close-btn" 
            onClick={() => {
              soundManager?.playClick?.()
              onClose?.()
            }}
            aria-label={t('common.close') || 'Cerrar'}
          >
            <X size={22} />
          </button>
        </div>

        {/* Channels navigation */}
        <nav className="chat-channels-nav">
          <button
            className={`chat-channel-tab ${activeChannel === 'global' ? 'active' : ''}`}
            onClick={() => {
              soundManager?.playClick?.()
              setActiveChannel('global')
            }}
          >
            <Globe size={15} />
            <span>{t('chat.global') || 'Global'}</span>
          </button>

          <button
            className={`chat-channel-tab ${activeChannel === 'alliance' ? 'active' : ''}`}
            onClick={() => {
              soundManager?.playClick?.()
              setActiveChannel('alliance')
            }}
          >
            <Shield size={15} />
            <span>{t('chat.alliance') || 'Alianza'}</span>
          </button>

          <button
            className={`chat-channel-tab ${activeChannel === 'system' ? 'active' : ''}`}
            onClick={() => {
              soundManager?.playClick?.()
              setActiveChannel('system')
            }}
          >
            <ScrollText size={15} />
            <span>{t('chat.system') || 'Sistema'}</span>
          </button>
        </nav>

        {/* Messages Body */}
        <div className="chat-messages-body">
          {currentList.map((msg) => (
            <div 
              key={msg.id} 
              className={`chat-msg-row ${msg.isMe ? 'is-me' : ''} ${msg.isSystem ? 'is-system' : ''}`}
            >
              <div className="chat-msg-avatar">{msg.avatar}</div>
              <div className="chat-msg-content">
                <div className="chat-msg-header">
                  <span className="chat-sender-name">{msg.sender}</span>
                  {msg.vip && <span className="chat-vip-tag">{msg.vip}</span>}
                  <span className="chat-msg-time">{msg.time}</span>
                </div>
                <p className="chat-msg-text">{msg.text}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input & Send Form */}
        {activeChannel !== 'system' ? (
          <form className="chat-modal-footer" onSubmit={handleSend}>
            <input
              type="text"
              className="chat-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t('chat.placeholder') || 'Escribe un mensaje al reino...'}
              maxLength={200}
            />
            <button 
              type="submit" 
              className="chat-send-btn" 
              disabled={!inputValue.trim()}
              title="Enviar"
              aria-label="Enviar mensaje"
            >
              <Send size={18} />
            </button>
          </form>
        ) : (
          <div className="chat-modal-footer" style={{ justifyContent: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Canal oficial de anuncios del reino (Solo lectura)
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
