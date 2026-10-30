import Layout from '@/src/components/Layout'
import { locale } from '@/src/components/layout/locale'
import SellerInsightsPanel from '@/src/features/seller-insights/SellerInsightsPanel'

export default function SellerInsightsPage() {
  return <Layout><div className="mx-auto max-w-5xl"><header className="mb-7"><p className="mb-1 text-sm text-muted-foreground">{locale.labels.account}</p><h1 className="font-display text-2xl font-bold text-foreground">{locale.labels.sellerInsights}</h1></header><SellerInsightsPanel /></div></Layout>
}
