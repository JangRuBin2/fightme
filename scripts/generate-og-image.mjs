/**
 * OG 이미지 생성 스크립트 (1200x600)
 * 브라우저에서 실행: 개발 서버에서 /og-generator 접속하거나,
 * 이 스크립트의 로직을 참고하여 수동 생성
 *
 * 생성된 이미지를 Supabase Storage public/og/share.png에 업로드
 */

// Node.js에서는 canvas 패키지가 필요하므로,
// 브라우저 콘솔에서 아래 코드를 실행하여 생성하세요:

const code = `
(() => {
  const W = 1200, H = 600;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // 배경 그라데이션
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#FAFAF7');
  grad.addColorStop(1, '#FFF5F5');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // 장식 원 (좌상)
  ctx.beginPath();
  ctx.arc(-60, -60, 200, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(232, 85, 61, 0.08)';
  ctx.fill();

  // 장식 원 (우하)
  ctx.beginPath();
  ctx.arc(W + 40, H + 40, 250, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(212, 168, 83, 0.08)';
  ctx.fill();

  // 타이틀
  ctx.textAlign = 'center';
  ctx.fillStyle = '#191F28';
  ctx.font = 'bold 72px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('나랑 싸울래?', W / 2, 220);

  // 서브타이틀
  ctx.fillStyle = '#4E5968';
  ctx.font = '500 36px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('AI 연애재판소', W / 2, 290);

  // 구분선
  ctx.strokeStyle = '#E8553D';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 60, 330);
  ctx.lineTo(W / 2 + 60, 330);
  ctx.stroke();

  // CTA
  ctx.fillStyle = '#E8553D';
  ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('AI 판사의 판결 결과를 확인해보세요!', W / 2, 400);

  // 브랜딩
  ctx.fillStyle = '#8B95A1';
  ctx.font = '24px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('커플/친구 갈등, AI가 판결합니다', W / 2, 460);

  // 다운로드
  const link = document.createElement('a');
  link.download = 'og-share.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
  console.log('OG image downloaded! Upload to Supabase Storage: public/og/share.png');
})();
`;

console.log('=== OG 이미지 생성 방법 ===');
console.log('');
console.log('1. 브라우저 개발자 도구 콘솔에서 아래 코드를 실행하세요:');
console.log('');
console.log(code);
console.log('');
console.log('2. 다운로드된 og-share.png를 Supabase Storage에 업로드:');
console.log('   버킷: public, 경로: og/share.png');
console.log('');
console.log('규격: 1200x600px PNG');
