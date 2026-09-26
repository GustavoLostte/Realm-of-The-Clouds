// scripts/patch_i18n_comprehensive.mjs
import fs from 'fs'
import path from 'path'

const localesDir = path.resolve('src/i18n/locales')

// 1. Quests Story Translations
const questStoryTranslations = {
  kr: {
    "q-c1-1": {
      "title": "왕관의 소재지",
      "desc": "중앙 광장에 황실 요새를 세워 왕실 지휘권을 강화하세요.",
      "hint": "요새가 이미 중앙 광장에 자리하고 있습니다. 첫 왕실 칙령을 수령하여 창건 보급품을 받으세요.",
      "action": "칙령 수령"
    },
    "q-c1-2": {
      "title": "골드 러시",
      "desc": "빈 터를 선택하고 심층 금광을 건설하여 왕국 수입을 확보하세요.",
      "hint": "[+] 기호가 있는 빈 터를 클릭하여 카탈로그를 열고 금광을 건설하세요.",
      "action": "금광 건설"
    },
    "q-c1-3": {
      "title": "주거 및 인구",
      "desc": "정착민 주택을 건설하여 왕국의 노동자 수용력을 늘리세요.",
      "hint": "각 주택은 주거를 제공하고 공사와 군대에 필요한 새 주민을 유치합니다.",
      "action": "주택 건설"
    },
    "q-c1-4": {
      "title": "노동의 결실",
      "desc": "광장의 건물에서 생산된 공물이나 자원을 수확하세요.",
      "hint": "건물 위에 떠 있는 동전 말풍선을 탭하거나 상단 표시줄의 \"모두 수확\"을 누르세요.",
      "action": "자원 수확"
    },
    "q-c1-5": {
      "title": "강변 제재소",
      "desc": "빈 터에 강변 제재소를 건설하여 지속적으로 목재를 가공하세요.",
      "hint": "가공된 목재는 방어 시설, 막사, 무기 제작에 필수적입니다.",
      "action": "제재소 건설"
    },
    "q-c1-6": {
      "title": "군사 요새",
      "desc": "전쟁 막사를 건설하여 군사 부대 훈련을 시작하세요.",
      "hint": "막사는 보병, 궁수, 전쟁 마법사를 징집하는 중심지입니다.",
      "action": "막사 건설"
    },
    "q-c1-7": {
      "title": "수비대 훈련",
      "desc": "전쟁 막사에서 주둔군 군사를 4명 이상 모집하세요.",
      "hint": "막사를 열고 골드와 식량을 소모하여 신병을 훈련시키고 광장을 수호하세요.",
      "action": "부대 징집"
    },
    "q-c1-8": {
      "title": "성벽 경계탑",
      "desc": "궁수 탑을 건설하여 국경을 감시하고 왕국을 방어하세요.",
      "hint": "요새화된 방어 시설은 약탈자를 저지하고 광장의 안보를 강화합니다.",
      "action": "방어탑 건립"
    },
    "q-c1-9": {
      "title": "화염의 세례",
      "desc": "영지가 전쟁에 나설 준비가 되었습니다! 던전 원정의 첫 번째 전투를 완수하세요.",
      "hint": "전령이나 하단 독에서 원정을 열고 오크 정찰병(노드 1)을 격파하세요.",
      "action": "전투 개시"
    },
    "q-c2-1": {
      "title": "화강암 채석장",
      "desc": "화강암 채석장을 건설하여 왕국에 거대한 석재 블록을 공급하세요.",
      "hint": "석재는 견고한 성벽과 고등 건축물을 세우는 데 필수적입니다.",
      "action": "채석장 건설"
    },
    "q-c2-2": {
      "title": "요새 확장",
      "desc": "광장의 건물 중 하나를 2레벨 이상으로 업그레이드하세요.",
      "hint": "기존 건물을 클릭하고 \"건물 업그레이드\"를 선택하세요.",
      "action": "건물 업그레이드"
    },
    "q-c2-3": {
      "title": "오크 군단 저지",
      "desc": "원정에서 노드 3(오크 강철 대장)을 격파하고 정복하세요.",
      "hint": "첫 3개의 오크 방어선을 돌파하여 갈림길을 여세요.",
      "action": "노드 3 전투"
    },
    "q-c2-4": {
      "title": "대왕실 보급소",
      "desc": "대왕실 보급소를 세워 제국의 물자 비축량을 극대화하세요.",
      "hint": "보급 창고는 약탈로부터 자원을 보호하고 보조 자재를 생산합니다.",
      "action": "보급소 건설"
    },
    "q-c2-5": {
      "title": "신비한 마력과 궁술",
      "desc": "주둔군에 궁수 3명과 전쟁 마법사 1명 이상을 확보하세요.",
      "hint": "원거리 부대는 타격 정밀도를 높이고 막강한 피해를 입힙니다.",
      "action": "마법사/궁수 징집"
    },
    "q-c3-1": {
      "title": "야수 사냥",
      "desc": "화산 동굴(노드 4a) 또는 그림자 구덩이(노드 4b)를 정복하세요.",
      "hint": "불타는 황무지에서 진격로를 선택하고 정예 야수를 물리치세요.",
      "action": "갈림길 진격"
    },
    "q-c3-2": {
      "title": "황실 금고",
      "desc": "대왕실 보급소를 건설하여 제국의 식량을 비축하세요.",
      "hint": "보급소는 재화를 안전하게 보호하면서 목재와 석재를 생성합니다.",
      "action": "보급소 건립"
    },
    "q-c3-3": {
      "title": "워로드 보르가스의 몰락",
      "desc": "황무지의 보스, 최고 워로드 보르가스(노드 6)를 격퇴하세요!",
      "hint": "보스는 치명적인 일격을 가합니다. 반드시 보병과 지원 부대를 충분히 대동하세요.",
      "action": "보르가스 처단"
    },
    "q-c3-4": {
      "title": "비전의 차원문",
      "desc": "차원 포털(노드 7)을 활성화하여 신비의 밀림(바이옴 2)을 개방하세요.",
      "hint": "보르가스를 쓰러뜨린 후 원정 지도에서 포털과 상호작용하세요.",
      "action": "포털 통과"
    },
    "q-c4-1": {
      "title": "제국의 왕관",
      "desc": "소버린의 왕국 레벨을 3 이상으로 올리세요.",
      "hint": "건물 건설, 군대 징집, 던전 정복을 통해 경험치를 획득하세요.",
      "action": "프로필 확인"
    },
    "q-c4-2": {
      "title": "영웅 지휘관",
      "desc": "성기사 지휘관(최고 영웅)을 군대에 영입하세요.",
      "hint": "성기사는 원정 결투 시 \"황실의 분노\" 필살기를 부여합니다.",
      "action": "영웅 영입"
    },
    "q-c4-3": {
      "title": "대제국의 대도시",
      "desc": "황실 광장의 빈 터 중 10개 이상에 건물을 활성화하세요.",
      "hint": "광장을 번영하는 대제국의 수도로 발전시키세요.",
      "action": "광장 확장"
    }
  },
  cn: {
    "q-c1-1": {
      "title": "王权之座",
      "desc": "在中央广场建造皇家要塞以巩固王权指挥。",
      "hint": "您的城堡已矗立于中央广场。领取首道皇家政令以获取建国初始补给。",
      "action": "领取政令"
    },
    "q-c1-2": {
      "title": "淘金热潮",
      "desc": "选择一块空地并建造深层金矿，以确保王国收入。",
      "hint": "点击带有 [+] 符号的空地以打开目录并建造金矿。",
      "action": "建造金矿"
    },
    "q-c1-3": {
      "title": "居所与人口",
      "desc": "建造开拓者房屋以提升王国的劳动力容量。",
      "hint": "每座房屋都提供庇护并吸引建设和军队所需的新居民。",
      "action": "建造房屋"
    },
    "q-c1-4": {
      "title": "辛勤成果",
      "desc": "收集广场建筑物产出的贡金或资源。",
      "hint": "点击建筑上方漂浮的金币气泡，或点击顶部栏的“全部收获”。"
      ,"action": "收集资源"
    },
    "q-c1-5": {
      "title": "沿河锯木厂",
      "desc": "在空地上建造沿河锯木厂，以持续加工木材。",
      "hint": "精制木材是筑造防御、军营和军械所必需的物资。",
      "action": "建造锯木厂"
    },
    "q-c1-6": {
      "title": "军事要塞",
      "desc": "建造战争军营以开始训练军队。",
      "hint": "军营是招募步兵、弓箭手和战争法师的枢纽。",
      "action": "建造军营"
    },
    "q-c1-7": {
      "title": "卫队训练",
      "desc": "在战争军营中为驻军招募至少4名士兵。",
      "hint": "打开军营，使用黄金和口粮训练新兵来保卫广场。",
      "action": "招募部队"
    },
    "q-c1-8": {
      "title": "城垣岗哨",
      "desc": "建造一座弓箭手塔楼以戒备边境并保卫王国。",
      "hint": "坚固的防御工事能击退掠夺者并提高广场的安全度。",
      "action": "建造箭塔"
    },
    "q-c1-9": {
      "title": "战火洗礼",
      "desc": "您的领地已做好出征准备！在地牢战役中赢得首场战斗。",
      "hint": "从传令官或底部快捷栏打开战役，击败兽人斥候（节点1）。",
      "action": "奔赴战场"
    },
    "q-c2-1": {
      "title": "花岗岩采石场",
      "desc": "建造一座花岗岩采石场，为王国供应大量石料石块。",
      "hint": "石料对于修筑坚实城墙和高等建筑不可或缺。",
      "action": "建造采石场"
    },
    "q-c2-2": {
      "title": "扩建要塞",
      "desc": "将广场上的任意建筑升级至2级或更高等级。",
      "hint": "点击现有建筑并选择“升级建筑”。"
      ,"action": "升级建筑"
    },
    "q-c2-3": {
      "title": "遏制兽人部落",
      "desc": "在战役中征服节点3（兽人铁甲队长）。",
      "hint": "击溃前三道兽人防线，解锁分支路线。",
      "action": "挑战节点3"
    },
    "q-c2-4": {
      "title": "皇家大补给库",
      "desc": "建造一座皇家大补给库，最大化帝国的物资储备容量。",
      "hint": "仓库能保护物资免遭突袭掠夺，并制造辅助材料。",
      "action": "建造补给库"
    },
    "q-c2-5": {
      "title": "奥术之力与精准射术",
      "desc": "驻防部队中拥有至少3名弓箭手和1名战争法师。",
      "hint": "远程单位可提升打击精度并输出毁灭性范围伤害。",
      "action": "招募法师/弓手"
    },
    "q-c3-1": {
      "title": "猎杀巨兽",
      "desc": "征服火山熔洞（节点4a）或暗影地穴（节点4b）。",
      "hint": "在灼热荒原中选择前行路线并击败精英巨兽。",
      "action": "进军岔路"
    },
    "q-c3-2": {
      "title": "皇家金库",
      "desc": "建造一座皇家大补给库以储藏帝国的口粮储备。",
      "hint": "补给库在生成木料与石材的同时护卫财富资产。",
      "action": "建造金库"
    },
    "q-c3-3": {
      "title": "军阀沃加斯的陨落",
      "desc": "击败荒原至高首领——最高军阀沃加斯（节点6）！",
      "hint": "首领招式极为致命，请务必派遣充裕的步兵和大军助阵。",
      "action": "迎战沃加斯"
    },
    "q-c3-4": {
      "title": "奥术传送门",
      "desc": "激活次元传送门（节点7）以开启神秘丛林（生态群系2）。",
      "hint": "击败沃加斯后，在战役地图上与传送门进行交互。",
      "action": "穿过传送门"
    },
    "q-c4-1": {
      "title": "帝国王冠",
      "desc": "使您的君主王国等级达到3级。",
      "hint": "通过兴建城池、募兵备战以及攻克地牢赢取经验。",
      "action": "查看档案"
    },
    "q-c4-2": {
      "title": "指挥官英雄",
      "desc": "招募圣骑士指挥官（至高英雄）加入您的军团。",
      "hint": "圣骑士将在战役决斗中赋予全军“皇家狂暴”绝技。",
      "action": "招募英雄"
    },
    "q-c4-3": {
      "title": "帝国大都会",
      "desc": "在帝国广场的至少10块土地上拥有已建成的建筑。",
      "hint": "将广场营建成繁荣昌盛的帝国首都。",
      "action": "扩张广场"
    }
  },
  br: {
    "q-c1-1": {
      "title": "A Sede da Coroa",
      "desc": "Possua a Fortaleza Imperial na praça central para consolidar o comando real.",
      "hint": "Seu castelo já preside a praça central. Reivindique seu primeiro decreto real para receber mantimentos iniciais.",
      "action": "Reivindicar Decreto"
    },
    "q-c1-2": {
      "title": "Corrida do Ouro",
      "desc": "Selecione um lote vazio e erga uma Mina de Ouro Profunda para garantir a renda do reino.",
      "hint": "Clique em qualquer lote com o símbolo [+] para abrir o catálogo e erguer a mina.",
      "action": "Construir Mina"
    },
    "q-c1-3": {
      "title": "Abrigo & População",
      "desc": "Construa uma Casa de Colonos para aumentar a capacidade de trabalhadores do reino.",
      "hint": "Cada casa fornece abrigo e atrai novos habitantes necessários para as obras e o exército.",
      "action": "Construir Casa"
    },
    "q-c1-4": {
      "title": "Frutos do Trabalho",
      "desc": "Colete tributos ou recursos gerados pelas construções na praça.",
      "hint": "Toque no balão de moedas flutuante sobre uma construção ou pressione \"Coletar Tudo\" na barra superior.",
      "action": "Coletar Recursos"
    },
    "q-c1-5": {
      "title": "Serraria Fluvial",
      "desc": "Construa uma Serraria Fluvial em um lote vazio para processar madeira continuamente.",
      "hint": "A madeira refinada é essencial para erguer defesas, quartéis e armas.",
      "action": "Construir Serraria"
    },
    "q-c1-6": {
      "title": "Fortaleza Militar",
      "desc": "Construa um Quartel de Guerra para iniciar o treinamento de tropas militares.",
      "hint": "O Quartel é o centro de recrutamento de infantaria, arqueiros e magos de guerra.",
      "action": "Construir Quartel"
    },
    "q-c1-7": {
      "title": "Treinamento da Guarda",
      "desc": "Recrute pelo menos 4 soldados em sua guarnição a partir do Quartel de Guerra.",
      "hint": "Abra o Quartel e treine recrutas usando ouro e provisões para defender a praça.",
      "action": "Recrutar Tropas"
    },
    "q-c1-8": {
      "title": "Vigia da Muralha",
      "desc": "Construa uma Torre de Arqueiros para patrulhar as fronteiras e defender o reino.",
      "hint": "Defesas fortificadas impedem invasores e aumentam a segurança da praça.",
      "action": "Erguer Torre"
    },
    "q-c1-9": {
      "title": "Batismo de Fogo",
      "desc": "Seu domínio está pronto para a guerra! Vença o primeiro confronto na Campanha de Masmorras.",
      "hint": "Abra a Campanha pelo Arauto ou pelo dock inferior e derrote o Batedor Orc (Nodo 1).",
      "action": "À Batalha"
    },
    "q-c2-1": {
      "title": "Pedreira de Granito",
      "desc": "Erga uma Pedreira de Granito para abastecer o reino com blocos maciços de pedra.",
      "hint": "A pedra é essencial para erguer muralhas pesadas e estruturas avançadas.",
      "action": "Construir Pedreira"
    },
    "q-c2-2": {
      "title": "Fortaleza em Expansão",
      "desc": "Aprimore qualquer edifício na praça para o Nível 2 ou superior.",
      "hint": "Clique em uma estrutura existente e selecione \"Melhorar Edifício\".",
      "action": "Melhorar Edifício"
    },
    "q-c2-3": {
      "title": "Conter a Horda Orc",
      "desc": "Conquiste o Nodo 3 (Capitão de Ferro Orc) na Campanha.",
      "hint": "Supere as três primeiras defesas orcs para abrir caminhos ramificados.",
      "action": "Lutar no Nodo 3"
    },
    "q-c2-4": {
      "title": "Grande Depósito Real",
      "desc": "Erga um Grande Depósito Real para maximizar o estoque de suprimentos do império.",
      "hint": "O depósito protege recursos contra saques e produz materiais auxiliares.",
      "action": "Construir Depósito"
    },
    "q-c2-5": {
      "title": "Força Mística & Pontaria",
      "desc": "Tenha pelo menos 3 Arqueiros e 1 Mago de Guerra em sua guarnição.",
      "hint": "Tropas à distância aumentam sua precisão e causam dano devastador.",
      "action": "Recrutar Magos/Arqueiros"
    },
    "q-c3-1": {
      "title": "Caçada às Bestas",
      "desc": "Conquiste a Caverna Vulcânica (Nodo 4a) ou o Poço das Sombras (Nodo 4b).",
      "hint": "Escolha sua rota nos Ermos Ardentes e derrote a fera de elite.",
      "action": "Para a Bifurcação"
    },
    "q-c3-2": {
      "title": "Cofre Real",
      "desc": "Construa um Grande Depósito Real para armazenar os mantimentos do império.",
      "hint": "O depósito gera madeira e pedra enquanto protege as riquezas.",
      "action": "Erguer Depósito"
    },
    "q-c3-3": {
      "title": "A Queda do Senhor da Guerra Vorgath",
      "desc": "Derrote o Senhor Supremo Vorgath (Nodo 6), o Chefe dos Ermos!",
      "hint": "O chefe desfere golpes devastadores. Leve soldados e infantaria preparados.",
      "action": "Enfrentar Vorgath"
    },
    "q-c3-4": {
      "title": "O Portal Arcano",
      "desc": "Ative o Portal Dimensional (Nodo 7) para abrir a Selva Mística (Bioma 2).",
      "hint": "Após derrotar Vorgath, interaja com o portal no mapa da campanha.",
      "action": "Cruzar o Portal"
    },
    "q-c4-1": {
      "title": "Coroa Imperial",
      "desc": "Alcance o Nível de Reino 3 com seu Soberano.",
      "hint": "Ganhe experiência construindo, recrutando e conquistando masmorras.",
      "action": "Ver Perfil"
    },
    "q-c4-2": {
      "title": "O Herói Comandante",
      "desc": "Recrute o Comandante Paladino (Herói Supremo) para seu exército.",
      "hint": "O Paladino concede o ataque \"Fúria Real\" em duelos de campanha.",
      "action": "Recrutar Herói"
    },
    "q-c4-3": {
      "title": "A Grande Metrópole",
      "desc": "Ocupe pelo menos 10 lotes da praça imperial com edifícios ativos.",
      "hint": "Transforme a praça na capital próspera do império.",
      "action": "Construir na Praça"
    }
  }
}

// 2. Chapters Translations
const chapterTranslations = {
  kr: {
    c1: { title: "제1장: 영지의 재건", subtitle: "성벽을 재건하고 고원에 첫 번째 정착지를 세우세요.", badge: "제1장" },
    c2: { title: "제2장: 황무지의 위협", subtitle: "오크의 침략을 격퇴하고 도시의 군사력을 강화하세요.", badge: "제2장" },
    c3: { title: "제3장: 워로드의 그림자", subtitle: "원소 야수를 물리치고 공포의 보르가스를 섬멸하세요.", badge: "제3장" },
    c4: { title: "제4장: 대제국의 시대", subtitle: "우주 균열을 지배하고 왕국에서 가장 영광스러운 왕좌를 세우세요.", badge: "제4장" }
  },
  cn: {
    c1: { title: "第1章：领地重生", subtitle: "重建城垣并在高原上建立您的第一个定居点。", badge: "第1章" },
    c2: { title: "第2章：荒原威胁", subtitle: "击退兽人入侵并强化城池的军事战力。", badge: "第2章" },
    c3: { title: "第3章：军阀阴影", subtitle: "击败元素巨兽并消灭可怕的沃加斯。", badge: "第3章" },
    c4: { title: "第4章：大帝国时代", subtitle: "掌控宇宙裂隙，铸就王国至高荣耀的王座。", badge: "第4章" }
  },
  br: {
    c1: { title: "Capítulo I: O Renascer do Feudo", subtitle: "Reconstrua as muralhas e estabeleça seu primeiro assentamento no planalto.", badge: "Capítulo I" },
    c2: { title: "Capítulo II: A Ameaça dos Ermos", subtitle: "Repele a incursão orc e fortaleça a capacidade militar da cidade.", badge: "Capítulo II" },
    c3: { title: "Capítulo III: A Sombra do Senhor da Guerra", subtitle: "Derrote as bestas elementais e destrua o temível Vorgath.", badge: "Capítulo III" },
    c4: { title: "Capítulo IV: A Era do Grande Império", subtitle: "Domine os portais cósmicos e erga o trono mais glorioso do reino.", badge: "Capítulo IV" }
  }
}

// 3. Kingdom Levels Translations
const kingdomLevelsTranslations = {
  kr: {
    "1": { title: "초보 영지 마을", unlocks: ["황실 요새", "정착민 주택", "금광", "막사", "궁수 탑", "제재소"] },
    "2": { title: "요새화된 영지", unlocks: ["화강암 채석장", "대왕실 보급소", "황실 풍차"] },
    "3": { title: "번영하는 백작령", unlocks: ["혼돈의 비전 차원문", "요새 2단계 업그레이드", "전체 생산량 +10%"] },
    "4": { title: "혼돈의 왕좌 왕국", unlocks: ["성기사 지휘관", "비전 차원 원정", "군사력 +15%"] },
    "5": { title: "천상 제국", unlocks: ["인구 수용력 +25%", "모든 건물 생산량 +20%"] }
  },
  cn: {
    "1": { title: "初生村庄", unlocks: ["帝国要塞", "定居者民居", "金矿", "军营", "箭塔", "锯木厂"] },
    "2": { title: "坚固领地", unlocks: ["花岗岩采石场", "皇家大补给库", "帝国风车"] },
    "3": { title: "繁荣伯国", unlocks: ["混沌奥术传送门", "要塞2阶升级", "全境产出 +10%"] },
    "4": { title: "混沌王座王国", unlocks: ["圣骑士指挥官", "奥术次元远征", "军事力量 +15%"] },
    "5": { title: "天界帝国", unlocks: ["人口容量 +25%", "所有建筑产量 +20%"] }
  },
  br: {
    "1": { title: "Vila Inicial", unlocks: ["Fortaleza Imperial", "Casa de Colonos", "Mina de Ouro", "Quartel", "Torre de Arqueiros", "Serraria"] },
    "2": { title: "Domínio Fortificado", unlocks: ["Pedreira de Granito", "Grande Depósito Real", "Moinho Imperial"] },
    "3": { title: "Condado Próspero", unlocks: ["Portal Arcano do Caos", "Melhorias de Fortaleza Nível II", "+10% de Produção Global"] },
    "4": { title: "Reino do Trono do Caos", unlocks: ["Comandante Paladino", "Expedições Dimensionais Arcanas", "+15% de Poder Militar"] },
    "5": { title: "Império Celestial", unlocks: ["+25% de Capacidade Populacional", "+20% de Produção em Todos os Edifícios"] }
  }
}

// 4. Army Translations
const armyTranslations = {
  kr: {
    title: "황실 주둔군 및 막사",
    subtitle: "부대를 모집하여 고원을 수호하고 영토를 정복하세요",
    close: "닫기",
    soldiersInArms: "무장한 병사",
    offensivePower: "총 공격력",
    populationCapacity: "인구 수용력",
    filterAll: "모든 병과",
    filterMelee: "보병",
    filterRanged: "원거리",
    filterMagic: "비전술사",
    filterHero: "영웅",
    barracksRequired: "전쟁 막사 필요!",
    barracksRequiredDesc: "새로운 부대를 모집하고 훈련시키려면 광장에 전쟁 막사를 건설해야 합니다.",
    buildBarracks: "막사 건설",
    cost: "비용:",
    recruit1: "모집 +1",
    recruitMax: "최대 ({count})",
    unitsInGarrison: "주둔군 부대",
    recruitBatch: "한 번에 {count}명 모집",
    recruitMaxPossible: "최대 가능 인원 모집 ({count})",
    hp: "체력",
    infantry: {
      name: "왕좌 근위대 (보병)",
      role: "축복받은 갑옷과 사자 방패를 장착한 중보병 선봉대."
    },
    archers: {
      name: "정상 궁수대",
      role: "장거리에서 냉기 화살을 쏘는 치명적인 저격수."
    },
    mages: {
      name: "비전 조율사",
      role: "광역 분산 피해를 입히는 우주 번개의 지배자."
    },
    commander: {
      name: "성기사 지휘관 (영웅)",
      role: "사기 고양 오라(아군 공격력 +20%)를 지닌 최고 지휘자."
    }
  },
  cn: {
    title: "皇家驻军与军营",
    subtitle: "招募军团以守护高原并征伐辽阔疆土",
    close: "关闭",
    soldiersInArms: "服役士兵",
    offensivePower: "总攻战力",
    populationCapacity: "人口容量",
    filterAll: "全兵种",
    filterMelee: "步兵",
    filterRanged: "远程",
    filterMagic: "秘术",
    filterHero: "英雄",
    barracksRequired: "需要战争军营！",
    barracksRequiredDesc: "您必须在广场上建造一座战争军营，方可招募并训练新军。",
    buildBarracks: "建造军营",
    cost: "消耗：",
    recruit1: "招募 +1",
    recruitMax: "最大值 ({count})",
    unitsInGarrison: "驻军单位",
    recruitBatch: "批量招募 {count} 名",
    recruitMaxPossible: "招募最大可能数量 ({count})",
    hp: "生命值",
    infantry: {
      name: "王座卫队 (步兵)",
      role: "装备神圣重甲与雄狮坚盾的重装先锋。"
    },
    archers: {
      name: "巅峰神射手",
      role: "施放远距离霜寒箭矢的致命狙击手。"
    },
    mages: {
      name: "奥术导能师",
      role: "掌握范围散射雷霆的宇宙电芒大师。"
    },
    commander: {
      name: "圣骑士指挥官 (英雄)",
      role: "拥有激励光环（友军攻击力 +20%）的至高领袖。"
    }
  },
  br: {
    title: "Guarnição Real & Quartel",
    subtitle: "Recrute batalhões para proteger o planalto e conquistar terras",
    close: "Fechar",
    soldiersInArms: "Soldados em Armas",
    offensivePower: "Poder Ofensivo Total",
    populationCapacity: "Capacidade de População",
    filterAll: "Todas as Tropas",
    filterMelee: "Infantaria",
    filterRanged: "À Distância",
    filterMagic: "Místicos",
    filterHero: "Heróis",
    barracksRequired: "Quartel de Guerra Necessário!",
    barracksRequiredDesc: "Você deve construir um Quartel de Guerra na praça para recrutar e treinar novas tropas.",
    buildBarracks: "Construir Quartel",
    cost: "Custo:",
    recruit1: "Recrutar +1",
    recruitMax: "Máx ({count})",
    unitsInGarrison: "Unidades na guarnição",
    recruitBatch: "Recrutar {count} de uma vez",
    recruitMaxPossible: "Recrutar máx possível ({count})",
    hp: "VIDA",
    infantry: {
      name: "Guarda do Trono (Infantaria)",
      role: "Vanguarda pesada com armadura abençoada e escudo de leão."
    },
    archers: {
      name: "Arqueiros do Pico",
      role: "Atiradores letais com flechas de gelo a longa distância."
    },
    mages: {
      name: "Canalizadores Arcanos",
      role: "Mestres do relâmpago cósmico com dano de dispersão em área."
    },
    commander: {
      name: "Comandante Paladino (Herói)",
      role: "Líder supremo com aura de motivação (+20% de ATQ para aliados)."
    }
  }
}

// 5. TechData Translations
const techDataTranslations = {
  kr: {
    categories: {
      economy: "경제 및 생산",
      military: "군사력 및 전술",
      arcane: "신비학 및 비전"
    },
    techs: {
      "tech-swords": { name: "강철 검", desc: "보병 공격력 +20% 및 근접 생명력 증가." },
      "tech-shields": { name: "사자 방패", desc: "모든 지상 부대의 피해 감소 +15%." },
      "tech-bows": { name: "합성 활", desc: "궁수 사거리 증가 및 치명타율 +12%." },
      "tech-crystals": { name: "비전 결정학", desc: "마법사 피해 +25% 및 차원석 정제 효율 증가." },
      "tech-fury": { name: "황실의 분노", desc: "지휘관 필살기 발동 속도 및 위력 강화." },
      "tech-tactics": { name: "군사 전술", desc: "원정 및 결투 시 부대 피해 +15%." },
      "tech-metallurgy": { name: "고등 야금술", desc: "금광 및 채석장 생산 속도 +20%." },
      "tech-logistics": { name: "제국 물류", desc: "자원 저장 한도 +30% 및 운송 효율 증가." },
      "tech-astrology": { name: "천문 예언", desc: "이벤트 보상 +25% 및 신비한 발견 확률 증가." },
      "tech-masonry": { name: "석공술", desc: "건물 건설 및 업그레이드 비용 -15%." },
      "tech-fortification": { name: "성벽 요새화", desc: "도시 방어력 +30% 및 약탈 방지율 증가." },
      "tech-taxation": { name: "왕실 세제 개혁", desc: "주민 주택 골드 생산량 +25%." }
    }
  },
  cn: {
    categories: {
      economy: "经济与生产",
      military: "军事与战术",
      arcane: "神秘与奥术"
    },
    techs: {
      "tech-swords": { name: "精钢重剑", desc: "步兵攻击力 +20% 并增加近战生命值。" },
      "tech-shields": { name: "雄狮坚盾", desc: "所有地面部队的伤害减免 +15%。" },
      "tech-bows": { name: "复合强弓", desc: "提升弓箭手射程，暴击率 +12%。" },
      "tech-crystals": { name: "奥术晶体学", desc: "法师伤害 +25% 并提升晶石提炼效率。" },
      "tech-fury": { name: "皇家狂暴", desc: "提升指挥官绝招施放速度与威力。" },
      "tech-tactics": { name: "军事战术", desc: "远征与决斗中所有部队伤害 +15%。" },
      "tech-metallurgy": { name: "高等冶金", desc: "金矿与采石场产出速率 +20%。" },
      "tech-logistics": { name: "帝国后勤", desc: "资源仓储上限 +30% 并加快运载效率。" },
      "tech-astrology": { name: "星象预言", desc: "事件奖励 +25% 并提升神秘奇遇几率。" },
      "tech-masonry": { name: "建筑石工", desc: "建筑建造与升级开销 -15%。" },
      "tech-fortification": { name: "城防工事", desc: "城邦防御力 +30% 并大幅降低被掠夺率。" },
      "tech-taxation": { name: "皇家税赋改革", desc: "居民民居黄金产出 +25%。" }
    }
  },
  br: {
    categories: {
      economy: "Economia & Produção",
      military: "Poder Militar & Táticas",
      arcane: "Misticismo & Arcano"
    },
    techs: {
      "tech-swords": { name: "Espadas de Aço", desc: "+20% de ATQ da infantaria e aumento de vida corpo a corpo." },
      "tech-shields": { name: "Escudos de Leão", desc: "+15% de redução de dano para todas as tropas terrestres." },
      "tech-bows": { name: "Arcos Compostos", desc: "Aumenta o alcance dos arqueiros e +12% de chance crítica." },
      "tech-crystals": { name: "Cristalografia Arcana", desc: "+25% de dano dos magos e maior refino de cristais." },
      "tech-fury": { name: "Fúria Real", desc: "Acelera e potencializa o ataque especial do comandante." },
      "tech-tactics": { name: "Táticas Militares", desc: "+15% de dano das tropas em expedições e duelos." },
      "tech-metallurgy": { name: "Metalurgia Avançada", desc: "+20% de velocidade de produção em minas e pedreiras." },
      "tech-logistics": { name: "Logística Imperial", desc: "+30% de capacidade de estoque e transporte rápido." },
      "tech-astrology": { name: "Astrologia Mística", desc: "+25% em recompensas de eventos e descobertas arcanas." },
      "tech-masonry": { name: "Alvenaria Real", desc: "-15% no custo de construção e melhoria de edifícios." },
      "tech-fortification": { name: "Fortificação de Muralhas", desc: "+30% na defesa da cidade e proteção contra saques." },
      "tech-taxation": { name: "Reforma Tributária", desc: "+25% de ouro gerado nas casas dos colonos." }
    }
  }
}

// 6. Common Rarity Translations
const rarityTranslations = {
  kr: { common: "일반", rare: "희귀", legendary: "전설", mythic: "신화" },
  cn: { common: "普通", rare: "稀有", legendary: "传说", mythic: "神话" },
  br: { common: "Comum", rare: "Raro", legendary: "Lendário", mythic: "Mítico" }
}

for (const lang of ['kr', 'cn', 'br']) {
  const filePath = path.join(localesDir, `${lang}.js`)
  let content = fs.readFileSync(filePath, 'utf8')

  // Parse using dynamic import
  const module = await import(filePath)
  const data = module[lang]

  // Apply updates
  if (!data.quests) data.quests = {}
  if (!data.quests.story) data.quests.story = {}
  Object.assign(data.quests.story, questStoryTranslations[lang])

  if (!data.questData) data.questData = {}
  if (!data.questData.chapters) data.questData.chapters = {}
  Object.assign(data.questData.chapters, chapterTranslations[lang])
  if (!data.questData.story) data.questData.story = {}
  Object.assign(data.questData.story, questStoryTranslations[lang])

  data.kingdomLevels = kingdomLevelsTranslations[lang]
  data.army = armyTranslations[lang]
  data.techData = techDataTranslations[lang]
  if (!data.common) data.common = {}
  data.common.rarity = rarityTranslations[lang]

  // Re-serialize module
  const newContent = `export const ${lang} = ${JSON.stringify(data, null, 2)};\n`
  fs.writeFileSync(filePath, newContent, 'utf8')
  console.log(`Successfully patched complete translations in ${lang}.js`)
}
