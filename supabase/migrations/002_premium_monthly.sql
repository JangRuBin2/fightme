-- Add last_premium_grant column for tracking monthly premium token grants
alter table profiles add column if not exists last_premium_grant timestamptz;

-- Add detail_unlocked to fights for preventing double-charge on verdict detail view
alter table fights add column if not exists detail_unlocked boolean default false;

-- Soft-delete support for profiles
alter table profiles add column if not exists is_deleted boolean default false;
alter table profiles add column if not exists deleted_at timestamptz;

-- Update token_logs reason CHECK constraint to include new reasons
-- Drop old constraint and recreate with all valid reasons
alter table token_logs drop constraint if exists token_logs_reason_check;
alter table token_logs add constraint token_logs_reason_check
  check (reason in (
    'SIGNUP_BONUS',
    'AD_REWARD',
    'FIGHT_JUDGE',
    'FIGHT_REVEAL',
    'FIGHT_DETAIL',
    'FIGHT_APPEAL',
    'FIGHT_DEFENSE_AI',
    'FIGHT_DEFENSE_SELF',
    'JUDGE_CREATE',
    'IAP_PURCHASE',
    'PREMIUM_MONTHLY'
  ));
