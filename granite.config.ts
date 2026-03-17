import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'fightme',
  brand: {
    displayName: '나랑 싸울래?',
    icon: 'https://static.toss.im/appsintoss/20071/daf30744-00e2-466b-8364-9cb5ac069932.png',
    // 네비게이션 바 로고 = 토스 콘솔에 업로드한 앱 아이콘과 동일
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
      build: 'next build && node scripts/fix-root-html.mjs && node scripts/move-to-web.mjs',
    },
  },
  outdir: 'out',
});
