-- 1. Profiles Table
create table if not exists public.perfis (
  id uuid references auth.users(id) on delete cascade primary key,
  nome text not null,
  email text not null,
  cargo text not null default 'analista',
  owner_id uuid references auth.users(id) on delete set null,
  foto_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Companies Table
create table if not exists public.empresas (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  nome text not null,
  cnpj text unique not null,
  nome_fantasia text,
  segmento text,
  responsavel text,
  email text,
  telefone text,
  portadores_ativos text[] default '{}',
  centros_ativos text[] default '{}',
  ativo boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Users to Companies Join Table
create table if not exists public.usuarios_empresas (
  user_id uuid references auth.users(id) on delete cascade not null,
  empresa_id uuid references public.empresas(id) on delete cascade not null,
  primary key (user_id, empresa_id)
);

-- 4. Portadores Table (Financial Accounts)
create table if not exists public.portadores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  nome text not null,
  tipo text not null,
  cor text not null,
  ativo boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Cost Centers Table
create table if not exists public.centros_custo (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  nome text not null,
  tipo text not null, -- 'entrada' or 'saida'
  ativo boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Payment Methods Table
create table if not exists public.formas_pagamento (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  nome text not null,
  ordem integer not null,
  ativo boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Transactions Table (Lancamentos)
create table if not exists public.lancamentos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  empresa_id uuid references public.empresas(id) on delete cascade not null,
  tipo text not null, -- 'entrada' or 'saida'
  descricao text not null,
  valor numeric(12,2) not null,
  vencimento date not null,
  competencia text not null,
  portador_id uuid references public.portadores(id) on delete set null,
  centro_custo_id uuid references public.centros_custo(id) on delete set null,
  forma_pagamento text not null,
  pago boolean default false not null,
  pagamento_data date,
  pagamento_comprovante text,
  observacao text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Email Notification Preferences Table
create table if not exists public.preferencias_notificacao (
  user_id uuid references auth.users(id) on delete cascade primary key,
  email_novo_lancamento boolean default false not null,
  email_inadimplencia boolean default true not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS on all tables
alter table public.perfis enable row level security;
alter table public.empresas enable row level security;
alter table public.usuarios_empresas enable row level security;
alter table public.portadores enable row level security;
alter table public.centros_custo enable row level security;
alter table public.formas_pagamento enable row level security;
alter table public.lancamentos enable row level security;
alter table public.preferencias_notificacao enable row level security;

-- 1. perfis Policies
create policy "perfis_select" on public.perfis for select
  using (id = auth.uid() or owner_id = auth.uid());

create policy "perfis_insert" on public.perfis for insert
  with check (id = auth.uid() or owner_id = auth.uid());

create policy "perfis_update" on public.perfis for update
  using (id = auth.uid() or owner_id = auth.uid())
  with check (id = auth.uid() or owner_id = auth.uid());

create policy "perfis_delete" on public.perfis for delete
  using (owner_id = auth.uid());

-- 2. usuarios_empresas Policies (Defines connection between user and company)
create policy "usuarios_empresas_select" on public.usuarios_empresas for select
  using (
    user_id = auth.uid() or 
    exists (select 1 from public.perfis where perfis.id = user_id and perfis.owner_id = auth.uid())
  );

create policy "usuarios_empresas_insert" on public.usuarios_empresas for insert
  with check (
    exists (select 1 from public.perfis where perfis.id = user_id and perfis.owner_id = auth.uid())
  );

create policy "usuarios_empresas_update" on public.usuarios_empresas for update
  using (
    exists (select 1 from public.perfis where perfis.id = user_id and perfis.owner_id = auth.uid())
  );

create policy "usuarios_empresas_delete" on public.usuarios_empresas for delete
  using (
    exists (select 1 from public.perfis where perfis.id = user_id and perfis.owner_id = auth.uid())
  );

-- 3. empresas Policies
create policy "empresas_select" on public.empresas for select
  using (
    user_id = auth.uid() or
    exists (
      select 1 from public.usuarios_empresas 
      where usuarios_empresas.empresa_id = id 
      and usuarios_empresas.user_id = auth.uid()
    )
  );

create policy "empresas_insert" on public.empresas for insert
  with check (
    user_id = auth.uid() and 
    exists (
      select 1 from public.perfis 
      where perfis.id = auth.uid() 
      and (perfis.cargo ilike '%admin%' or perfis.cargo ilike '%administrador%')
    )
  );

create policy "empresas_update" on public.empresas for update
  using (user_id = auth.uid());

create policy "empresas_delete" on public.empresas for delete
  using (user_id = auth.uid());

-- 4. portadores, centros_custo, formas_pagamento Policies (Shared configuration)
create policy "portadores_select" on public.portadores for select
  using (
    user_id = auth.uid() or 
    user_id = (select owner_id from public.perfis where perfis.id = auth.uid())
  );

create policy "portadores_all" on public.portadores for all
  using (user_id = auth.uid());

create policy "centros_custo_select" on public.centros_custo for select
  using (
    user_id = auth.uid() or 
    user_id = (select owner_id from public.perfis where perfis.id = auth.uid())
  );

create policy "centros_custo_all" on public.centros_custo for all
  using (user_id = auth.uid());

create policy "formas_pagamento_select" on public.formas_pagamento for select
  using (
    user_id = auth.uid() or 
    user_id = (select owner_id from public.perfis where perfis.id = auth.uid())
  );

create policy "formas_pagamento_all" on public.formas_pagamento for all
  using (user_id = auth.uid());

-- 5. lancamentos Policies
create policy "lancamentos_select" on public.lancamentos for select
  using (
    user_id = auth.uid() or 
    exists (
      select 1 from public.empresas 
      where empresas.id = lancamentos.empresa_id 
      and (
        empresas.user_id = auth.uid() or 
        exists (
          select 1 from public.usuarios_empresas 
          where usuarios_empresas.empresa_id = empresas.id 
          and usuarios_empresas.user_id = auth.uid()
        )
      )
    )
  );

create policy "lancamentos_insert" on public.lancamentos for insert
  with check (
    user_id = auth.uid() and 
    not exists (
      select 1 from public.perfis 
      where perfis.id = auth.uid() 
      and (perfis.cargo ilike '%visualizador%' or perfis.cargo ilike '%visualizadora%')
    ) and
    exists (
      select 1 from public.empresas 
      where empresas.id = empresa_id 
      and (
        empresas.user_id = auth.uid() or 
        empresas.user_id = (select owner_id from public.perfis where perfis.id = auth.uid()) or
        exists (
          select 1 from public.usuarios_empresas 
          where usuarios_empresas.empresa_id = empresas.id 
          and usuarios_empresas.user_id = auth.uid()
        )
      )
    )
  );

create policy "lancamentos_update" on public.lancamentos for update
  using (
    not exists (
      select 1 from public.perfis 
      where perfis.id = auth.uid() 
      and (perfis.cargo ilike '%visualizador%' or perfis.cargo ilike '%visualizadora%')
    ) and
    exists (
      select 1 from public.empresas 
      where empresas.id = empresa_id 
      and (
        empresas.user_id = auth.uid() or 
        empresas.user_id = (select owner_id from public.perfis where perfis.id = auth.uid()) or
        exists (
          select 1 from public.usuarios_empresas 
          where usuarios_empresas.empresa_id = empresas.id 
          and usuarios_empresas.user_id = auth.uid()
        )
      )
    )
  );

create policy "lancamentos_delete" on public.lancamentos for delete
  using (
    not exists (
      select 1 from public.perfis 
      where perfis.id = auth.uid() 
      and (perfis.cargo ilike '%visualizador%' or perfis.cargo ilike '%visualizadora%')
    ) and
    exists (
      select 1 from public.empresas 
      where empresas.id = empresa_id 
      and (
        empresas.user_id = auth.uid() or 
        empresas.user_id = (select owner_id from public.perfis where perfis.id = auth.uid()) or
        exists (
          select 1 from public.usuarios_empresas 
          where usuarios_empresas.empresa_id = empresas.id 
          and usuarios_empresas.user_id = auth.uid()
        )
      )
    )
  );

-- 6. preferencias_notificacao Policies
create policy "preferencias_notificacao_all" on public.preferencias_notificacao for all
  using (user_id = auth.uid());

-- =========================================================================
-- DATABASE TRIGGERS
-- =========================================================================

-- Trigger to automatically create a profile and notification preferences when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.perfis (id, nome, email, cargo, owner_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', new.email),
    new.email,
    'analista', -- Default cargo
    coalesce((new.raw_user_meta_data->>'owner_id')::uuid, null)
  );
  
  insert into public.preferencias_notificacao (user_id, email_novo_lancamento, email_inadimplencia)
  values (new.id, false, true);

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- =========================================================================
-- MIGRATION: Novas melhorias (Convites, PF/PJ, Parcelamento)
-- =========================================================================

-- Convites (garantindo que a tabela existe com a estrutura reportada e adicionando as novas colunas)
create table if not exists public.convites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  email_convidado text not null,
  papel text not null,
  status text default 'pendente' not null,
  token text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone
);

ALTER TABLE public.convites
  ADD COLUMN IF NOT EXISTS nome TEXT,
  ADD COLUMN IF NOT EXISTS senha_temporaria TEXT,
  ADD COLUMN IF NOT EXISTS empresas_ids UUID[] DEFAULT '{}';

-- Suporte a Pessoa Física (PF)
ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS tipo_pessoa TEXT DEFAULT 'pj' CHECK (tipo_pessoa IN ('pj', 'pf')),
  ADD COLUMN IF NOT EXISTS documento TEXT;

-- Parcelamentos
ALTER TABLE public.lancamentos
  ADD COLUMN IF NOT EXISTS parcela_ref TEXT,
  ADD COLUMN IF NOT EXISTS parcela_num INTEGER,
  ADD COLUMN IF NOT EXISTS parcela_total INTEGER;

-- Politica basica para convites
alter table public.convites enable row level security;
create policy "convites_all" on public.convites for all using (user_id = auth.uid());

-- Preferências de Notificação adicionais
ALTER TABLE public.preferencias_notificacao
  ADD COLUMN IF NOT EXISTS email_vencimento boolean default true not null,
  ADD COLUMN IF NOT EXISTS email_vencimento_dias integer default 3 not null,
  ADD COLUMN IF NOT EXISTS email_resumo_semanal boolean default true not null,
  ADD COLUMN IF NOT EXISTS email_resumo_dia_semana integer default 1 not null,
  ADD COLUMN IF NOT EXISTS email_relatorio_mensal boolean default true not null;

