"use client";

import AdModal from "@/components/shared/AdModal";
import { useTokens } from "@/hooks/useTokens";
import { getFight, submitDefense } from "@/lib/api/fights";
import { getErrorMessage, isInsufficientTokens } from "@/lib/errors";
import type { Fight } from "@/types/database";
import { motion } from "framer-motion";
import { Bot, Coins, PenLine, Shield, User, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import { getCharLimits } from "@/lib/limits";

type DefenseTab = "ai" | "self";
type DefenseSide = "user" | "opponent" | "both";

interface DefenseSectionData {
  side: "user" | "opponent";
  text: string;
}

function DefensePreview({ sections }: { sections: DefenseSectionData[] }) {
  return (
    <>
      {sections.map((section, i) => {
        const isOpponent = section.side === "opponent";
        const label = isOpponent ? "상대 측 변론" : "내 측 변론";
        return (
          <div
            key={i}
            className={`${isOpponent ? "bg-accent-50" : "bg-primary-50"} rounded-xl p-4`}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Shield
                className={`w-4 h-4 ${isOpponent ? "text-accent-500" : "text-primary-500"}`}
              />
              <p
                className={`text-body2 font-medium ${isOpponent ? "text-accent-600" : "text-primary-600"}`}
              >
                {label}
              </p>
            </div>
            <p className="text-body2 text-gray-700 leading-relaxed">
              {section.text}
            </p>
          </div>
        );
      })}
    </>
  );
}

export default function DefensePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-3 border-primary-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <DefenseContent />
    </Suspense>
  );
}

function DefenseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fightId = searchParams.get("id");
  const [fight, setFight] = useState<Fight | null>(null);
  const [activeTab, setActiveTab] = useState<DefenseTab>("ai");
  const [defenseSide, setDefenseSide] = useState<DefenseSide>("user");
  const [selfDefense, setSelfDefense] = useState("");
  const [selfDefenseOpponent, setSelfDefenseOpponent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [aiDefenseSections, setAiDefenseSections] = useState<
    DefenseSectionData[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [showAdModal, setShowAdModal] = useState(false);
  const { balance, canAfford, refresh } = useTokens();
  const isPremium = useStore((s) => s.isPremium);
  const limits = getCharLimits(isPremium);

  useEffect(() => {
    if (!fightId) return;
    getFight(fightId)
      .then(setFight)
      .catch(() => {});
  }, [fightId]);

  const sideLabel =
    defenseSide === "user"
      ? "내"
      : defenseSide === "opponent"
        ? "상대"
        : "양쪽";

  const handleAIDefense = async () => {
    if (!fight || !fightId || isSubmitting) return;

    if (!canAfford(5)) {
      setShowAdModal(true);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await submitDefense(fightId, null, "ai", defenseSide);
      setAiDefenseSections(result.defense.sections);
      setAiGenerated(true);
      await refresh();
    } catch (err) {
      if (isInsufficientTokens(err)) {
        setShowAdModal(true);
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmitSelf = (() => {
    if (defenseSide === "both")
      return (
        selfDefense.trim().length > 0 && selfDefenseOpponent.trim().length > 0
      );
    return selfDefense.trim().length > 0;
  })();

  const handleSubmitSelfDefense = async () => {
    if (!fight || !fightId || isSubmitting || !canSubmitSelf) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (defenseSide === "both") {
        // 양쪽 입력: defense_text에 JSON으로 양쪽 텍스트 전달
        await submitDefense(
          fightId,
          JSON.stringify({
            user: selfDefense.trim(),
            opponent: selfDefenseOpponent.trim(),
          }),
          "self",
          "both",
        );
      } else {
        await submitDefense(fightId, selfDefense.trim(), "self", defenseSide);
      }
      await refresh();
      router.push(`/fight/appeal/?id=${fightId}`);
    } catch (err) {
      if (isInsufficientTokens(err)) {
        setShowAdModal(true);
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToAppeal = () => {
    router.push(`/fight/appeal/?id=${fightId}`);
  };

  const hasExistingDefense = fight?.defense && fight.defense.sections && fight.defense.sections.length > 0;

  if (!fight) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-3 border-primary-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 이미 변론이 있으면 기존 변론 표시 + 항소로 이동 안내
  if (hasExistingDefense) {
    return (
      <div className="px-5 pb-24">
        <div className="pt-16 pb-4">
          <h1 className="text-h2 text-gray-900">변론 완료</h1>
          <p className="text-body2 text-gray-500 mt-1">
            이미 변론이 제출되었습니다
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {fight.defense!.sections.map((section, i) => {
            const isOpponent = section.side === 'opponent';
            return (
              <div
                key={i}
                className={`${isOpponent ? 'bg-accent-50' : 'bg-primary-50'} rounded-xl p-4`}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <Shield
                    className={`w-4 h-4 ${isOpponent ? 'text-accent-500' : 'text-primary-500'}`}
                  />
                  <p
                    className={`text-body2 font-medium ${isOpponent ? 'text-accent-600' : 'text-primary-600'}`}
                  >
                    {isOpponent ? (fight.opponent_name || '상대') : (fight.user_name || '나')} 측 변론
                  </p>
                </div>
                <p className="text-body2 text-gray-700 leading-relaxed">
                  {section.text}
                </p>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => router.push(`/fight/appeal/?id=${fightId}`)}
          className="w-full py-3.5 rounded-xl font-semibold text-body1 bg-primary-400 text-white active:bg-primary-500 flex items-center justify-center gap-2"
        >
          <Shield className="w-5 h-5" />
          이 변론으로 항소하기 (토큰 5개)
        </button>
      </div>
    );
  }

  return (
    <div className="px-5 pb-24">
      <div className="pt-16 pb-4">
        <h1 className="text-h2 text-gray-900">변론 추가하기</h1>
        <p className="text-body2 text-gray-500 mt-1">
          추가 변론으로 판결을 뒤집어보세요
        </p>
      </div>

      {/* Token balance */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent-50 text-accent-600 text-caption font-medium">
          <Coins className="w-3.5 h-3.5" />
          토큰 {balance}개
        </div>
      </div>

      {/* Defense side selector */}
      <div className="mb-4">
        <label className="block text-body2 font-medium text-gray-700 mb-2">
          누구의 변론을 만들까요?
        </label>
        <div className="flex gap-2">
          {[
            { value: "user" as const, label: "내 편", icon: User },
            { value: "opponent" as const, label: "상대 편", icon: User },
            { value: "both" as const, label: "양쪽 다", icon: Users },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              disabled={isSubmitting}
              onClick={() => {
                setDefenseSide(value);
                setAiGenerated(false);
                setAiDefenseSections([]);
                setSelfDefense("");
                setSelfDefenseOpponent("");
              }}
              className={`flex-1 py-2.5 rounded-xl text-caption font-medium flex items-center justify-center gap-1.5 transition-colors ${
                defenseSide === value
                  ? "bg-primary-400 text-white"
                  : "bg-gray-100 text-gray-600 active:bg-gray-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          className={`flex-1 py-2.5 rounded-xl text-body2 font-medium flex items-center justify-center gap-1.5 transition-colors ${activeTab === "ai" ? "bg-primary-400 text-white" : "bg-gray-100 text-gray-600"}`}
          onClick={() => setActiveTab("ai")}
        >
          <Bot className="w-4 h-4" />
          AI 변호사 (5토큰)
        </button>
        <button
          className={`flex-1 py-2.5 rounded-xl text-body2 font-medium flex items-center justify-center gap-1.5 transition-colors ${activeTab === "self" ? "bg-primary-400 text-white" : "bg-gray-100 text-gray-600"}`}
          onClick={() => setActiveTab("self")}
        >
          <PenLine className="w-4 h-4" />
          직접 변호 (무료)
        </button>
      </div>

      {error && (
        <p className="text-body2 text-red-500 text-center mb-4">{error}</p>
      )}

      {/* AI Defense Tab */}
      {activeTab === "ai" && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-4"
        >
          <div className="card text-center">
            <Bot className="w-12 h-12 text-primary-400 mx-auto mb-3" />
            <h3 className="text-body1 font-semibold text-gray-900 mb-1">
              AI 변호사
            </h3>
            <p className="text-body2 text-gray-500 mb-4">
              {sideLabel} 입장을 AI가 대신 변호해드립니다
            </p>

            {!aiGenerated ? (
              <button
                className="w-full py-3 rounded-xl font-semibold text-body1 bg-primary-400 text-white active:bg-primary-500 disabled:opacity-50"
                onClick={handleAIDefense}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    변호문 작성 중...
                  </div>
                ) : (
                  `${sideLabel} 변론 생성`
                )}
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-left space-y-3"
              >
                <DefensePreview sections={aiDefenseSections} />
                <button
                  onClick={handleGoToAppeal}
                  className="w-full py-3 rounded-xl font-semibold text-body1 bg-primary-400 text-white active:bg-primary-500 flex items-center justify-center gap-2"
                >
                  <Shield className="w-5 h-5" />이 변론으로 재판결 받기
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {/* Self Defense Tab */}
      {activeTab === "self" && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-4"
        >
          {defenseSide === "both" ? (
            <>
              {/* 양쪽 다: 원고/피고 각각 입력 */}
              <div className="card">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-500" />
                  </div>
                  <div>
                    <h3 className="text-body1 font-semibold text-gray-900">
                      {fight.user_name || "나"} 측 변론
                    </h3>
                    <p className="text-caption text-gray-500">
                      내 입장에서 추가 변론을 작성해주세요
                    </p>
                  </div>
                </div>
                <textarea
                  className="textarea-field h-28"
                  placeholder="내가 왜 덜 잘못했는지 설명해주세요..."
                  maxLength={limits.defenseSelf ?? undefined}
                  value={selfDefense}
                  onChange={(e) => setSelfDefense(e.target.value)}
                />
                {limits.defenseSelf && (
                  <p className="text-caption text-gray-400 text-right mt-1">
                    {selfDefense.length}/{limits.defenseSelf}
                  </p>
                )}
              </div>
              <div className="card">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-accent-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-accent-500" />
                  </div>
                  <div>
                    <h3 className="text-body1 font-semibold text-gray-900">
                      {fight.opponent_name || "상대"} 측 변론
                    </h3>
                    <p className="text-caption text-gray-500">
                      상대 입장에서 추가 변론을 작성해주세요
                    </p>
                  </div>
                </div>
                <textarea
                  className="textarea-field h-28"
                  placeholder="상대방이 왜 덜 잘못했는지 설명해주세요..."
                  maxLength={limits.defenseSelf ?? undefined}
                  value={selfDefenseOpponent}
                  onChange={(e) => setSelfDefenseOpponent(e.target.value)}
                />
                {limits.defenseSelf && (
                  <p className="text-caption text-gray-400 text-right mt-1">
                    {selfDefenseOpponent.length}/{limits.defenseSelf}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="card">
              <PenLine className="w-8 h-8 text-gray-400 mb-3" />
              <h3 className="text-body1 font-semibold text-gray-900 mb-1">
                직접 변호
              </h3>
              <p className="text-body2 text-gray-500 mb-4">
                {sideLabel} 입장에서 추가 변론을 작성해주세요
              </p>
              <textarea
                className="textarea-field h-36"
                placeholder={
                  defenseSide === "opponent"
                    ? "상대방이 왜 덜 잘못했는지 설명해주세요..."
                    : "내가 왜 덜 잘못했는지 추가로 설명해주세요..."
                }
                maxLength={limits.defenseSelf ?? undefined}
                value={selfDefense}
                onChange={(e) => setSelfDefense(e.target.value)}
              />
              <p className="text-caption text-gray-400 text-right mt-1">
                {selfDefense.length}/{limits.defenseSelf}
              </p>
            </div>
          )}

          {canSubmitSelf && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <button
                className="w-full py-3.5 rounded-xl font-semibold text-body1 bg-primary-400 text-white active:bg-primary-500 flex items-center justify-center gap-2 disabled:opacity-50"
                onClick={handleSubmitSelfDefense}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    변론 제출하기
                  </>
                )}
              </button>
            </motion.div>
          )}
        </motion.div>
      )}

      {showAdModal && <AdModal onClose={() => setShowAdModal(false)} />}
    </div>
  );
}
