import { callEdgeFunction } from './edge';
import { iapActivateResponseSchema } from '@/lib/schemas';

/**
 * Activate a purchase by verifying with Toss API and granting tokens/premium.
 */
export async function activatePurchase(orderId: string, sku: string) {
  return callEdgeFunction('iap-activate', iapActivateResponseSchema, {
    body: { orderId, sku },
  });
}
