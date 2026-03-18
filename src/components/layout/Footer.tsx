'use client';

export default function Footer() {
  return (
    <footer className="px-5 pb-24 pt-6">
      <div className="space-y-1 text-caption text-gray-400">
        <p>상호명: 인프리 | 대표: 장루빈</p>
        <p>사업자등록번호: 790-39-01572</p>
        <p>주소: 대전광역시 유성구 대정로28번안길 80</p>
        <p>문의: wkdfnqls2465@gmail.com</p>
        <p className="pt-2 text-gray-300">
          &copy; {new Date().getFullYear()} 나랑 싸울래? All rights reserved.
        </p>
      </div>
    </footer>
  );
}
