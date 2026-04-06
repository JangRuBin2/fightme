/**
 * Canvas API를 사용한 판결 결과 이미지 생성
 * Toss WebView에서는 html-to-image 사용 불가 → Canvas 직접 드로잉
 */

import type { Fight } from '@/types/database';

interface VerdictImageData {
  fight: Fight;
  judgeName: string;
}

const WIDTH = 720;
const PADDING = 48;
const CARD_PAD = 40;
const LINE_HEIGHT = 26;
const CLAIM_FONT = '18px -apple-system, BlinkMacSystemFont, sans-serif';
const COMMENT_FONT = 'italic 22px -apple-system, BlinkMacSystemFont, sans-serif';

const COLORS = {
  bg: '#FAFAF7',
  card: '#FFFFFF',
  primary: '#E8553D',
  accent: '#D4A853',
  textDark: '#191F28',
  textMid: '#4E5968',
  textLight: '#8B95A1',
  gaugeBg: '#E5E8EB',
  border: '#E5E8EB',
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  const chars = Array.from(text);
  let currentLine = '';

  for (const char of chars) {
    const testLine = currentLine + char;
    if (ctx.measureText(testLine).width > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export function generateVerdictImage({ fight, judgeName }: VerdictImageData): string {
  const myName = fight.user_name || '나';
  const theirName = fight.opponent_name || '상대';
  const myFault = fight.user_fault ?? 50;
  const theirFault = fight.opponent_fault ?? 50;

  const gaugeX = PADDING + CARD_PAD;
  const gaugeW = WIDTH - (PADDING + CARD_PAD) * 2;
  const claimW = (gaugeW - 16) / 2;
  const claimTextW = claimW - 32;

  // 사전 측정용 임시 캔버스
  const measure = document.createElement('canvas').getContext('2d')!;
  measure.font = CLAIM_FONT;
  const myClaimLines = wrapText(measure, fight.user_claim, claimTextW);
  const theirClaimLines = wrapText(measure, fight.opponent_claim, claimTextW);
  const maxClaimLines = Math.max(myClaimLines.length, theirClaimLines.length);
  const claimH = 40 + maxClaimLines * LINE_HEIGHT + 16; // 제목 + 라인들 + 패딩

  measure.font = COMMENT_FONT;
  const commentLines = fight.comment ? wrapText(measure, `"${fight.comment}"`, gaugeW - 48) : [];
  const commentH = fight.comment ? 32 + commentLines.length * 30 + 16 : 0;

  const DETAIL_FONT = '18px -apple-system, BlinkMacSystemFont, sans-serif';
  measure.font = DETAIL_FONT;
  const detailLines = fight.verdict_detail ? wrapText(measure, fight.verdict_detail, gaugeW - 48) : [];
  const detailH = detailLines.length > 0 ? 36 + detailLines.length * LINE_HEIGHT + 16 : 0;

  // 동적 높이 계산
  const contentH = 48 + 48 + 60 + 40 + 28 + 24 + 48 + claimH + 32 + commentH + detailH + 60;
  const HEIGHT = PADDING * 2 + contentH;

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d')!;

  // 배경
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // 카드
  const cardX = PADDING;
  const cardY = PADDING;
  const cardW = WIDTH - PADDING * 2;
  const cardH = HEIGHT - PADDING * 2;

  ctx.fillStyle = COLORS.card;
  ctx.shadowColor = 'rgba(0,0,0,0.08)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 4;
  roundRect(ctx, cardX, cardY, cardW, cardH, 24);
  ctx.fill();
  ctx.shadowColor = 'transparent';

  let y = cardY + 48;

  // 타이틀
  ctx.fillStyle = COLORS.textLight;
  ctx.font = '500 24px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('AI 판결 결과', WIDTH / 2, y);
  y += 48;

  // 판사 이름
  ctx.fillStyle = COLORS.textDark;
  ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(`${judgeName} 판사`, WIDTH / 2, y);
  y += 60;

  // 구분선
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardX + 32, y);
  ctx.lineTo(cardX + cardW - 32, y);
  ctx.stroke();
  y += 40;

  // 이름 + 과실 %
  ctx.textAlign = 'left';
  ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = COLORS.primary;
  ctx.fillText(`${myName} ${myFault}%`, gaugeX, y);

  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.accent;
  ctx.fillText(`${theirName} ${theirFault}%`, gaugeX + gaugeW, y);
  y += 24;

  // 게이지 바
  const gaugeH = 20;
  const gaugeR = gaugeH / 2;

  roundRect(ctx, gaugeX, y, gaugeW, gaugeH, gaugeR);
  ctx.fillStyle = COLORS.gaugeBg;
  ctx.fill();

  const myW = Math.max(gaugeH, (myFault / 100) * gaugeW);
  if (myFault > 0) {
    ctx.beginPath();
    ctx.moveTo(gaugeX + gaugeR, y);
    ctx.lineTo(gaugeX + myW, y);
    ctx.lineTo(gaugeX + myW, y + gaugeH);
    ctx.lineTo(gaugeX + gaugeR, y + gaugeH);
    ctx.quadraticCurveTo(gaugeX, y + gaugeH, gaugeX, y + gaugeH - gaugeR);
    ctx.lineTo(gaugeX, y + gaugeR);
    ctx.quadraticCurveTo(gaugeX, y, gaugeX + gaugeR, y);
    ctx.closePath();
    ctx.fillStyle = COLORS.primary;
    ctx.fill();
  }

  const theirW = Math.max(gaugeH, (theirFault / 100) * gaugeW);
  if (theirFault > 0) {
    const theirX = gaugeX + gaugeW - theirW;
    ctx.beginPath();
    ctx.moveTo(theirX, y);
    ctx.lineTo(gaugeX + gaugeW - gaugeR, y);
    ctx.quadraticCurveTo(gaugeX + gaugeW, y, gaugeX + gaugeW, y + gaugeR);
    ctx.lineTo(gaugeX + gaugeW, y + gaugeH - gaugeR);
    ctx.quadraticCurveTo(gaugeX + gaugeW, y + gaugeH, gaugeX + gaugeW - gaugeR, y + gaugeH);
    ctx.lineTo(theirX, y + gaugeH);
    ctx.closePath();
    ctx.fillStyle = COLORS.accent;
    ctx.fill();
  }
  y += gaugeH + 48;

  // 주장 카드 (동적 높이)
  // 내 주장
  roundRect(ctx, gaugeX, y, claimW, claimH, 16);
  ctx.fillStyle = `${COLORS.primary}15`;
  ctx.fill();

  ctx.textAlign = 'left';
  ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = COLORS.primary;
  ctx.fillText(`${myName} 주장`, gaugeX + 16, y + 28);

  ctx.font = CLAIM_FONT;
  ctx.fillStyle = COLORS.textMid;
  myClaimLines.forEach((line, i) => {
    ctx.fillText(line, gaugeX + 16, y + 56 + i * LINE_HEIGHT);
  });

  // 상대 주장
  const claimX2 = gaugeX + claimW + 16;
  roundRect(ctx, claimX2, y, claimW, claimH, 16);
  ctx.fillStyle = `${COLORS.accent}15`;
  ctx.fill();

  ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = COLORS.accent;
  ctx.fillText(`${theirName} 주장`, claimX2 + 16, y + 28);

  ctx.font = CLAIM_FONT;
  ctx.fillStyle = COLORS.textMid;
  theirClaimLines.forEach((line, i) => {
    ctx.fillText(line, claimX2 + 16, y + 56 + i * LINE_HEIGHT);
  });
  y += claimH + 32;

  // 판사 코멘트 (동적 높이)
  if (fight.comment && commentLines.length > 0) {
    const commentBoxH = 32 + commentLines.length * 30 + 16;
    roundRect(ctx, gaugeX, y, gaugeW, commentBoxH, 16);
    ctx.fillStyle = `${COLORS.primary}12`;
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.font = COMMENT_FONT;
    ctx.fillStyle = COLORS.textDark;
    commentLines.forEach((line, i) => {
      ctx.fillText(line, WIDTH / 2, y + 36 + i * 30);
    });
    y += commentBoxH + 24;
  }

  // 판결 이유 (동적 높이)
  if (detailLines.length > 0) {
    ctx.textAlign = 'left';
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = COLORS.textLight;
    ctx.fillText('판결 이유', gaugeX, y + 20);
    y += 36;

    ctx.font = DETAIL_FONT;
    ctx.fillStyle = COLORS.textMid;
    detailLines.forEach((line, i) => {
      ctx.fillText(line, gaugeX, y + i * LINE_HEIGHT);
    });
    y += detailLines.length * LINE_HEIGHT + 16;
  }

  // 푸터
  ctx.textAlign = 'center';
  ctx.font = '20px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = COLORS.textLight;
  ctx.fillText('나랑 싸울래? | AI 판결 서비스', WIDTH / 2, cardY + cardH - 32);

  return canvas.toDataURL('image/png');
}

/**
 * 이미지를 디바이스에 저장
 * - 토스 WebView: saveBase64Data() 사용 (<a download> 불가)
 * - 일반 브라우저: <a download> fallback
 */
export async function saveVerdictImageToDevice(base64: string): Promise<void> {
  const pureBase64 = base64.replace(/^data:image\/png;base64,/, '');

  try {
    const { saveBase64Data } = await import('@apps-in-toss/web-framework');
    await saveBase64Data({
      data: pureBase64,
      fileName: `verdict-${Date.now()}.png`,
      mimeType: 'image/png',
    });
    return;
  } catch {
    // fallback
  }

  const link = document.createElement('a');
  link.href = base64;
  link.download = `verdict-${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
