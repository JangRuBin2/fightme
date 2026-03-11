import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'fightme',
  brand: {
    displayName: '나랑 싸울래?',
    icon: '',
    primaryColor: '#FF6B6B',
  },
  navigationBar: {
    withBackButton: true,
    withHomeButton: false,
  },
  permissions: [],
  webViewProps: {
    type: 'partner',
    bounces: false,
    overScrollMode: 'never',
  },
  web: {
    host: 'localhost',
    port: 3000,
    commands: {
      dev: 'next dev',
      build: 'next build && node scripts/fix-root-html.mjs',
    },
  },
  outdir: 'out',
});
