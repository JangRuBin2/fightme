import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient, createAdminClient } from '../_shared/supabase.ts';
import { grantTokens } from '../_shared/tokens.ts';

const TOSS_API_URL = Deno.env.get('APPS_IN_TOSS_API_URL') || 'https://apps-in-toss-api.toss.im';

// SKU -> token amount mapping (must match frontend IAP_PRODUCTS)
const TOKEN_AMOUNTS: Record<string, number> = {
  'ait.0000022646.78a7c359.7f50c10c27.3734847956': 30,
  'ait.0000022646.473afee2.9cfcc03773.3735029892': 100,
  'ait.0000022646.22110900.9046734c07.3735065039': 300,
  'ait.0000022646.2930c5c5.1b96522f35.3735386544': 50,
};

const PREMIUM_SKUS = new Set(['ait.0000022646.2930c5c5.1b96522f35.3735386544']);

// Reuse fixPem from auth-toss
function fixPem(raw: string): string {
  let pem = raw.trim();
  if (pem.startsWith('LS0t')) {
    try { pem = atob(pem); } catch { /* continue */ }
  }
  pem = pem.replace(/\\n/g, '\n').replace(/\\r/g, '').trim();
  if (pem.startsWith('-----BEGIN') && pem.includes('\n')) return pem;
  let type = 'CERTIFICATE';
  if (pem.includes('PRIVATE KEY')) {
    type = pem.includes('RSA PRIVATE KEY') ? 'RSA PRIVATE KEY' : 'PRIVATE KEY';
  }
  const base64 = pem.replace(/-----BEGIN [A-Z ]+-----/g, '').replace(/-----END [A-Z ]+-----/g, '').replace(/\s/g, '');
  const lines = base64.match(/.{1,64}/g) || [];
  return `-----BEGIN ${type}-----\n${lines.join('\n')}\n-----END ${type}-----\n`;
}

interface DenoHttpClient { close(): void; }
interface DenoWithHttpClient {
  createHttpClient(options: { cert: string; key: string; certChain: string; privateKey: string }): DenoHttpClient;
}
interface FetchWithClient extends RequestInit { client: DenoHttpClient; }

async function verifyOrderWithToss(orderId: string): Promise<{ verified: boolean; status?: string }> {
  const rawCert = Deno.env.get('APPS_IN_TOSS_MTLS_CERT');
  const rawKey = Deno.env.get('APPS_IN_TOSS_MTLS_KEY');

  if (!rawCert || !rawKey) {
    console.warn('mTLS not configured - skipping Toss verification');
    return { verified: false };
  }

  try {
    const cert = fixPem(rawCert);
    const key = fixPem(rawKey);

    const httpClient = (Deno as unknown as DenoWithHttpClient).createHttpClient({
      cert, key, certChain: cert, privateKey: key,
    });

    const response = await fetch(
      `${TOSS_API_URL}/api-partner/v1/apps-in-toss/order/get-order-status`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
        client: httpClient,
      } as FetchWithClient
    );

    if (!response.ok) return { verified: false };

    const data = await response.json();
    const status = data.success?.status ?? data.status;
    const verified = status === 'PAID' || status === 'COMPLETED' || status === 'PAYMENT_COMPLETED';
    return { verified, status };
  } catch (err) {
    console.error('Toss order verification failed:', err);
    return { verified: false };
  }
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createSupabaseClient(authHeader);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { orderId, sku } = body;

    if (!orderId || !sku) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing orderId or sku' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Verify purchase with Toss API
    const { verified } = await verifyOrderWithToss(orderId);
    if (!verified) {
      return new Response(
        JSON.stringify({ success: false, error: '결제 검증에 실패했습니다' }),
        { status: 403, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createAdminClient();
    const tokenAmount = TOKEN_AMOUNTS[sku];

    if (!tokenAmount) {
      return new Response(
        JSON.stringify({ success: false, error: '알 수 없는 상품입니다' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Grant tokens
    const newBalance = await grantTokens(supabaseAdmin, user.id, tokenAmount, 'IAP_PURCHASE');

    if (newBalance === null) {
      return new Response(
        JSON.stringify({ success: false, error: '토큰 지급에 실패했습니다' }),
        { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Handle premium activation
    let isPremium = false;
    if (PREMIUM_SKUS.has(sku)) {
      const { error: premiumError } = await supabaseAdmin
        .from('profiles')
        .update({
          is_premium: true,
          premium_expires_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (premiumError) {
        console.error('Failed to activate premium:', premiumError.message);
      } else {
        isPremium = true;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          orderId,
          sku,
          activatedAt: new Date().toISOString(),
          tokenBalance: newBalance,
          isPremium,
        },
      }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('iap-activate error:', err);
    return new Response(
      JSON.stringify({ success: false, error: '결제 처리 중 오류가 발생했습니다' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
