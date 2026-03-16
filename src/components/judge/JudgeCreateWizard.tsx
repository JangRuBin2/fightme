'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, AlertTriangle } from 'lucide-react';

interface WizardStep {
  question: string;
  options: { value: string; label: string; emoji: string }[];
}

const WIZARD_STEPS: WizardStep[] = [
  {
    question: '갈등이 생겼을 때 어떻게 접근하나요?',
    options: [
      { value: '논리', label: '논리적으로 분석', emoji: '🧠' },
      { value: '감정', label: '감정을 먼저 이해', emoji: '💕' },
      { value: '직감', label: '직감으로 판단', emoji: '⚡' },
      { value: '경험', label: '경험에 기반', emoji: '📚' },
    ],
  },
  {
    question: '판결할 때 가장 중요하게 보는 것은?',
    options: [
      { value: '공정', label: '공정함', emoji: '⚖️' },
      { value: '공감', label: '양쪽 마음', emoji: '🤝' },
      { value: '재미', label: '재미와 위트', emoji: '😂' },
      { value: '교훈', label: '교훈과 성장', emoji: '🌱' },
    ],
  },
  {
    question: '어떤 말투를 사용하나요?',
    options: [
      { value: '반말', label: '반말 (야, 이건...)' , emoji: '😤' },
      { value: '존댓말', label: '존댓말 (제 판결은...)' , emoji: '🎩' },
      { value: '사투리', label: '사투리 (아이가...)' , emoji: '🏔️' },
      { value: '인터넷', label: '인터넷체 (ㄹㅇ...)' , emoji: '📱' },
    ],
  },
  {
    question: '판결 스타일은?',
    options: [
      { value: '냉정', label: '팩트 폭격', emoji: '🧊' },
      { value: '따뜻', label: '따뜻한 조언', emoji: '☀️' },
      { value: '유머', label: '웃기면서 날카롭게', emoji: '🎭' },
      { value: '꼰대', label: '잔소리 스타일', emoji: '👴' },
    ],
  },
  {
    question: '가장 어울리는 특징은?',
    options: [
      { value: '완벽주의', label: '디테일에 강한', emoji: '🔍' },
      { value: '대범한', label: '큰 그림을 보는', emoji: '🦅' },
      { value: '츤데레', label: '관심없는 척 정확한', emoji: '😏' },
      { value: '다정한', label: '잘잘못보다 화해', emoji: '🫂' },
    ],
  },
  {
    question: '판결 후 한마디 스타일은?',
    options: [
      { value: '팩트', label: '"그래서 니 잘못이야"', emoji: '💥' },
      { value: '위로', label: '"두 분 다 고생했어요"', emoji: '🌸' },
      { value: '훈계', label: '"내가 살아보니까..."', emoji: '📢' },
      { value: '드립', label: '"이건 좀 웃기다ㅋㅋ"', emoji: '😆' },
    ],
  },
];

interface JudgeCreateWizardProps {
  onComplete: (data: {
    name: string;
    q1: string;
    q2: string;
    q3: string;
    q4: string;
    q5: string;
    q6: string;
  }) => void;
  isSubmitting: boolean;
}

export default function JudgeCreateWizard({ onComplete, isSubmitting }: JudgeCreateWizardProps) {
  const [step, setStep] = useState(0); // 0 = name input, 1-6 = questions
  const [name, setName] = useState('');
  const [answers, setAnswers] = useState<string[]>(Array(6).fill(''));

  const isNameStep = step === 0;
  const questionIndex = step - 1;
  const totalSteps = WIZARD_STEPS.length + 1; // +1 for name step
  const isLastStep = step === totalSteps - 1;
  const progress = ((step + 1) / totalSteps) * 100;

  const canProceed = isNameStep ? name.trim().length > 0 : answers[questionIndex] !== '';

  const handleNext = () => {
    if (isLastStep && canProceed) {
      onComplete({
        name: name.trim(),
        q1: answers[0],
        q2: answers[1],
        q3: answers[2],
        q4: answers[3],
        q5: answers[4],
        q6: answers[5],
      });
      return;
    }
    if (canProceed && step < totalSteps - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const selectAnswer = (value: string) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = value;
    setAnswers(newAnswers);
  };

  return (
    <div className="flex flex-col min-h-[60vh]">
      {/* Progress */}
      <div className="h-1 bg-gray-100 rounded-full mb-6">
        <motion.div
          className="h-full bg-primary-400 rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Warning */}
      <div className="bg-amber-50 rounded-xl p-3 mb-5 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
        <p className="text-caption text-amber-700">
          부적절한 내용의 판사는 AI 검토 후 거절될 수 있습니다
        </p>
      </div>

      {/* Step Content */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {isNameStep ? (
              <div>
                <h2 className="text-h3 text-gray-900 mb-2">판사 이름을 지어주세요</h2>
                <p className="text-body2 text-gray-500 mb-6">재미있고 개성있는 이름으로!</p>
                <input
                  className="input-field text-lg"
                  placeholder="예: 냉철한 판사님"
                  maxLength={20}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
                <p className="text-caption text-gray-400 text-right mt-1">{name.length}/20</p>
              </div>
            ) : (
              <div>
                <h2 className="text-h3 text-gray-900 mb-2">
                  Q{questionIndex + 1}. {WIZARD_STEPS[questionIndex].question}
                </h2>
                <p className="text-body2 text-gray-500 mb-6">
                  {step}/{totalSteps - 1}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {WIZARD_STEPS[questionIndex].options.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => selectAnswer(option.value)}
                      className={`p-4 rounded-2xl border-2 text-left transition-colors ${
                        answers[questionIndex] === option.value
                          ? 'border-primary-400 bg-primary-50'
                          : 'border-gray-200 bg-gray-50 active:bg-gray-100'
                      }`}
                    >
                      <span className="text-2xl mb-2 block">{option.emoji}</span>
                      <span className="text-body2 font-medium text-gray-800">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-6">
        {step > 0 && (
          <button
            onClick={handleBack}
            className="px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-medium flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            이전
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!canProceed || isSubmitting}
          className="flex-1 btn-primary flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              AI가 판사를 만드는 중...
            </div>
          ) : isLastStep ? (
            <>
              <Sparkles className="w-5 h-5" />
              판사 생성하기
            </>
          ) : (
            <>
              다음
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
