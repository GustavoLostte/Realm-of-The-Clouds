import fs from 'fs';

const shopDataByLocale = {
  us: {
    allianceDiscount: "-70% DISCOUNT",
    gemPacks: {
      pack_handful: {
        name: "Handful of Gems",
        desc: "Small pouch of arcane crystals for quick speedups and consumables.",
        badge: ""
      },
      pack_pouch: {
        name: "Bag of Gems",
        desc: "The favorite choice of sovereigns. Ideal for boosting the fief and unlocking technologies.",
        badge: "POPULAR"
      },
      pack_chest: {
        name: "Imperial Gem Chest",
        desc: "A chest brimming with pure crystals. Activate sovereign perks and revive in dungeons.",
        badge: "BEST VALUE"
      },
      pack_vault: {
        name: "Throne Vault",
        desc: "Boundless arcane wealth to dominate every biome and forge a legendary empire.",
        badge: "TITANIC"
      }
    },
    perkBadges: {
      perk_harvest_horn: "QOL #1",
      perk_second_builder: "EXPANSION x2",
      perk_daily_blessing: "10x VALUE",
      perk_engineering: "MAX SPEED"
    },
    perkBenefits: {
      perk_harvest_horn: "Instant harvest of the entire fief in 1 tap with +25% bonus.",
      perk_second_builder: "2 simultaneous constructions underway.",
      perk_daily_blessing: "+35 Crystals every day for 30 days.",
      perk_engineering: "-30% construction time and -25% production cycle time."
    }
  },
  es: {
    allianceDiscount: "-70% DESCUENTO",
    gemPacks: {
      pack_handful: {
        name: "Puñado de Gemas",
        desc: "Bolsita de cristales arcanos para pequeñas aceleraciones y consumibles.",
        badge: ""
      },
      pack_pouch: {
        name: "Bolsa de Gemas",
        desc: "La elección favorita de los soberanos. Ideal para acelerar el feudo y desbloquear tecnologías.",
        badge: "POPULAR"
      },
      pack_chest: {
        name: "Cofre Imperial de Gemas",
        desc: "Un arcón repleto de cristales puros. Permite activar ventajas del soberano y revivir en mazmorras.",
        badge: "MEJOR VALOR"
      },
      pack_vault: {
        name: "Bóveda del Trono",
        desc: "Riqueza arcana ilimitada para dominar todos los biomas y erigir un imperio legendario.",
        badge: "TITÁNICO"
      }
    },
    perkBadges: {
      perk_harvest_horn: "CALIDAD DE VIDA #1",
      perk_second_builder: "EXPANSIÓN x2",
      perk_daily_blessing: "VALOR x10",
      perk_engineering: "VELOCIDAD TOTAL"
    },
    perkBenefits: {
      perk_harvest_horn: "Cosecha instantánea de todo el feudo en 1 clic con +25% de bonus.",
      perk_second_builder: "2 obras simultáneas en marcha.",
      perk_daily_blessing: "+35 Gemas cada día durante 30 días.",
      perk_engineering: "-30% tiempo de obra y -25% tiempo de producción."
    }
  },
  br: {
    allianceDiscount: "-70% DESCONTO",
    gemPacks: {
      pack_handful: {
        name: "Punhado de Gemas",
        desc: "Bolsa de cristais arcanos para acelerações rápidas e consumíveis.",
        badge: ""
      },
      pack_pouch: {
        name: "Bolsa de Gemas",
        desc: "A escolha favorita dos soberanos. Ideal para acelerar o feudo e desbloquear tecnologias.",
        badge: "POPULAR"
      },
      pack_chest: {
        name: "Baú Imperial de Gemas",
        desc: "Um baú repleto de cristais puros. Ative vantagens do soberano e reviva em masmorras.",
        badge: "MELHOR VALOR"
      },
      pack_vault: {
        name: "Cofre do Trono",
        desc: "Riqueza arcana ilimitada para dominar todos os biomas e forjar um império lendário.",
        badge: "TITÂNICO"
      }
    },
    perkBadges: {
      perk_harvest_horn: "QUALIDADE DE VIDA #1",
      perk_second_builder: "EXPANSÃO x2",
      perk_daily_blessing: "VALOR x10",
      perk_engineering: "VELOCIDADE TOTAL"
    },
    perkBenefits: {
      perk_harvest_horn: "Colheita instantânea de todo o feudo em 1 clique com +25% de bônus.",
      perk_second_builder: "2 construções simultâneas em andamento.",
      perk_daily_blessing: "+35 Cristais todos os dias durante 30 dias.",
      perk_engineering: "-30% no tempo de obra e -25% no ciclo de produção."
    }
  },
  kr: {
    allianceDiscount: "-70% 할인",
    gemPacks: {
      pack_handful: {
        name: "한 줌의 보석",
        desc: "빠른 속도 향상 및 소모품을 위한 신비한 수정 주머니.",
        badge: ""
      },
      pack_pouch: {
        name: "보석 주머니",
        desc: "군주들이 가장 선호하는 선택. 영지 발전과 기술 잠금 해제에 이상적입니다.",
        badge: "인기"
      },
      pack_chest: {
        name: "제국 보석 상자",
        desc: "순수한 수정으로 가득 찬 상자. 군주 특전을 활성화하고 던전에서 부활할 수 있습니다.",
        badge: "최고 가성비"
      },
      pack_vault: {
        name: "왕좌의 금고",
        desc: "모든 생물 군계를 정복하고 전설적인 제국을 건설할 수 있는 무한한 신비한 부.",
        badge: "타이탄"
      }
    },
    perkBadges: {
      perk_harvest_horn: "편의성 #1",
      perk_second_builder: "확장 x2",
      perk_daily_blessing: "10배 가치",
      perk_engineering: "최고 속도"
    },
    perkBenefits: {
      perk_harvest_horn: "한 번의 탭으로 영지 전체 즉시 수확 및 +25% 보너스.",
      perk_second_builder: "동시에 2개의 건설 진행 가능.",
      perk_daily_blessing: "30일 동안 매일 35개의 크리스탈 지급.",
      perk_engineering: "건설 시간 -30%, 생산 주기 -25% 단축."
    }
  },
  cn: {
    allianceDiscount: "-70% 特惠折扣",
    gemPacks: {
      pack_handful: {
        name: "一把宝石",
        desc: "用于快速加速和消耗品的一小袋秘术水晶。",
        badge: ""
      },
      pack_pouch: {
        name: "宝石锦囊",
        desc: "领主们的最爱之选。加速领地发展和解锁科技的理想之选。",
        badge: "热门"
      },
      pack_chest: {
        name: "帝国宝石宝箱",
        desc: "装满纯净水晶的宝箱。激活领主特权并在地牢中复活。",
        badge: "超值首选"
      },
      pack_vault: {
        name: "王座金库",
        desc: "无尽的秘术财富，征服每一个生态群落，筑就传奇帝国。",
        badge: "泰坦级"
      }
    },
    perkBadges: {
      perk_harvest_horn: "便民首选 #1",
      perk_second_builder: "双倍扩张",
      perk_daily_blessing: "超值十倍",
      perk_engineering: "极速掌控"
    },
    perkBenefits: {
      perk_harvest_horn: "一键收割全城并享有 +25% 皇家加成。",
      perk_second_builder: "同时进行两处建筑施工工程。",
      perk_daily_blessing: "连续30天每日领取35颗秘术水晶。",
      perk_engineering: "建造时间减少30%，资源生产加速25%。"
    }
  }
};

for (const lang of ['us', 'es', 'br', 'kr', 'cn']) {
  const filePath = `src/i18n/locales/${lang}.js`;
  let content = fs.readFileSync(filePath, 'utf8');

  const locData = shopDataByLocale[lang];

  // 1. Add allianceDiscount inside starterPack
  if (!content.includes('"allianceDiscount"')) {
    content = content.replace(
      /("allianceDesc":\s*"[^"]+")\s*\n(\s*})/,
      `$1,\n    "allianceDiscount": "${locData.allianceDiscount}"\n$2`
    );
  }

  // 2. Add gemPacks, perkBadges, perkBenefits inside shop
  if (!content.includes('"gemPacks"')) {
    const shopInsert = `,\n    "gemPacks": ${JSON.stringify(locData.gemPacks, null, 6).trim()},\n    "perkBadges": ${JSON.stringify(locData.perkBadges, null, 6).trim()},\n    "perkBenefits": ${JSON.stringify(locData.perkBenefits, null, 6).trim()}`;
    content = content.replace(
      /("dailyBlessingDesc":\s*"[^"]+")\s*\n(\s*},\s*\n\s*"profile")/,
      `$1${shopInsert}\n$2`
    );
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${filePath}`);
}
