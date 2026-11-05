import { test } from '@e2e-dev/web'
import { expect } from 'e2e'

test('visitor can discover donation campaigns from the dedicated page', async ({ app, browser, screen }) => {
  await browser.route('**/v1/listings?**', route => {
    const url = new URL(route.request.url)
    if (url.searchParams.get('type') === 'donation') return route.fulfill({ json: { status: true, data: { page: 1, total_records: 1, listings: [{
      id: 90, slug: 'community-garden', title: 'Community garden fund', description: 'Help plant a local garden', images: [],
      type: 'listings', order_type: 'donation', goal_price: { amount: 1000, currency: 'USD', formatted: '$1,000.00' },
      raised_amount: { amount: 250, currency: 'USD', formatted: '$250.00' }, offer_price: { amount: 10, currency: 'USD', formatted: '$10.00' },
      list_price: { amount: 10, currency: 'USD', formatted: '$10.00' }, account: { name: 'Garden group' },
    }] } } })
    return route.fulfill({ json: { status: true, data: { page: 1, total_records: 0, listings: [] } } })
  })
  await app.open('/donations')
  await expect(screen.getByRole('heading', 'Make a difference')).toBeVisible()
  await expect(screen.getByRole('heading', 'Community garden fund')).toBeVisible()
  await expect(screen.getByText('Raised: $250.00')).toBeVisible()
  await expect(screen.getByText('Goal: $1,000.00')).toBeVisible()
  await expect(screen.getByRole('link', 'View campaign')).toHaveAttribute('href', '/listing/community-garden')
})
