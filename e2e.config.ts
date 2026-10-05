import type { E2EConfig } from 'e2e'
import { web } from '@e2e-dev/web'
import { loadEnv } from 'vite'

for (const [key, value] of Object.entries(loadEnv('test', process.cwd(), ''))) {
  process.env[key] ??= value
}

const appUrl = process.env.APP_URL ?? 'http://127.0.0.1:8080'

export default {
  targets: [
    {
      name: 'chromium',
      engine: web(),
      app: {
        url: appUrl,
        ...(process.env.APP_URL
          ? {}
          : {
              command: {
                executable: 'pnpm',
                args: ['dev', '--host', '127.0.0.1', '--port', '8080'],
                reuseExisting: true,
                log: '.e2e/logs/app.log',
              },
            }),
      },
    },
  ],
} satisfies E2EConfig
