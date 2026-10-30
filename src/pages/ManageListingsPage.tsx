import Layout from '@/src/components/Layout'
import ManageListingsPanel from '@/src/features/manage-listings/ManageListingsPanel'
import { locale } from '@/src/components/layout/locale'

export default function ManageListingsPage() {
  return <Layout><div className="mx-auto max-w-5xl"><header className="mb-7"><p className="mb-1 text-sm text-muted-foreground">{locale.labels.sell}</p><h1 className="font-display text-2xl font-bold text-foreground">{locale.labels.manageListings}</h1></header><ManageListingsPanel /></div></Layout>
}
