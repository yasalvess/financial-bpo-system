import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Pegar o ID do admin atual
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) throw new Error('Não autorizado');

    // Usar o service role para ignorar as RLS e ter permissões de admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Checar se quem chamou é de fato admin (embora o app confie, segurança a mais)
    const { data: perfilAdmin } = await supabaseAdmin.from('perfis').select('cargo').eq('id', user.id).single();
    if (perfilAdmin?.cargo !== 'admin' && perfilAdmin?.cargo !== 'Administrador(a)') {
      throw new Error('Apenas administradores podem criar usuários');
    }

    const { email, password, nome, cargo, empresasIds } = await req.json();

    if (!email || !password || !nome) {
      throw new Error('E-mail, senha e nome são obrigatórios');
    }

    // Cria o usuário na Auth do Supabase com service_role (não desloga o usuário atual)
    const { data: novoUsuario, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nome: nome,
        owner_id: user.id // injeta o ID do admin criador
      }
    });

    if (createError) throw createError;

    // Atualiza o cargo e o owner_id na tabela perfis (o trigger já criou a linha)
    await supabaseAdmin.from('perfis').update({
      cargo: cargo,
      owner_id: user.id
    }).eq('id', novoUsuario.user.id);

    // Vincula às empresas
    if (empresasIds && empresasIds.length > 0) {
      const vinculacoes = empresasIds.map((empId: string) => ({
        user_id: novoUsuario.user.id,
        empresa_id: empId
      }));
      const { error: vincError } = await supabaseAdmin.from('usuarios_empresas').insert(vinculacoes);
      if (vincError) throw vincError;
    }

    return new Response(JSON.stringify({ success: true, user: novoUsuario.user }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
