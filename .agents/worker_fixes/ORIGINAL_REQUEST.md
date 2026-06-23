## 2026-06-22T22:08:17-03:00
You are Worker 3 (Security and Validation Bug Fixer).
Your working directory is c:\Users\Yasmin\OneDrive\Documentos\financial-bpo-system\.agents\worker_fixes.
Your task is to fix the issues raised by Reviewer 1:

1. RLS Security Bypass in `schema.sql`:
   Modify `empresas_select` and `lancamentos_select` policies to remove BPO parent admin read access bypass. Make sure analysts/visualizers can only see companies/transactions they are linked to in `usuarios_empresas`.
   - Update `empresas_select` to:
     ```sql
     create policy "empresas_select" on public.empresas for select
       using (
         user_id = auth.uid() or
         exists (
           select 1 from public.usuarios_empresas 
           where usuarios_empresas.empresa_id = id 
           and usuarios_empresas.user_id = auth.uid()
         )
       );
     ```
   - Update `lancamentos_select` to:
     ```sql
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
     ```
2. Date Validation in Main Transaction Form (`workspace.jsx`):
   Locate `LancamentoFormModal`'s `submit` handler in `workspace.jsx`. Add a validation check for the `vencimento` field using `Validacao` and push to toast notifications if it's missing (preventing sending empty date inputs which result in "NaN/NaN" values):
   ```javascript
   const errVenc = Validacao.required(f.vencimento, 'Vencimento');
   if (errVenc) return toast.push(errVenc, 'error');
   ```
3. Trigger Function Security Settings in `schema.sql`:
   Modify `handle_new_user()` definition in `schema.sql` to explicitly define a secure search path using:
   ```sql
   security definer set search_path = public;
   ```

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

When done, write a handoff report handoff.md in your working directory and call send_message to report your completion to the parent orchestrator (conversation ID: 537f1403-d660-4159-b343-bc4ea82cf658).
