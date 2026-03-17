import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeId = 'warm' | 'dark-court' | 'neon-fight';

interface CurrentFight {
  userName: string;
  opponentName: string;
  userClaim: string;
  opponentClaim: string;
  judgeId: string | null;
}

interface AppState {
  // Auth
  userId: string | null;
  nickname: string | null;
  isLoggedIn: boolean;
  setAuth: (userId: string, nickname: string | null) => void;
  clearAuth: () => void;

  // Tokens
  tokenBalance: number;
  setTokenBalance: (balance: number) => void;
  adjustTokens: (delta: number) => void;

  // Theme
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;

  // Current fight in progress
  currentFight: CurrentFight;
  setUserName: (name: string) => void;
  setOpponentName: (name: string) => void;
  setUserClaim: (claim: string) => void;
  setOpponentClaim: (claim: string) => void;
  setJudgeId: (id: string) => void;
  resetFight: () => void;
}

const initialFight: CurrentFight = {
  userName: '',
  opponentName: '',
  userClaim: '',
  opponentClaim: '',
  judgeId: null,
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Auth
      userId: null,
      nickname: null,
      isLoggedIn: false,
      setAuth: (userId, nickname) =>
        set({ userId, nickname, isLoggedIn: true }),
      clearAuth: () =>
        set({ userId: null, nickname: null, isLoggedIn: false, tokenBalance: 0 }),

      // Tokens
      tokenBalance: 0,
      setTokenBalance: (balance) => set({ tokenBalance: balance }),
      adjustTokens: (delta) =>
        set((state) => ({ tokenBalance: Math.max(0, state.tokenBalance + delta) })),

      // Theme
      theme: 'warm' as ThemeId,
      setTheme: (theme) => set({ theme }),

      // Current fight in progress
      currentFight: { ...initialFight },
      setUserName: (name) =>
        set((state) => ({
          currentFight: { ...state.currentFight, userName: name },
        })),
      setOpponentName: (name) =>
        set((state) => ({
          currentFight: { ...state.currentFight, opponentName: name },
        })),
      setUserClaim: (claim) =>
        set((state) => ({
          currentFight: { ...state.currentFight, userClaim: claim },
        })),
      setOpponentClaim: (claim) =>
        set((state) => ({
          currentFight: { ...state.currentFight, opponentClaim: claim },
        })),
      setJudgeId: (id) =>
        set((state) => ({
          currentFight: { ...state.currentFight, judgeId: id },
        })),
      resetFight: () =>
        set({ currentFight: { ...initialFight } }),
    }),
    {
      name: 'fightme-storage',
      partialize: (state) => ({
        userId: state.userId,
        nickname: state.nickname,
        isLoggedIn: state.isLoggedIn,
        tokenBalance: state.tokenBalance,
        theme: state.theme,
        currentFight: state.currentFight,
      }),
    }
  )
);
