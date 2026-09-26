import React, { useState, useEffect, useMemo } from 'react'
import './RankingModal.css'
import { 
  Trophy, 
  Crown, 
  Clock, 
  Swords, 
  Award,
} from 'lucide-react'
import { RANKING_CATEGORIES, getCategoryRanking } from '../data/rankingData'
import { getCurrentSeasonData } from '../data/arenaData'
import { fetchLeaderboardFromCloud, upsertPlayerToLeaderboard, getPlayerId } from '../utils/supabaseClient'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n/index.jsx'

export function RankingModal({
  isOpen,
  onClose,
  initialCategory = 'power',
  kingdomLevel = 1,
  buildings = [],
  troops = {},
  trophies = 400,
  dungeonProgress = {},
  completedNodes = [],
  unlockedTechIds = [],
  playerName = 'Comandante',
  onOpenArena,
  onOpenCampaign,
}) {
  const { t } = useTranslation()
  const [activeCategory, setActiveCategory] = useState(initialCategory)
  const [cloudPlayers, setCloudPlayers] = useState([])
  const [currentTime, setCurrentTime] = useState(() => Date.now())

  useEffect(() => {
    if (!isOpen) return
    setCurrentTime(Date.now())
    const interval = setInterval(() => setCurrentTime(Date.now()), 15000)
    return () => clearInterval(interval)
  }, [isOpen])

  const seasonData = useMemo(() => getCurrentSeasonData(currentTime), [currentTime])

  useEffect(() => {
    if (isOpen && initialCategory) {
      setActiveCategory(initialCategory)
    }
  }, [isOpen, initialCategory])

  // Support closing with Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        soundManager.playClick()
        onClose?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Prepare player data bundle
  const playerData = useMemo(() => {
    const nodesCount = Array.isArray(completedNodes) ? completedNodes.length : 0
    const floorFromNodes = nodesCount > 0 ? nodesCount + 1 : 1
    const computedFloor = dungeonProgress?.maxFloorUnlocked || dungeonProgress?.currentFloor || floorFromNodes
    const computedStars = dungeonProgress?.totalStars || (nodesCount * 3)

    const savedName = localStorage.getItem('toc_player_name') || playerName || 'Comandante'
    const savedAvatar = localStorage.getItem('toc_player_avatar') || '/assets/avatars/avatar_king.webp'

    return {
      id: getPlayerId(),
      playerName: savedName,
      level: kingdomLevel,
      buildings,
      troops,
      trophies,
      techCount: (unlockedTechIds || []).length,
      dungeonFloor: computedFloor,
      dungeonStars: computedStars,
      avatar: savedAvatar,
      leagueName: trophies >= 2800 ? 'Gran Soberano' : trophies >= 2000 ? 'Platino Real' : trophies >= 1400 ? 'Oro Veterano' : trophies >= 800 ? 'Plata Guerrero' : 'Bronce Novicio',
      arenaWins: Math.max(1, Math.floor(trophies / 24)),
    }
  }, [playerName, kingdomLevel, buildings, troops, trophies, unlockedTechIds, dungeonProgress, completedNodes])

  // Silent background sync for leaderboard with live cloud data
  useEffect(() => {
    if (!isOpen) return
    let isCancelled = false

    const syncLeaderboard = async () => {
      try {
        const [fetchRes] = await Promise.allSettled([
          fetchLeaderboardFromCloud(activeCategory, 100),
          upsertPlayerToLeaderboard(playerData),
        ])
        if (!isCancelled && fetchRes.status === 'fulfilled' && fetchRes.value?.success && Array.isArray(fetchRes.value?.data)) {
          setCloudPlayers(fetchRes.value.data)
        }
      } catch (err) {
        console.warn('Leaderboard sync error:', err)
      }
    }

    syncLeaderboard()
    return () => { isCancelled = true }
  }, [isOpen, activeCategory, playerData])

  // Calculate live ranking for selected category (fusing local + Supabase cloud)
  const { list: rankedList, playerRank, playerEntry } = useMemo(() => {
    return getCategoryRanking(activeCategory, playerData, cloudPlayers)
  }, [activeCategory, playerData, cloudPlayers])

  if (!isOpen) return null

  const handleCategoryChange = (catId) => {
    soundManager.playClick()
    setActiveCategory(catId)
  }

  // Top 3 for podium
  const top1 = rankedList[0]
  const top2 = rankedList[1]
  const top3 = rankedList[2]

  const getSovereignName = (entry) => {
    if (!entry) return ''
    if (entry.isPlayer) {
      return entry.name || t('ranking.yourSovereignty') || 'Tu Reino Soberano'
    }
    return entry.name || 'Soberano'
  }

  const getSovereignKingdom = (entry) => {
    if (!entry) return ''
    if (entry.isPlayer) {
      return t('ranking.chaosKingdom') || entry.kingdom
    }
    return entry.kingdom || 'Reino Imperial'
  }

  const getSovereignDetails = (entry) => {
    if (!entry) return ''
    if (entry.isPlayer) {
      if (activeCategory === 'power') {
        const lvText = t('profile.heroLevel', { level: playerData.level || 1 }) || `Level ${playerData.level || 1}`
        const count = (playerData.buildings || []).length
        const bldText = t('profile.statBuildings') || 'Buildings'
        return `${lvText} • ${count} ${bldText}`
      } else if (activeCategory === 'arena') {
        const lName = t(`ranking.leagues.${playerData.leagueName}`) || playerData.leagueName || 'Bronze'
        const winsText = t('arena.victories') || 'Victories'
        return `${lName} • ${playerData.arenaWins || 0} ${winsText}`
      } else {
        const fText = t('ranking.floorUnit') || 'Floor'
        return `${fText} ${playerData.dungeonFloor || 1} • ${playerData.dungeonStars || 0} ⭐`
      }
    }

    // Real cloud player stats
    return entry.subtext || ''
  }

  const formatScore = (val) => {
    if (activeCategory === 'power') {
      return `${val.toLocaleString()} ${t('ranking.powerUnit') || 'Power'}`
    } else if (activeCategory === 'arena') {
      return `${val.toLocaleString()} ${t('ranking.crownsUnit') || 'Crowns'}`
    } else {
      return `${t('ranking.floorUnit') || 'Floor'} ${val}`
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="ranking-modal-window" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ranking-modal-header">
          <div className="ranking-header-left">
            <div className="ranking-crest-box">
              <img 
                src="/assets/hud_icons/btn_ranking.webp" 
                alt="Ranking" 
                className="ranking-header-crest-img" 
                draggable="false" 
              />
            </div>
            <div>
              <span className="ranking-tag">{t('ranking.tag')}</span>
              <h2 className="ranking-title">{t('ranking.title')}</h2>
            </div>
          </div>

          <button 
            type="button"
            className="modal-close-candy-btn" 
            onClick={(e) => {
              e.stopPropagation()
              soundManager.playClick()
              onClose?.()
            }} 
            title={t('common.close')}
            aria-label={t('common.close')}
          >
            <img src="/assets/hud_icons/btn_close.webp" alt={t('common.close')} draggable="false" />
          </button>
        </div>

        {/* Season Timer Bar & Cloud Status */}
        <div className="ranking-season-bar">
          <div className="season-info-left">
            <Clock size={15} className="season-clock-svg" />
            <span>{t('ranking.seasonTimerLead') || 'Imperial Season:'} <strong>{seasonData.remainingFormatted}</strong> {t('ranking.seasonTimerTail') || 'remaining'}</span>
          </div>
          <div className="season-rewards-preview">
            <span className="season-rank-tag">
              <span className="season-live-dot" />
              {cloudPlayers.length > 0 
                ? `${cloudPlayers.length}+ ${t('ranking.liveCompetitors') || 'Soberanos en Línea'}`
                : (t('ranking.tournamentInProgress') || 'Torneo de Temporada en Curso')}
            </span>
          </div>
          <div className="season-tier-preview">
            <Award size={15} />
            <span>{t('ranking.globalRank') || 'Your Global Rank:'} <strong>#{playerRank}</strong></span>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="ranking-tabs-nav">
          {RANKING_CATEGORIES.map((cat) => (
            <button 
              key={cat.id}
              className={`ranking-cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => handleCategoryChange(cat.id)}
            >
              <img src={cat.icon} alt={cat.label} className="ranking-cat-icon" draggable="false" />
              <span>{t(`ranking.categories.${cat.id}`) || cat.label}</span>
            </button>
          ))}
        </div>

        {/* Main Scrollable Content */}
        <div className="ranking-modal-content">
          {/* Top 3 Royal Podium */}
          <div className="ranking-podium-stage">
            {/* 2nd Place */}
            {top2 && (
              <div className={`podium-pillar step-2 ${top2.isPlayer ? 'is-player' : ''}`}>
                <div className="pillar-medal silver">{t('ranking.secondPlace')}</div>
                <div className="pillar-avatar-box">
                  <img src={top2.avatar} alt={getSovereignName(top2)} className="pillar-avatar" draggable="false" />
                  {top2.isPlayer && <span className="pillar-player-badge">{t('ranking.you')}</span>}
                </div>
                <h4 className="pillar-name">{getSovereignName(top2)}</h4>
                <span className="pillar-kingdom">{getSovereignKingdom(top2)}</span>
                <span className="pillar-score silver">{formatScore(top2.score)}</span>
              </div>
            )}

            {/* 1st Place Champion */}
            {top1 && (
              <div className={`podium-pillar step-1 ${top1.isPlayer ? 'is-player' : ''}`}>
                <div className="pillar-crown-icon">
                  <Crown size={24} className="crown-svg" />
                </div>
                <div className="pillar-medal gold">{t('ranking.champion')}</div>
                <div className="pillar-avatar-box champ">
                  <img src={top1.avatar} alt={getSovereignName(top1)} className="pillar-avatar" draggable="false" />
                  {top1.isPlayer && <span className="pillar-player-badge">{t('ranking.you')}</span>}
                </div>
                <h4 className="pillar-name champ">{getSovereignName(top1)}</h4>
                <span className="pillar-kingdom">{getSovereignKingdom(top1)}</span>
                <span className="pillar-score gold">{formatScore(top1.score)}</span>
              </div>
            )}

            {/* 3rd Place */}
            {top3 && (
              <div className={`podium-pillar step-3 ${top3.isPlayer ? 'is-player' : ''}`}>
                <div className="pillar-medal bronze">{t('ranking.thirdPlace')}</div>
                <div className="pillar-avatar-box">
                  <img src={top3.avatar} alt={getSovereignName(top3)} className="pillar-avatar" draggable="false" />
                  {top3.isPlayer && <span className="pillar-player-badge">{t('ranking.you')}</span>}
                </div>
                <h4 className="pillar-name">{getSovereignName(top3)}</h4>
                <span className="pillar-kingdom">{getSovereignKingdom(top3)}</span>
                <span className="pillar-score bronze">{formatScore(top3.score)}</span>
              </div>
            )}
          </div>

          {/* Sticky Player Rank Callout Card */}
          {playerEntry && (
            <div className="ranking-player-callout">
              <div className="callout-rank-badge">
                <span className="rank-num">#{playerRank}</span>
                <span className="rank-label">{t('ranking.yourRank')}</span>
              </div>

              <div className="callout-avatar-wrap">
                <img src={playerEntry.avatar} alt="Tú" className="callout-avatar" draggable="false" />
              </div>

              <div className="callout-meta">
                <div className="callout-name-row">
                  <h4 className="callout-name">{playerEntry.name} ({t('ranking.you') || 'You'})</h4>
                  <span className="callout-tag">{t('ranking.yourActiveFortress')}</span>
                </div>
                <span className="callout-subtext">{getSovereignDetails(playerEntry)}</span>
              </div>

              <div className="callout-score-box">
                <span className="score-lead">{t('ranking.colScore') || 'Score'}:</span>
                <strong className="score-val">{formatScore(playerEntry.score)}</strong>
              </div>
            </div>
          )}

          {/* Leaderboard Table */}
          <div className="ranking-table-wrap">
            <table className="ranking-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>{t('ranking.colRank')}</th>
                  <th>{t('ranking.colSovereign')}</th>
                  <th>{t('ranking.colTitleDetails')}</th>
                  <th style={{ textAlign: 'right' }}>{t('ranking.colScore')}</th>
                </tr>
              </thead>
              <tbody>
                {rankedList.map((entry) => {
                  const isTop3 = entry.rank <= 3
                  return (
                    <tr 
                      key={entry.id} 
                      className={`ranking-row ${entry.isPlayer ? 'row-player' : ''} ${isTop3 ? `rank-${entry.rank}` : ''}`}
                    >
                      <td className="rank-col">
                        {entry.rank === 1 ? (
                          <span className="rank-badge gold">1º</span>
                        ) : entry.rank === 2 ? (
                          <span className="rank-badge silver">2º</span>
                        ) : entry.rank === 3 ? (
                          <span className="rank-badge bronze">3º</span>
                        ) : (
                          <span className="rank-badge normal">#{entry.rank}</span>
                        )}
                      </td>

                      <td className="user-col">
                        <div className="user-cell-layout">
                          <img src={entry.avatar} alt={getSovereignName(entry)} className="cell-avatar" draggable="false" />
                          <div className="cell-names">
                            <span className="cell-sovereign-name">
                              {getSovereignName(entry)} 
                              {entry.isPlayer && <span className="you-pill">{t('ranking.you')}</span>}
                              {entry.isCloudPlayer && !entry.isPlayer && <span className="live-pill">LIVE</span>}
                            </span>
                            <span className="cell-kingdom-name">{getSovereignKingdom(entry)}</span>
                          </div>
                        </div>
                      </td>

                      <td className="details-col">
                        <span className="cell-subtext">{getSovereignDetails(entry)}</span>
                      </td>

                      <td className="score-col">
                        <span className="cell-score">{formatScore(entry.score)}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="ranking-modal-footer">
          <div className="footer-quick-links">
            <button 
              type="button" 
              className="btn-footer-link"
              onClick={() => {
                soundManager.playClick()
                onClose?.()
                onOpenArena?.()
              }}
            >
              <Swords size={14} />
              <span>{t('ranking.goToArena')}</span>
            </button>
            <button 
              type="button" 
              className="btn-footer-link"
              onClick={() => {
                soundManager.playClick()
                onClose?.()
                onOpenCampaign?.()
              }}
            >
              <Trophy size={14} />
              <span>{t('ranking.goToDungeons')}</span>
            </button>
          </div>

          <button 
            type="button"
            className="btn-ranking-close"
            onClick={(e) => {
              e.stopPropagation()
              soundManager.playClick()
              onClose?.()
            }}
          >
            <span>{t('ranking.backToKingdom')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
