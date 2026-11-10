import { Link, Navigate, useParams } from 'react-router-dom'
import Layout from '@/src/components/Layout'
import { useBrandName } from '@/src/components/layout/brandContext'
import { policies, policyBySlug, type Policy } from '@/src/features/policies/policies'

/** /policy/:slug: privacy, terms, cancellation, refund and FAQ pages (text in features/policies/policies.ts). */
export default function PolicyPage() {
  const { slug } = useParams()
  const policy = policyBySlug(slug)
  if (!policy) return <Navigate to="/" replace />
  return <Layout className="py-10"><PolicyBody policy={policy} /></Layout>
}

function PolicyBody({ policy }: { policy: Policy }) {
  const brand = useBrandName() || 'this store'
  const withBrand = (text: string) => text.replaceAll('{brand}', brand)
  return (
      <article className="mx-auto max-w-3xl">
        <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">{policy.title}</h1>
        <p className="mt-2 text-muted-foreground">{withBrand(policy.summary)}</p>
        <div className="mt-8 space-y-7">
          {policy.sections.map(section => (
            <section key={section.heading}>
              <h2 className="font-display text-xl font-semibold text-foreground">{section.heading}</h2>
              {section.body.map(paragraph => <p key={paragraph} className="mt-2 text-sm leading-relaxed text-muted-foreground">{withBrand(paragraph)}</p>)}
            </section>
          ))}
        </div>
        <nav className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-5 text-sm">
          {policies.filter(other => other.slug !== policy.slug).map(other => <Link key={other.slug} to={`/policy/${other.slug}`} className="text-coffee-accent hover:underline">{other.title}</Link>)}
        </nav>
      </article>
  )
}
