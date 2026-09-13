import { writeFileSync } from 'fs'
import { br } from '../src/i18n/locales/br.js'

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

const brazilianDeepPatch = {
  start: {
    title: "TRONO DO CAOS",
    subtitle: "FORJA DE IMPÉRIOS",
    emailPlaceholder: "seu_email@exemplo.com"
  },
  quests: {
    daily: {
      "daily-tribute": {
        title: "Tributo Matinal",
        desc: "Colete tributos e impostos dos edifícios da praça central."
      },
      "daily-garrison": {
        title: "Patrulha da Guarda",
        desc: "Mantenha ao menos 6 combatentes prontos para batalha na guarnição."
      },
      "daily-campaign": {
        title: "Vigília de Fronteira",
        desc: "Conquiste ou vença pelo menos 1 nó de combate na Campanha."
      }
    },
    epic: {
      "epic-castle-tier": {
        title: "O Trono Dourado",
        desc: "Evolua a Prefeitura para o Nível 3."
      },
      "epic-population-boom": {
        title: "Império em Expansão",
        desc: "Atinja a capacidade de população de pelo menos 50 colonos."
      },
      "epic-grand-army": {
        title: "Legião Invencível",
        desc: "Recrute um contingente de mais de 12 tropas na sua guarnição."
      }
    }
  },
  questData: {
    daily: {
      "daily-tribute": {
        title: "Tributo Matinal",
        desc: "Colete tributos e impostos dos edifícios da praça central."
      },
      "daily-garrison": {
        title: "Patrulha da Guarda",
        desc: "Mantenha ao menos 6 combatentes prontos para batalha na guarnição."
      },
      "daily-campaign": {
        title: "Vigília de Fronteira",
        desc: "Conquiste ou vença pelo menos 1 nó de combate na Campanha."
      }
    },
    epic: {
      "epic-castle-tier": {
        title: "O Trono Dourado",
        desc: "Evolua a Prefeitura para o Nível 3."
      },
      "epic-population-boom": {
        title: "Império em Expansão",
        desc: "Atinja a capacidade de população de pelo menos 50 colonos."
      },
      "epic-grand-army": {
        title: "Legião Invencível",
        desc: "Recrute um contingente de mais de 12 tropas na sua guarnição."
      }
    }
  },
  arena: {
    assaults: "Assaltos",
    chooseRival: "🎯 Escolha seu Rival",
    chooseRivalDesc: "Selecione uma fortaleza de poder similar. Cada cerco consome 1 bilhete.",
    lootBuildings: "🏰 Saquear 3 Edifícios",
    lootBuildingsDesc: "Toque nos 3 edifícios vulneráveis para romper suas defesas e extrair recursos antes que o tempo acabe.",
    yourSiegeForce: "Sua Força de Cerco Atual",
    power: "Poder",
    breach: "Romper",
    rivalCitadels: "Cidadelas Rivais para Cerco",
    newRivals: "Novos Rivais",
    assaultLoot: "Saque do Assalto",
    honorPointsLabel: "Pontos de Honra",
    seasonEnd: "Temporada encerra em: 4 dias e 16 horas",
    rank: "Classificação",
    sovereignKingdom: "Soberano e Reino",
    league: "Liga",
    victories: "Vitórias",
    crowns: "Coroas",
    defenseTitle: "Defesa do Reino e Registro de Cercos",
    bazaarTitle: "Bazar do Gladiador Imperial",
    owned: "Possui",
    redeemPrize: "Resgatar Prêmio",
    yourSovereignty: "Sua Soberania (Você)",
    chaosKingdom: "Reino do Caos",
    tabPvp: "Coliseu",
    tabRanking: "Classificação",
    tabDefense: "Defesa",
    tabShop: "Loja",
    attackBtn: "Atacar"
  },
  shop: {
    bundles: {
      starter_pack: {
        title: "Pacote Inicial do Soberano",
        desc: "Inicie seu reinado com recursos essenciais, gemas e título de fundador."
      },
      war_pack: {
        title: "Batalhão Hostil de Guerra",
        desc: "Reforce sua guarnição com tropas de elite, armas de cerco e poções de fúria."
      },
      builder_pack: {
        title: "Pacote do Arquiteto Imperial",
        desc: "Madeira maciça, granito e projetos para expandir sua fortaleza rapidamente."
      },
      mythic_pack: {
        title: "Pacote Supremo do Soberano do Caos",
        desc: "Baú lendário contendo o Herói Paladino, relíquias épicas e distintivo VIP de Coroa."
      }
    },
    vipTiers: {
      "0": {
        title: "Cidadão",
        perk: "Taxa padrão de produção de recursos"
      },
      "1": {
        title: "Barão",
        perk: "+5% Velocidade de Construção, +5% Produção de Recursos"
      },
      "2": {
        title: "Duque",
        perk: "+10% Ataque do Exército, +10% Velocidade de Construção, +10% Produção"
      },
      "3": {
        title: "Soberano Imperial",
        perk: "+20% Produção Global, Conclusão Imediata sob 5m, Moldura de Avatar Exclusiva"
      }
    },
    bundleItems: {
      commander: "Comandante Paladino",
      relics: "Baú de Relíquias Épicas",
      potions: "5x Poções de Fúria",
      bombs: "10x Bombas Arcanas",
      vipBadge: "Distintivo Coroa VIP",
      title: "Título de Fundador"
    }
  },
  shopItems: {
    gem_packs: {
      small: "Punhado de Gemas",
      medium: "Bolsa de Gemas",
      large: "Baú Imperial de Gemas",
      vault: "Cofre do Trono"
    },
    bundles: {
      conqueror: {
        title: "Baú do Conquistador",
        subtitle: "Oferta de Boas-Vindas para o Soberano"
      },
      alliance: {
        title: "Pacote da Grande Aliança",
        subtitle: "Legião Imperial Pronta para o Cerco"
      }
    },
    bundleItems: {
      relicEmblem: "Relíquia: Emblema do Sol Imperial",
      titleConqueror: "Título Real: 'O Conquistador Solar'"
    },
    perks: {
      oneClickHarvest: "Berrante do Arauto (Colheita Total)",
      secondBuilder: "Segundo Construtor Real",
      dailyBlessing: "Bênção Diária do Caos (Passe Mensal)",
      engineering: "Mestria em Engenharia Imperial"
    }
  },
  profile: {
    modalTitle: "Perfil do Soberano",
    modalSubtitle: "Estatísticas do Império, Legado e Conquistas",
    tabOverview: "Visão Geral",
    tabAchievements: "Conquistas",
    tabAvatars: "Retratos",
    levelProgress: "Progresso do Nível",
    statPower: "Poder Imperial",
    statArmy: "Exército Ativo",
    statDungeons: "Masmorras Dominadas",
    statTech: "Pesquisas Concluídas",
    statArena: "Pontos de Arena",
    passTitle: "Passe NFT Imperial",
    passSubtitle: "Soberano do Planalto do Caos",
    passMinted: "Cunhado na Web3",
    passConnected: "Carteira Conectada",
    avatarSelectorTitle: "Selecionar Retrato do Monarca",
    avatarSelectorDesc: "Escolha a aparência visível do seu soberano nas classificações imperiais",
    achievementsTitle: "Feitos Imperiais e Conquistas",
    achievements: {
      first_blood: {
        title: "Batismo de Fogo",
        desc: "Vença sua primeira batalha na Campanha ou Masmorra."
      },
      builder: {
        title: "Mestre Arquiteto",
        desc: "Construa pelo menos 5 edifícios no reino."
      },
      warlord: {
        title: "Senhor da Guerra Supremo",
        desc: "Derrote o Senhor da Guerra Orc Vorgath na Cidadela."
      },
      wealth: {
        title: "Tesouro Dourado",
        desc: "Acumule 10.000 de Ouro no tesouro real."
      },
      tactician: {
        title: "Gladiador da Arena",
        desc: "Alcance 1.000 coroas na Arena PvP."
      },
      scholar: {
        title: "Erudito Arcano",
        desc: "Pesquise pelo menos 6 tecnologias na Grande Academia."
      }
    }
  },
  menu: {
    selectLanguage: "Selecionar Idioma / Select Language:",
    creditsTitle: "Trono do Caos: Forja de Impérios",
    guestMode: "Modo Convidado (Off-chain)",
    tokenChaos: "Token $CHAOS",
    syncingStateNotice: "Sincronizando estado do reino com TOC Chaos L2..."
  },
  notifications: {
    web3WalletDisconnected: "Carteira Web3 desconectada",
    syncingBlockchain: "Sincronizando estado do reino com TOC Chaos L2..."
  },
  inventoryItems: {
    slots: {
      head: "Coroa / Elmo",
      weapon: "Arma Real",
      accessory: "Relíquia / Talismã"
    },
    relics: {
      relic_corona_caos: {
        name: "Coroa do Caos",
        desc: "+15% de produção de Ouro em todas as minas. Eleva o prestígio do reino.",
        dropSource: "Senhor Supremo Vorgath (Chefe do Bioma 1)"
      },
      relic_espada_jade: {
        name: "Espada Rúnica de Jade",
        desc: "+20% de Ataque Militar. Golpes devastadores em campanhas e arenas.",
        dropSource: "Dragão Arcano de Jade (Chefe do Bioma 2)"
      },
      relic_caliz_titan: {
        name: "Cálice do Rei Titã de Gelo",
        desc: "+20% de Defesa. Absorve impactos pesados em combates prolongados.",
        dropSource: "Rei Titã do Gelo (Chefe Final do Bioma 3)"
      },
      relic_broquel_hierro: {
        name: "Broquel de Ferro Negro",
        desc: "+15% de Defesa. Aumenta a sobrevivência das tropas em cercos e campanhas.",
        dropSource: "Orc Guarda de Ferro (Bioma 1)"
      },
      relic_amuleto_selva: {
        name: "Amuleto da Selva Esmeralda",
        desc: "+15% de produção de Alimento. Aumenta a eficiência das colheitas.",
        dropSource: "Pantera das Sombras (Bioma 2)"
      },
      relic_emblema_leon: {
        name: "Emblema do Sol Imperial",
        desc: "+20% de produção de Ouro. Dobra os tributos reais diários.",
        dropSource: "Baú do Conquistador (Oferta Exclusiva)"
      },
      relic_manto_vencedor: {
        name: "Manto do Vencedor",
        desc: "+10% ATQ e +10% DEF. Uma capa lendária para campeões da Arena.",
        dropSource: "Loja de Honra do Coliseu"
      }
    },
    consumables: {
      potion_heal: {
        name: "Poção Maior de Vida",
        desc: "Restaura 40% da vida em combates de masmorra e arena."
      },
      potion_focus: {
        name: "Elixir de Foco",
        desc: "Aumenta o dano crítico em 25% por 1 combate."
      },
      bomb_dwarf: {
        name: "Bomba Anã de Pólvora",
        desc: "Causa 200 de dano em área a todos os inimigos em uma explosão."
      }
    }
  },
  arenaItems: {
    leagues: {
      league_bronze: "Liga Bronze",
      league_silver: "Liga Prata",
      league_gold: "Liga Ouro",
      league_platinum: "Liga Platina",
      league_master: "Soberano Supremo"
    },
    honorShop: {
      honor_relic_mantle: "Manto do Vencedor",
      honor_shield_8h: "Escudo de Paz (8 Horas)",
      honor_shield_24h: "Escudo de Paz (24 Horas)",
      honor_gems_60: "Bolsa com 60 Gemas Arcanas",
      honor_chest_war: "Baú de Suprimentos Militares",
      item_relic_manto_vencedor: "Manto do Vencedor",
      item_shield_8h: "Escudo de Paz (8 Horas)",
      item_shield_24h: "Escudo de Paz (24 Horas)",
      item_gems_pouch: "Bolsa com 60 Gemas Arcanas",
      item_war_chest: "Baú de Suprimentos Militares"
    }
  },
  ranking: {
    tag: "Salão da Glória Imperial",
    title: "Classificação dos Soberanos",
    secondPlace: "2º Lugar",
    champion: "Campeão",
    thirdPlace: "3º Lugar",
    yourRank: "Sua Posição",
    yourActiveFortress: "Sua Fortaleza Ativa",
    colRank: "Posição",
    colSovereign: "Soberano",
    colTitleDetails: "Título e Domínio",
    colScore: "Pontuação",
    goToArena: "Ir para a Arena",
    goToDungeons: "Ir para Masmorras",
    backToKingdom: "Voltar ao Reino",
    categories: {
      power: "Poder do Reino",
      arena: "Coroas da Arena",
      dungeon: "Andares de Masmorra"
    },
    powerUnit: "Poder",
    crownsUnit: "Coroas",
    floorUnit: "Andar",
    tournamentInProgress: "Torneio de Temporada em Andamento",
    globalRank: "Classificação Global",
    seasonTimerLead: "Temporada Imperial:",
    seasonTimerTail: "restantes",
    stars: "Estrelas",
    leagues: {
      "Maestro Arcano": "Mestre Arcano",
      "Platino Real": "Platina Real",
      "Oro Veterano": "Ouro Veterano",
      "Plata Guerrero": "Prata Guerreiro",
      "Bronce Novicio": "Bronze Novato"
    },
    sovereigns: {
      "sov-1": { name: "Soberano Malakor", kingdom: "Império do Caos", title: "Imperador Primordial" },
      "sov-2": { name: "Rainha Valquíria Astrid", kingdom: "Bastião do Trovão", title: "Senhora das Valquírias" },
      "sov-3": { name: "Paladino Roland", kingdom: "Cidadela da Alvorada", title: "Defensor Sagrado" },
      "sov-4": { name: "Arquimago Ignis", kingdom: "Torre Astral", title: "Mestre do Fogo Arcano" },
      "sov-5": { name: "Rei Valerius", kingdom: "Domínio do Leão Dourado", title: "Senhor da Coroa" },
      "sov-6": { name: "Belicista Vorgar", kingdom: "Muralhas de Ferro", title: "Destruidor do Norte" },
      "sov-7": { name: "Duque Kaelen", kingdom: "Terras da Vingança", title: "Rastreador Noturno" },
      "sov-8": { name: "Lady Sylvana", kingdom: "Floresta Sombria", title: "Arqueira do Luar" },
      "sov-9": { name: "Marechal Roderic", kingdom: "Muralhas Inabaláveis", title: "Escudo Impenetrável" },
      "sov-10": { name: "Vanguarda Malakor", kingdom: "Pico da Tempestade", title: "Lâmina da Tormenta" },
      "sov-11": { name: "Lady Cassandra", kingdom: "Vanguarda Dourada", title: "Rainha da Luz" },
      "sov-12": { name: "Duque Balthazar", kingdom: "Cidadela do Dragão", title: "Linhagem Dracônica" },
      "sov-13": { name: "Barão Mordred", kingdom: "Ermos Sombrios", title: "Cavaleiro Negro" },
      "sov-14": { name: "Condessa Elena", kingdom: "Vale da Névoa Congelada", title: "Soberana do Gelo" },
      "sov-15": { name: "Comandante Godric", kingdom: "Portão do Crepúsculo", title: "Bastião da Fé" }
    }
  },
  techTree: {
    tag: "Grande Academia do Reino",
    title: "Pesquisa Real"
  },
  avatars: {
    king: {
      name: "Rei Valerius",
      title: "Senhor da Coroa"
    },
    valkyrie: {
      name: "Valquíria Astrid",
      title: "Escudo dos Céus"
    },
    paladin: {
      name: "Paladino Roland",
      title: "Defensor Sagrado"
    },
    mage: {
      name: "Arquimago Ignis",
      title: "Mestre do Fogo Arcano"
    }
  },
  expeditions: {
    modalTitle: "Expedições e Masmorras de Campanha",
    modalSubtitle: "Envie seus regimentos além do planalto flutuante para resgatar tesouros",
    forcesReady: "Tropas prontas para o combate:",
    soldiers: "soldados",
    readinessOptimal: "Prontidão Ótima",
    readinessBasic: "Forças Básicas",
    readinessLow: "Guarnição Escassa",
    heroBannerTitle: "Masmorras do Caos: Duelo com Golpe Crítico!",
    heroBannerDesc: "Lute sala por sala ajustando o medidor de precisão e derrote o Senhor da Guerra do Caos.",
    heroBannerBtn: "Entrar na Masmorra!",
    victoryTitle: "Vitória Gloriosa!",
    spoilsTitle: "Tesouros e Espólios Resgatados:",
    claimSpoilsBtn: "Reivindicar Espólios e Retornar ao Trono",
    enemyLabel: "Inimigo:",
    winChanceLabel: "Chance:",
    highRisk: "Alto Risco (<30%)",
    lootLabel: "Espólios:",
    dispatchBtn: "Despachar",
    dispatchTooltip: "Despachar batalhão para a batalha",
    dispatchDisabledTooltip: "Mais soldados necessários",
    difficulties: {
      easy: "Fácil",
      medium: "Médio",
      hard: "Difícil",
      boss: "Elite"
    },
    items: {
      "exp-1": {
        name: "Criptas da Legião do Caos",
        region: "Fronteira Ocidental",
        duration: "3 Salas",
        description: "Avance por 3 câmaras subterrâneas derrotando goblins, orcs e o Senhor do Caos.",
        enemySquad: "Goblin -> Orc Berserker -> Senhor Vorgath [CHEFE]"
      },
      "exp-2": {
        name: "Santuário do Dragão de Jade",
        region: "Selva Esmeralda",
        duration: "4 Salas",
        description: "Derrote os guardiões elementais para resgatar a milenar Espada Rúnica de Jade.",
        enemySquad: "Pantera da Selva -> Arqueiro Druida -> Dragão Arcano de Jade [CHEFE]"
      },
      "exp-3": {
        name: "Fortaleza Glacial do Titã de Gelo",
        region: "Picos Nevados Árticos",
        duration: "5 Salas",
        description: "Enfrente nevascas impiedosas para desafiar o orgulhoso Rei Titã do Gelo.",
        enemySquad: "Lobo da Neve -> Golem de Gelo -> Gigante Glacial -> Rei Titã de Gelo [CHEFE]"
      },
      "exp-4": {
        name: "Fenda Abissal do Caos",
        region: "Vazio Astral",
        duration: "5 Salas",
        description: "Erradique as legiões do vazio que emergem das fraturas dimensionais.",
        enemySquad: "Rastreador do Vazio -> Feiticeiro Abissal -> Senhor do Caos [CHEFE FINAL]"
      }
    }
  },
  dungeonCombat: {
    dungeonName: "Cidadela do Fogo Negro: Duelo com o Orc",
    dungeonSubtitle: "Combate Cinematográfico - Primeiras 3 Masmorras",
    bossBadge: "[CHEFE]",
    closeTitle: "Fechar Masmorra",
    playerHeroName: "Campeão Real",
    duelBadge: "DUELO",
    timingMiss: "Errou",
    timingGood: "Bom",
    timingPerfect: "Perfeito",
    timingCritical: "CRÍTICO!",
    strikeBtn: "GOLPE CRÍTICO!",
    strikeHint: "[ESPAÇO]",
    quitWithLootBtn: "Recuar com Espólios",
    dungeonVictoryTitle: "MASMORRA CONQUISTADA!!",
    claimLegendaryLootBtn: "Reivindicar Grandes Espólios para o Reino",
    defeatTitle: "Caído em Combate",
    retryBtn: "Tentar Duelo Novamente",
    returnCityBtn: "Retornar à Cidade",
    rooms: {
      "0": {
        name: "Batedor de Vanguarda Orc",
        title: "Vanguarda dos Ermos"
      },
      "1": {
        name: "Orc Berserker de Fogo",
        title: "Guardião do Machado Flamejante"
      },
      "2": {
        name: "Senhor da Guerra Orc Vorgath",
        title: "Tirano da Cidadela do Fogo Negro"
      }
    }
  },
  kingdomEvents: {
    "event-caravan": {
      title: "Caravana de Seda Real",
      subtitle: "Visita da Rota Comercial Oriental",
      emissaryName: "Lady Vanya",
      emissaryRole: "Líder da Caravana do Deserto",
      description: "Uma grande caravana de camelos carregada de sedas e especiarias exóticas chega aos portões, desejando prosperidade e propondo acordos comerciais.",
      choices: {
        trade_wood_food: {
          label: "Trocar Madeira por Provisões",
          description: "Entregue madeira excedente em troca de sacos fartos de grãos frescos.",
          outcomeText: "Acordo selado! As carroças descarregam mantimentos que alimentam seus colonos."
        },
        trade_gold_gems: {
          label: "Comprar Cristais Arcanos",
          description: "Pague com moedas de ouro imperial para adquirir gemas raras das estepes.",
          outcomeText: "Lady Vanya entrega uma bolsa de cristais brilhantes extraídos de cavernas distantes."
        },
        trade_decline: {
          label: "Dispensar com Cortesia",
          description: "Agradeça pela visita, mas preserve intactas as reservas do reino.",
          outcomeText: "A caravana segue viagem pacificamente rumo aos vales vizinhos."
        }
      }
    },
    "event-alchemist": {
      title: "O Elixir do Alquimista Errante",
      subtitle: "Mistério e Transmutação",
      emissaryName: "Mestre Ignis",
      emissaryRole: "Erudito da Irmandade Dourada",
      description: "Um velho alquimista de manto estrelado com frascos fumegantes afirma dominar a fórmula de multiplicar ouro e pedra bruta.",
      choices: {
        alchemist_transmute: {
          label: "Financiar Experimento Dourado",
          description: "Contribua com pedra e algumas moedas para tentar transmutar em barras de ouro puro.",
          outcomeText: "O frasco explode em lampejos dourados! O experimento é um sucesso absoluto."
        },
        alchemist_gems: {
          label: "Comprar Tintura de Cristal",
          description: "Invista uma quantia de ouro para obter um frasco de essência cristalizada.",
          outcomeText: "O frasco se dissolve deixando gemas perfeitas de alto valor arcano."
        },
        alchemist_reject: {
          label: "Recusar por Suspeita de Fraude",
          description: "Não arrisque os cofres do reino em magias experimentais duvidosas.",
          outcomeText: "O alquimista recolhe seus frascos resmungando e desaparece em uma nuvem de enxofre."
        }
      }
    },
    "event-bandits": {
      title: "Incursão nas Florestas da Fronteira",
      subtitle: "Ameaça de Bandidos",
      emissaryName: "Gruk o Implacável",
      emissaryRole: "Capitão dos Foras da Lei",
      description: "Um bando de foras da lei se estabeleceu nas colinas e ameaça saquear as carroças de suprimentos caso você não tome providências imediatas.",
      choices: {
        bandits_fight: {
          label: "Enviar a Guarda Militar",
          description: "Envie suas tropas para cercar e expurgar o acampamento rebelde.",
          outcomeText: "Seus soldados aniquilam o bando! Recuperam o saque para o tesouro real."
        },
        bandits_bribe: {
          label: "Pagar Tributo de Paz",
          description: "Entregue um baú de ouro para que busquem fortuna em outras terras.",
          outcomeText: "Os bandidos pegam o ouro e se retiram temporariamente de suas terras."
        },
        bandits_barricade: {
          label: "Fortificar Postos de Fronteira",
          description: "Use madeira para erguer paliçadas que protejam os fazendeiros.",
          outcomeText: "As paliçadas desestimulam os forasteiros, que desistem do ataque."
        }
      }
    },
    "event-harvest-festival": {
      title: "O Grande Banquete da Colheita",
      subtitle: "Festividades Populares",
      emissaryName: "Burgomestre Elric",
      emissaryRole: "Porta-voz dos Colonos",
      description: "Os campos renderam boas colheitas e os colonos pedem para organizar um banquete na praça principal para elevar a moral e celebrar o trono.",
      choices: {
        festival_grand: {
          label: "Financiar Banquete Real Grandioso",
          description: "Contribua com comida e ouro para fartura nas mesas, menestréis e vinho doce.",
          outcomeText: "A praça se enche de danças e louvores ao Rei! A devoção do povo concede generoso XP e tributos."
        },
        festival_modest: {
          label: "Festa Comunitária Modesta",
          description: "Compartilhe uma porção equilibrada de comida para uma celebração simples.",
          outcomeText: "Os colonos agradecem o gesto fraterno e arrecadam uma doação modesta para o tesouro."
        },
        festival_cancel: {
          label: "Economizar para Tempos de Guerra",
          description: "Explique que cada grão deve ser guardado nos silos de reserva.",
          outcomeText: "Os colonos compreendem a prudência do governante e retornam ao trabalho."
        }
      }
    },
    "event-astral-rift": {
      title: "A Fenda Astral do Eremita",
      subtitle: "Anomalia Mágica",
      emissaryName: "Astróloga Selene",
      emissaryRole: "Observadora do Véu",
      description: "Uma fratura de luz violeta e sussurros estelares surgiu perto das ruínas do vale. Cristais puros flutuam em seu vórtice.",
      choices: {
        astral_channel: {
          label: "Canalizar com Cristais Arcanos",
          description: "Invista gemas para estabilizar a fenda e extrair materiais elementais condensados.",
          outcomeText: "A fenda implode harmoniosamente liberando abundantes riquezas elementais!"
        },
        astral_study: {
          label: "Registrar a Frequência Cósmica",
          description: "Peça aos seus sábios para registrarem notas místicas antes que ela se desfaça.",
          outcomeText: "Selene decifra runas cósmicas e presenteia você com 3 fragmentos estelares."
        }
      }
    },
    "event-guild-petition": {
      title: "Petição da Guilda dos Construtores",
      subtitle: "Arquitetura e Obras",
      emissaryName: "Mestre Thorin",
      emissaryRole: "Decano da Fraternidade dos Pedreiros",
      description: "Os mestres da pedreira e da serraria solicitam fundos para adquirir novas roldanas e serras hidráulicas para acelerar a extração.",
      choices: {
        guild_invest: {
          label: "Modernizar Maquinário",
          description: "Pague com ouro e madeira para equipar os operários com ferramentas de ponta.",
          outcomeText: "Os novos guindastes extraem enormes blocos de granito sem parar!"
        },
        guild_reinforce: {
          label: "Fornecer Rações Extras",
          description: "Entregue alimentos para revigorar os trabalhadores do turno noturno.",
          outcomeText: "Bem alimentados, os lenhadores cortam e transportam madeira em velocidade recorde."
        },
        guild_postpone: {
          label: "Adiar para o Próximo Trimestre",
          description: "Priorize outras despesas imediatas do reino.",
          outcomeText: "Os mestres retornam ao trabalho otimizando as ferramentas atuais."
        }
      }
    },
    "event-gambler": {
      title: "O Trapaceiro dos Dados Carmesins",
      subtitle: "Jogo de Azar e Fortuna",
      emissaryName: "Jack o Trapaceiro",
      emissaryRole: "Apostador de Taberna",
      description: "Um malandro de capa de veludo mostra dois dados esculpidos em osso de dragão: \"Uma aposta nobre, Soberano. Dobre o valor ou saia de mãos vazias.\"",
      choices: {
        gambler_roll_gold: {
          label: "Apostar 100 de Ouro (Tudo ou Nada)",
          description: "Teste sua sorte em busca do pote do apostador.",
          outcomeText: "Dados duplos de ouro! Jack cerra os dentes e entrega a bolsa com 260 de ouro."
        },
        gambler_roll_gems: {
          label: "Apostar 3 Gemas de Fogo",
          description: "Uma aposta de alto risco envolvendo gemas valiosas.",
          outcomeText: "Rolagem milagrosa! O apostador entrega uma sacola cheia de cristais brilhantes."
        },
        gambler_arrest: {
          label: "Expulsá-lo da Praça Central",
          description: "A lei proíbe apostas clandestinas nas imediações do castelo.",
          outcomeText: "A guarda confisca os dados viciados e uma pequena bolsa com 30 moedas."
        }
      }
    },
    "event-wandering-knight": {
      title: "O Paladino Desarraigado",
      subtitle: "Lealdade à Coroa",
      emissaryName: "Sir Gareth da Cruz",
      emissaryRole: "Cavaleiro Veterano",
      description: "Um cavaleiro em armadura amassada mas polida se ajoelha perante seus estandartes oferecendo lealdade e treinamento para suas tropas em troca de um posto real.",
      choices: {
        knight_hire_heavy: {
          label: "Recrutar para a Guarnição (+2 Infantaria)",
          description: "Ofereça alojamento e soldo para integrá-lo às fileiras de infantaria pesada.",
          outcomeText: "Sir Gareth junta-se com 2 veteranos de infantaria pesada ao seu exército!"
        },
        knight_hire_scouts: {
          label: "Comissionar como Instrutor (+2 Arqueiros)",
          description: "Pague com ouro para que instrua os atiradores do reino.",
          outcomeText: "Gareth aprimora a pontaria dos arqueiros, incorporando 2 atiradores de elite."
        },
        knight_bless: {
          label: "Conceder Passagem Segura e Alimento",
          description: "Deseje boa sorte e forneça pão de viagem.",
          outcomeText: "O cavaleiro agradece a hospitalidade e promete espalhar sua fama no norte."
        }
      }
    }
  }
}

deepMerge(br, brazilianDeepPatch)

const output = `export const br = ${JSON.stringify(br, null, 2)}\n`
writeFileSync('./src/i18n/locales/br.js', output, 'utf-8')
console.log('Successfully completed deep Brazilian Portuguese localization patch!')
