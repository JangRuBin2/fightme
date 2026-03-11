-- profiles
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  token integer default 5,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- judges
create table judges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description varchar(30),
  prompt text not null,
  is_user_created boolean default false,
  is_approved boolean default true,
  reject_reason text,
  score integer default 0,
  usage_count integer default 0,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

create index idx_judges_listing on judges (is_user_created, is_approved, score desc);

-- fights (verdicts merged)
create table fights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  judge_id uuid not null references judges(id),
  user_claim varchar(100) not null,
  opponent_claim varchar(100) not null,
  user_fault integer check (user_fault >= 0 and user_fault <= 100),
  opponent_fault integer check (opponent_fault >= 0 and opponent_fault <= 100),
  comment varchar(40),
  verdict_detail text,
  stage text default 'INITIAL' check (stage in ('INITIAL', 'APPEAL')),
  defense text,
  is_revealed boolean default false,
  created_at timestamptz default now()
);

-- judge_votes
create table judge_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  judge_id uuid not null references judges(id) on delete cascade,
  is_upvote boolean not null,
  created_at timestamptz default now(),
  unique(user_id, judge_id)
);

-- token_logs
create table token_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  amount integer not null,
  reason text not null check (reason in ('SIGNUP_BONUS', 'AD_REWARD', 'FIGHT_JUDGE', 'FIGHT_REVEAL', 'FIGHT_DETAIL', 'FIGHT_APPEAL', 'FIGHT_DEFENSE_AI', 'FIGHT_DEFENSE_SELF')),
  created_at timestamptz default now()
);

-- RLS policies
alter table profiles enable row level security;
alter table fights enable row level security;
alter table judge_votes enable row level security;
alter table token_logs enable row level security;

-- Profiles: users can read/update own
create policy "Users can read own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Judges: anyone can read approved judges, creators can read own
create policy "Anyone can read approved judges" on judges for select using (is_approved = true);
create policy "Users can read own judges" on judges for select using (auth.uid() = created_by);

-- Fights: users can read own, anyone can read revealed fights (for shared results)
create policy "Users can read own fights" on fights for select using (auth.uid() = user_id);
create policy "Users can insert own fights" on fights for insert with check (auth.uid() = user_id);
create policy "Anyone can read revealed fights" on fights for select using (is_revealed = true);

-- Judge votes: users can manage own votes
create policy "Users can read own votes" on judge_votes for select using (auth.uid() = user_id);
create policy "Users can insert own votes" on judge_votes for insert with check (auth.uid() = user_id);
create policy "Users can update own votes" on judge_votes for update using (auth.uid() = user_id);
create policy "Users can delete own votes" on judge_votes for delete using (auth.uid() = user_id);

-- Token logs: users can read own
create policy "Users can read own token logs" on token_logs for select using (auth.uid() = user_id);

-- Seed default judges
insert into judges (name, description, prompt, is_user_created, is_approved) values
('공정한 김판사', '법과 원칙을 중시하는 정의로운 판사',
'너는 "공정한 김판사"다. 항상 공정하고 논리적으로 판결한다. 감정보다 사실에 기반한 판단을 내린다. 존댓말을 사용하며, 양쪽의 입장을 균형있게 고려한다.',
false, true),
('초강력T 황판사', '감정 따위 없다. 팩트만 말한다.',
'너는 "초강력T 황판사"다. 감정은 1도 없고 오직 논리와 팩트로만 판결한다. 반말을 쓰고, 직설적이며, 가차없다. "그래서 니 잘못이야" 같은 말투를 즐겨 쓴다.',
false, true),
('공감요정 박판사', '모두의 마음을 이해하는 따뜻한 판사',
'너는 "공감요정 박판사"다. 양쪽 모두의 마음을 깊이 이해하고 공감한다. 따뜻한 존댓말을 쓰며, 판결 후에도 위로의 말을 잊지 않는다. "두 분 다 힘드셨겠어요" 같은 표현을 자주 쓴다.',
false, true),
('꼰대 최판사', '내가 살아보니까... 라떼는 말이야...',
'너는 "꼰대 최판사"다. 모든 판결을 본인의 경험에 빗대어 내린다. "내가 살아보니까", "요즘 것들은" 같은 말투를 쓴다. 반말을 쓰고, 약간 과장된 훈계를 곁들인다.',
false, true);
