import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import { contact } from '@/src/config/contact'
import { locale } from '@/src/components/layout/locale'

/**
 * Contact details with a WhatsApp button and a map, read from `src/config/contact.ts`.
 * Nothing configured means nothing rendered, so a template can always include it.
 * `message` is the text WhatsApp opens with (for example the listing being asked about).
 */
export default function ContactBlock({ message = '', className = '' }: { message?: string; className?: string }) {
  const whatsapp = contact.whatsapp.replace(/\D/g, '')
  const phone = contact.phone.trim()
  const email = contact.email.trim()
  const address = contact.address.trim()
  const hours = contact.hours.trim()
  if (!whatsapp && !phone && !email && !address && !hours) return null
  const whatsappLink = `https://wa.me/${whatsapp}${message ? `?text=${encodeURIComponent(message)}` : ''}`
  const mapQuery = encodeURIComponent(address)
  const row = 'flex items-start gap-3 text-sm text-foreground'
  const icon = 'mt-0.5 h-4 w-4 shrink-0 text-coffee-accent'
  return (
    <section className={`grid gap-6 rounded-2xl border border-border bg-card p-5 md:grid-cols-2 ${className}`}>
      <div className="space-y-3">
        <h2 className="font-display text-xl font-bold text-foreground">{locale.labels.contactUs}</h2>
        {address && <p className={row}><MapPin className={icon} />{address}</p>}
        {hours && <p className={row}><Clock className={icon} />{hours}</p>}
        {phone && <p className={row}><Phone className={icon} /><a href={`tel:${phone.replace(/\s/g, '')}`} className="hover:underline">{phone}</a></p>}
        {email && <p className={row}><Mail className={icon} /><a href={`mailto:${email}`} className="hover:underline">{email}</a></p>}
        {whatsapp && (
          <a href={whatsappLink} target="_blank" rel="noreferrer" className="btn-hero inline-flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />{locale.labels.contactWhatsapp}
          </a>
        )}
      </div>
      {address && (
        <div className="min-h-[220px] overflow-hidden rounded-xl border border-border bg-muted">
          <iframe
            title={locale.labels.contactMap}
            src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
            className="h-full min-h-[220px] w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}
    </section>
  )
}
