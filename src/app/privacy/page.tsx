'use client';

export default function PrivacyPage() {
  return (
    <div className="px-5 pb-24">
      <div className="pt-16 pb-6">
        <h1 className="text-h2 text-gray-900">개인정보처리방침</h1>
        <p className="text-caption text-gray-400 mt-1">시행일: 2026년 3월 17일</p>
      </div>

      <div className="space-y-6 text-body2 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-body1 font-semibold text-gray-900 mb-2">1. 수집하는 개인정보</h2>
          <p>회사는 서비스 제공을 위해 다음 정보를 수집합니다.</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
            <li>토스 계정 식별 정보 (토스 유저키, 내부 이메일)</li>
            <li>서비스 이용 기록 (판결 내역, 토큰 사용 내역)</li>
            <li>기기 정보 (접속 환경, 브라우저 정보)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-body1 font-semibold text-gray-900 mb-2">2. 개인정보의 수집 및 이용 목적</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>회원 식별 및 서비스 제공</li>
            <li>판결 기록 저장 및 조회</li>
            <li>토큰 잔액 관리 및 결제 처리</li>
            <li>서비스 개선 및 통계 분석</li>
          </ul>
        </section>

        <section>
          <h2 className="text-body1 font-semibold text-gray-900 mb-2">3. 개인정보의 보유 및 이용 기간</h2>
          <p>
            회원 탈퇴 시 지체 없이 파기합니다. 단, 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
            <li>전자상거래 관련 기록: 5년</li>
            <li>접속 로그: 3개월</li>
          </ul>
        </section>

        <section>
          <h2 className="text-body1 font-semibold text-gray-900 mb-2">4. 개인정보의 제3자 제공</h2>
          <p>
            회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다.
            단, 법령에 의한 경우는 예외로 합니다.
          </p>
        </section>

        <section>
          <h2 className="text-body1 font-semibold text-gray-900 mb-2">5. 개인정보 처리의 위탁</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Supabase Inc. - 데이터 저장 및 인증</li>
            <li>Google LLC - AI 판결 생성 (Gemini API)</li>
            <li>(주)비바리퍼블리카 - 결제 처리 (토스 인앱결제)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-body1 font-semibold text-gray-900 mb-2">6. 이용자의 권리</h2>
          <p>
            이용자는 언제든지 자신의 개인정보를 조회, 수정, 삭제할 수 있으며,
            계정 삭제(탈퇴)를 통해 모든 개인정보를 파기할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-body1 font-semibold text-gray-900 mb-2">7. 개인정보의 파기</h2>
          <p>
            보유 기간이 경과하거나 처리 목적이 달성된 경우, 해당 개인정보를 지체 없이 파기합니다.
            전자적 파일은 복구 불가능한 방법으로 삭제합니다.
          </p>
        </section>

        <section>
          <h2 className="text-body1 font-semibold text-gray-900 mb-2">8. 개인정보보호 책임자</h2>
          <p className="text-gray-600">
            문의사항이 있으시면 아래로 연락해주세요.
          </p>
          <p className="text-gray-600 mt-1">
            이메일: privacy@fightme.internal
          </p>
        </section>

        <section>
          <h2 className="text-body1 font-semibold text-gray-900 mb-2">9. 변경사항 안내</h2>
          <p>
            본 방침이 변경될 경우, 시행일 최소 7일 전에 서비스 내 공지합니다.
          </p>
        </section>
      </div>
    </div>
  );
}
