'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

const ARTICLES = [
  {
    title: '제1조 (목적)',
    content:
      '이 약관은 나랑 싸울래?(이하 "서비스")의 이용 조건 및 절차, 이용자와 서비스 제공자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.',
  },
  {
    title: '제2조 (정의)',
    content:
      '1. "서비스"란 나랑 싸울래?가 제공하는 AI 판사 기반 갈등 판결, 판사 생성, 판결 기록 관리 등 관련 제반 서비스를 의미합니다. 2. "이용자"란 이 약관에 따라 서비스를 이용하는 자를 말합니다. 3. "토스 계정"이란 토스 앱을 통해 인증된 이용자의 계정을 의미합니다.',
  },
  {
    title: '제3조 (약관의 효력 및 변경)',
    content:
      '1. 이 약관은 서비스를 이용하고자 하는 모든 이용자에게 적용됩니다. 2. 서비스는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지사항을 통해 공지합니다. 3. 이용자가 변경된 약관에 동의하지 않는 경우, 서비스 이용을 중단하고 탈퇴할 수 있습니다.',
  },
  {
    title: '제4조 (서비스의 제공)',
    content:
      '서비스는 다음의 기능을 제공합니다: AI 판사를 통한 갈등 판결, 변론 및 항소 기능, 나만의 판사 캐릭터 생성, 판결 기록 관리 및 공유. 서비스는 토스 앱인토스(Apps-in-Toss)를 통해 제공되며, 일부 기능은 토큰 소비가 필요할 수 있습니다.',
  },
  {
    title: '제5조 (이용자의 의무)',
    content:
      '1. 이용자는 서비스 이용 시 관련 법령, 이 약관의 규정, 이용안내 및 서비스와 관련하여 공지한 주의사항을 준수하여야 합니다. 2. 이용자는 타인의 개인정보를 부정하게 사용해서는 안 됩니다. 3. 이용자는 서비스를 이용하여 법령 또는 공서양속에 반하는 행위를 해서는 안 됩니다.',
  },
  {
    title: '제6조 (개인정보 보호)',
    content:
      '서비스는 이용자의 개인정보를 보호하기 위해 관련 법령에서 정하는 바에 따라 개인정보를 수집, 이용, 보관, 처리합니다. 수집되는 정보: 토스 사용자 키. 서비스는 수집된 정보를 서비스 제공 목적 외에 사용하지 않으며, 이용자의 동의 없이 제3자에게 제공하지 않습니다.',
  },
  {
    title: '제7조 (서비스 이용의 제한 및 중지)',
    content:
      '1. 서비스는 시스템 점검, 장비 교체 및 고장, 통신 장애 등의 사유가 발생한 경우 서비스의 제공을 일시적으로 중단할 수 있습니다. 2. 서비스는 이용자가 본 약관을 위반하거나 서비스의 정상적인 운영을 방해한 경우 서비스 이용을 제한할 수 있습니다.',
  },
  {
    title: '제8조 (회원 탈퇴 및 연결 끊기)',
    content:
      '1. 이용자는 언제든지 서비스 내 설정에서 회원 탈퇴를 요청할 수 있습니다. 2. 토스 앱에서 연결 끊기를 할 경우, 서비스의 모든 이용자 데이터(판결 기록, 판사, 토큰 등)가 즉시 삭제됩니다. 3. 삭제된 데이터는 복구할 수 없습니다.',
  },
  {
    title: '제9조 (면책조항)',
    content:
      '1. 서비스는 천재지변, 전쟁, 기간통신사업자의 서비스 중지 등 불가항력적인 사유로 서비스를 제공할 수 없는 경우 책임이 면제됩니다. 2. AI가 생성한 판결, 변론 등은 오락 목적이며, 서비스는 해당 내용의 법적 효력이나 정확성을 보장하지 않습니다. 3. 이용자가 서비스를 이용하여 기대하는 결과를 얻지 못하거나 손해를 입은 경우, 서비스는 이에 대해 책임을 지지 않습니다.',
  },
] as const;

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="px-5 pb-8">
      <div className="pt-6 pb-4">
        <button
          className="flex items-center gap-1 text-body2 text-gray-500 mb-3"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4" />
          뒤로
        </button>
        <h1 className="text-h2 text-gray-900">서비스 이용약관</h1>
      </div>

      <div className="flex flex-col gap-6">
        {ARTICLES.map((article, i) => (
          <section key={i} className="card">
            <h2 className="text-body1 font-semibold text-gray-900 mb-2">
              {article.title}
            </h2>
            <p className="text-body2 text-gray-600 leading-relaxed">
              {article.content}
            </p>
          </section>
        ))}
      </div>

      <p className="text-caption text-gray-400 mt-6 text-center">
        시행일: 2026년 3월 13일
      </p>
    </div>
  );
}
