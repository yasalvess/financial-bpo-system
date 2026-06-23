# Handoff Report — Explorer 1 (Database Security Explorer)

## 1. Observation
After a thorough read-only investigation of the codebase, the following details were observed:
- **No Database Schema File**: No SQL files or table initialization scripts (like `schema.sql`) exist in the project files. The `supabase` directory contains only `supabase/functions/` (Deno edge functions).
- **Core Tables Queried**: The application frontend and Edge Functions interact with 8 distinct database tables:
  1. `perfis` (queried in `app.jsx:57` and `settings.jsx:663`)
  2. `empresas` (queried in `app.jsx:225, 252, 269` and `hooks.jsx:15`)
  3. `usuarios_empresas` (queried in `settings.jsx:666` and `admin-criar-usuario/index.ts:68`)
  4. `portadores` (queried in `app.jsx:151, 159, 170` and `hooks.jsx:16`)
  5. `centros_custo` (queried in `app.jsx:180, 188, 199` and `hooks.jsx:17`)
  6. `formas_pagamento` (queried in `app.jsx:208, 217` and `hooks.jsx:18`)
  7. `lancamentos` (queried in `app.jsx:302, 306, 338, 344`, `hooks.jsx:28`, and Edge Functions)
  8. `preferencias_notificacao` (queried in `settings.jsx:846, 855` and Edge Functions)

- **Access Controls & Ownership in Code**:
  - `admin-criar-usuario/index.ts` creates new users via Supabase Auth and injects their creator's user ID as `owner_id` in their user metadata. It then updates `perfis` with `cargo` and `owner_id` (admin's ID).
  - Admins are linked to companies they create via the `user_id` column of `empresas`.
  - Non-admin users (Analysts/Visualizers) are linked to companies via the `usuarios_empresas` join table (fields: `user_id`, `empresa_id`).
  - Frontend queries in `hooks.jsx` filter resources (`empresas`, `portadores`, `centros_custo`, `formas_pagamento`) using `.eq('user_id', userId)`.
  - **Syntax/Merge Issue in settings.jsx**: Line 643 contains a malformed line merging a `div` tag and a function declaration:
    ```javascript
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>function AbaUsuarios({ session, data }) {
    ```
    Also, line 808 contains a stray text string outside of any JSX block:
    ```javascript
    }                 Revogar
    ```

---

## 2. Logic Chain
1. **Lack of Database Definition**: Since `schema.sql` does not exist, database creation and RLS policies must be established in a new file. Proposing a `schema.sql` at the root directory of the workspace matches the acceptance criteria.
2. **Access Security Structure**: 
   - Row Level Security (RLS) is required to restrict user access to companies they are linked to or companies they own.
   - For `empresas`, an admin should access companies where `user_id = auth.uid()`. An analyst or visualizer should access companies linked to them in `usuarios_empresas` or companies owned by their profile's `owner_id`.
   - For `lancamentos`, access should only be allowed if the user has access to the parent company (verified via `empresas` ownership or `usuarios_empresas`).
   - For configuration tables (`portadores`, `centros_custo`, `formas_pagamento`), access should be allowed if they are owned by the user (`user_id = auth.uid()`) or by the user's admin/owner (`user_id = (select owner_id from perfis where perfis.id = auth.uid())`).
3. **Frontend Query Conflict**:
   - The current queries in `hooks.jsx` restrict company and configuration fetches using `.eq('user_id', userId)` where `userId` is the current user's ID.
   - For an analyst or visualizer, their `user_id` does not match the company's `user_id` (which belongs to the admin).
   - Therefore, the client-side queries will return empty arrays regardless of database RLS permissions.
   - **Conclusion**: The frontend query filters in `hooks.jsx` must be modified to remove the hardcoded client-side `user_id` filters on shared assets and let RLS policies govern multi-tenant security dynamically, OR the query must fetch data based on the user's `owner_id`. Removing the `.eq('user_id', userId)` filters in the frontend and relying on database RLS is the cleanest approach.

---

## 3. Caveats
- Since this is a read-only investigation, database tables were analyzed solely from the queries and mutations in the frontend code and the Deno edge functions. No actual database connection was used to query the system catalog.
- It is assumed that the `cargo` field values in `perfis` can either be `'admin'`, `'analista'`, `'visualizador'`, or their uppercase variants `'Administrador(a)'`, `'Analista'`, `'Visualizador'`. Policies are written to match both formats case-insensitively or via exact matches.

---

## 4. Conclusion
We must implement a `schema.sql` that defines the database structure and sets up rigid, non-recursive RLS policies that filter access based on `usuarios_empresas` and `owner_id`. In addition, we must propose updating `hooks.jsx` to query resources without the client-side `user_id` filters so that the RLS filters can execute correctly.

Below is the proposed SQL script for database initialization and security policies:

### Proposed `schema.sql`
```sql
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
    user_id = (select owner_id from public.perfis where perfis.id = auth.uid()) or
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
        empresas.user_id = (select owner_id from public.perfis where perfis.id = auth.uid()) or
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
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

## 5. Verification Method
1. **Verification of Schema and Policies syntax**: The proposed `schema.sql` file can be executed in any standard PostgreSQL / Supabase SQL Editor.
2. **Verification of frontend query adjustments**:
   - In `hooks.jsx`, locate the `useAppData` function.
   - Temporarily replace the queries for `empresas`, `portadores`, `centros_custo`, and `formas_pagamento` to remove `.eq('user_id', userId)` and test with both an administrator account and an analyst account to ensure that correct subset of records are returned based on the user's association in `usuarios_empresas` / `owner_id`.
