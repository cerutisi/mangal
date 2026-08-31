import { SectionTitle } from '@/components/ui/Panel'
import type { SiteSettings } from '@/lib/settings'

export function Contacts({ contacts }: { contacts: SiteSettings['contacts'] }) {
  const rows = [
    { label: 'Телефон', value: contacts.phone, href: `tel:${contacts.phone.replace(/\s/g, '')}` },
    {
      label: 'Telegram',
      value: contacts.telegram,
      href: `https://t.me/${contacts.telegram.replace('@', '')}`,
    },
    {
      label: 'WhatsApp',
      value: contacts.whatsapp,
      href: `https://wa.me/${contacts.whatsapp.replace(/\D/g, '')}`,
    },
    { label: 'Мастерская', value: contacts.city },
    { label: 'Часы', value: contacts.hours },
  ]

  return (
    <section id="contacts" className="mx-auto max-w-5xl px-2 py-6">
      <SectionTitle>Связь</SectionTitle>

      <dl className="mt-3 grid gap-x-3 sm:grid-cols-[auto_1fr]">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="pt-1 text-[11px] uppercase tracking-widest text-steel-500">
              {row.label}
            </dt>
            <dd className="border-b-2 border-steel-700 pb-1 text-hud text-bone">
              {row.href ? (
                <a href={row.href} className="hover:text-coal">
                  {row.value}
                </a>
              ) : (
                row.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
