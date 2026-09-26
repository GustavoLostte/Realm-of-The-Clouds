import { readFileSync, writeFileSync } from 'fs'
import { kr } from '../src/i18n/locales/kr.js'

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {}
      deepMerge(target[key], source[key])
    } else {
      target[key] = source[key]
    }
  }
}

const koreanDeepPatch = {
  start: {
    title: "혼돈의 왕좌",
    subtitle: "엠파이어 포지",
    emailPlaceholder: "your_email@example.com"
  },
  quests: {
    daily: {
      "daily-tribute": {
        title: "아침 조공 수령",
        desc: "광장 건물들에서 세금과 조공을 징수하세요."
      },
      "daily-garrison": {
        title: "경비대 순찰",
        desc: "주둔지에 최소 6명의 전투 준비 병력을 유지하세요."
      },
      "daily-campaign": {
        title: "국경 경계",
        desc: "캠페인에서 최소 1개의 전투 거점을 정복하거나 승리하세요."
      }
    },
    epic: {
      "epic-castle-tier": {
        title: "황금 왕좌",
        desc: "마을 회관을 레벨 3으로 업그레이드하세요."
      },
      "epic-population-boom": {
        title: "번영하는 제국",
        desc: "정착민 인구 수용량을 최소 50명까지 도달시키세요."
      },
      "epic-grand-army": {
        title: "무적 군단",
        desc: "주둔지에 12명 이상의 부대를 모집하세요."
      }
    }
  },
  questData: {
    daily: {
      "daily-tribute": {
        title: "아침 조공 수령",
        desc: "광장 건물들에서 세금과 조공을 징수하세요."
      },
      "daily-garrison": {
        title: "경비대 순찰",
        desc: "주둔지에 최소 6명의 전투 준비 병력을 유지하세요."
      },
      "daily-campaign": {
        title: "국경 경계",
        desc: "캠페인에서 최소 1개의 전투 거점을 정복하거나 승리하세요."
      }
    },
    epic: {
      "epic-castle-tier": {
        title: "황금 왕좌",
        desc: "마을 회관을 레벨 3으로 업그레이드하세요."
      },
      "epic-population-boom": {
        title: "번영하는 제국",
        desc: "정착민 인구 수용량을 최소 50명까지 도달시키세요."
      },
      "epic-grand-army": {
        title: "무적 군단",
        desc: "주둔지에 12명 이상의 부대를 모집하세요."
      }
    }
  },
  arena: {
    assaults: "공격 횟수",
    chooseRival: "🎯 라이벌 선택",
    chooseRivalDesc: "비슷한 전투력의 요새를 선택하세요. 포위 공격마다 티켓 1장이 소모됩니다.",
    lootBuildings: "🏰 건물 3곳 약탈",
    lootBuildingsDesc: "제한 시간 내에 취약한 건물 3곳을 탭하여 성벽을 뚫고 자원을 약탈하세요.",
    yourSiegeForce: "현재 포위 부대",
    power: "전투력",
    breach: "돌파",
    rivalCitadels: "포위 대상 라이벌 성채",
    newRivals: "새로운 라이벌",
    assaultLoot: "약탈 전리품",
    honorPointsLabel: "명예 포인트",
    seasonEnd: "시즌 종료까지: 4일 16시간",
    rank: "순위",
    sovereignKingdom: "군주 및 왕국",
    league: "리그",
    victories: "승리",
    crowns: "크라운",
    defenseTitle: "왕국 방어 및 포위 기록",
    bazaarTitle: "황실 검투사 바자르",
    owned: "보유 중",
    redeemPrize: "보상 교환",
    yourSovereignty: "나의 주권 (본인)",
    chaosKingdom: "혼돈의 왕국",
    tabPvp: "콜로세움",
    tabRanking: "랭킹",
    tabDefense: "방어",
    tabShop: "상점",
    attackBtn: "공격"
  },
  shop: {
    bundles: {
      starter_pack: {
        title: "군주 스타터 팩",
        desc: "필수 자원, 젬, 창립 군주 칭호로 왕국 통치를 시작하세요."
      },
      war_pack: {
        title: "워호스트 대대",
        desc: "정예 부대, 공성 장비 및 분노의 물약으로 주둔군을 강화하세요."
      },
      builder_pack: {
        title: "황실 건축가 팩",
        desc: "대량의 목재, 화강암, 설계도로 요새를 빠르게 확장하세요."
      },
      mythic_pack: {
        title: "혼돈의 군주 번들",
        desc: "성기사 영웅, 에픽 유물 및 VIP 왕관 휘장이 포함된 최고급 상자입니다."
      }
    },
    vipTiers: {
      "0": {
        title: "시민",
        perk: "기본 자원 생산율"
      },
      "1": {
        title: "남작",
        perk: "건설 속도 +5%, 자원 생산량 +5%"
      },
      "2": {
        title: "공작",
        perk: "군대 공격력 +10%, 건설 속도 +10%, 자원 생산량 +10%"
      },
      "3": {
        title: "황실 최고 군주",
        perk: "전체 생산량 +20%, 5분 미만 즉시 무료 완료, 전용 아바타 테두리"
      }
    },
    bundleItems: {
      commander: "성기사 사령관",
      relics: "에픽 유물 상자",
      potions: "분노의 물약 5개",
      bombs: "비전 폭탄 10개",
      vipBadge: "VIP 왕관 휘장",
      title: "창립자 칭호"
    }
  },
  shopItems: {
    gem_packs: {
      small: "한 줌의 젬",
      medium: "젬 자루",
      large: "황실 젬 보물함",
      vault: "왕좌의 금고"
    },
    bundles: {
      conqueror: {
        title: "정복자의 상자",
        subtitle: "군주를 위한 특별 환영 혜택"
      },
      alliance: {
        title: "대연합 번들",
        subtitle: "공성을 위해 결성된 황실 군단"
      }
    },
    bundleItems: {
      relicEmblem: "유물: 황실 태양의 문장",
      titleConqueror: "황실 칭호: '태양의 정복자'"
    },
    perks: {
      oneClickHarvest: "전령의 나팔 (전체 수확)",
      secondBuilder: "제2 황실 건축가",
      dailyBlessing: "혼돈의 일일 축복 (월간 패스)",
      engineering: "황실 공학 마스터리"
    }
  },
  profile: {
    modalTitle: "군주 프로필",
    modalSubtitle: "제국 통계, 유산 및 업적",
    tabOverview: "개요",
    tabAchievements: "업적",
    tabAvatars: "초상화",
    levelProgress: "레벨 진행도",
    statPower: "제국 전투력",
    statArmy: "보유 군대",
    statDungeons: "던전 거점",
    statTech: "연구 완료",
    statArena: "아레나 포인트",
    passTitle: "황실 NFT 패스",
    passSubtitle: "혼돈의 고원의 최고 군주",
    passMinted: "Web3에 발행됨",
    passConnected: "지갑 연결됨",
    avatarSelectorTitle: "군주 초상화 선택",
    avatarSelectorDesc: "황실 랭킹에서 다른 군주들에게 표시될 외형을 선택하세요",
    achievementsTitle: "황실 위업 및 업적",
    achievements: {
      first_blood: {
        title: "화염의 세례",
        desc: "캠페인 또는 던전에서 첫 번째 전투에 승리하세요."
      },
      builder: {
        title: "건축 거장",
        desc: "왕국에 5개 이상의 건물을 건설하세요."
      },
      warlord: {
        title: "최고 워로드",
        desc: "성채에서 오크 워로드 보르가스를 쓰러뜨리세요."
      },
      wealth: {
        title: "황금 보물창고",
        desc: "왕실 금고에 골드 10,000을 축적하세요."
      },
      tactician: {
        title: "아레나 검투사",
        desc: "PvP 아레나에서 크라운 1,000개에 도달하세요."
      },
      scholar: {
        title: "비전 학자",
        desc: "대아카데미에서 6개 이상의 기술을 연구하세요."
      }
    }
  },
  menu: {
    selectLanguage: "게임 언어 선택 / Select Language:",
    creditsTitle: "혼돈의 왕좌: 엠파이어 포지",
    guestMode: "게스트 모드 (오프체인)",
    tokenChaos: "토큰 $CHAOS",
    syncingStateNotice: "TOC Chaos L2와 왕국 상태 동기화 중..."
  },
  notifications: {
    web3WalletDisconnected: "Web3 지갑 연결이 해제되었습니다",
    syncingBlockchain: "TOC Chaos L2와 왕국 상태 동기화 중..."
  },
  inventoryItems: {
    slots: {
      head: "왕관 / 투구",
      weapon: "황실 무기",
      accessory: "유물 / 부적"
    },
    relics: {
      relic_corona_caos: {
        name: "혼돈의 왕관",
        desc: "모든 광산의 골드 생산량 +15%. 왕국 레벨 명성을 높입니다.",
        dropSource: "최고 워로드 보르가스 (바이옴 1 보스)"
      },
      relic_espada_jade: {
        name: "비취 룬 검",
        desc: "군대 공격력 +20%. 캠페인과 아레나에서 치명타를 가합니다.",
        dropSource: "비취 비전 드래곤 (바이옴 2 보스)"
      },
      relic_caliz_titan: {
        name: "얼음 타이탄 왕의 성배",
        desc: "방어력 +20%. 장기전에서 강력한 충격을 흡수합니다.",
        dropSource: "얼음 타이탄 킹 (바이옴 3 최종 보스)"
      },
      relic_broquel_hierro: {
        name: "흑철 버클러 방패",
        desc: "방어력 +15%. 공성과 캠페인에서 부대 생존력을 높입니다.",
        dropSource: "철갑 경비 오크 (바이옴 1)"
      },
      relic_amuleto_selva: {
        name: "에메랄드 숲의 부적",
        desc: "식량 생산량 +15%. 주민 수확 효율을 높입니다.",
        dropSource: "그림자 표범 (바이옴 2)"
      },
      relic_emblema_leon: {
        name: "황실 태양의 문장",
        desc: "골드 생산량 +20%. 일일 왕실 조공을 2배로 증가시킵니다.",
        dropSource: "정복자의 상자 (특별 한정)"
      },
      relic_manto_vencedor: {
        name: "승리자의 망토",
        desc: "공격력 +10% 및 방어력 +10%. 아레나 챔피언을 위한 전설의 망토입니다.",
        dropSource: "콜로세움 명예 상점"
      }
    },
    consumables: {
      potion_heal: {
        name: "상급 회복 물약",
        desc: "던전 및 아레나 전투에서 생명력의 40%를 회복합니다."
      },
      potion_focus: {
        name: "집중의 영약",
        desc: "1회의 전투 동안 치명타 피해량이 25% 증가합니다."
      },
      bomb_dwarf: {
        name: "드워프 화약 폭탄",
        desc: "단 한 번의 폭발로 모든 적에게 200의 범위 피해를 줍니다."
      }
    }
  },
  arenaItems: {
    leagues: {
      league_bronze: "브론즈 리그",
      league_silver: "실버 리그",
      league_gold: "골드 리그",
      league_platinum: "플래티넘 리그",
      league_master: "최고 군주 리그"
    },
    honorShop: {
      honor_relic_mantle: "승리자의 망토",
      honor_shield_8h: "평화의 방패 (8시간)",
      honor_shield_24h: "평화의 방패 (24시간)",
      honor_gems_60: "비전 젬 자루 (60개)",
      honor_chest_war: "군사 보급 상자",
      item_relic_manto_vencedor: "승리자의 망토",
      item_shield_8h: "평화의 방패 (8시간)",
      item_shield_24h: "평화의 방패 (24시간)",
      item_gems_pouch: "비전 젬 자루 (60개)",
      item_war_chest: "군사 보급 상자"
    }
  },
  ranking: {
    tag: "황실 명예의 전당",
    title: "제국 군주 랭킹",
    secondPlace: "2위",
    champion: "챔피언",
    thirdPlace: "3위",
    yourRank: "나의 순위",
    yourActiveFortress: "현재 활성화된 요새",
    colRank: "순위",
    colSovereign: "군주",
    colTitleDetails: "칭호 및 영지",
    colScore: "점수",
    goToArena: "아레나로 이동",
    goToDungeons: "던전으로 이동",
    backToKingdom: "왕국으로 복귀",
    categories: {
      power: "왕국 전투력",
      arena: "아레나 크라운",
      dungeon: "던전 층수"
    },
    powerUnit: "전투력",
    crownsUnit: "크라운",
    floorUnit: "층",
    tournamentInProgress: "시즌 토너먼트 진행 중",
    globalRank: "글로벌 순위",
    seasonTimerLead: "황실 시즌:",
    seasonTimerTail: "남음",
    stars: "별",
    leagues: {
      "Maestro Arcano": "비전 마스터",
      "Platino Real": "로열 플래티넘",
      "Oro Veterano": "베테랑 골드",
      "Plata Guerrero": "전사 실버",
      "Bronce Novicio": "초심자 브론즈"
    },
    sovereigns: {
      "sov-1": { name: "군주 말라코르", kingdom: "혼돈의 제국", title: "태고의 황제" },
      "sov-2": { name: "여왕 발키리 아스트리드", kingdom: "천둥의 요새", title: "발키리의 군주" },
      "sov-3": { name: "성기사 롤랜드", kingdom: "새벽의 성채", title: "신성한 수호자" },
      "sov-4": { name: "대마법사 이그니스", kingdom: "비전의 첨탑", title: "원소의 조련사" },
      "sov-5": { name: "발레리우스 국왕", kingdom: "황금 사자 영지", title: "초대 왕관의 주인" },
      "sov-6": { name: "전쟁군주 볼가르", kingdom: "피의 철벽", title: "북방의 파괴자" },
      "sov-7": { name: "공작 카엘렌", kingdom: "복수의 영토", title: "밤의 추적자" },
      "sov-8": { name: "여군주 실바나", kingdom: "그림자 숲", title: "달빛의 궁수" },
      "sov-9": { name: "원수 로데릭", kingdom: "철벽 바스티온", title: "부서지지 않는 방패" },
      "sov-10": { name: "선봉장 말라코르", kingdom: "폭풍의 봉우리", title: "태풍의 칼날" },
      "sov-11": { name: "여군주 카산드라", kingdom: "황금 선봉대", title: "빛의 여왕" },
      "sov-12": { name: "공작 발타자르", kingdom: "드래곤 성채", title: "용의 혈통" },
      "sov-13": { name: "남작 모드레드", kingdom: "어둠의 황무지", title: "검은 검사" },
      "sov-14": { name: "여백작 엘레나", kingdom: "서리 안개 골짜기", title: "빙결의 지배자" },
      "sov-15": { name: "기사단장 고드릭", kingdom: "황혼의 관문", title: "신념의 보루" }
    }
  },
  techTree: {
    tag: "왕국 대아카데미",
    title: "황실 연구소"
  },
  avatars: {
    king: {
      name: "발레리우스 국왕",
      title: "왕관의 군주"
    },
    valkyrie: {
      name: "발키리 아스트리드",
      title: "천공의 방패"
    },
    paladin: {
      name: "성기사 롤랜드",
      title: "신성한 수호자"
    },
    mage: {
      name: "대마법사 이그니스",
      title: "비전 화염의 조련사"
    }
  },
  expeditions: {
    modalTitle: "원정 및 캠페인 던전",
    modalSubtitle: "부유 고원 너머로 연대를 파견하여 전리품을 획득하세요",
    forcesReady: "전투 준비 병력:",
    soldiers: "병사",
    readinessOptimal: "최적 준비 완료",
    readinessBasic: "기본 전력",
    readinessLow: "주둔군 부족",
    heroBannerTitle: "혼돈의 던전: 크리티컬 타격 결투!",
    heroBannerDesc: "타이밍 게이지를 맞춰 방마다 적과 싸우고 혼돈의 워로드를 격파하세요.",
    heroBannerBtn: "던전 입장!",
    victoryTitle: "영광스러운 승리!",
    spoilsTitle: "획득한 보물 및 전리품:",
    claimSpoilsBtn: "전리품 수령 및 왕좌로 복귀",
    enemyLabel: "적군:",
    winChanceLabel: "승률:",
    highRisk: "고위험 (<30%)",
    lootLabel: "전리품:",
    dispatchBtn: "출정",
    dispatchTooltip: "대대를 전투에 파견합니다",
    dispatchDisabledTooltip: "더 많은 병사가 필요합니다",
    difficulties: {
      easy: "쉬움",
      medium: "보통",
      hard: "어려움",
      boss: "정예"
    },
    items: {
      "exp-1": {
        name: "혼돈 군단의 지하 묘지",
        region: "서부 국경 지대",
        duration: "3개 방",
        description: "고블린, 오크 및 혼돈의 워로드를 쓰러뜨리며 3개의 지하 방을 돌파하세요.",
        enemySquad: "고블린 -> 화염 오크 버서커 -> 워로드 보르가스 [보스]"
      },
      "exp-2": {
        name: "비취 드래곤의 성소",
        region: "에메랄드 숲",
        duration: "4개 방",
        description: "원소 수호자들을 제압하고 고대 비취 룬 검을 확보하세요.",
        enemySquad: "정글 표범 -> 드루이드 궁수 -> 비취 비전 드래곤 [보스]"
      },
      "exp-3": {
        name: "얼음 타이탄의 빙하 성채",
        region: "극지 설원 봉우리",
        duration: "5개 방",
        description: "혹한의 폭풍을 뚫고 빙하 타이탄 왕에게 도전하세요.",
        enemySquad: "설원 늑대 -> 얼음 골렘 -> 빙결 거인 -> 얼음 타이탄 킹 [보스]"
      },
      "exp-4": {
        name: "혼돈의 심연 균열",
        region: "아스트랄 보이드",
        duration: "5개 방",
        description: "시공간의 균열에서 쏟아져 나오는 공허의 군단을 섬멸하세요.",
        enemySquad: "공허의 추적자 -> 심연의 마법사 -> 혼돈의 군주 [최종 보스]"
      }
    }
  },
  dungeonCombat: {
    dungeonName: "흑염의 성채: 오크와의 결투",
    dungeonSubtitle: "시네마틱 전투 - 처음 3개의 던전",
    bossBadge: "[보스]",
    closeTitle: "던전 닫기",
    playerHeroName: "황실 챔피언",
    duelBadge: "결투",
    timingMiss: "빗맞음",
    timingGood: "좋음",
    timingPerfect: "완벽함",
    timingCritical: "치명타!",
    strikeBtn: "결정타 일격!",
    strikeHint: "[스페이스바]",
    quitWithLootBtn: "전리품 챙겨 후퇴",
    dungeonVictoryTitle: "던전 정복 완료!!",
    claimLegendaryLootBtn: "왕국을 위한 대전리품 수령",
    defeatTitle: "전투에서 쓰러짐",
    retryBtn: "결투 재도전",
    returnCityBtn: "도시로 귀환",
    rooms: {
      "0": {
        name: "오크 선봉 정찰병",
        title: "황무지의 선봉대"
      },
      "1": {
        name: "화염 오크 버서커",
        title: "화염 도끼의 수호자"
      },
      "2": {
        name: "오크 워로드 보르가스",
        title: "흑염 성채의 지배자"
      }
    }
  },
  kingdomEvents: {
    "event-caravan": {
      title: "왕실 비단 대상단",
      subtitle: "동방 교역로의 방문",
      emissaryName: "상인 자히르",
      emissaryRole: "비단길 대상단주",
      description: "이국적인 비단과 향신료를 실은 대규모 낙타 대상단이 성문에 도착했습니다. 영지의 번영을 축복하며 교역 협정을 제안합니다.",
      choices: {
        caravan_trade: {
          label: "교역 특권 허가",
          desc: "골드 100을 지불하고 고급 목재 및 석재 자재를 확보합니다.",
          outcomeText: "대상단이 왕실 창고에 훌륭한 건축 자재를 가득 채우고 감사를 표했습니다."
        },
        caravan_tax: {
          label: "황실 통행세 징수",
          desc: "교역 특혜 없이 엄격한 통행세를 부과합니다 (+120 골드).",
          outcomeText: "대상단은 불만을 표했으나 엄정한 법에 따라 황실 금고에 금화를 납부했습니다."
        },
        caravan_dismiss: {
          label: "정중히 배웅",
          desc: "어떠한 거래도 하지 않고 다음 도시로 이동하도록 안내합니다.",
          outcomeText: "대상단은 다음 고원을 향해 평화롭게 떠났습니다."
        }
      }
    },
    "event-alchemist": {
      title: "방랑 연금술사의 실험",
      subtitle: "비전 연구의 기회",
      emissaryName: "마이스터 오렐리우스",
      emissaryRole: "비전 학회 탈주자",
      description: "화려한 비약 병을 든 연금술사가 왕궁을 찾아왔습니다. 왕실의 후원을 받으면 기적의 가속 비약을 제조해 주겠다고 약속합니다.",
      choices: {
        alchemist_fund: {
          label: "실험 자금 전액 후원",
          desc: "골드 80을 지원하여 연금술 비약을 받습니다.",
          outcomeText: "연금술사의 실험이 대성공하여 수확과 생산을 가속하는 비약을 전달받았습니다!"
        },
        alchemist_cautious: {
          label: "기본 시약만 구매",
          desc: "적은 비용(30 골드)으로 안전한 활력 묘약을 확보합니다.",
          outcomeText: "연금술사는 작은 시약 병을 건네며 감사의 인사를 남겼습니다."
        },
        alchemist_reject: {
          label: "위험한 연금술 거부",
          desc: "왕국 내에서 검증되지 않은 마법 실험을 금지합니다.",
          outcomeText: "연금술사는 아쉬운 표정으로 조용히 성문을 떠났습니다."
        }
      }
    },
    "event-bandits": {
      title: "국경 산적단의 출몰",
      subtitle: "치안 위협과 대처",
      emissaryName: "경비대장 발린",
      emissaryRole: "국경 수비대 사령관",
      description: "고원 외곽의 농가와 채석장을 위협하는 무장 산적 무리가 포착되었습니다. 단호한 조치가 필요합니다.",
      choices: {
        bandits_attack: {
          label: "황실 근위대 급파",
          desc: "병력을 투입하여 산적단을 완전히 소탕하고 전리품을 회수합니다.",
          outcomeText: "근위대가 산적단을 격퇴하고 약탈당했던 금화와 보급품을 왕실로 회수했습니다!"
        },
        bandits_bribe: {
          label: "일시적 통행료 지불",
          desc: "전투 손실을 피하기 위해 금화 50으로 평화를 유지합니다.",
          outcomeText: "산적단은 금화를 챙기고 국경 너머로 물러났습니다."
        },
        bandits_fortify: {
          label: "국경 방어벽 강화",
          desc: "목재 40을 소모하여 방어 초소를 세웁니다.",
          outcomeText: "새로 건설된 방어 타워를 보고 산적들이 접근을 포기했습니다."
        }
      }
    },
    "event-harvest-festival": {
      title: "풍년의 대축제",
      subtitle: "백성들의 환호",
      emissaryName: "집정관 엘라",
      emissaryRole: "민정 장관",
      description: "풍성한 수확을 기념하기 위해 백성들이 수도 광장에서 대규모 축제를 열기를 간청하고 있습니다.",
      choices: {
        festival_grand: {
          label: "성대한 황실 연회 개최",
          desc: "식량 60과 골드 40을 베풀어 민심을 결집합니다.",
          outcomeText: "백성들이 군주님의 은혜를 찬양하며 노동 생산성과 사기가 치솟았습니다!"
        },
        festival_modest: {
          label: "소박한 광장 축제",
          desc: "최소한의 자원으로 소규모 기념식을 엽니다.",
          outcomeText: "백성들이 따뜻한 분위기 속에서 감사함을 나누었습니다."
        },
        festival_ration: {
          label: "식량 비축 우선",
          desc: "축제를 생략하고 다가올 겨울을 위해 곡물을 보관합니다.",
          outcomeText: "축제는 취소되었으나 제국의 비축 곡물 창고는 가득 찼습니다."
        }
      }
    },
    "event-astral-rift": {
      title: "아스트랄 균열의 진동",
      subtitle: "원소 마력의 왜곡",
      emissaryName: "천문학자 시엘",
      emissaryRole: "황실 점성술사",
      description: "부유 섬 상공의 마법 균열에서 신비로운 청자색 에너지가 뿜어져 나오고 있습니다. 비전 마력이 고원에 가득 찹니다.",
      choices: {
        rift_harness: {
          label: "비전 마력 흡수 및 정제",
          desc: "마법 연구진을 투입하여 순수한 마나 수정을 추출합니다.",
          outcomeText: "연구진이 성공적으로 희귀 비전 크리스탈을 정제해 냈습니다!"
        },
        rift_seal: {
          label: "보호 결계로 봉인",
          desc: "석재 50을 소모하여 룬 봉인석을 설치합니다.",
          outcomeText: "결계가 안전하게 작동하여 왕국에 평온이 찾아왔습니다."
        },
        rift_observe: {
          label: "동태 관찰",
          desc: "직접 개입하지 않고 마력의 자연 소멸을 기다립니다.",
          outcomeText: "균열은 서서히 빛을 잃으며 밤하늘 속으로 사라졌습니다."
        }
      }
    },
    "event-guild-petition": {
      title: "장인 길드의 청원",
      subtitle: "도시 건축 지원 요청",
      emissaryName: "장인장 브록",
      emissaryRole: "석공 및 대장장이 조합장",
      description: "도시의 석공과 대장장이들이 신규 작업장 설립을 위한 세금 감면과 황실의 목재 지원을 청원하고 있습니다.",
      choices: {
        guild_grant: {
          label: "작업장 설립 전폭 지원",
          desc: "목재 80을 지원하여 장인들의 생산성을 높입니다.",
          outcomeText: "길드가 최신식 공방을 완공하여 건축 효율이 대폭 상승했습니다!"
        },
        guild_compromise: {
          label: "절충안 제시",
          desc: "소액의 골드 30만 지원합니다.",
          outcomeText: "장인들은 만족하며 황실의 지원금으로 공구를 정비했습니다."
        },
        guild_refuse: {
          label: "청원 기각",
          desc: "현재의 황실 자원을 국가 방어에 우선 배정합니다.",
          outcomeText: "장인들은 아쉬움을 삼키며 현재 작업장으로 돌아갔습니다."
        }
      }
    },
    "event-gambler": {
      title: "수수께끼의 도박사",
      subtitle: "주점의 내기",
      emissaryName: "외눈박이 핀",
      emissaryRole: "방랑 승부사",
      description: "주점에 나타난 수상한 사내가 왕실 금화와 희귀 보물을 걸고 주사위 대결을 제안합니다.",
      choices: {
        gambler_play: {
          label: "내기에 응하기",
          desc: "골드 50을 걸고 운을 시험합니다 (승리 시 큰 보상).",
          outcomeText: "탁월한 승부수로 승리하여 도박사의 희귀 보물 주머니를 획득했습니다!"
        },
        gambler_refuse: {
          label: "관심 없음",
          desc: "내기를 거절하고 성 밖으로 돌려보냅니다.",
          outcomeText: "도박사는 어깨를 으쓱하며 다른 주점으로 발걸음을 옮겼습니다."
        },
        gambler_arrest: {
          label: "불법 도박 혐의로 체포",
          desc: "성 근처의 불법 도박을 엄단하고 판돈을 몰수합니다.",
          outcomeText: "경비대가 가짜 주사위와 몰수된 금화 30을 왕실 금고에 귀속시켰습니다."
        }
      }
    },
    "event-wandering-knight": {
      title: "방랑하는 성기사",
      subtitle: "왕관을 향한 충성",
      emissaryName: "경 가레스",
      emissaryRole: "베테랑 성기사",
      description: "전투의 상흔이 남은 빛나는 갑주를 입은 기사가 깃발 앞에 무릎을 꿇고, 충성을 맹세하며 군대를 훈련시키겠다고 자청합니다.",
      choices: {
        knight_recruit: {
          label: "왕실 기사단장 임명",
          desc: "골드 100을 하사하고 정규 지휘관으로 등용합니다.",
          outcomeText: "경 가레스의 맹렬한 지휘 아래 주둔군 전체의 전투 규율과 공격력이 강화되었습니다!"
        },
        knight_hospitality: {
          label: "따뜻한 환대 제공",
          desc: "식량 30을 베풀고 축복의 기도를 받습니다.",
          outcomeText: "성기사는 따뜻한 식사에 감사하며 왕국 수호를 위한 신성한 축복을 남겼습니다."
        },
        knight_decline: {
          label: "정중한 거절",
          desc: "현재의 재정 여건상 새로운 기사를 맞이할 수 없습니다.",
          outcomeText: "기사는 고개를 숙여 예를 표한 뒤 또 다른 여정을 떠났습니다."
        }
      }
    }
  }
}

deepMerge(kr, koreanDeepPatch)

const output = `export const kr = ${JSON.stringify(kr, null, 2)}\n`
writeFileSync('./src/i18n/locales/kr.js', output, 'utf-8')
console.log('Successfully completed deep Korean localization patch!')
