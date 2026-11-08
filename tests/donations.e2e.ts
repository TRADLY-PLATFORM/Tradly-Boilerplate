import { test } from '@e2e-dev/web'
import { expect } from 'e2e'

test('donation links and page stay hidden while the donation feature is disabled', async ({ app, browser, screen }) => {
  await app.open('/')
  await expect(screen.getByRole('heading', 'Discover Amazing Products')).toBeVisible()
  await expect(screen.getByRole('link', 'Explore donation campaigns')).not.toBeVisible()
  await expect(screen.getByRole('link', 'Support a cause')).not.toBeVisible()
  await app.open('/donations')
  await expect(browser).toHaveURL('/')
})
