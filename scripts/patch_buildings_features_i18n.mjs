import fs from 'fs'
import path from 'path'

const localesDir = path.resolve('src/i18n/locales')
const files = ['es.js', 'us.js', 'br.js', 'kr.js', 'cn.js']

const ACADEMIA_I18N = {
  es: {
    name: "Gran Academia Arcana",
    desc: "Círculo de eruditos y sabios reales. Canaliza investigaciones y desbloquea el Árbol Tecnológico del imperio."
  },
  us: {
    name: "Grand Arcane Academy",
    desc: "Circle of scholars and royal sages. Channels research and unlocks the imperial Technology Tree."
  },
  br: {
    name: "Grande Academia Arcana",
    desc: "Círculo de sábios e eruditos reais. Conduz pesquisas e desbloqueia a Árvore Tecnológica do império."
  },
  kr: {
    name: "대비전 학술원",
    desc: "왕실 학자들의 중심지. 연구를 진행하고 제국의 기술 트리를 해금합니다."
  },
  cn: {
    name: "大奥术学院",
    desc: "皇家学者与贤者圣所。推动科研并解锁帝国的技术科技树。"
  }
}

const BUTTONS_I18N = {
  es: {
    openExpeditionsBtn: "Abrir Grieta Cósmica & Expediciones",
    openInventoryBtn: "Abrir Bóveda e Inventario Real",
    openTechTreeBtn: "Investigar Tecnologías del Reino",
    storageCapacityTitle: "Capacidad de Almacenamiento del Reino",
    storageCapacityDesc: "Sube de nivel el Gran Almacén para expandir el límite máximo de recolección de provisiones."
  },
  us: {
    openExpeditionsBtn: "Open Cosmic Rift & Expeditions",
    openInventoryBtn: "Open Vault & Royal Inventory",
    openTechTreeBtn: "Research Kingdom Technologies",
    storageCapacityTitle: "Kingdom Storage Capacity",
    storageCapacityDesc: "Level up the Grand Warehouse to expand the maximum collection limit for supplies."
  },
  br: {
    openExpeditionsBtn: "Abrir Fenda Cósmica e Expedições",
    openInventoryBtn: "Abrir Cofre e Inventário Real",
    openTechTreeBtn: "Pesquisar Tecnologias do Reino",
    storageCapacityTitle: "Capacidade de Armazenamento do Reino",
    storageCapacityDesc: "Suba o nível do Grande Armazém para expandir o limite máximo de provisões."
  },
  kr: {
    openExpeditionsBtn: "우주 균열 및 원정 열기",
    openInventoryBtn: "보물 금고 및 왕실 인벤토리 열기",
    openTechTreeBtn: "왕국 기술 연구하기",
    storageCapacityTitle: "왕국 자원 보관 한도",
    storageCapacityDesc: "대형 창고를 강화하여 자원 보관 한도를 확장하세요."
  },
  cn: {
    openExpeditionsBtn: "开启宇宙裂缝与远征",
    openInventoryBtn: "打开皇家金库与物品栏",
    openTechTreeBtn: "研发王国帝国科技",
    storageCapacityTitle: "王国资源存储容量上限",
    storageCapacityDesc: "升级大仓库以大幅提高帝国的各项物资储备上限。"
  }
}

for (const f of files) {
  const lang = f.replace('.js', '')
  const filePath = path.join(localesDir, f)
  let content = fs.readFileSync(filePath, 'utf-8')

  // 1. Insert academia inside buildings.slots
  const acadData = ACADEMIA_I18N[lang]
  const acadJsonSnippet = `      "academia": {\n        "name": ${JSON.stringify(acadData.name)},\n        "desc": ${JSON.stringify(acadData.desc)}\n      },\n`

  if (!content.includes('"academia":')) {
    content = content.replace('"slots": {', `"slots": {\n${acadJsonSnippet}`)
  }

  // 2. Insert the 5 buttons under "buildings": {
  const btnData = BUTTONS_I18N[lang]
  const btnJsonSnippet = `    "openExpeditionsBtn": ${JSON.stringify(btnData.openExpeditionsBtn)},\n    "openInventoryBtn": ${JSON.stringify(btnData.openInventoryBtn)},\n    "openTechTreeBtn": ${JSON.stringify(btnData.openTechTreeBtn)},\n    "storageCapacityTitle": ${JSON.stringify(btnData.storageCapacityTitle)},\n    "storageCapacityDesc": ${JSON.stringify(btnData.storageCapacityDesc)},\n`

  if (!content.includes('"openExpeditionsBtn":')) {
    content = content.replace('"buildings": {', `"buildings": {\n${btnJsonSnippet}`)
  }

  fs.writeFileSync(filePath, content, 'utf-8')
  console.log(`Patched ${f} successfully`)
}
