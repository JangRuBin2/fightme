// FightMe 인앱결제(IAP) 타입 정의
// https://developers-apps-in-toss.toss.im/iap/develop.html

export interface IapProductItem {
  sku: string;
  displayAmount: string;
  displayName: string;
  iconUrl?: string;
  description?: string;
}

export interface IapProductListResponse {
  products: IapProductItem[];
}

export interface IapPurchaseResult {
  type: 'success' | 'error';
  orderId?: string;
  sku?: string;
  errorCode?: IapErrorCode;
  errorMessage?: string;
}

export type IapErrorCode =
  | 'USER_CANCELED'
  | 'NETWORK_ERROR'
  | 'PRODUCT_NOT_FOUND'
  | 'ALREADY_PURCHASED'
  | 'PAYMENT_FAILED'
  | 'PRODUCT_NOT_GRANTED_BY_PARTNER'
  | 'UNKNOWN_ERROR';

export interface IapPendingOrder {
  orderId: string;
  sku: string;
  purchasedAt: string;
}

export interface IapCompletedOrder {
  orderId: string;
  sku: string;
  status: 'COMPLETED' | 'REFUNDED';
  purchasedAt: string;
  completedAt?: string;
  refundedAt?: string;
}

// 서버 API 응답 타입
export type IapOrderStatus =
  | 'PURCHASED'
  | 'PAYMENT_COMPLETED'
  | 'FAILED'
  | 'REFUNDED'
  | 'ORDER_IN_PROGRESS'
  | 'NOT_FOUND';

export interface IapOrderStatusResponse {
  orderId: string;
  status: IapOrderStatus;
  sku?: string;
  amount?: number;
  purchasedAt?: string;
}

// 상품 SKU 상수 (토스 콘솔 상품 ID와 일치해야 함 - placeholder)
export const IAP_PRODUCTS = {
  TOKEN_30: 'ait.0000022646.78a7c359.7f50c10c27.3734847956',
  TOKEN_100: 'ait.0000022646.473afee2.9cfcc03773.3735029892',
  TOKEN_300: 'ait.0000022646.22110900.9046734c07.3735065039',
  PREMIUM_LAUNCH: 'ait.0000022646.2930c5c5.1b96522f35.3735386544',
} as const;

export type IapProductSku = typeof IAP_PRODUCTS[keyof typeof IAP_PRODUCTS];

// 상품별 토큰 수량
export const TOKEN_AMOUNTS: Record<string, number> = {
  [IAP_PRODUCTS.TOKEN_30]: 30,
  [IAP_PRODUCTS.TOKEN_100]: 100,
  [IAP_PRODUCTS.TOKEN_300]: 300,
  [IAP_PRODUCTS.PREMIUM_LAUNCH]: 200, // 200 tokens/month lifetime
};

// 상품 타입
export type IapProductType = 'token' | 'premium';

export function getProductType(sku: string): IapProductType {
  if (sku === IAP_PRODUCTS.PREMIUM_LAUNCH) return 'premium';
  return 'token';
}

// 프리미엄 런칭 이벤트 종료일 (이 날짜 이후에는 PREMIUM_LAUNCH 상품 판매 중단)
export const PREMIUM_LAUNCH_END_DATE = new Date('2026-06-30T23:59:59+09:00');

// 프리미엄 런칭 이벤트가 아직 유효한지 확인
export function isPremiumLaunchAvailable(): boolean {
  return new Date() < PREMIUM_LAUNCH_END_DATE;
}

// 상품 표시 정보 (SDK에서 가져오지 못할 경우 폴백)
export const IAP_PRODUCT_INFO: Record<string, {
  name: string;
  description: string;
  price: string;
  tokenAmount: number;
  type: IapProductType;
}> = {
  [IAP_PRODUCTS.TOKEN_30]: {
    name: '토큰 30개',
    description: '판결 10회 분량',
    price: '990원',
    tokenAmount: 30,
    type: 'token',
  },
  [IAP_PRODUCTS.TOKEN_100]: {
    name: '토큰 100개',
    description: '판결 33회 분량',
    price: '2,490원',
    tokenAmount: 100,
    type: 'token',
  },
  [IAP_PRODUCTS.TOKEN_300]: {
    name: '토큰 300개',
    description: '판결 100회 분량',
    price: '6,900원',
    tokenAmount: 300,
    type: 'token',
  },
  [IAP_PRODUCTS.PREMIUM_LAUNCH]: {
    name: '오픈기념 프리미엄',
    description: '평생 글자수 무제한 + 매월 토큰 200개',
    price: '9,900원',
    tokenAmount: 200,
    type: 'premium',
  },
};
