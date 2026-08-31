import fs from 'node:fs'
import { randomUUID } from 'node:crypto'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { adminUsers, products, settings, type ProductStat } from '../lib/db/schema'
import { DEFAULT_SETTINGS } from '../lib/settings'
import { hashPassword } from '../lib/auth/password'

if (fs.existsSync('.env.local')) process.loadEnvFile('.env.local')

const sqlite = new Database(process.env.DATABASE_URL?.replace(/^file:/, '') ?? 'mangal.db')
const db = drizzle(sqlite)

const stat = (key: string, label: string, value: string, bar?: number): ProductStat => ({
  key,
  label,
  value,
  bar,
})

const CATALOG = [
  {
    slot: 1,
    slug: 'stalker-6mm',
    title: 'СТАЛКЕР 6ММ',
    tagline: 'Базовый ствол арсенала. Не изящен, зато переживёт хозяина.',
    price: 435000,
    alt: 'Пиксельный мангал с прямыми ножками, шестью шампурами и тлеющими углями',
    stats: [
      stat('steel', 'ТОЛЩИНА СТАЛИ', '6 мм', 60),
      stat('weight', 'ВЕС', '34 кг', 55),
      stat('skewers', 'ШАМПУРОВ', '8 шт', 65),
      stat('size', 'ГАБАРИТЫ', '80×35×85 см', 50),
    ],
    description: `Рабочая лошадь линейки. Корпус из листа **6 мм** — не ведёт после десятого розжига, не выгибается от жара.\n\n- сплошной шов по периметру, зачищен заподлицо\n- поддув: восемь отверстий под уровнем углей\n- ножки съёмные, в багажник влезает\n\nБерут, когда мангал ставят один раз и надолго.`,
  },
  {
    slot: 2,
    slug: 'ochag-3mm',
    title: 'ОЧАГ 3ММ',
    tagline: 'Лёгкий и дешёвый. Для дачи, где мангал живёт под навесом.',
    price: 229000,
    alt: 'Небольшой пиксельный мангал на перекрещенных ножках',
    stats: [
      stat('steel', 'ТОЛЩИНА СТАЛИ', '3 мм', 30),
      stat('weight', 'ВЕС', '14 кг', 22),
      stat('skewers', 'ШАМПУРОВ', '6 шт', 45),
      stat('size', 'ГАБАРИТЫ', '60×30×80 см', 35),
    ],
    description: `Самая доступная позиция. Сталь **3 мм** — компромисс: легче носить, но при постоянной эксплуатации на открытом воздухе корпус поведёт за пару сезонов.\n\nЧестно предупреждаем: если жарите каждые выходные — смотрите на 6 мм и толще.`,
  },
  {
    slot: 3,
    slug: 'kuznets-8mm',
    title: 'КУЗНЕЦ 8ММ',
    tagline: 'Тяжёлый калибр с боковым столиком. Один раз поставил — и всё.',
    price: 689000,
    alt: 'Массивный пиксельный мангал с боковым столиком и ярко горящими углями',
    stats: [
      stat('steel', 'ТОЛЩИНА СТАЛИ', '8 мм', 80),
      stat('weight', 'ВЕС', '58 кг', 82),
      stat('skewers', 'ШАМПУРОВ', '10 шт', 80),
      stat('size', 'ГАБАРИТЫ', '95×40×90 см', 70),
    ],
    description: `Стационарная модель. **8 мм** держат температуру: угли не гаснут между партиями, мясо доходит ровно.\n\nБоковой столик из той же стали — на него можно ставить чугун, а не только тарелку.`,
  },
  {
    slot: 4,
    slug: 'kolodec-grill',
    title: 'КОЛОДЕЦ ГРИЛЬ',
    tagline: 'Решётка вместо шампуров. Для стейков и овощей целиком.',
    price: 519000,
    alt: 'Пиксельный гриль-колонна на центральной опоре с решёткой',
    stats: [
      stat('steel', 'ТОЛЩИНА СТАЛИ', '4 мм', 40),
      stat('weight', 'ВЕС', '27 кг', 45),
      stat('skewers', 'РЕШЁТКА', '45×30 см', 60),
      stat('size', 'ГАБАРИТЫ', '55×45×105 см', 65),
    ],
    description: `Вертикальная стойка с чугунной решёткой на трёх уровнях. Высоту жара регулируете не углями, а положением решётки.\n\nШампуры тоже кладутся — пазы под них есть.`,
  },
  {
    slot: 5,
    slug: 'kazan-hybrid',
    title: 'КАЗАН ГИБРИД',
    tagline: 'Мангал с крышкой и кольцом под казан. Две задачи, один корпус.',
    price: 795000,
    alt: 'Пиксельный мангал с откидной крышкой и дымовой трубой',
    stats: [
      stat('steel', 'ТОЛЩИНА СТАЛИ', '6 мм', 60),
      stat('weight', 'ВЕС', '49 кг', 72),
      stat('skewers', 'ШАМПУРОВ', '8 шт', 65),
      stat('size', 'ГАБАРИТЫ', '90×40×95 см', 72),
    ],
    description: `Крышка с трубой превращает мангал в полузакрытый гриль: можно томить, а не только жарить на открытом жару.\n\nСнимаете центральную секцию — получаете кольцо под казан на 8 литров.`,
  },
  {
    slot: 6,
    slug: 'pohod-4mm',
    title: 'ПОХОД 4ММ',
    tagline: 'Складной, 9 кг, помещается в багажник седана.',
    price: 179000,
    alt: 'Компактный складной пиксельный мангал на косых ножках',
    stats: [
      stat('steel', 'ТОЛЩИНА СТАЛИ', '4 мм', 40),
      stat('weight', 'ВЕС', '9 кг', 15),
      stat('skewers', 'ШАМПУРОВ', '6 шт', 45),
      stat('size', 'ГАБАРИТЫ', '50×26×70 см', 25),
    ],
    description: `Разбирается без инструмента за минуту, ножки складываются внутрь корпуса. В комплекте чехол из брезента.\n\nНе стационарный вариант: **4 мм** для выездов, а не для ежедневной жарки во дворе.`,
  },
  {
    slot: 7,
    slug: 'bastion-10mm',
    title: 'БАСТИОН 10ММ',
    tagline: 'Максимальный калибр. Вес как у мотоцикла, ресурс как у бетона.',
    price: 1149000,
    alt: 'Очень широкий пиксельный мангал с решёткой, столиком и жарким огнём',
    stats: [
      stat('steel', 'ТОЛЩИНА СТАЛИ', '10 мм', 100),
      stat('weight', 'ВЕС', '86 кг', 100),
      stat('skewers', 'ШАМПУРОВ', '12 шт', 95),
      stat('size', 'ГАБАРИТЫ', '120×45×95 см', 95),
    ],
    description: `Для тех, кто жарит на компанию из двадцати человек и не хочет думать про мангал следующие двадцать лет.\n\n**10 мм** — это уже не мангал, это оборудование. Перевозить вдвоём, ставить один раз.`,
  },
  {
    slot: 8,
    slug: 'dym-koptilnya',
    title: 'ДЫМ КОПТИЛЬНЯ',
    tagline: 'Мангал и холодное копчение в одном корпусе.',
    price: 869000,
    alt: 'Пиксельный мангал-коптильня на центральной опоре с крышкой и трубой',
    stats: [
      stat('steel', 'ТОЛЩИНА СТАЛИ', '6 мм', 60),
      stat('weight', 'ВЕС', '52 кг', 76),
      stat('skewers', 'КРЮКОВ', '10 шт', 70),
      stat('size', 'ГАБАРИТЫ', '85×40×140 см', 88),
    ],
    description: `Верхняя камера с крюками и задвижкой, нижняя — топка. Дымогенератор в комплекте.\n\nЗа один заход: шашлык внизу, грудинка холодного копчения наверху.`,
    inStock: false,
  },
] as const

const now = Math.floor(Date.now() / 1000)

db.delete(products).run()
for (const item of CATALOG) {
  db.insert(products)
    .values({
      id: randomUUID(),
      slug: item.slug,
      title: item.title,
      tagline: item.tagline,
      description: item.description,
      priceMinor: item.price,
      currency: 'PLN',
      stats: [...item.stats] as ProductStat[],
      spriteUrl: `/sprites/${item.slug}.png`,
      spriteAlt: item.alt,
      slotIndex: item.slot,
      isActive: true,
      inStock: 'inStock' in item ? item.inStock : true,
      createdAt: now,
      updatedAt: now,
    })
    .run()
}

for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
  db.insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } })
    .run()
}

async function seedAdmin() {
  const login = process.env.SEED_ADMIN_LOGIN ?? 'admin'
  const password = process.env.SEED_ADMIN_PASSWORD
  if (!password) {
    console.warn('SEED_ADMIN_PASSWORD не задан — администратор не создан')
    return
  }
  const passwordHash = await hashPassword(password)
  db.insert(adminUsers)
    .values({ id: randomUUID(), login, passwordHash, role: 'admin', createdAt: now })
    .onConflictDoUpdate({ target: adminUsers.login, set: { passwordHash } })
    .run()
  console.log(`Администратор: ${login}`)
}

seedAdmin().then(() => {
  console.log(`Товаров загружено: ${CATALOG.length}`)
})
