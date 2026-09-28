// City Layout & Hall Configuration for Realm of the Clouds
// Official central hub connecting the 6 architectural cloud corridors

export const CLOUD_CITY_HALLS = [
  {
    id: 'exit_left',
    hallIndex: 0,
    hallNumber: 1,
    name: 'Reino de las Nubes',
    hallName: 'Puente Celestial del Oeste',
    zoneTag: 'Salida Oeste / Muelle de Dirigibles',
    bg: '/MAPS/Realm_of_the_Clouds/cloud_hall_exit_left.jpg',
    groundOffset: '31.0%',
    description: 'Embarcadero flotante con vistas al horizonte y navíos celestiales.',
    leftExitIndex: 5,
    rightExitIndex: 1,
    npcs: [
      {
        id: 'npc_market',
        name: 'Barnaby Mercader',
        title: 'Bazar Central de las Nubes',
        role: 'Market',
        avatar: '/NPCS/npc_market.jpg',
        x: 48,
        dialog: '¡Bienvenido a las alturas, noble Paladín! Los mejores tesoros y suministros de los siete reinos pasan por mi balanza.',
        badgeColor: '#eab308'
      }
    ]
  },
  {
    id: 'hall_1',
    hallIndex: 1,
    hallNumber: 2,
    name: 'Reino de las Nubes',
    hallName: 'Pasillo del Alba',
    zoneTag: 'Corredor de Alquimia y Magia Rúnica',
    bg: '/MAPS/Realm_of_the_Clouds/cloud_hall_1.jpg',
    groundOffset: '31.0%',
    description: 'Santuario de alquimia y magia rúnica bañado por rayos de sol matutino.',
    leftExitIndex: 0,
    rightExitIndex: 2, // Leads into center (cloud_hall_4)!
    npcs: [
      {
        id: 'npc_potions',
        name: 'Alquimista Aurelius',
        title: 'Maestro de Elixires Sagrados',
        role: 'Pociones',
        avatar: '/NPCS/npc_potions.jpg',
        x: 22,
        dialog: 'Mis elixires concentran el rocío puro de los cielos. ¡Te mantendrán con vida en el combate!',
        badgeColor: '#06b6d4'
      },
      {
        id: 'npc_runes',
        name: 'Sylvia Rúnica',
        title: 'Erudita de las Runas Antiguas',
        role: 'Runas',
        avatar: '/NPCS/npc_runes.jpg',
        x: 52,
        dialog: 'Las piedras rúnicas guardan el secreto de los ancestros celestiales. ¿Deseas despertar su poder?',
        badgeColor: '#8b5cf6'
      },
      {
        id: 'npc_imbuiment',
        name: 'Gorim Martilloceleste',
        title: 'Maestro Encantador',
        role: 'Imbuiment',
        avatar: '/NPCS/npc_imbuiment.jpg',
        x: 78,
        dialog: '¡Puedo imbuir tus flechas y carcaj con fuego estelar y bendiciones divinas!',
        badgeColor: '#ec4899'
      }
    ]
  },
  {
    id: 'hall_4_center',
    hallIndex: 2,
    hallNumber: 3,
    isCenter: true,
    name: 'Reino de las Nubes',
    hallName: 'Plaza Central del Palacio',
    zoneTag: '⭐ CENTRO DE LA CIUDAD — Gran Puerta Dorada',
    bg: '/MAPS/Realm_of_the_Clouds/cloud_hall_4.jpg',
    groundOffset: '31.0%',
    description: 'El corazón soberano del Reino de las Nubes. Aquí se erige la imponente Gran Puerta Dorada del Palacio.',
    leftExitIndex: 1,
    rightExitIndex: 3,
    npcs: [
      {
        id: 'npc_quest',
        name: 'Comandante Valeria',
        title: 'Tablón de Misiones del Reino',
        role: 'Quest / Misiones',
        avatar: '/NPCS/npc_quest.jpg',
        x: 20,
        dialog: '¡Saludos, Paladín! El Alto Consejo busca héroes de puntería implacable para defender los templos flotantes.',
        badgeColor: '#f97316'
      },
      {
        id: 'npc_teleport',
        name: 'Zephyrus',
        title: 'Maestro de Portales y Vientos',
        role: 'Teleport',
        avatar: '/NPCS/npc_teleport.jpg',
        x: 50,
        dialog: 'Las corrientes etéreas conectan este palacio celestial con todas las regiones del mundo. ¿Hacia dónde deseas viajar?',
        badgeColor: '#3b82f6'
      },
      {
        id: 'npc_class_change',
        name: 'Archimaestro Eldor',
        title: 'Tutor de Clases y Disciplinas',
        role: 'Cambio de Clase',
        avatar: '/NPCS/npc_class_change.jpg',
        x: 80,
        dialog: 'El camino de la luz es amplio. Si alguna vez deseas cambiar tu vocación de combate, yo te guiaré.',
        badgeColor: '#10b981'
      }
    ]
  },
  {
    id: 'hall_3',
    hallIndex: 3,
    hallNumber: 4,
    name: 'Reino de las Nubes',
    hallName: 'Paseo de las Fuentes Celestiales',
    zoneTag: 'Corredor de las Arcas y Almacenes',
    bg: '/MAPS/Realm_of_the_Clouds/cloud_hall_3.jpg',
    groundOffset: '31.0%',
    description: 'Elegante alameda suspendida con vista a jardines flotantes y cascadas de rocío celestial.',
    leftExitIndex: 2, // Leads into center (cloud_hall_4)!
    rightExitIndex: 4,
    npcs: [
      {
        id: 'npc_bank',
        name: 'Lord Silverfinch',
        title: 'Banquero Real de la Corte',
        role: 'Banco',
        avatar: '/NPCS/npc_bank.jpg',
        x: 32,
        dialog: 'Tus monedas de oro y reliquias celestiales están custodiadas bajo los más estrictos sellos mágicos.',
        badgeColor: '#eab308'
      },
      {
        id: 'npc_storage',
        name: 'Hilda Cuidadora',
        title: 'Guardiana del Baúl y Alijo',
        role: 'Baúl / Almacén',
        avatar: '/NPCS/npc_storage.jpg',
        x: 72,
        dialog: 'Guardo todo tu equipamiento extra en baúles mágicos con acceso ilimitado desde cualquier reino.',
        badgeColor: '#a855f7'
      }
    ]
  },
  {
    id: 'hall_2',
    hallIndex: 4,
    hallNumber: 5,
    name: 'Reino de las Nubes',
    hallName: 'Avenida de la Guardia Real',
    zoneTag: 'Distrito de Armería y Tiro Celestial',
    bg: '/MAPS/Realm_of_the_Clouds/cloud_hall_2.jpg',
    groundOffset: '31.0%',
    description: 'Corredor de armería y campo de prueba para arqueros y soldados celestiales.',
    leftExitIndex: 3,
    rightExitIndex: 5,
    npcs: [
      {
        id: 'npc_bow_shop',
        name: 'Kaelen Flechasol',
        title: 'Maestro de Arcos y Flechas',
        role: 'Arcos y Flechas',
        avatar: '/NPCS/npc_bow_shop.jpg',
        x: 28,
        dialog: '¡Para un Paladín de la Luz, sólo lo mejor! Arcos consagrados con plumas de fénix y astiles de cedro celestial.',
        badgeColor: '#f59e0b'
      },
      {
        id: 'npc_armory',
        name: 'Thorin Coraza Férrea',
        title: 'Maestro de Armaduras y Espadas',
        role: 'Armaduras y Espadas',
        avatar: '/NPCS/npc_armory.jpg',
        x: 74,
        dialog: 'Nuestras cotas y escudos celestiales repelen las garras más oscuras. ¡Acércate al yunque!',
        badgeColor: '#64748b'
      }
    ]
  },
  {
    id: 'exit_right',
    hallIndex: 5,
    hallNumber: 6,
    name: 'Reino de las Nubes',
    hallName: 'Gran Puente del Santuario',
    zoneTag: 'Salida Este / Camino a las Mazmorras',
    bg: '/MAPS/Realm_of_the_Clouds/cloud_hall_exit_right.jpg',
    groundOffset: '31.0%',
    description: 'La gran calzada celestial hacia las torres exteriores y campos de batalla del reino.',
    leftExitIndex: 4,
    rightExitIndex: 0,
    npcs: []
  }
]

export const CENTER_CITY_HALL_INDEX = 2 // Index for cloud_hall_4.jpg
