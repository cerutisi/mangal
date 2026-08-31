export const SETTINGS_TAG = 'settings'

export type ThemeName = 'iron' | 'blocks'

export type SiteSettings = {
  hero: { title: string; subtitle: string; cta: string }
  contacts: { phone: string; telegram: string; whatsapp: string; city: string; hours: string }
  production: { icon: string; title: string; text: string }[]
  footer: { about: string; legal: string }
  emails: { clientSubject: string; managerSubject: string; replyTime: string }
  theme: ThemeName
  demoNotice: string
}

export const DEFAULT_SETTINGS: SiteSettings = {
  hero: {
    title: 'МАНГАЛЫ ИЗ ЧЁРНОЙ СТАЛИ',
    subtitle: 'Сварено вручную. Переживёт вас, ваших детей и пару переездов.',
    cta: 'В АРСЕНАЛ',
  },
  contacts: {
    phone: '+48 601 234 567',
    telegram: '@mangal_stal',
    whatsapp: '+48 601 234 567',
    city: 'Вроцлав, ул. Пшемысловая 14',
    hours: 'Пн–Пт 09:00–18:00',
  },
  production: [
    {
      icon: 'icon-steel',
      title: 'СТАЛЬ',
      text: 'Лист 3–10 мм холоднокатаной стали. Никакой оцинковки: она горит и травит еду.',
    },
    {
      icon: 'icon-weld',
      title: 'СВАРКА',
      text: 'Полуавтомат в среде аргона, сплошной шов по периметру. Швы зачищены заподлицо.',
    },
    {
      icon: 'icon-paint',
      title: 'ПОКРАСКА',
      text: 'Пескоструй, грунт и термостойкая эмаль до 800 °C. Не облезает после первой растопки.',
    },
    {
      icon: 'icon-shield',
      title: 'ГАРАНТИЯ',
      text: '5 лет на прогар корпуса. Прогорел — меняем, без экспертиз и переписки.',
    },
  ],
  footer: {
    about: 'Мастерская стальных мангалов. Работаем с 2014 года.',
    legal: 'Пиксель-графика и тексты — собственные. Все права на них у мастерской.',
  },
  emails: {
    clientSubject: 'Заявка принята',
    managerSubject: 'Новая заявка с сайта',
    replyTime: 'в течение рабочего дня',
  },
  theme: 'iron',
  demoNotice: 'ВИТРИНА-ДЕМО. ОПЛАТА НА САЙТЕ НЕ ПРОИЗВОДИТСЯ — МЕНЕДЖЕР СВЯЖЕТСЯ И ПОДТВЕРДИТ ЗАКАЗ.',
}
