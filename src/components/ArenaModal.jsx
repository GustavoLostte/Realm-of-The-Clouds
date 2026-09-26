import React, { useState, useEffect } from 'react'
import './ArenaModal.css'
import { 
  Shield, 
  Clock, 
  RefreshCw, 
  Flame,
  CheckCircle2,
  Swords,
  HelpCircle,
  Sparkles,
  Zap,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { 
  ARENA_LEAGUES, 
  getLeagueForTrophies, 
  BASE_LEADERBOARD, 
  HONOR_SHOP_ITEMS,
  getCurrentSeasonData,
  calculateTrophyReset,
  getSeasonRewardsForLeague,
} from '../data/arenaData'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n/index.jsx'

export function ArenaModal({
  isOpen,
  onClose,
  initialTab = 'pvp',
  trophies = 250,
  tickets = 3,
  honorPoints = 150,
  peaceShieldUntil = 0,
  rivals = [],
  onRefreshRivals,
  onStartBattle,
  defenseLog = [],
  onRevengeBattle,
  onBuyTickets,
  onBuyHonorItem,
  ownedRelicIds = [],
  troops = {},
  kingdomLevel = 1,
}) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState(initialTab) // 'pvp' | 'ranking' | 'defense' | 'shop'
  const [refreshing, setRefreshing] = useState(false)
  const [showGuide, setShowGuide] = useState(true)
  const [currentTime, setCurrentTime] = useState(() => Date.now())

  const [showSeasonOverview, setShowSeasonOverview] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setCurrentTime(Date.now())
    if (initialTab) {
      setActiveTab(initialTab)
    }
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 10000)
    return () => clearInterval(interval)
  }, [isOpen, initialTab])

  if (!isOpen) return null

  const currentLeague = getLeagueForTrophies(trophies)
  const seasonData = getCurrentSeasonData(currentTime)
  const predictedResetTrophies = calculateTrophyReset(trophies)
  const isShieldActive = peaceShieldUntil > currentTime
  const shieldTimeLeftMin = isShieldActive ? Math.ceil((peaceShieldUntil - currentTime) / 60000) : 0

  // Military strength calculations
  const playerInfantry = troops?.infantry || 0
  const playerArchers = troops?.archers || 0
  const playerCommanders = troops?.commander || 0
  const playerMilitaryPower = (playerInfantry * 10) + (playerArchers * 12) + (playerCommanders * 50) + (kingdomLevel * 80)
  const playerBreachBonus = Math.min(25, (playerInfantry * 2) + (playerCommanders * 10))

  // Calculate next league progress
  const currentLeagueIdx = ARENA_LEAGUES.findIndex((l) => l.id === currentLeague.id)
  const nextLeague = ARENA_LEAGUES[currentLeagueIdx + 1] || null
  const leagueProgress = nextLeague
    ? Math.min(100, Math.max(0, ((trophies - currentLeague.minTrophies) / (nextLeague.minTrophies - currentLeague.minTrophies)) * 100))
    : 100

  // Insert player into leaderboard dynamically
  const sortedLeaderboard = [...BASE_LEADERBOARD]
  const playerEntry = {
    rank: 0,
    name: t('arena.yourSovereignty'),
    kingdom: t('arena.chaosKingdom'),
    trophies,
    leagueId: currentLeague.id,
    avatar: '/assets/avatars/avatar_paladin.webp',
    wins: Math.max(12, Math.round(trophies / 20)),
    isPlayer: true,
  }

  // Find placement
  let playerRank = 1
  for (let i = 0; i < sortedLeaderboard.length; i++) {
    if (trophies < sortedLeaderboard[i].trophies) {
      playerRank = sortedLeaderboard[i].rank + 1
    }
  }
  playerEntry.rank = playerRank

  const handleTabClick = (tab) => {
    soundManager.playClick()
    setActiveTab(tab)
  }

  const handleRefreshClick = () => {
    soundManager.playClick()
    setRefreshing(true)
    onRefreshRivals?.()
    setTimeout(() => setRefreshing(false), 400)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card arena-modal-window" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="arena-modal-header">
          <div className="arena-header-info">
            <div className="arena-header-icon-box">
              <img 
                src="/assets/hud_icons/btn_arena.webp" 
                alt={t('arena.title')} 
                className="arena-trophy-img" 
                draggable="false" 
              />
            </div>
            <div>
              <div className="arena-header-title-row">
                <h2 className="arena-header-title">{t('arena.title')}</h2>
                <span className="league-pill-badge" style={{ background: currentLeague.gradient }}>
                  <img src={currentLeague.image} alt={t(`arenaItems.leagues.${currentLeague.id}`) || currentLeague.name} className="league-pill-img" />
                  {t(`arenaItems.leagues.${currentLeague.id}`) || currentLeague.name}
                </span>
              </div>
              <p className="arena-header-sub">{t('arena.headerSub')}</p>
            </div>
          </div>

          <div className="arena-header-right">
            {/* Tickets Indicator */}
            <div className="arena-tickets-pill" title={t('arena.ticketsTooltip')}>
              <img src="/assets/hud_icons/btn_army.webp" alt={t('arena.assaults')} className="arena-pill-icon" />
              <span className="ticket-label-text">{t('arena.assaults')}</span>
              <span className="ticket-count">{tickets} / 3</span>
              {tickets < 3 && (
                <button 
                  className="btn-buy-ticket" 
                  onClick={onBuyTickets}
                  title={t('arena.buyTicketBtn')}
                >
                  +
                </button>
              )}
            </div>

            {/* Honor Coins Pill */}
            <div className="arena-honor-pill" title={t('arena.honorPointsLabel')}>
              <img src="/assets/hud_icons/btn_ranking.webp" alt={t('arena.honor')} className="arena-pill-icon" />
              <span className="honor-val">{honorPoints} {t('arena.honor')}</span>
            </div>

            <button className="modal-close-candy-btn" onClick={onClose} title={t('common.close')}>
              <img src="/assets/hud_icons/btn_close.webp" alt={t('common.close')} draggable="false" />
            </button>
          </div>
        </header>

        {/* Peace Shield Bar if Active */}
        {isShieldActive && (
          <div className="peace-shield-active-banner">
            <Shield size={16} className="shield-icon-anim" />
            <span>{t('arena.shieldActive', { min: shieldTimeLeftMin })}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <nav className="arena-nav-tabs">
          <button 
            className={`arena-nav-tab ${activeTab === 'pvp' ? 'active' : ''}`}
            onClick={() => handleTabClick('pvp')}
            title={t('arena.tabRivals')}
          >
            <img src="/assets/hud_icons/btn_army.webp" alt={t('arena.tabRivals')} className="arena-tab-img" />
            <span className="arena-tab-text-full">{t('arena.tabRivals')}</span>
            <span className="arena-tab-text-mobile">{t('arena.tabRivals')}</span>
            {tickets > 0 && <span className="tab-bubble-alert">{tickets}</span>}
          </button>

          <button 
            className={`arena-nav-tab ${activeTab === 'ranking' ? 'active' : ''}`}
            onClick={() => handleTabClick('ranking')}
            title={t('arena.trophiesLabel')}
          >
            <img src="/assets/hud_icons/btn_ranking.webp" alt={t('arena.trophiesLabel')} className="arena-tab-img" />
            <span className="arena-tab-text-full">{t('arena.trophiesLabel')}</span>
            <span className="arena-tab-text-mobile">{t('arena.trophiesLabel')}</span>
          </button>

          <button 
            className={`arena-nav-tab ${activeTab === 'defense' ? 'active' : ''}`}
            onClick={() => handleTabClick('defense')}
            title={t('arena.tabLog')}
          >
            <img src="/assets/hud_icons/btn_quests.webp" alt={t('arena.tabLog')} className="arena-tab-img" />
            <span className="arena-tab-text-full">{t('arena.tabLog')}</span>
            <span className="arena-tab-text-mobile">{t('arena.tabLog')}</span>
            {defenseLog.some((d) => !d.revengeClaimed) && <span className="tab-bubble-revenge">!</span>}
          </button>

          <button 
            className={`arena-nav-tab ${activeTab === 'shop' ? 'active' : ''}`}
            onClick={() => handleTabClick('shop')}
            title={t('arena.tabHonorShop')}
          >
            <img src="/assets/hud_icons/btn_inventory.webp" alt={t('arena.tabHonorShop')} className="arena-tab-img" />
            <span className="arena-tab-text-full">{t('arena.tabHonorShop')}</span>
            <span className="arena-tab-text-mobile">{t('arena.tabHonorShop')}</span>
          </button>
        </nav>

        {/* Modal Content */}
        <div className="arena-tab-content">
          {/* TAB 1: PVP MATCHMAKING SIEGES */}
          {activeTab === 'pvp' && (
            <div className="pvp-view">
              {/* Current League Banner Hero */}
              <div className="league-hero-card" style={{ background: currentLeague.gradient }}>
                <div className="league-hero-left">
                  <div className="league-hero-icon-pedestal">
                    <img src={currentLeague.image} alt={t(`arenaItems.leagues.${currentLeague.id}`) || currentLeague.name} className="league-hero-img" />
                  </div>
                  <div>
                    <h3 className="league-hero-name">{t(`arenaItems.leagues.${currentLeague.id}`) || currentLeague.name} ({trophies} {t('arena.crowns')})</h3>
                    <p className="league-hero-desc">{t(`arena.leagueDescriptions.${currentLeague.id}`) || currentLeague.description}</p>
                    <span className="league-hero-perk">{t('arena.lootMultiplier')} +{Math.round((currentLeague.rewardMultiplier - 1) * 100)}%</span>
                  </div>
                </div>

                <div className="league-hero-progress-block">
                  <div className="league-progress-label">
                    <span>{nextLeague ? `${t('arena.nextLeague')} ${t(`arenaItems.leagues.${nextLeague.id}`) || nextLeague.name}` : t('arena.maxLeague')}</span>
                    <span>{nextLeague ? `${trophies} / ${nextLeague.minTrophies}` : `${trophies}`} {t('arena.crowns')}</span>
                  </div>
                  <div className="league-progress-track">
                    <div className="league-progress-fill" style={{ width: `${leagueProgress}%` }} />
                  </div>
                </div>
              </div>

              {/* HOW TO ATTACK: VISUAL QUICK GUIDE BANNER */}
              <div className="arena-how-to-attack-banner">
                <div className="how-to-attack-top-row">
                  <div className="how-to-title-group">
                    <div className="how-to-badge">
                      <Swords size={16} className="swords-anim" />
                      <span>{t('arena.howToAttackTitle')}</span>
                    </div>
                    <span className="how-to-tagline">
                      {t('arena.howToAttackDesc')}
                    </span>
                  </div>
                  <button 
                    type="button"
                    className="btn-toggle-guide" 
                    onClick={() => setShowGuide((prev) => !prev)}
                    title={showGuide ? t('arena.hideGuide') : t('arena.showGuide')}
                  >
                    <HelpCircle size={14} />
                    <span>{showGuide ? t('arena.hideGuide') : t('arena.showGuide')}</span>
                    {showGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {showGuide && (
                  <div className="how-to-body-wrapper">
                    <div className="how-to-steps-row">
                      <div className="how-to-step-card step-1">
                        <div className="step-number-badge">1</div>
                        <div className="step-card-text">
                          <span className="step-card-title">{t('arena.chooseRival')}</span>
                          <span className="step-card-desc">{t('arena.step1Desc')}</span>
                        </div>
                      </div>

                      <div className="how-to-step-connector">➔</div>

                      <div className="how-to-step-card step-2">
                        <div className="step-number-badge">2</div>
                        <div className="step-card-text">
                          <span className="step-card-title">{t('arena.step2Title')}</span>
                          <span className="step-card-desc">{t('arena.step2Desc')}</span>
                        </div>
                      </div>

                      <div className="how-to-step-connector">➔</div>

                      <div className="how-to-step-card step-3">
                        <div className="step-number-badge">3</div>
                        <div className="step-card-text">
                          <span className="step-card-title">{t('arena.lootBuildings')}</span>
                          <span className="step-card-desc">{t('arena.step3Desc')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="how-to-reassurance-note">
                      <Sparkles size={14} className="sparkle-gold-icon" />
                      <span>
                        <strong>{t('arena.troopsSafe')}</strong> {t('arena.troopsSafeDesc')}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* SOVEREIGN'S MILITARY POWER STATUS STRIP */}
              <div className="player-military-power-strip">
                <div className="military-left">
                  <div className="military-shield-box">
                    <Shield size={18} color="#fbbf24" />
                  </div>
                  <div className="military-text">
                    <span className="military-label">{t('arena.yourSiegeForce')}</span>
                    <strong className="military-power-val">⚔️ {playerMilitaryPower} {t('arena.powerUnit')} ({t('common.levelShort')} {kingdomLevel})</strong>
                  </div>
                </div>

                <div className="military-chips-row">
                  <span className="military-chip" title={t('arena.infantry')}>
                    <img src="/assets/hud_icons/btn_army.webp" alt={t('arena.infantry')} className="chip-icon" />
                    {playerInfantry} {t('arena.infantry')}
                  </span>
                  {playerArchers > 0 && (
                    <span className="military-chip" title={t('arena.archers')}>
                      <img src="/assets/buildings/archer_tower/archer_tower.webp" alt={t('arena.archers')} className="chip-icon" />
                      {playerArchers} {t('arena.archers')}
                    </span>
                  )}
                  {playerCommanders > 0 && (
                    <span className="military-chip" title={t('arena.commanders')}>
                      <img src="/assets/avatars/avatar_paladin.webp" alt={t('arena.commanders')} className="chip-icon" />
                      {playerCommanders} {t('arena.commanders')}
                    </span>
                  )}
                  <span className="military-chip bonus" title={t('arena.breachSuccess')}>
                    <Zap size={13} color="#fef08a" />
                    +{playerBreachBonus}% {t('arena.breachSuccess')}
                  </span>
                </div>
              </div>

              {/* Matchmaking Rivals Header */}
              <div className="rivals-section-header">
                <div>
                  <h3 className="section-title">{t('arena.rivalCitadels')}</h3>
                  <p className="section-sub">{t('arena.rivalsSectionSub')}</p>
                </div>
                <button 
                  className={`btn-refresh-rivals ${refreshing ? 'spinning' : ''}`}
                  onClick={handleRefreshClick}
                  title={t('arena.newRivals')}
                >
                  <RefreshCw size={14} />
                  <span>{t('arena.newRivals')}</span>
                </button>
              </div>

              {/* Rivals Cards Grid */}
              <div className="rivals-grid">
                {rivals.map((rival) => {
                  const rivalInfantry = rival.defense?.infantry || 0
                  const rivalArchers = rival.defense?.archers || 0
                  const rivalMages = rival.defense?.mages || 0
                  const rivalPower = (rivalInfantry * 10) + (rivalArchers * 12) + (rivalMages * 20) + ((rival.level || 1) * 75)

                  let advantageTag = { text: t('arena.advantage'), type: 'advantage', color: '#22c55e', desc: t('arena.advantageDesc') }
                  if (playerMilitaryPower >= rivalPower) {
                    advantageTag = { text: t('arena.advantage'), type: 'advantage', color: '#22c55e', desc: t('arena.advantageDesc') }
                  } else if (playerMilitaryPower >= rivalPower * 0.75) {
                    advantageTag = { text: t('arena.balanced'), type: 'balanced', color: '#eab308', desc: t('arena.balancedDesc') }
                  } else {
                    advantageTag = { text: t('arena.danger'), type: 'danger', color: '#ef4444', desc: t('arena.dangerDesc') }
                  }

                  const rivalName = rival.profileKey ? (t(`arena.rivals.${rival.profileKey}.name`) || rival.name) : rival.name
                  const rivalKingdom = rival.profileKey ? (t(`arena.rivals.${rival.profileKey}.kingdom`) || rival.kingdom) : rival.kingdom

                  return (
                    <div key={rival.id} className="rival-card">
                      <div className="rival-card-header">
                        <span className="diff-badge" style={{ background: rival.difficulty.color }}>
                          {t(`arena.diff_${rival.difficulty.id}`) || rival.difficulty.tag}
                        </span>
                        <span className="rival-trophy-tag">
                          <img src="/assets/hud_icons/btn_ranking.webp" alt={t('arena.crowns')} className="tag-res-icon" />
                          {rival.trophies}
                        </span>
                      </div>

                      <div className="rival-body">
                        <div className="rival-avatar-box">
                          <img src={rival.avatar} alt={rivalName} className="rival-avatar" />
                        </div>
                        <div className="rival-meta">
                          <h4 className="rival-name">{rivalName}</h4>
                          <span className="rival-kingdom-title">{rivalKingdom} ({t('common.levelShort')} {rival.level})</span>
                        </div>
                      </div>

                      {/* Power Comparison & Advantage Row */}
                      <div className="rival-power-row">
                        <div className="rival-power-meta">
                          <span className="power-label">{t('arena.defensivePower')}</span>
                          <span className="power-number">🛡️ {rivalPower} {t('arena.powerUnit')}</span>
                        </div>
                        <span 
                          className={`rival-advantage-pill ${advantageTag.type}`}
                          style={{ borderColor: advantageTag.color, color: advantageTag.color }}
                          title={advantageTag.desc}
                        >
                          <span className="advantage-dot" style={{ background: advantageTag.color }} />
                          {advantageTag.text}
                        </span>
                      </div>

                      {/* Defense Preview */}
                      <div className="rival-defense-preview">
                        <span className="preview-label">{t('arena.defensiveGarrison')}</span>
                        <div className="preview-chips">
                          <span>
                            <img src="/assets/hud_icons/btn_army.webp" alt={t('arena.infantry')} className="chip-res-icon" />
                            {rival.defense.infantry} {t('arena.infantry')}
                          </span>
                          <span>
                            <img src="/assets/buildings/archer_tower/archer_tower.webp" alt={t('arena.archers')} className="chip-res-icon" />
                            {rival.defense.archers} {t('arena.archers')}
                          </span>
                          {rival.defense.mages > 0 && (
                            <span>
                              <img src="/assets/avatars/avatar_mage.webp" alt={t('arena.mages')} className="chip-res-icon" />
                              {rival.defense.mages} {t('arena.mages')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Rewards in play */}
                      <div className="rival-rewards-row">
                        <div className="reward-col">
                          <span className="col-label">{t('arena.assaultLoot')}</span>
                          <div className="reward-pills-wrap">
                            <span className="col-val win">
                              <img src="/assets/hud_icons/btn_ranking.webp" alt={t('arena.crowns')} className="reward-res-icon" />
                              +{rival.rewards.trophies}
                            </span>
                            <span className="col-val win">
                              <img src="/assets/hud_icons/icon_gold.webp" alt={t('resources.gold')} className="reward-res-icon" />
                              +{rival.rewards.gold}
                            </span>
                          </div>
                        </div>
                        <div className="reward-col">
                          <span className="col-label">{t('arena.honorPointsLabel')}</span>
                          <span className="col-val honor">
                            <img src="/assets/hud_icons/btn_ranking.webp" alt={t('arena.honor')} className="reward-res-icon" />
                            +{rival.rewards.honor} {t('arena.honor')}
                          </span>
                        </div>
                      </div>

                      {/* Primary High-Impact Attack Button */}
                      <button 
                        className={`btn-attack-rival pvp-primary-action ${tickets > 0 ? 'ready-to-attack' : 'need-tickets'}`}
                        onClick={() => onStartBattle(rival)}
                        title={tickets > 0 ? `⚔️ ${rivalName}` : t('arena.buyTicketBtn')}
                      >
                        <div className="btn-attack-inner">
                          <Swords size={18} className="attack-swords-icon" />
                          <div className="attack-text-group">
                            <span className="attack-headline">⚔️ {t('arena.attackNow')}</span>
                            <span className="attack-subline">
                              {tickets > 0 
                                ? t('arena.spendsTicket', { tickets }) 
                                : t('arena.noTicketsPrompt')}
                            </span>
                          </div>
                        </div>
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* TAB 2: GLOBAL LEADERBOARD */}
          {activeTab === 'ranking' && (
            <div className="ranking-view">
              {/* Season Timer Card */}
              <div className="season-info-bar">
                <div className="season-left">
                  <Clock size={18} className="season-clock-icon" />
                  <div>
                    <span className="season-title">
                      {seasonData.title} <strong style={{ color: '#facc15' }}>(T{seasonData.seasonNumber})</strong>
                    </span>
                    <span className="season-timer">
                      {t('arena.seasonEnd', { time: seasonData.remainingFormatted }) || `Fin de Temporada en: ${seasonData.remainingFormatted}`}
                    </span>
                  </div>
                </div>
                <div 
                  className="season-reward-pill" 
                  onClick={() => { soundManager.playClick(); setShowSeasonOverview(prev => !prev) }}
                  style={{ cursor: 'pointer' }}
                  title={`${t('arena.seasonEndTrophyReset') || 'Ajuste Suave de Copas'}: ${trophies} ➔ ${predictedResetTrophies}`}
                >
                  <Sparkles size={14} style={{ color: '#facc15' }} />
                  <span>{t('arena.seasonRewardLead')} <strong>{t(`arena.leagueChests.${currentLeague.id}`) || currentLeague.seasonChest}</strong></span>
                </div>
              </div>

              {/* Season Rewards & Trophy Soft-Reset Overview Panel */}
              {showSeasonOverview && (
                <div className="season-overview-dropdown" style={{
                  background: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(234, 179, 8, 0.4)',
                  borderRadius: '12px',
                  padding: '14px',
                  marginBottom: '16px',
                  color: '#e2e8f0',
                  fontSize: '0.85rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong style={{ color: '#fef08a', fontSize: '0.92rem' }}>
                      🏆 {t('arena.seasonRewardsTitle') || 'Recompensas por Liga al Fin de Temporada'}
                    </strong>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      {t('arena.seasonEndTrophyReset') || 'Ajuste Suave'}: <strong style={{ color: '#4ade80' }}>{trophies} ➔ {predictedResetTrophies}</strong>
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                    {ARENA_LEAGUES.map((l) => {
                      const isCurrent = l.id === currentLeague.id
                      const bundle = getSeasonRewardsForLeague(l.id)
                      return (
                        <div key={l.id} style={{
                          background: isCurrent ? 'rgba(234, 179, 8, 0.15)' : 'rgba(30, 41, 59, 0.5)',
                          border: isCurrent ? '1px solid #facc15' : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '8px',
                          padding: '8px',
                          textAlign: 'center',
                        }}>
                          <div style={{ fontWeight: 'bold', color: l.color, fontSize: '0.82rem' }}>{l.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '2px' }}>{bundle.chestName}</div>
                          <div style={{ fontSize: '0.72rem', color: '#facc15', marginTop: '4px' }}>
                            +{bundle.rewards.gems} 💎 • +{bundle.rewards.gold.toLocaleString()} 🪙
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Podium Top 3 */}
              <div className="leaderboard-podium">
                {/* 2nd Place */}
                {sortedLeaderboard[1] && (
                  <div className="podium-step step-2">
                    <div className="podium-laurel">
                      <img src="/assets/hud_icons/btn_build.webp" alt="2º" className="podium-rank-icon" />
                      {t('ranking.secondPlace')}
                    </div>
                    <img src={sortedLeaderboard[1].avatar} alt={t(`ranking.sovereigns.sov-${sortedLeaderboard[1].rank}.name`) || sortedLeaderboard[1].name} className="podium-avatar" />
                    <span className="podium-name">{t(`ranking.sovereigns.sov-${sortedLeaderboard[1].rank}.name`) || sortedLeaderboard[1].name}</span>
                    <span className="podium-trophies">
                      <img src="/assets/hud_icons/btn_ranking.webp" alt={t('arena.crowns')} className="podium-res-icon" />
                      {sortedLeaderboard[1].trophies}
                    </span>
                  </div>
                )}

                {/* 1st Place Champion */}
                {sortedLeaderboard[0] && (
                  <div className="podium-step step-1">
                    <div className="podium-crown">
                      <img src="/assets/hud_icons/btn_ranking.webp" alt={t('arena.crowns')} className="podium-crown-img" />
                    </div>
                    <div className="podium-laurel gold">
                      <img src="/assets/hud_icons/icon_gold.webp" alt="1º" className="podium-rank-icon" />
                      {t('ranking.champion')}
                    </div>
                    <img src={sortedLeaderboard[0].avatar} alt={t(`ranking.sovereigns.sov-${sortedLeaderboard[0].rank}.name`) || sortedLeaderboard[0].name} className="podium-avatar champ" />
                    <span className="podium-name">{t(`ranking.sovereigns.sov-${sortedLeaderboard[0].rank}.name`) || sortedLeaderboard[0].name}</span>
                    <span className="podium-kingdom">{t(`ranking.sovereigns.sov-${sortedLeaderboard[0].rank}.kingdom`) || sortedLeaderboard[0].kingdom}</span>
                    <span className="podium-trophies">
                      <img src="/assets/hud_icons/btn_ranking.webp" alt={t('arena.crowns')} className="podium-res-icon" />
                      {sortedLeaderboard[0].trophies}
                    </span>
                  </div>
                )}

                {/* 3rd Place */}
                {sortedLeaderboard[2] && (
                  <div className="podium-step step-3">
                    <div className="podium-laurel">
                      <img src="/assets/hud_icons/icon_stone.webp" alt="3º" className="podium-rank-icon" />
                      {t('ranking.thirdPlace')}
                    </div>
                    <img src={sortedLeaderboard[2].avatar} alt={t(`ranking.sovereigns.sov-${sortedLeaderboard[2].rank}.name`) || sortedLeaderboard[2].name} className="podium-avatar" />
                    <span className="podium-name">{t(`ranking.sovereigns.sov-${sortedLeaderboard[2].rank}.name`) || sortedLeaderboard[2].name}</span>
                    <span className="podium-trophies">
                      <img src="/assets/hud_icons/btn_ranking.webp" alt={t('arena.crowns')} className="podium-res-icon" />
                      {sortedLeaderboard[2].trophies}
                    </span>
                  </div>
                )}
              </div>

              {/* Leaderboard Table */}
              <div className="leaderboard-table-container">
                <table className="leaderboard-table">
                  <thead>
                    <tr>
                      <th>{t('arena.rank')}</th>
                      <th>{t('arena.sovereignKingdom')}</th>
                      <th>{t('arena.league')}</th>
                      <th>{t('arena.victories')}</th>
                      <th>{t('arena.crowns')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Your Sticky Row */}
                    <tr className="player-sticky-row">
                      <td className="rank-cell"><strong>#{playerEntry.rank}</strong></td>
                      <td className="player-meta-cell">
                        <img src={playerEntry.avatar} alt={t('arena.you')} className="row-avatar" />
                        <div>
                          <span className="player-name-text">{playerEntry.name}</span>
                          <span className="player-kingdom-text">{playerEntry.kingdom}</span>
                        </div>
                      </td>
                      <td>
                        <span className="table-league-badge">
                          <img src={currentLeague.image} alt={t(`arenaItems.leagues.${currentLeague.id}`) || currentLeague.name} className="table-league-img" />
                          {t(`arenaItems.leagues.${currentLeague.id}`) || currentLeague.name}
                        </span>
                      </td>
                      <td>
                        <span className="table-wins-val">
                          <img src="/assets/hud_icons/btn_army.webp" alt={t('arena.victories')} className="table-res-icon" />
                          {playerEntry.wins}
                        </span>
                      </td>
                      <td className="trophies-cell">
                        <strong>
                          <img src="/assets/hud_icons/btn_ranking.webp" alt={t('arena.crowns')} className="table-res-icon" />
                          {playerEntry.trophies}
                        </strong>
                      </td>
                    </tr>

                    {sortedLeaderboard.map((entry) => {
                      const leagueInfo = ARENA_LEAGUES.find((l) => l.id === entry.leagueId) || currentLeague
                      const sovName = t(`ranking.sovereigns.sov-${entry.rank}.name`) || entry.name
                      const sovKingdom = t(`ranking.sovereigns.sov-${entry.rank}.kingdom`) || entry.kingdom
                      const leagueName = t(`arenaItems.leagues.${leagueInfo.id}`) || leagueInfo.name

                      return (
                        <tr key={entry.rank} className={entry.rank <= 3 ? `top-${entry.rank}` : ''}>
                          <td className="rank-cell">
                            {entry.rank === 1 ? '1º' : entry.rank === 2 ? '2º' : entry.rank === 3 ? '3º' : `#${entry.rank}`}
                          </td>
                          <td className="player-meta-cell">
                            <img src={entry.avatar} alt={sovName} className="row-avatar" />
                            <div>
                              <span className="player-name-text">{sovName}</span>
                              <span className="player-kingdom-text">{sovKingdom}</span>
                            </div>
                          </td>
                          <td>
                            <span className="table-league-badge">
                              <img src={leagueInfo.image} alt={leagueName} className="table-league-img" />
                              {leagueName}
                            </span>
                          </td>
                          <td>
                            <span className="table-wins-val">
                              <img src="/assets/hud_icons/btn_army.webp" alt={t('arena.victories')} className="table-res-icon" />
                              {entry.wins}
                            </span>
                          </td>
                          <td className="trophies-cell">
                            <strong>
                              <img src="/assets/hud_icons/btn_ranking.webp" alt={t('arena.crowns')} className="table-res-icon" />
                              {entry.trophies}
                            </strong>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: DEFENSE LOG & REVENGE */}
          {activeTab === 'defense' && (
            <div className="defense-view">
              <div className="defense-header-notice">
                <Shield size={20} className="defense-notice-icon" />
                <div>
                  <h4 className="notice-title">{t('arena.defenseTitle')}</h4>
                  <p className="notice-sub">{t('arena.defenseNoticeSub')}</p>
                </div>
              </div>

              <div className="defense-log-list">
                {defenseLog.length === 0 ? (
                  <div className="empty-defense-state">
                    <Shield size={32} />
                    <p>{t('arena.emptyDefenseNotice')}</p>
                  </div>
                ) : (
                  defenseLog.map((log) => (
                    <div key={log.id} className={`defense-log-card ${log.result}`}>
                      <div className="defense-log-left">
                        <img src={log.attackerAvatar} alt={log.attackerName} className="log-attacker-avatar" />
                        <div className="log-meta">
                          <h4 className="log-attacker-name">{log.attackerName}</h4>
                          <span className="log-attacker-kingdom">{log.attackerKingdom}</span>
                          <span className="log-time">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      <div className="defense-log-center">
                        {log.result === 'victory' ? (
                          <span className="log-result-tag victory">
                            <img src="/assets/hud_icons/btn_army.webp" alt={t('arena.defenseTitle')} className="tag-res-icon" />
                            {t('arena.successfulDefense', { count: log.trophiesDiff })}
                          </span>
                        ) : (
                          <span className="log-result-tag defeat">
                            {t('arena.wallBreached', { trophies: log.trophiesDiff, gold: log.goldLost })}
                          </span>
                        )}
                      </div>

                      <div className="defense-log-right">
                        {log.result === 'defeat' && (
                          <button 
                            className={`btn-revenge ${log.revengeClaimed ? 'claimed' : ''}`}
                            onClick={() => !log.revengeClaimed && onRevengeBattle(log)}
                            disabled={log.revengeClaimed}
                          >
                            <Flame size={15} />
                            <span>{log.revengeClaimed ? t('arena.revengeClaimed') : t('arena.revengeNow')}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: HONOR SHOP */}
          {activeTab === 'shop' && (
            <div className="honor-shop-view">
              <div className="honor-shop-header-banner">
                <div>
                  <h3 className="honor-title">{t('arena.bazaarTitle')}</h3>
                  <p className="honor-sub">{t('arena.honorSub')}</p>
                </div>
                <div className="honor-balance-badge">
                  <img src="/assets/hud_icons/btn_ranking.webp" alt={t('arena.honor')} className="honor-balance-img" />
                  <span className="badge-val">{honorPoints} {t('arena.honor')}</span>
                </div>
              </div>

              <div className="honor-items-grid">
                {HONOR_SHOP_ITEMS.map((item) => {
                  const isOwned = item.isOneTime && ownedRelicIds.includes(item.relicId)
                  const canAfford = honorPoints >= item.costHonor

                  return (
                    <div key={item.id} className={`honor-item-card ${isOwned ? 'owned' : ''}`}>
                      <div className="honor-item-top">
                        <div className="honor-item-icon-pedestal">
                          <img src={item.image} alt={t(`arena.honorShopDetails.${item.id}.name`) || t(`arenaItems.honorShop.${item.id}`) || item.name} className="honor-item-img" />
                        </div>
                        <div className="honor-item-info">
                          <h4 className="honor-item-name">{t(`arena.honorShopDetails.${item.id}.name`) || t(`arenaItems.honorShop.${item.id}`) || item.name}</h4>
                          <span className="honor-item-effect">{t(`arena.honorShopDetails.${item.id}.effect`) || item.effect}</span>
                        </div>
                      </div>

                      <p className="honor-item-desc">{t(`arena.honorShopDetails.${item.id}.desc`) || item.description}</p>

                      <div className="honor-item-footer">
                        <span className="honor-cost-text">
                          <img src="/assets/hud_icons/btn_ranking.webp" alt={t('arena.honor')} className="honor-cost-img" />
                          {item.costHonor} {t('arena.honor')}
                        </span>

                        {isOwned ? (
                          <button className="btn-buy-honor owned" disabled>
                            <CheckCircle2 size={14} />
                            <span>{t('arena.owned')}</span>
                          </button>
                        ) : (
                          <button 
                            className={`btn-buy-honor ${canAfford ? 'can-buy' : 'cant-afford'}`}
                            onClick={() => onBuyHonorItem(item)}
                            disabled={!canAfford}
                          >
                            <span>{t('arena.redeemPrize')}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
