import { writeFileSync } from 'fs'
import { cn } from '../src/i18n/locales/cn.js'

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

const chineseDeepPatch = {
  start: {
    title: "混沌王座",
    subtitle: "帝国锻造",
    emailPlaceholder: "your_email@example.com"
  },
  quests: {
    daily: {
      "daily-tribute": {
        title: "晨间进贡",
        desc: "从主城广场的各建筑物中收取税收与贡赋。"
      },
      "daily-garrison": {
        title: "守卫巡逻",
        desc: "在要塞驻军中保持至少6名整装待发的作战人员。"
      },
      "daily-campaign": {
        title: "边境警戒",
        desc: "在战役征途中攻占或赢得至少1个战斗据点。"
      }
    },
    epic: {
      "epic-castle-tier": {
        title: "黄金王座",
        desc: "将市政厅升级至3级。"
      },
      "epic-population-boom": {
        title: "繁荣帝国",
        desc: "达到至少50名定居者的殖民地人口容量。"
      },
      "epic-grand-army": {
        title: "无敌军团",
        desc: "在驻军中招募超过12名士兵的精锐军团。"
      }
    }
  },
  questData: {
    daily: {
      "daily-tribute": {
        title: "晨间进贡",
        desc: "从主城广场的各建筑物中收取税收与贡赋。"
      },
      "daily-garrison": {
        title: "守卫巡逻",
        desc: "在要塞驻军中保持至少6名整装待发的作战人员。"
      },
      "daily-campaign": {
        title: "边境警戒",
        desc: "在战役征途中攻占或赢得至少1个战斗据点。"
      }
    },
    epic: {
      "epic-castle-tier": {
        title: "黄金王座",
        desc: "将市政厅升级至3级。"
      },
      "epic-population-boom": {
        title: "繁荣帝国",
        desc: "达到至少50名定居者的殖民地人口容量。"
      },
      "epic-grand-army": {
        title: "无敌军团",
        desc: "在驻军中招募超过12名士兵的精锐军团。"
      }
    }
  },
  arena: {
    assaults: "突击次数",
    chooseRival: "🎯 选择你的对手",
    chooseRivalDesc: "选择实力相当的城寨。每次围城消耗1张突击门票。",
    lootBuildings: "🏰 掠夺3处建筑",
    lootBuildingsDesc: "在倒计时结束前，点击3处脆弱建筑攻破城防并提取资源。",
    yourSiegeForce: "当前攻城部队",
    power: "战力",
    breach: "攻破",
    rivalCitadels: "可攻打的对手城堡",
    newRivals: "换一批对手",
    assaultLoot: "突击战利品",
    honorPointsLabel: "荣誉点数",
    seasonEnd: "赛季结算倒计时：4天16小时",
    rank: "排名",
    sovereignKingdom: "君主与王国",
    league: "段位",
    victories: "胜利",
    crowns: "王冠",
    defenseTitle: "王国防御与围城日志",
    bazaarTitle: "帝国角斗士市集",
    owned: "已拥有",
    redeemPrize: "兑换奖励",
    yourSovereignty: "你的主权（本人）",
    chaosKingdom: "混沌王国",
    tabPvp: "竞技场",
    tabRanking: "排行榜",
    tabDefense: "防御",
    tabShop: "商城",
    attackBtn: "发起进攻"
  },
  shop: {
    bundles: {
      starter_pack: {
        title: "君王启航礼包",
        desc: "包含基础资源、神秘宝石及开国君主称号，助力王权崛起。"
      },
      war_pack: {
        title: "战争统帅军团",
        desc: "以精锐部队、攻城重械与狂怒魔药强化您的驻军前线。"
      },
      builder_pack: {
        title: "帝国皇家建造礼包",
        desc: "海量木材、坚石与建筑蓝图，急速扩展您的宏伟城堡。"
      },
      mythic_pack: {
        title: "混沌主宰至尊礼盒",
        desc: "终极宝箱，包含圣骑士英雄、史诗圣物及VIP黄金皇冠徽章。"
      }
    },
    vipTiers: {
      "0": {
        title: "平民",
        perk: "标准基础资源产出速率"
      },
      "1": {
        title: "男爵",
        perk: "建造速度提升5%，资源产量提升5%"
      },
      "2": {
        title: "公爵",
        perk: "全军攻击力增加10%，建造速度加快10%，产量提升10%"
      },
      "3": {
        title: "帝国最高领主",
        perk: "全境产出提升20%，5分钟内建筑瞬间免费完成，专属头像框"
      }
    },
    bundleItems: {
      commander: "圣骑士指挥官",
      relics: "史诗圣物箱",
      potions: "狂怒药水 x5",
      bombs: "奥术爆弹 x10",
      vipBadge: "VIP黄金皇冠徽章",
      title: "开国君主称号"
    }
  },
  shopItems: {
    gem_packs: {
      small: "一把宝石",
      medium: "一袋宝石",
      large: "皇家宝石宝箱",
      vault: "帝国王座金库"
    },
    bundles: {
      conqueror: {
        title: "征服者特惠宝箱",
        subtitle: "新晋君主独享专属特惠"
      },
      alliance: {
        title: "伟大同盟礼包",
        subtitle: "整装待发的帝国围城军团"
      }
    },
    bundleItems: {
      relicEmblem: "圣物：帝国烈阳纹章",
      titleConqueror: "皇家称号：'烈阳征服者'"
    },
    perks: {
      oneClickHarvest: "传令官号角（全城一键征收）",
      secondBuilder: "第二位帝国皇家工匠",
      dailyBlessing: "混沌每日赐福（尊享月卡）",
      engineering: "帝国工程精通"
    }
  },
  profile: {
    modalTitle: "君主档案",
    modalSubtitle: "帝国数据统计、功勋与传奇成就",
    tabOverview: "总览",
    tabAchievements: "成就",
    tabAvatars: "肖像",
    levelProgress: "等级进度",
    statPower: "帝国战力",
    statArmy: "现役军队",
    statDungeons: "地下城据点",
    statTech: "已研发科技",
    statArena: "竞技场王冠",
    passTitle: "帝国NFT通行证",
    passSubtitle: "混沌高悬群岛至高主宰",
    passMinted: "Web3链上铸造",
    passConnected: "钱包已连接",
    avatarSelectorTitle: "挑选君王肖像",
    avatarSelectorDesc: "选择将在帝国排行榜上向其他君主展示的外观面貌",
    achievementsTitle: "帝国伟业与勋章",
    achievements: {
      first_blood: {
        title: "烈火洗礼",
        desc: "在战役或地下城中赢得你的第一场战斗胜利。"
      },
      builder: {
        title: "首席建筑大师",
        desc: "在王国中建成至少5座不同建筑。"
      },
      warlord: {
        title: "巅峰战狂",
        desc: "在黑火城堡中彻底击溃兽人督军沃尔加斯。"
      },
      wealth: {
        title: "黄金宝库",
        desc: "在王室金库中积攒超过10,000枚金币。"
      },
      tactician: {
        title: "角斗霸主",
        desc: "在PvP竞技场中斩获1,000顶荣誉王冠。"
      },
      scholar: {
        title: "奥术博学士",
        desc: "在皇家大科学院中完成至少6项科技研究。"
      }
    }
  },
  menu: {
    selectLanguage: "选择语言 / Select Language:",
    creditsTitle: "混沌王座：帝国锻造",
    guestMode: "访客模式（本地链下）",
    tokenChaos: "代币 $CHAOS",
    syncingStateNotice: "正在与 TOC Chaos L2 链上同步王国状态..."
  },
  notifications: {
    web3WalletDisconnected: "Web3 钱包已断开连接",
    syncingBlockchain: "正在与 TOC Chaos L2 链上同步王国状态..."
  },
  inventoryItems: {
    slots: {
      head: "王冠 / 头盔",
      weapon: "皇家兵器",
      accessory: "圣物 / 护身符"
    },
    relics: {
      relic_corona_caos: {
        name: "混沌皇冠",
        desc: "所有金矿金币产量增加15%，大幅提升王国威望等级。",
        dropSource: "最高督军沃尔加斯（首个区域首领）"
      },
      relic_espada_jade: {
        name: "翡翠符文剑",
        desc: "全军攻击力增加20%，在战役与竞技场中造成毁灭性打击。",
        dropSource: "翡翠奥术巨龙（第二区域首领）"
      },
      relic_caliz_titan: {
        name: "寒冰泰坦王圣杯",
        desc: "全军防御力增加20%，在持久战中吸收大量剧烈冲击。",
        dropSource: "极地泰坦王（第三区域终极首领）"
      },
      relic_broquel_hierro: {
        name: "黑铁圆盾",
        desc: "全军防御增加15%，提高攻城战与远征中的部队存活率。",
        dropSource: "铁甲卫士兽人（首个区域）"
      },
      relic_amuleto_selva: {
        name: "翡翠密林护身符",
        desc: "粮食产出增加15%，大幅提升农夫劳作收获效率。",
        dropSource: "影袭猎豹（第二区域）"
      },
      relic_emblema_leon: {
        name: "帝国烈阳纹章",
        desc: "金币总产量增加20%，每日皇家供奉收益翻倍。",
        dropSource: "征服者特惠宝箱（独家尊享）"
      },
      relic_manto_vencedor: {
        name: "胜者荣耀斗篷",
        desc: "攻击力增加10%，防御力增加10%，竞技场冠军的专属传说披风。",
        dropSource: "角斗士荣誉商店"
      }
    },
    consumables: {
      potion_heal: {
        name: "强效治疗药剂",
        desc: "在地下城与竞技场决斗中瞬间回复40%生命值。"
      },
      potion_focus: {
        name: "专注灵药",
        desc: "在接下来的单场战斗中使暴击伤害提升25%。"
      },
      bomb_dwarf: {
        name: "矮人烈性火药弹",
        desc: "引发剧烈爆破，瞬间对全场敌人造成200点范围伤害。"
      }
    }
  },
  arenaItems: {
    leagues: {
      league_bronze: "青铜联赛",
      league_silver: "白银联赛",
      league_gold: "黄金联赛",
      league_platinum: "铂金联赛",
      league_master: "至高主宰联赛"
    },
    honorShop: {
      honor_relic_mantle: "胜者荣耀斗篷",
      honor_shield_8h: "停战和平护盾（8小时）",
      honor_shield_24h: "停战和平护盾（24小时）",
      honor_gems_60: "一袋奥术宝石（60颗）",
      honor_chest_war: "军事军需重箱",
      item_relic_manto_vencedor: "胜者荣耀斗篷",
      item_shield_8h: "停战和平护盾（8小时）",
      item_shield_24h: "停战和平护盾（24小时）",
      item_gems_pouch: "一袋奥术宝石（60颗）",
      item_war_chest: "军事军需重箱"
    }
  },
  ranking: {
    tag: "帝国荣誉殿堂",
    title: "帝国君主天梯榜",
    secondPlace: "亚军",
    champion: "冠军",
    thirdPlace: "季军",
    yourRank: "你的排名",
    yourActiveFortress: "当前统治的城塞",
    colRank: "名次",
    colSovereign: "君王",
    colTitleDetails: "称号与领地",
    colScore: "战绩积分",
    goToArena: "前往竞技场",
    goToDungeons: "探索地下城",
    backToKingdom: "返回主城",
    categories: {
      power: "领地战力",
      arena: "竞技场王冠",
      dungeon: "地下城层数"
    },
    powerUnit: "战力",
    crownsUnit: "王冠",
    floorUnit: "层",
    tournamentInProgress: "赛季锦标赛激战中",
    globalRank: "全服排名",
    seasonTimerLead: "帝国赛季结算：",
    seasonTimerTail: "后结束",
    stars: "星级",
    leagues: {
      "Maestro Arcano": "奥术宗师",
      "Platino Real": "皇家白金",
      "Oro Veterano": "百战老兵黄金",
      "Plata Guerrero": "骁勇战者白银",
      "Bronce Novicio": "初出茅庐青铜"
    },
    sovereigns: {
      "sov-1": { name: "马拉科尔霸王", kingdom: "混沌帝国", title: "太初古帝" },
      "sov-2": { name: "阿斯特丽德女武神", kingdom: "雷霆要塞", title: "女武神领主" },
      "sov-3": { name: "罗兰圣骑士", kingdom: "拂晓圣塞", title: "神圣防卫者" },
      "sov-4": { name: "伊格尼斯大贤者", kingdom: "奥术高塔", title: "烈焰驭者" },
      "sov-5": { name: "瓦莱里乌斯国王", kingdom: "金狮领地", title: "王冠正统" },
      "sov-6": { name: "沃尔加尔战狂", kingdom: "血染铁壁", title: "北境毁灭者" },
      "sov-7": { name: "凯伦大公", kingdom: "复仇之境", title: "夜行猎鹰" },
      "sov-8": { name: "希尔瓦娜夫人", kingdom: "暗影之森", title: "月光神射手" },
      "sov-9": { name: "罗德里克元帅", kingdom: "钢铁城垒", title: "不破之壁" },
      "sov-10": { name: "马拉科尔先锋", kingdom: "风暴之巅", title: "狂飙之刃" },
      "sov-11": { name: "卡珊德拉女领主", kingdom: "黄金先锋军", title: "圣光女皇" },
      "sov-12": { name: "巴尔萨泽公爵", kingdom: "巨龙圣塞", title: "真龙血脉" },
      "sov-13": { name: "莫德雷德男爵", kingdom: "幽冥荒原", title: "黑骑游侠" },
      "sov-14": { name: "埃琳娜伯爵夫人", kingdom: "霜雾寒谷", title: "冰魄支配者" },
      "sov-15": { name: "戈德里克骑士统领", kingdom: "黄昏之门", title: "信义坚壁" }
    }
  },
  techTree: {
    tag: "王国皇家最高科学院",
    title: "帝国前沿科技研发"
  },
  avatars: {
    king: {
      name: "瓦莱里乌斯国王",
      title: "执掌王冠之主"
    },
    valkyrie: {
      name: "阿斯特丽德女武神",
      title: "苍穹庇护之盾"
    },
    paladin: {
      name: "罗兰圣骑士",
      title: "神圣守望者"
    },
    mage: {
      name: "伊格尼斯大贤者",
      title: "奥术烈焰编织者"
    }
  },
  expeditions: {
    modalTitle: "远征与战役地下城",
    modalSubtitle: "派遣你的军团跨越浮空高原，掠夺未知遗迹的宝藏",
    forcesReady: "整装待发的兵力：",
    soldiers: "战士",
    readinessOptimal: "战备极佳",
    readinessBasic: "基础兵力",
    readinessLow: "驻军告急",
    heroBannerTitle: "混沌地下城：精准致命一击决斗！",
    heroBannerDesc: "配合时钟指针节拍逐层击溃敌人，最终诛灭混沌战狂督军。",
    heroBannerBtn: "踏入地下城！",
    victoryTitle: "辉煌大胜！",
    spoilsTitle: "搜刮的奇珍宝藏与战利品：",
    claimSpoilsBtn: "收取战利品并凯旋回朝",
    enemyLabel: "敌方守军：",
    winChanceLabel: "预估胜率：",
    highRisk: "极高风险 (<30%)",
    lootLabel: "战利品：",
    dispatchBtn: "拔营出征",
    dispatchTooltip: "派遣军团奔赴战场",
    dispatchDisabledTooltip: "需要更多的兵力支援",
    difficulties: {
      easy: "普通",
      medium: "中等",
      hard: "困难",
      boss: "精英首领"
    },
    items: {
      "exp-1": {
        name: "混沌军团地宫",
        region: "西陲边防线",
        duration: "3间密室",
        description: "穿过3间地下密室，连续斩杀哥布林、狂暴兽人并直面混沌战狂督军。",
        enemySquad: "哥布林 -> 烈焰兽人狂战士 -> 督军沃尔加斯 [首领]"
      },
      "exp-2": {
        name: "翡翠巨龙圣殿",
        region: "翡翠密林",
        duration: "4间密室",
        description: "击溃古代元素守卫，夺回失落已久的远古翡翠符文剑。",
        enemySquad: "密林幽豹 -> 德鲁伊射手 -> 翡翠奥术巨龙 [首领]"
      },
      "exp-3": {
        name: "极地泰坦寒冰圣垒",
        region: "极北雪峰",
        duration: "5间密室",
        description: "顶着暴风雪穿透极地防线，向高傲的冰霜泰坦王发起神圣挑战。",
        enemySquad: "冰原雪狼 -> 霜岩魔像 -> 极地冰霜巨人 -> 寒冰泰坦王 [首领]"
      },
      "exp-4": {
        name: "混沌虚空深渊裂隙",
        region: "星界虚无",
        duration: "5间密室",
        description: "彻底肃清从时空裂缝中不断涌现的虚空军团，守护浮岛根基。",
        enemySquad: "虚空猎手 -> 深渊奥术巫师 -> 混沌主宰 [终极首领]"
      }
    }
  },
  dungeonCombat: {
    dungeonName: "黑火城堡：与兽人的生死决斗",
    dungeonSubtitle: "电影级沉浸决斗 - 前3座地下城",
    bossBadge: "[首领]",
    closeTitle: "离开地下城",
    playerHeroName: "皇家捍卫冠军",
    duelBadge: "决斗",
    timingMiss: "未击中",
    timingGood: "良好",
    timingPerfect: "完美！",
    timingCritical: "致命暴击！！",
    strikeBtn: "雷霆致命一击！",
    strikeHint: "[空格键]",
    quitWithLootBtn: "携战利品撤退",
    dungeonVictoryTitle: "地下城彻底征服！！",
    claimLegendaryLootBtn: "为帝国迎回传奇战利品",
    defeatTitle: "英雄在战斗中倒下",
    retryBtn: "重新决斗",
    returnCityBtn: "返回主城",
    rooms: {
      "0": {
        name: "兽人先锋侦察兵",
        title: "荒原先锋斥候"
      },
      "1": {
        name: "烈焰兽人狂战士",
        title: "炽烈重斧守护者"
      },
      "2": {
        name: "兽人督军沃尔加斯",
        title: "黑火城堡的暴君"
      }
    }
  },
  kingdomEvents: {
    "event-caravan": {
      title: "皇家丝绸商队",
      subtitle: "东方贸易线来访",
      emissaryName: "瓦妮娅夫人",
      emissaryRole: "大漠商队总领",
      description: "一支满载异域锦缎与辛香料的庞大骆驼商队行至主城门口，祝愿领地繁荣昌盛并呈上通商提议。",
      choices: {
        trade_wood_food: {
          label: "以木材兑换粮饷",
          description: "交出盈余木材，换取成袋新鲜饱满的粮食储备。",
          outcomeText: "交易达成！商队卸下了丰盛的粮食，充足滋养了全城定居者。"
        },
        trade_gold_gems: {
          label: "采购奥术晶石",
          description: "支付帝国金币，买下从遥远荒原采掘出的稀有宝石。",
          outcomeText: "瓦妮娅夫人向您呈上一袋从深邃矿洞中采集的璀璨晶石。"
        },
        trade_decline: {
          label: "礼貌谢绝告别",
          description: "感谢远道而来的商队，但保留王国的各项储备不予动用。",
          outcomeText: "商队队伍整肃，心满意足地向下一座山谷平稳行进。"
        }
      }
    },
    "event-alchemist": {
      title: "流浪炼金术士的秘药",
      subtitle: "秘术与点金转化",
      emissaryName: "伊格尼斯大师",
      emissaryRole: "黄金兄弟会学士",
      description: "一位身穿星辰长袍、手持烟雾试剂瓶的年长炼金术士声称已掌握倍增黄金与矿石的点金秘方。",
      choices: {
        alchemist_transmute: {
          label: "资助点金奇迹实验",
          description: "提供部分石料与少量金币，尝试炼制纯金金条。",
          outcomeText: "试剂瓶爆发出耀眼的金色光芒！实验取得了空前的圆满成功。"
        },
        alchemist_gems: {
          label: "购买结晶酊剂",
          description: "投资一笔金币，获取一瓶高度浓缩的结晶奥术精华。",
          outcomeText: "药瓶融化，留下了数枚极具奥术价值的高纯度宝石。"
        },
        alchemist_reject: {
          label: "怀疑欺诈并予以驱逐",
          description: "切勿将王室金库的资财押注于来路不明的危险巫术。",
          outcomeText: "炼金术士一边嘟囔着收起器皿，一边在硫磺烟雾中悄然离去。"
        }
      }
    },
    "event-bandits": {
      title: "边境密林的突袭",
      subtitle: "强盗流寇的威胁",
      emissaryName: "残暴者格鲁克",
      emissaryRole: "边陲法外狂徒头目",
      description: "一伙盘踞在东部丘陵的强盗公然威胁，若不立刻支付重金，便要彻底洗劫过往的粮饷补给车队。",
      choices: {
        bandits_fight: {
          label: "调遣精锐卫队围剿",
          description: "部署精兵合围并扫荡叛匪营地，彰显军威。",
          outcomeText: "将士们一举荡平匪巢！追回了大量被掠物资并充缴国库。"
        },
        bandits_bribe: {
          label: "交纳买路钱以求安宁",
          description: "递交一箱金币，诱使他们前往其他领地寻求发财之路。",
          outcomeText: "暴徒们掠走金币，暂时撤离了您的王国辖区。"
        },
        bandits_barricade: {
          label: "加固边防前沿哨所",
          description: "调拨木材筑造坚韧栅栏与箭塔，护卫农户周全。",
          outcomeText: "坚固的防御工事使强盗望而生畏，只得狼狈放弃劫掠计划。"
        }
      }
    },
    "event-harvest-festival": {
      title: "秋收盛大国宴",
      subtitle: "全民欢庆大典",
      emissaryName: "埃里克镇长",
      emissaryRole: "领地定居者发言人",
      description: "麦田连年丰收，全城百姓渴求在王城中央广场举办一场盛大宴会，以振奋士气并向王座致敬。",
      choices: {
        festival_grand: {
          label: "资助豪华皇家宴席",
          description: "慷慨拨付充足的粮食与金币，请来乐师与甘醇佳酿供全民欢庆。",
          outcomeText: "广场上欢歌笑语、歌颂君主！民众忠心爆棚，带来了丰厚的经验与贡纳。"
        },
        festival_modest: {
          label: "举办简朴社区茶话宴",
          description: "按标准配给调拨适量食物，组织一场朴素温暖的庆祝活动。",
          outcomeText: "民众倍感君王关怀，自发为国库筹集了一小笔心意捐款。"
        },
        festival_cancel: {
          label: "厉行节约以备战事",
          description: "向百姓阐明每一粒粮食都必须完好保存在防备荒年的粮仓中。",
          outcomeText: "定居者们深刻理解了领主的远虑，纷纷毫无怨言地重返岗位。"
        }
      }
    },
    "event-astral-rift": {
      title: "隐士的星界裂缝",
      subtitle: "超自然魔法异象",
      emissaryName: "占星师塞勒涅",
      emissaryRole: "界幕观察学者",
      description: "在幽谷废墟旁赫然出现一道闪耀着紫光与群星私语的裂缝，纯净晶石在漩涡中静静漂浮。",
      choices: {
        astral_channel: {
          label: "以奥术宝石引导共鸣",
          description: "投入宝石稳固裂隙，并提取源源不断的浓缩元素材料。",
          outcomeText: "裂隙在和谐中稳健内爆，释放出极其丰沛的元素财富！"
        },
        astral_study: {
          label: "记录宇宙回响频率",
          description: "指令随行贤者在异象消散之前潜心抄录下神秘的星象符文。",
          outcomeText: "塞勒涅成功破译了天外符文，并奉献了3枚群星璀璨碎片。"
        }
      }
    },
    "event-guild-petition": {
      title: "工匠公会的请愿",
      subtitle: "建筑规划与工程",
      emissaryName: "托林工匠大师",
      emissaryRole: "石匠工会会长",
      description: "采石场与伐木场的工头们恳请拨付专款添置新型滑轮与水力锯，以显著加快资源的开采效率。",
      choices: {
        guild_invest: {
          label: "全面引进现代化机械",
          description: "拨付金币与木材，为工匠们换装最先进的工程器械。",
          outcomeText: "新式起重机运转如飞，巨大花岗岩石料被昼夜不息地源源产出！"
        },
        guild_reinforce: {
          label: "为夜班矿工增发口粮",
          description: "调拨优质粮食，犒劳辛勤奋战在深夜前线的工匠团队。",
          outcomeText: "吃饱喝足的伐木工以惊人的创纪录速率运回了大量栋梁之材。"
        },
        guild_postpone: {
          label: "延期至下个季度办理",
          description: "优先将经费调度用于王国当务之急的开支事项。",
          outcomeText: "工头们服从调度，转而潜心保养现有器械以维持产出。"
        }
      }
    },
    "event-gambler": {
      title: "红骰狂徒的赌局",
      subtitle: "机遇与命运博弈",
      emissaryName: "老千杰克",
      emissaryRole: "酒馆赌徒",
      description: "一名身披天鹅绒斗篷的无赖展示出两枚龙骨打磨的骰子：\"尊贵的陛下，敢不敢来一把？要么满载双倍而归，要么空手离场。\"",
      choices: {
        gambler_roll_gold: {
          label: "押注100金币（孤注一掷）",
          description: "放手一搏，测试你的帝王气运。",
          outcomeText: "掷出黄金六点！杰克咬牙切齿地双手奉上装满260金币的沉重钱袋。"
        },
        gambler_roll_gems: {
          label: "押注3颗烈焰宝石",
          description: "以珍贵宝石作为筹码展开高风险博弈。",
          outcomeText: "奇迹般的双骰胜出！赌徒只得极不情愿地交出了一袋闪闪发光的稀有水晶。"
        },
        gambler_arrest: {
          label: "严正驱逐出主城广场",
          description: "王国律法严厉取缔城堡附近的地下非法聚赌。",
          outcomeText: "卫兵当场没收了作弊骰子以及一袋装有30枚硬币的小钱袋。"
        }
      }
    },
    "event-wandering-knight": {
      title: "流浪的无主圣骑",
      subtitle: "向帝国王冠尽忠",
      emissaryName: "十字骑士加雷斯爵士",
      emissaryRole: "资深百战圣骑",
      description: "一位身着略有磨损但擦得锃亮重甲的骑士单膝跪在军旗下，誓言效忠王廷并愿协助操练驻军。",
      choices: {
        knight_hire_heavy: {
          label: "授衔并编入常备要塞（+2 重步兵）",
          description: "提供安顿居所与丰厚薪饷，将其纳入重步兵序列。",
          outcomeText: "加雷斯爵士率领2名精锐重装战士庄严加入您的主城军团！"
        },
        knight_hire_scouts: {
          label: "委任为射术总教头（+2 神射手）",
          description: "拨付金币命其专职操练领地的精锐射手。",
          outcomeText: "在加雷斯爵士的严苛调教下，射手箭无虚发，军团新增2名百步穿杨的精兵。"
        },
        knight_bless: {
          label: "赐予盘缠与充足干粮",
          description: "祝愿他一路顺风，并资助途中所需的军粮与清水。",
          outcomeText: "骑士深表感激，郑重许诺必将在北方大地广为传颂君王的仁德。"
        }
      }
    }
  }
}

deepMerge(cn, chineseDeepPatch)

const output = `export const cn = ${JSON.stringify(cn, null, 2)}\n`
writeFileSync('./src/i18n/locales/cn.js', output, 'utf-8')
console.log('Successfully completed deep Chinese localization patch!')
