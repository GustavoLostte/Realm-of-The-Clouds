import React, { Suspense, lazy } from 'react'
import { ErrorBoundary } from './ErrorBoundary'
import { soundManager } from '../utils/audio'
import { gameStorage } from '../utils/gameStorage'
import { useTranslation } from '../i18n/index.jsx'

// Lazy loaded modals with dynamic import code-splitting
const CombatModeModal = lazy(() => import('./CombatModeModal').then((m) => ({ default: m.CombatModeModal })))
const KingdomHubModal = lazy(() => import('./KingdomHubModal').then((m) => ({ default: m.KingdomHubModal })))
const ChatModal = lazy(() => import('./ChatModal').then((m) => ({ default: m.ChatModal })))
const DungeonCampaignWindow = lazy(() => import('./DungeonCampaignWindow').then((m) => ({ default: m.DungeonCampaignWindow })))
const BuildModal = lazy(() => import('./BuildModal').then((m) => ({ default: m.BuildModal })))
const BuildingDetailsModal = lazy(() => import('./BuildingDetailsModal').then((m) => ({ default: m.BuildingDetailsModal })))
const QuestsModal = lazy(() => import('./QuestsModal').then((m) => ({ default: m.QuestsModal })))
const ArmyModal = lazy(() => import('./ArmyModal').then((m) => ({ default: m.ArmyModal })))
const StarterWelcomeModal = lazy(() => import('./StarterWelcomeModal').then((m) => ({ default: m.StarterWelcomeModal })))
const ExpeditionModal = lazy(() => import('./ExpeditionModal').then((m) => ({ default: m.ExpeditionModal })))
const DungeonCombatModal = lazy(() => import('./DungeonCombatModal').then((m) => ({ default: m.DungeonCombatModal })))
const MenuModal = lazy(() => import('./MenuModal').then((m) => ({ default: m.MenuModal })))
const ProfileModal = lazy(() => import('./ProfileModal').then((m) => ({ default: m.ProfileModal })))
const LevelUpModal = lazy(() => import('./LevelUpModal').then((m) => ({ default: m.LevelUpModal })))
const OfflineEarningsModal = lazy(() => import('./OfflineEarningsModal').then((m) => ({ default: m.OfflineEarningsModal })))
const KingdomEventModal = lazy(() => import('./KingdomEventModal').then((m) => ({ default: m.KingdomEventModal })))
const TechTreeModal = lazy(() => import('./TechTreeModal').then((m) => ({ default: m.TechTreeModal })))
const InventoryModal = lazy(() => import('./InventoryModal').then((m) => ({ default: m.InventoryModal })))
const ShopModal = lazy(() => import('./ShopModal').then((m) => ({ default: m.ShopModal })))
const ArenaModal = lazy(() => import('./ArenaModal').then((m) => ({ default: m.ArenaModal })))
const SeasonEndModal = lazy(() => import('./SeasonEndModal').then((m) => ({ default: m.SeasonEndModal })))
const ArenaBattleView = lazy(() => import('./ArenaBattleView').then((m) => ({ default: m.ArenaBattleView })))
const RankingModal = lazy(() => import('./RankingModal').then((m) => ({ default: m.RankingModal })))
const HarvestAllModal = lazy(() => import('./HarvestAllModal').then((m) => ({ default: m.HarvestAllModal })))
const UsernameModal = lazy(() => import('./UsernameModal').then((m) => ({ default: m.UsernameModal })))

export function ModalHost({
  // Modal visibility flags & setters
  combatModeModalOpen,
  setCombatModeModalOpen,
  kingdomHubModalOpen,
  setKingdomHubModalOpen,
  chatModalOpen,
  setChatModalOpen,
  campaignWindowOpen,
  setCampaignWindowOpen,
  buildModalOpen,
  setBuildModalOpen,
  detailsModalOpen,
  setDetailsModalOpen,
  questsModalOpen,
  setQuestsModalOpen,
  armyModalOpen,
  setArmyModalOpen,
  welcomeModalOpen,
  setWelcomeModalOpen,
  expeditionModalOpen,
  setExpeditionModalOpen,
  dungeonCombatOpen,
  setDungeonCombatOpen,
  menuModalOpen,
  setMenuModalOpen,
  profileModalOpen,
  setProfileModalOpen,
  levelUpModalOpen,
  setLevelUpModalOpen,
  offlineModalOpen,
  setOfflineModalOpen,
  eventModalOpen,
  setEventModalOpen,
  techTreeModalOpen,
  setTechTreeModalOpen,
  inventoryModalOpen,
  setInventoryModalOpen,
  shopModalOpen,
  setShopModalOpen,
  arenaModalOpen,
  setArenaModalOpen,
  seasonEndModalOpen,
  setSeasonEndModalOpen,
  arenaBattleOpen,
  setArenaBattleOpen,
  rankingModalOpen,
  setRankingModalOpen,
  harvestModalOpen,
  setHarvestModalOpen,
  usernameModalOpen,
  setUsernameModalOpen,

  // Game data
  resources,
  slots,
  troops,
  trainingQueue,
  speedups,
  vipStatus,
  arenaData,
  completedNodes,
  setCompletedNodes,
  unlockedBiomes,
  setUnlockedBiomes,
  unlockedTechIds,
  ownedRelicIds,
  equippedRelics,
  consumables,
  kingdomLevel,
  kingdomXp,
  xpProgress,
  storageCapacity,
  currentLevelDef,
  levelUpInfo,
  playerName,
  playerAvatar,
  soundEnabled,
  fpsMode,
  particlesEnabled,
  selectedSlot,
  recommendedBuildId,
  setRecommendedBuildId,
  evaluatedStoryQuests,
  evaluatedDailyQuests,
  evaluatedEpicFeats,
  activeChapterData,
  currentChapterNum,
  activeStoryQuest,
  activeEvent,
  offlineEarnings,
  pendingSeasonData,
  selectedArenaRival,
  arenaInitialTab,
  shopInitialTab,
  rankingCategory,
  totalPendingQuests,
  isWheelFreeSpinReady,
  lastWheelFreeSpinTime,
  hasStartedGame,
  tutorialSeen,
  setTutorialSeen,
  setTutorialKey,
  setIsTutorialActive,
  getTutorialAccountKey,

  // Callbacks
  handleOpenArena,
  handleOpenBuildMenu,
  handleOpenShop,
  handleOpenRanking,
  handleCampaignClaimLoot,
  handleCombatRetreatCost,
  handleNodeDefeated,
  handleUseConsumable,
  handleObtainRelic,
  handleDungeonRevive,
  handleSelectBuilding,
  handleUpgradeBuilding,
  handleDemolishBuilding,
  handleCollectFromSlot,
  handleSpeedupBuilding,
  handleUseSpeedup,
  handleClaimQuest,
  handleQueueTroops,
  handleCancelTrainingJob,
  handleSpeedupTraining,
  handleInstantFinishTraining,
  handleLaunchExpedition,
  handleOpenDungeonCombat,
  handleDungeonVictory,
  handleToggleSound,
  handleResetGame,
  handleManualSave,
  handleLogout,
  showNotification,
  handleSetFpsMode,
  handleToggleParticles,
  handleSavePlayerName,
  handleClaimLevelUpRewards,
  handleCollectOfflineEarnings,
  handleResolveEventChoice,
  handleResearchTech,
  handleEquipRelic,
  handleUnequipRelic,
  handleCraftConsumable,
  handleBuyGems,
  handleBuyStarterPack,
  handleActivateVipPerk,
  handleSpinWheelReward,
  handleRefreshRivals,
  handleStartArenaBattle,
  handleArenaRevenge,
  handleBuyArenaTicket,
  handleBuyHonorItem,
  handleClaimSeasonRewards,
  handleArenaBattleVictory,
  handleArenaBattleDefeat,
  handleOneClickHarvestAll,
}) {
  const { t } = useTranslation()

  return (
    <Suspense fallback={null}>
      {/* Combat Mode Selector Modal (Single Player PvE vs Multiplayer PvP) */}
      {combatModeModalOpen && (
        <CombatModeModal 
          isOpen={combatModeModalOpen}
          onClose={() => setCombatModeModalOpen(false)}
          onOpenPvE={() => setCampaignWindowOpen(true)}
          onOpenPvP={() => handleOpenArena('pvp')}
          arenaTickets={arenaData.tickets}
          showNotification={showNotification}
        />
      )}

      {/* Kingdom Hub Modal (Clean Centralized Access for Kingdom, Shop, Inventory, Quests, etc.) */}
      {kingdomHubModalOpen && (
        <KingdomHubModal 
          isOpen={kingdomHubModalOpen}
          onClose={() => setKingdomHubModalOpen(false)}
          onOpenBuild={() => handleOpenBuildMenu(null)}
          onOpenShop={() => handleOpenShop('offers')}
          onOpenInventory={() => setInventoryModalOpen(true)}
          onOpenQuests={() => setQuestsModalOpen(true)}
          onOpenRanking={handleOpenRanking}
          onOpenSettings={() => setMenuModalOpen(true)}
          questPendingCount={totalPendingQuests}
          wheelFreeSpinReady={isWheelFreeSpinReady}
        />
      )}

      {/* Royal Kingdom & Global Chat Modal */}
      {chatModalOpen && (
        <ChatModal 
          isOpen={chatModalOpen}
          onClose={() => setChatModalOpen(false)}
          playerName={playerName || 'Lord King'}
        />
      )}

      {/* Full Campaign Window (System Architecture Map & Dungeons) */}
      {campaignWindowOpen && (
        <ErrorBoundary onReset={() => setCampaignWindowOpen(false)}>
          <DungeonCampaignWindow 
            isOpen={campaignWindowOpen}
            onClose={() => setCampaignWindowOpen(false)}
            onClaimLoot={handleCampaignClaimLoot}
            onRetreatCost={handleCombatRetreatCost}
            resources={resources}
            troops={troops}
            completedNodes={completedNodes}
            setCompletedNodes={setCompletedNodes}
            unlockedBiomes={unlockedBiomes}
            setUnlockedBiomes={setUnlockedBiomes}
            onNodeDefeated={handleNodeDefeated}
            consumables={consumables}
            onUseConsumable={handleUseConsumable}
            equippedRelics={equippedRelics}
            unlockedTechIds={unlockedTechIds}
            onObtainRelic={handleObtainRelic}
            gems={resources.gems}
            onDungeonRevive={handleDungeonRevive}
            onOpenShop={handleOpenShop}
          />
        </ErrorBoundary>
      )}

      {/* Build Catalog Modal */}
      {buildModalOpen && (
        <BuildModal 
          isOpen={buildModalOpen}
          onClose={() => {
            setBuildModalOpen(false)
            setRecommendedBuildId(null)
          }}
          onSelectBuilding={handleSelectBuilding}
          targetSlot={selectedSlot}
          resources={resources}
          kingdomLevel={kingdomLevel}
          recommendedBuildingId={recommendedBuildId || activeStoryQuest?.targetBuilding || null}
          slots={slots}
        />
      )}

      {/* Building Details Modal */}
      {detailsModalOpen && (
        <BuildingDetailsModal 
          isOpen={detailsModalOpen}
          onClose={() => {
            soundManager.stopBuildingSound()
            setDetailsModalOpen(false)
          }}
          slot={selectedSlot ? slots.find((s) => s.id === selectedSlot.id) || selectedSlot : null}
          resources={resources}
          speedups={speedups}
          vipStatus={vipStatus}
          onUpgradeBuilding={handleUpgradeBuilding}
          onDemolishBuilding={handleDemolishBuilding}
          onCollect={handleCollectFromSlot}
          onSpeedupBuilding={handleSpeedupBuilding}
          onUseSpeedup={handleUseSpeedup}
          storageCapacity={storageCapacity}
          onOpenArmy={() => setArmyModalOpen(true)}
          onOpenExpeditions={() => setExpeditionModalOpen(true)}
          onOpenInventory={() => setInventoryModalOpen(true)}
          onOpenTechTree={() => setTechTreeModalOpen(true)}
        />
      )}

      {/* Quests Modal */}
      {questsModalOpen && (
        <QuestsModal 
          isOpen={questsModalOpen}
          onClose={() => setQuestsModalOpen(false)}
          quests={evaluatedStoryQuests}
          dailyQuests={evaluatedDailyQuests}
          epicFeats={evaluatedEpicFeats}
          onClaimQuest={handleClaimQuest}
          chapterData={activeChapterData}
          currentChapter={currentChapterNum}
        />
      )}

      {/* Army & Garrison Modal */}
      {armyModalOpen && (() => {
        const cuartelSlot = slots.find((s) => s.buildingId === 'cuartel' && !s.isConstructing)
        const cuartelLevel = cuartelSlot ? (cuartelSlot.level || 1) : 1
        return (
          <ArmyModal 
            isOpen={armyModalOpen}
            onClose={() => setArmyModalOpen(false)}
            resources={resources}
            troops={troops}
            hasCuartel={Boolean(cuartelSlot)}
            cuartelLevel={cuartelLevel}
            trainingQueue={trainingQueue}
            onQueueTroops={handleQueueTroops}
            onCancelTrainingJob={handleCancelTrainingJob}
            onSpeedupTraining={handleSpeedupTraining}
            onInstantFinishTraining={handleInstantFinishTraining}
            speedups={speedups}
            onOpenBuild={handleOpenBuildMenu}
          />
        )
      })()}

      {/* Starter Narrative Welcome & Onboarding Modal */}
      {welcomeModalOpen && hasStartedGame && !usernameModalOpen && (
        <StarterWelcomeModal 
          isOpen={welcomeModalOpen && hasStartedGame && !usernameModalOpen}
          onClose={() => {
            setWelcomeModalOpen(false)
            const activeEmail = gameStorage.getEmail()
            const accountKey = getTutorialAccountKey(activeEmail)
            if (!tutorialSeen && localStorage.getItem(accountKey) !== 'true') {
              setIsTutorialActive(true)
            }
          }}
          onStartTutorial={() => {
            setWelcomeModalOpen(false)
            setIsTutorialActive(true)
          }}
        />
      )}

      {/* Expedition Modal (Quick Patrols) */}
      {expeditionModalOpen && (
        <ExpeditionModal 
          isOpen={expeditionModalOpen}
          onClose={() => setExpeditionModalOpen(false)}
          onLaunchExpedition={handleLaunchExpedition}
          onOpenDungeonCombat={handleOpenDungeonCombat}
          troops={troops}
        />
      )}

      {/* Dungeon Combat Fallback Modal */}
      {dungeonCombatOpen && (
        <DungeonCombatModal
          isOpen={dungeonCombatOpen}
          onClose={() => setDungeonCombatOpen(false)}
          onVictory={handleDungeonVictory}
          troops={troops}
        />
      )}

      {/* Menu / Settings Modal */}
      {menuModalOpen && (
        <MenuModal 
          isOpen={menuModalOpen}
          onClose={() => setMenuModalOpen(false)}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          onResetGame={handleResetGame}
          onManualSave={handleManualSave}
          onLogout={handleLogout}
          showNotification={showNotification}
          playerName={playerName || 'Lord King'}
          onOpenChangeName={() => setUsernameModalOpen(true)}
          onRestartTutorial={() => {
            const activeEmail = gameStorage.getEmail()
            const accountKey = getTutorialAccountKey(activeEmail)
            localStorage.removeItem(accountKey)
            localStorage.removeItem('toc_tutorial_completed')
            setTutorialSeen(false)
            setTutorialKey((prev) => prev + 1)
            setIsTutorialActive(true)
            showNotification(t('notifications.tutorialRestarted'), 'info')
          }}
          fpsMode={fpsMode}
          onSetFpsMode={handleSetFpsMode}
          particlesEnabled={particlesEnabled}
          onToggleParticles={handleToggleParticles}
        />
      )}

      {/* Profile & Achievements Modal */}
      {profileModalOpen && (
        <ProfileModal 
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          resources={resources}
          slots={slots}
          troops={troops}
          kingdomLevel={kingdomLevel}
          kingdomXp={kingdomXp}
          xpProgress={xpProgress}
          showNotification={showNotification}
          playerName={playerName || 'Lord King'}
          playerAvatar={playerAvatar}
          onOpenChangeName={() => setUsernameModalOpen(true)}
          onSaveName={handleSavePlayerName}
          onLogout={handleLogout}
        />
      )}

      {/* Level Up Celebration Modal */}
      {levelUpModalOpen && hasStartedGame && (
        <LevelUpModal
          isOpen={levelUpModalOpen && hasStartedGame}
          onClose={() => setLevelUpModalOpen(false)}
          newLevel={levelUpInfo?.newLevel || kingdomLevel}
          levelData={levelUpInfo?.levelData || currentLevelDef}
          onClaimRewards={handleClaimLevelUpRewards}
        />
      )}

      {/* Offline Earnings Welcome Back Modal */}
      {offlineModalOpen && hasStartedGame && (
        <OfflineEarningsModal 
          isOpen={offlineModalOpen && hasStartedGame}
          earnings={offlineEarnings}
          onCollect={handleCollectOfflineEarnings}
        />
      )}

      {/* Kingdom Event & Dilemmas Modal */}
      {eventModalOpen && hasStartedGame && (
        <KingdomEventModal 
          isOpen={eventModalOpen && hasStartedGame}
          onClose={() => setEventModalOpen(false)}
          event={activeEvent}
          resources={resources}
          troops={troops}
          onResolveChoice={handleResolveEventChoice}
        />
      )}

      {/* Royal Tech Tree Modal */}
      {techTreeModalOpen && (
        <TechTreeModal 
          isOpen={techTreeModalOpen}
          onClose={() => setTechTreeModalOpen(false)}
          resources={resources}
          kingdomLevel={kingdomLevel}
          unlockedTechIds={unlockedTechIds}
          onResearchTech={handleResearchTech}
        />
      )}

      {/* Treasury Relics & Combat Consumables Backpack Modal */}
      {inventoryModalOpen && (
        <InventoryModal 
          isOpen={inventoryModalOpen}
          onClose={() => setInventoryModalOpen(false)}
          ownedRelicIds={ownedRelicIds}
          equippedRelics={equippedRelics}
          consumables={consumables}
          resources={resources}
          onEquipRelic={handleEquipRelic}
          onUnequipRelic={handleUnequipRelic}
          onCraftConsumable={handleCraftConsumable}
        />
      )}

      {/* Royal Bazaar & Monetization Shop Modal */}
      {shopModalOpen && (
        <ShopModal
          isOpen={shopModalOpen}
          onClose={() => setShopModalOpen(false)}
          initialTab={shopInitialTab}
          resources={resources}
          vipStatus={vipStatus}
          lastWheelFreeSpinTime={lastWheelFreeSpinTime}
          lastFreeSpinTime={lastWheelFreeSpinTime}
          onBuyGems={handleBuyGems}
          onBuyStarterPack={handleBuyStarterPack}
          onActivateVipPerk={handleActivateVipPerk}
          onSpinWheelReward={handleSpinWheelReward}
        />
      )}

      {/* Competitive Coliseo / Arena Modal */}
      {arenaModalOpen && (
        <ArenaModal
          isOpen={arenaModalOpen}
          onClose={() => setArenaModalOpen(false)}
          initialTab={arenaInitialTab}
          trophies={arenaData.trophies}
          tickets={arenaData.tickets}
          honorPoints={arenaData.honorPoints}
          peaceShieldUntil={arenaData.peaceShieldUntil}
          rivals={arenaData.rivals || []}
          onRefreshRivals={handleRefreshRivals}
          onStartBattle={handleStartArenaBattle}
          defenseLog={arenaData.defenseLog || []}
          onRevengeBattle={handleArenaRevenge}
          onBuyTickets={handleBuyArenaTicket}
          onBuyHonorItem={handleBuyHonorItem}
          ownedRelicIds={ownedRelicIds}
          troops={troops}
          kingdomLevel={kingdomLevel}
        />
      )}

      {/* Competitive Arena Season End Ceremony Modal */}
      {pendingSeasonData && seasonEndModalOpen && (
        <SeasonEndModal
          isOpen={seasonEndModalOpen}
          onClose={() => setSeasonEndModalOpen(false)}
          seasonNumber={pendingSeasonData.seasonNumber}
          seasonTitle={pendingSeasonData.seasonTitle}
          league={pendingSeasonData.league}
          chestName={pendingSeasonData.chestName}
          rewards={pendingSeasonData.rewards}
          trophiesBefore={pendingSeasonData.trophiesBefore}
          trophiesAfter={pendingSeasonData.trophiesAfter}
          onClaimRewards={handleClaimSeasonRewards}
        />
      )}

      {/* PvP Tactical Siege Battle View */}
      {arenaBattleOpen && (
        <ArenaBattleView
          isOpen={arenaBattleOpen}
          onClose={() => setArenaBattleOpen(false)}
          rival={selectedArenaRival}
          troops={troops}
          equippedRelics={equippedRelics}
          unlockedTechIds={unlockedTechIds}
          consumables={consumables}
          onUseConsumable={handleUseConsumable}
          onVictory={handleArenaBattleVictory}
          onDefeat={handleArenaBattleDefeat}
          resources={resources}
          onRetreatCost={handleCombatRetreatCost}
        />
      )}

      {/* Global Leaderboard & Sovereign Ranking Modal */}
      {rankingModalOpen && (
        <RankingModal 
          isOpen={rankingModalOpen}
          onClose={() => setRankingModalOpen(false)}
          initialCategory={rankingCategory}
          kingdomLevel={kingdomLevel}
          buildings={slots.filter((s) => s.buildingId && !s.isConstructing)}
          troops={troops}
          trophies={arenaData.trophies}
          completedNodes={completedNodes}
          unlockedTechIds={unlockedTechIds}
          playerName={playerName || 'Lord King'}
          onOpenArena={() => {
            setRankingModalOpen(false)
            handleOpenArena('pvp')
          }}
          onOpenCampaign={() => {
            setRankingModalOpen(false)
            showNotification(t('combatModal.campaignNotice') || '¡Próximamente! La Campaña Celestial estará disponible en la próxima actualización de Aetheria.', 'info')
          }}
        />
      )}

      {/* Imperial Instant Harvest All Decree Modal */}
      {harvestModalOpen && (
        <HarvestAllModal
          isOpen={harvestModalOpen}
          onClose={() => setHarvestModalOpen(false)}
          onConfirmHarvest={() => {
            handleOneClickHarvestAll()
            setHarvestModalOpen(false)
          }}
          onOpenShop={handleOpenShop}
          hasOneClickHarvest={vipStatus.hasOneClickHarvest}
          hasEngineering={vipStatus.hasEngineering}
          gems={resources.gems}
          slots={slots}
          unlockedTechIds={unlockedTechIds}
          equippedRelics={equippedRelics}
        />
      )}

      {/* Sovereign Username & Identity Modal */}
      {usernameModalOpen && (
        <UsernameModal 
          isOpen={usernameModalOpen}
          onClose={() => setUsernameModalOpen(false)}
          currentName={playerName}
          currentAvatar={playerAvatar}
          onSave={handleSavePlayerName}
        />
      )}
    </Suspense>
  )
}
