import fs from 'fs';

const campaignTranslations = {
  us: {
    biome1: {
      name: "Chapter 1: The Great Chaos Campaign",
      subtitle: "The March of Heroes (17 Epic Encounters)"
    },
    sectors: {
      "1": { name: "Sector I: Orc Vanguard", desc: "3 Orcs" },
      "2": { name: "Sector II: Beast Pit", desc: "1 Minotaur" },
      "3": { name: "Sector III: Mixed Assault", desc: "3 Orcs + 1 Minotaur" },
      "4": { name: "Sector IV: Miniboss Crypt", desc: "1 Chaos Miniboss" },
      "5": { name: "Sector V: Shadow Labyrinth", desc: "3 Minotaurs + 1 Orc" },
      "6": { name: "Sector VI: Throne of Doomsday", desc: "3 Minotaurs + Supreme Boss" }
    },
    combat: {
      dazed: "[DAZED!] -",
      counter: "[COUNTER!] -"
    },
    nodes: {
      "node-1": {
        name: "Orc Scout",
        subtitle: "Phase 1 · Moorland Vanguard",
        desc: "Swift scout sent to probe your bastion's defenses. Agile but fragile."
      },
      "node-2": {
        name: "Orc Berserker",
        subtitle: "Phase 1 · Flame Axe Warrior",
        desc: "Armored brute wielding twin axes wreathed in living fire. Ferocious direct strikes."
      },
      "node-3": {
        name: "Orc Iron Captain",
        subtitle: "Phase 1 · Outpost Bastion",
        desc: "Commander of the vanguard horde. Carries a massive cast-iron spiked buckler."
      },
      "node-4": {
        name: "Red-Horn Minotaur",
        subtitle: "Phase 2 · Terror of the Pit",
        desc: "Colossal mythical beast armed with a crushing club. Your first major trial."
      },
      "node-5": {
        name: "Blood Spear Orc",
        subtitle: "Phase 3 · Ash Harasser",
        desc: "Relentless skirmisher throwing venomous javelins that decimate defensive lines."
      },
      "node-6": {
        name: "Orc Devastator",
        subtitle: "Phase 3 · Trench Breaker",
        desc: "Elite shock-warrior of the horde, encased in rusted plate armor and thirsty for blood."
      },
      "node-7": {
        name: "Orc Warlord",
        subtitle: "Phase 3 · Blood Chieftain",
        desc: "Division general commanding the orc phalanx, guarding the gateway to the sanctum."
      },
      "node-8": {
        name: "Cavern Minotaur",
        subtitle: "Phase 3 · Horde Colossus",
        desc: "Primeval brute bred by the orcs to pulverize any legion that dares approach."
      },
      "node-9": {
        name: "Miniboss: Abyss Sentinel",
        subtitle: "Phase 4 · MID-SECTOR MINIBOSS!",
        desc: "Armored titan bearing a cyclopean warhammer. Its footsteps shake the subterranean depths."
      },
      "node-10": {
        name: "Ebony Gladiator Minotaur",
        subtitle: "Phase 5 · Combat Beast I",
        desc: "First combat bull of the inner guard. Razor horns capable of splitting reinforced shields."
      },
      "node-11": {
        name: "Crypt Raging Minotaur",
        subtitle: "Phase 5 · Combat Beast II",
        desc: "Taurine barbarian frenzied by the stench of battle. Strikes with unstoppable fury."
      },
      "node-12": {
        name: "Armored Titan Minotaur",
        subtitle: "Phase 5 · Combat Beast III",
        desc: "Colossus plated in forged iron slabs. Immense physical resilience and devastating charges."
      },
      "node-13": {
        name: "Orc Shadow Archmage",
        subtitle: "Phase 5 · Shaman of the Shadows",
        desc: "Orc sorcerer channeling void sorceries to seal the final corridor to the Throne."
      },
      "node-14": {
        name: "Blood Sentinel Minotaur",
        subtitle: "Phase 6 · Praetorian Guard I",
        desc: "Blood sentinel bound by oath to guard the Supreme Boss with its very life."
      },
      "node-15": {
        name: "Hell Executioner Minotaur",
        subtitle: "Phase 6 · Praetorian Guard II",
        desc: "Executioner with massive horns wielding a spiked mace chained in hellfire."
      },
      "node-16": {
        name: "King of Horns Minotaur",
        subtitle: "Phase 6 · Guard Champion",
        desc: "The most feared of all subterranean minotaurs. The final obstacle before the Throne."
      },
      "node-17": {
        name: "SUPREME BOSS: Lord of Shadows",
        subtitle: "Phase 6 · FINAL CAMPAIGN BOSS!",
        desc: "Absolute sovereign of the Chaos Dungeon. His cursed blade devours entire souls."
      }
    }
  },
  es: {
    biome1: {
      name: "Capítulo Único: La Gran Campaña del Caos",
      subtitle: "La Marcha de los Héroes (17 Encuentros Épicos)"
    },
    sectors: {
      "1": { name: "Sector I: Vanguardia Orca", desc: "3 Orcos" },
      "2": { name: "Sector II: Foso de Bestias", desc: "1 Minotauro" },
      "3": { name: "Sector III: Ofensiva Mixta", desc: "3 Orcos + 1 Minotauro" },
      "4": { name: "Sector IV: Cripta del Minijefe", desc: "1 Minijefe" },
      "5": { name: "Sector V: Laberinto de Sombras", desc: "3 Minotauros + 1 Orco" },
      "6": { name: "Sector VI: Trono del Juicio Final", desc: "3 Minotauros + Boss Supremo" }
    },
    combat: {
      dazed: "[¡ATURDIDO!] -",
      counter: "[¡CONTRAATAQUE!] -"
    },
    nodes: {
      "node-1": {
        name: "Orco Explorador",
        subtitle: "Fase 1 · Vanguardia de los Páramos",
        desc: "Vigía veloz enviado para tantear las defensas de tu bastión. Ágil pero vulnerable."
      },
      "node-2": {
        name: "Orco Berserker",
        subtitle: "Fase 1 · Guerrero de Hacha Flamígera",
        desc: "Bárbaro acorazado con hachas gemelas envueltas en llamas vivas. Golpes directos feroces."
      },
      "node-3": {
        name: "Orco Capitán de Hierro",
        subtitle: "Fase 1 · Bastión de la Avanzada",
        desc: "Comandante de la avanzadilla orca. Porta un pesado escudo tachonado en hierro fundido."
      },
      "node-4": {
        name: "Minotauro Cornamenta Roja",
        subtitle: "Fase 2 · El Terror del Foso",
        desc: "Bestia legendaria de masa colosal armada con un garrote desgarrador. Primer gran desafío."
      },
      "node-5": {
        name: "Orco Lanzador Sangriento",
        subtitle: "Fase 3 · Hostigador de las Cenizas",
        desc: "Tirador implacable con jabalinas envenenadas que diezman las líneas defensivas."
      },
      "node-6": {
        name: "Orco Devastador",
        subtitle: "Fase 3 · Trinchera de Asalto",
        desc: "Guerrero de élite de la horda, blindado en placas oxidadas y sediento de gloria."
      },
      "node-7": {
        name: "Orco Señor de la Guerra",
        subtitle: "Fase 3 · Caudillo de Sangre",
        desc: "General de división que comanda a la falange de orcos y custodia la entrada al santuario."
      },
      "node-8": {
        name: "Minotauro de las Cavernas",
        subtitle: "Fase 3 · Coloso de la Horda",
        desc: "Criatura ancestral entrenada por los orcos para destrozar cualquier escuadrón que se acerque."
      },
      "node-9": {
        name: "Minijefe: El Guardián del Abismo",
        subtitle: "Fase 4 · ¡MINIJEFE DEL SECTOR CENTRAL!",
        desc: "Titán acorazado con un martillo ciclópeo. Su presencia hace temblar las profundidades."
      },
      "node-10": {
        name: "Minotauro Gladiador de Ébano",
        subtitle: "Fase 5 · Bestia de Combate I",
        desc: "Primer toro de combate de la guardia interna. Astas afiladas capaces de hendir escudos."
      },
      "node-11": {
        name: "Minotauro Furioso de las Criptas",
        subtitle: "Fase 5 · Bestia de Combate II",
        desc: "Bárbaro taurino enfurecido por el hedor de la batalla. Golpea con frenesí incesante."
      },
      "node-12": {
        name: "Minotauro Titán Acorazado",
        subtitle: "Fase 5 · Bestia de Combate III",
        desc: "Coloso recubierto de placas de hierro fundido. Alta resistencia física y embestida brutal."
      },
      "node-13": {
        name: "Orco Archimago Oscuro",
        subtitle: "Fase 5 · Chamán de las Sombras",
        desc: "Hechicero orco que canaliza energías oscuras para resguardar el pasadizo final al Trono."
      },
      "node-14": {
        name: "Minotauro Centinela de Sangre",
        subtitle: "Fase 6 · Guardia Pretoriana I",
        desc: "Guardián de sangre que juró proteger al Boss Supremo con su propia existencia."
      },
      "node-15": {
        name: "Minotauro Verdugo Infernal",
        subtitle: "Fase 6 · Guardia Pretoriana II",
        desc: "Verdugo de cornamenta colosal con una maza con cadenas de fuego infernal."
      },
      "node-16": {
        name: "Minotauro Rey de los Cuernos",
        subtitle: "Fase 6 · Campeón de la Guardia",
        desc: "El más temido de todos los minotauros del reino subterráneo. Último obstáculo antes del Trono."
      },
      "node-17": {
        name: "BOSS SUPREMO: Señor de las Tinieblas",
        subtitle: "Fase 6 · ¡GRAN JEFE FINAL DEL CAPÍTULO!",
        desc: "Soberano absoluto de la Mazmorra del Caos. Su espada maldita devora almas enteras."
      }
    }
  },
  br: {
    biome1: {
      name: "Capítulo Único: A Grande Campanha do Caos",
      subtitle: "A Marcha dos Heróis (17 Encontros Épicos)"
    },
    sectors: {
      "1": { name: "Setor I: Vanguarda Orc", desc: "3 Orcs" },
      "2": { name: "Setor II: Fosso das Feras", desc: "1 Minotauro" },
      "3": { name: "Setor III: Ofensiva Mista", desc: "3 Orcs + 1 Minotauro" },
      "4": { name: "Setor IV: Cripta do Minichefe", desc: "1 Minichefe" },
      "5": { name: "Setor V: Labirinto das Sombras", desc: "3 Minotauros + 1 Orc" },
      "6": { name: "Setor VI: Trono do Juízo Final", desc: "3 Minotauros + Chefe Supremo" }
    },
    combat: {
      dazed: "[ATORDISSO!] -",
      counter: "[CONTRA-ATAQUE!] -"
    },
    nodes: {
      "node-1": {
        name: "Orc Batedor",
        subtitle: "Fase 1 · Vanguarda dos Ermos",
        desc: "Vigia veloz enviado para sondar as defesas do seu bastião. Ágil mas frágil."
      },
      "node-2": {
        name: "Orc Berserker",
        subtitle: "Fase 1 · Guerreiro do Machado Flamejante",
        desc: "Bárbaro blindado com machados duplos envoltos em chamas vivas. Golpes diretos ferozes."
      },
      "node-3": {
        name: "Orc Capitão de Ferro",
        subtitle: "Fase 1 · Bastião do Posto Avançado",
        desc: "Comandante da vanguarda orc. Empunha um pesado escudo cravejado de ferro fundido."
      },
      "node-4": {
        name: "Minotauro dos Chifres Rubros",
        subtitle: "Fase 2 · O Terror do Fosso",
        desc: "Besta colossal armada com uma clava devastadora. Seu primeiro grande desafio."
      },
      "node-5": {
        name: "Orc Arremessador Sangrento",
        subtitle: "Fase 3 · Hostigador das Cinzas",
        desc: "Arremessador implacável com lanças envenenadas que dizimam as linhas de defesa."
      },
      "node-6": {
        name: "Orc Devastador",
        subtitle: "Fase 3 · Trincheira de Assalto",
        desc: "Guerreiro de elite da horda, blindado em placas enferrujadas e sedento de glória."
      },
      "node-7": {
        name: "Senhor da Guerra Orc",
        subtitle: "Fase 3 · Caudilho de Sangue",
        desc: "General de divisão que comanda a falange orc e guarda a entrada do santuário."
      },
      "node-8": {
        name: "Minotauro das Cavernas",
        subtitle: "Fase 3 · Colosso da Horda",
        desc: "Criatura ancestral treinada pelos orcs para esmagar qualquer esquadrão que se aproxime."
      },
      "node-9": {
        name: "Minichefe: Guardião do Abismo",
        subtitle: "Fase 4 · ¡MINICHEFE DO SETOR CENTRAL!",
        desc: "Titã blindado com um martelo ciclópico. Seus passos estremecem as profundezas."
      },
      "node-10": {
        name: "Minotauro Gladiador de Ébano",
        subtitle: "Fase 5 · Besta de Combate I",
        desc: "Primeiro touro de combate da guarda interna. Chifres afiados capazes de partir escudos."
      },
      "node-11": {
        name: "Minotauro Furioso das Criptas",
        subtitle: "Fase 5 · Besta de Combate II",
        desc: "Bárbaro taurino enfurecido pelo calor do combate. Desfere golpes com fúria incessante."
      },
      "node-12": {
        name: "Minotauro Titã Blindado",
        subtitle: "Fase 5 · Besta de Combate III",
        desc: "Colosso revestido de placas de ferro fundido. Alta resistência física e investida brutal."
      },
      "node-13": {
        name: "Arquimago Sombrio Orc",
        subtitle: "Fase 5 · Xamã das Sombras",
        desc: "Feiticeiro orc que canaliza energias arcanas sombrias para guardar o corredor final."
      },
      "node-14": {
        name: "Minotauro Sentinela de Sangue",
        subtitle: "Fase 6 · Guarda Pretoriana I",
        desc: "Guardião de sangue que jurou proteger o Boss Supremo com sua própria existência."
      },
      "node-15": {
        name: "Minotauro Carrasco Infernal",
        subtitle: "Fase 6 · Guarda Pretoriana II",
        desc: "Carrasco de chifres colossais empunhando uma maça acorrentada em fogo infernal."
      },
      "node-16": {
        name: "Minotauro Rei dos Chifres",
        subtitle: "Fase 6 · Campeão da Guarda",
        desc: "O mais temido dos minotauros do reino subterrâneo. Último obstáculo antes do Trono."
      },
      "node-17": {
        name: "CHEFE SUPREMO: Senhor das Trevas",
        subtitle: "Fase 6 · ¡GRANDE CHEFE FINAL DO CAPÍTULO!",
        desc: "Soberano absoluto da Masmorra do Caos. Sua lâmina amaldiçoada devora almas inteiras."
      }
    }
  },
  kr: {
    biome1: {
      name: "유일 챕터: 대혼돈의 원정",
      subtitle: "영웅들의 진군 (17개의 서사시적 조우)"
    },
    sectors: {
      "1": { name: "1구역: 오크 선봉대", desc: "오크 3마리" },
      "2": { name: "2구역: 맹수의 구덩이", desc: "미노타우로스 1마리" },
      "3": { name: "3구역: 복합 공세", desc: "오크 3마리 + 미노타우로스 1마리" },
      "4": { name: "4구역: 미니보스의 은신처", desc: "미니보스 1마리" },
      "5": { name: "5구역: 그림자 미궁", desc: "미노타우로스 3마리 + 오크 1마리" },
      "6": { name: "6구역: 심판의 왕좌", desc: "미노타우로스 3마리 + 최고 보스" }
    },
    combat: {
      dazed: "[기절!] -",
      counter: "[반격!] -"
    },
    nodes: {
      "node-1": {
        name: "오크 정찰병",
        subtitle: "1단계 · 황무지 선봉대",
        desc: "요새의 방어를 시험하기 위해 파견된 빠른 정찰병입니다. 민첩하지만 취약합니다."
      },
      "node-2": {
        name: "오크 광전사",
        subtitle: "1단계 · 불타는 도끼 전사",
        desc: "살아있는 화염에 휩싸인 쌍도끼를 휘두르는 중장갑 야만용사. 사나운 직접 타격을 가합니다."
      },
      "node-3": {
        name: "철완의 오크 대장",
        subtitle: "1단계 · 전초기지 요새",
        desc: "오크 선봉대의 지휘관. 주철 대형 방패를 들고 있습니다."
      },
      "node-4": {
        name: "붉은 뿔의 미노타우로스",
        subtitle: "2단계 · 구덩이의 공포",
        desc: "파괴적인 몽둥이를 휘두르는 거대한 전설의 괴수. 첫 번째 거대한 관문입니다."
      },
      "node-5": {
        name: "피빛 투창 오크",
        subtitle: "3단계 · 잿더미의 교란자",
        desc: "방어선을 무너뜨리는 독 묻은 투창을 던지는 가차 없는 척후병입니다."
      },
      "node-6": {
        name: "오크 파괴자",
        subtitle: "3단계 · 돌파 참호병",
        desc: "녹슨 판금 갑옷으로 무장하고 영광을 갈망하는 호드의 정예 전사."
      },
      "node-7": {
        name: "오크 전쟁군주",
        subtitle: "3단계 · 피의 족장",
        desc: "오크 군단을 지휘하며 성소 입구를 지키는 사단장."
      },
      "node-8": {
        name: "동굴 미노타우로스",
        subtitle: "3단계 · 호드의 거신",
        desc: "접근하는 모든 분대를 분쇄하도록 오크들이 조련한 고대 괴수."
      },
      "node-9": {
        name: "미니보스: 심연의 파수꾼",
        subtitle: "4단계 · 중앙 구역 미니보스!",
        desc: "거대한 워해머를 든 중갑 타이탄. 그 발걸음은 심연 전체를 뒤흔듭니다."
      },
      "node-10": {
        name: "흑단 검투사 미노타우로스",
        subtitle: "5단계 · 전투 괴수 I",
        desc: "내부 경비대의 첫 번째 전투 투우. 방패를 쪼개버릴 만큼 날카로운 뿔을 지녔습니다."
      },
      "node-11": {
        name: "묘지의 광란 미노타우로스",
        subtitle: "5단계 · 전투 괴수 II",
        desc: "전장의 피비린내에 광분한 소머리 야만인. 끊임없는 광기로 맹공을 퍼붓습니다."
      },
      "node-12": {
        name: "중장갑 타이탄 미노타우로스",
        subtitle: "5단계 · 전투 괴수 III",
        desc: "주철 판금으로 뒤덮인 거인. 엄청난 물리 방어력과 파괴적인 돌진력을 지녔습니다."
      },
      "node-13": {
        name: "오크 암흑 대마법사",
        subtitle: "5단계 · 그림자의 주술사",
        desc: "왕좌로 향하는 마지막 통로를 봉쇄하기 위해 흑마법을 집중시키는 오크 주술사."
      },
      "node-14": {
        name: "피의 파수병 미노타우로스",
        subtitle: "6단계 · 근위대 I",
        desc: "목숨을 걸고 최고 보스를 수호하겠다고 맹세한 피의 근위병."
      },
      "node-15": {
        name: "지옥의 집행관 미노타우로스",
        subtitle: "6단계 · 근위대 II",
        desc: "지옥불 사슬에 묶인 메이스를 휘두르는 거대한 뿔의 사형 집행인."
      },
      "node-16": {
        name: "뿔의 제왕 미노타우로스",
        subtitle: "6단계 · 근위대 챔피언",
        desc: "지하 세계에서 가장 공포스러운 미노타우로스. 왕좌에 오르기 전 마지막 장애물입니다."
      },
      "node-17": {
        name: "최고 보스: 어둠의 군주",
        subtitle: "6단계 · 챕터 최종 거대 보스!",
        desc: "혼돈의 던전의 절대 군주. 그의 저주받은 검은 영혼을 집어삼킵니다."
      }
    }
  },
  cn: {
    biome1: {
      name: "唯一篇章：大混沌远征战役",
      subtitle: "英雄进军之途（17场史诗对决）"
    },
    sectors: {
      "1": { name: "第I区域：兽人先锋", desc: "兽人 x3" },
      "2": { name: "第II区域：狂兽深渊", desc: "牛头魔 x1" },
      "3": { name: "第III区域：联军突击", desc: "兽人 x3 + 牛头魔 x1" },
      "4": { name: "第IV区域：统领地宫", desc: "次级领主 x1" },
      "5": { name: "第V区域：暗影迷宫", desc: "牛头魔 x3 + 兽人 x1" },
      "6": { name: "第VI区域：终末审判王座", desc: "牛头魔 x3 + 终极领主" }
    },
    combat: {
      dazed: "[眩晕!] -",
      counter: "[反击!] -"
    },
    nodes: {
      "node-1": {
        name: "兽人侦察兵",
        subtitle: "第1阶段 · 荒原前锋",
        desc: "被派来探测你堡垒防御的敏捷斥候。身手敏捷但防御脆弱。"
      },
      "node-2": {
        name: "兽人狂战士",
        subtitle: "第1阶段 · 烈焰战斧武士",
        desc: "手持燃魂双斧的重装狂战士。招式凶猛残暴。"
      },
      "node-3": {
        name: "黑铁兽人统领",
        subtitle: "第1阶段 · 前哨要塞",
        desc: "兽人先锋指挥官。手持铸铁重盾，防御严密。"
      },
      "node-4": {
        name: "赤角牛头魔",
        subtitle: "第2阶段 · 深渊巨恐",
        desc: "手持巨型碎骨重槌的庞然凶兽。领主面临的首个巨大考验。"
      },
      "node-5": {
        name: "血矛掷弹兽人",
        subtitle: "第3阶段 · 灰烬袭扰者",
        desc: "投掷剧毒标枪撕裂防线的凶狠突击手。"
      },
      "node-6": {
        name: "荒原毁灭者兽人",
        subtitle: "第3阶段 · 战壕先锋",
        desc: "身披锈甲、渴望血与荣耀的兽人重甲精锐。"
      },
      "node-7": {
        name: "兽人战争领主",
        subtitle: "第3阶段 · 嗜血酋长",
        desc: "统帅整个兽人方阵、镇守圣殿入口的军团统领。"
      },
      "node-8": {
        name: "洞窟巨角牛头魔",
        subtitle: "第3阶段 · 部落巨像",
        desc: "被兽人驯化、专门粉碎来犯之敌的远古庞然凶兽。"
      },
      "node-9": {
        name: "次级领主：深渊守望者",
        subtitle: "第4阶段 · 核心区域统领！",
        desc: "手握独眼巨锤的重装泰坦巨怪。他的脚步让深渊大地颤动。"
      },
      "node-10": {
        name: "黑曜角斗牛魔",
        subtitle: "第5阶段 · 狂暴凶兽 I",
        desc: "内圈近卫军先头战兽。利角可轻易刺穿精钢盾牌。"
      },
      "node-11": {
        name: "地宫狂暴牛魔",
        subtitle: "第5阶段 · 狂暴凶兽 II",
        desc: "被血腥战意激怒的狂暴蛮兽。连续挥击势不可挡。"
      },
      "node-12": {
        name: "铁甲泰坦牛头魔",
        subtitle: "第5阶段 · 狂暴凶兽 III",
        desc: "身裹厚重铸铁甲板的巨兽。物理防御极高，冲锋极具杀伤力。"
      },
      "node-13": {
        name: "暗影兽人大法师",
        subtitle: "第5阶段 · 暗影萨满",
        desc: "引导虚空黑暗秘术、封锁通往王座最后走廊的强力法师。"
      },
      "node-14": {
        name: "血誓卫士牛头魔",
        subtitle: "第6阶段 · 禁卫近卫军 I",
        desc: "立下血之誓言誓死守护终极领主的顽强守卫。"
      },
      "node-15": {
        name: "炼狱行刑牛魔",
        subtitle: "第6阶段 · 禁卫近卫军 II",
        desc: "挥舞锁链烈焰流星锤的凶残巨角刽子手。"
      },
      "node-16": {
        name: "万角之王牛头魔",
        subtitle: "第6阶段 · 近卫军冠军统领",
        desc: "地下王国最令人胆寒的牛头魔君王。直面王座前的终极阻碍。"
      },
      "node-17": {
        name: "终极领主：暗影主宰",
        subtitle: "第6阶段 · 全篇终极巨魔首领！",
        desc: "混沌地下王国的绝对霸主。其噬魂魔剑足以吞噬整座军团的灵魂。"
      }
    }
  }
};

for (const lang of ['us', 'es', 'br', 'kr', 'cn']) {
  const filePath = `src/i18n/locales/${lang}.js`;
  let content = fs.readFileSync(filePath, 'utf8');
  const tData = campaignTranslations[lang];

  // Match the complete campaignData block up to the army section
  const regex = /"campaignData":\s*\{[\s\S]*?\n  \},(?=\s*"army":)/;
  const newBlock = `"campaignData": {
    "enemyTypes": {
      "orc": "${lang === 'es' ? 'Orco' : lang === 'us' ? 'Orc' : lang === 'br' ? 'Orc' : lang === 'kr' ? '오크' : '兽人'}",
      "minotaur": "${lang === 'es' ? 'Minotauro' : lang === 'us' ? 'Minotaur' : lang === 'br' ? 'Minotauro' : lang === 'kr' ? '미노타우로스' : '牛头魔'}",
      "miniboss": "${lang === 'es' ? 'Minijefe del Caos' : lang === 'us' ? 'Chaos Miniboss' : lang === 'br' ? 'Minichefe do Caos' : lang === 'kr' ? '혼돈의 미니보스' : '混沌次级领主'}",
      "boss": "${lang === 'es' ? 'Jefe Supremo' : lang === 'us' ? 'Supreme Boss' : lang === 'br' ? 'Chefe Supremo' : lang === 'kr' ? '최고 보스' : '终极首领'}"
    },
    "biome1": ${JSON.stringify(tData.biome1, null, 6).trim()},
    "sectors": ${JSON.stringify(tData.sectors, null, 6).trim()},
    "combat": ${JSON.stringify(tData.combat, null, 6).trim()},
    "nodes": ${JSON.stringify(tData.nodes, null, 6).trim()}
  },`;

  if (regex.test(content)) {
    content = content.replace(regex, newBlock);
  } else {
    console.log(`campaignData already up to date in ${lang}`);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${filePath}`);
}
