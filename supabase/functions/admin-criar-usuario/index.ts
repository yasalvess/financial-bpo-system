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
    // Usar o service role para ignorar as RLS e ter permissões de admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Não autorizado: Cabeçalho Authorization ausente');
    const token = authHeader.replace('Bearer ', '');

    // Pegar o ID do admin atual pelo token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) throw new Error('Não autorizado: Token inválido');

    // Checar se quem chamou é de fato admin (case-insensitive)
    const { data: perfilAdmin } = await supabaseAdmin.from('perfis').select('cargo').eq('id', user.id).single();
    const cargoLower = (perfilAdmin?.cargo || '').toLowerCase();
    if (!cargoLower.includes('admin') && !cargoLower.includes('administrador')) {
      throw new Error('Apenas administradores podem gerenciar usuários');
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'delete') {
      const { id, isConvite } = body;
      if (!id) throw new Error('ID do usuário é obrigatório para exclusão');

      if (isConvite) {
        // Se for convite pendente, apenas remove da tabela de convites
        const { error: deleteConvError } = await supabaseAdmin.from('convites').delete().eq('id', id);
        if (deleteConvError) throw deleteConvError;
      } else {
        // Pegar o e-mail do usuário para deletar convites vinculados
        const { data: perfilInfo } = await supabaseAdmin.from('perfis').select('email').eq('id', id).single();
        
        // Deletar o usuário no Supabase Auth (cascade apaga perfis e usuarios_empresas)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(id);
        if (deleteError) {
          const errorMsg = deleteError.message?.toLowerCase() || '';
          if (errorMsg.includes('not found') || errorMsg.includes('inexistente') || deleteError.status === 404) {
            // Se o usuário não existir no Auth, removemos o perfil diretamente no banco
            await supabaseAdmin.from('perfis').delete().eq('id', id);
          } else {
            throw deleteError;
          }
        }

        if (perfilInfo && perfilInfo.email) {
          await supabaseAdmin.from('convites').delete().eq('email_convidado', perfilInfo.email);
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Ação Padrão: Criar Usuário
    const { email, password, nome, cargo, empresasIds } = body;

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
        owner_id: user.id
      }
    });

    if (createError) throw createError;

    // Atualiza o cargo e o owner_id na tabela perfis (o trigger já criou a linha)
    await supabaseAdmin.from('perfis').update({
      cargo: cargo,
      owner_id: user.id
    }).eq('id', novoUsuario.user.id);

    // Vincula às empresas (inserção um a um para evitar problemas de parsing em lote)
    if (empresasIds && empresasIds.length > 0) {
      for (const empId of empresasIds) {
        const { error: vincError } = await supabaseAdmin.from('usuarios_empresas').insert({
          user_id: novoUsuario.user.id,
          empresa_id: empId
        });
        if (vincError) throw vincError;
      }
    }

    // Registra na tabela de convites para histórico/controle (formatado como array literal do postgres)
    const pgArray = `{${(empresasIds || []).join(',')}}`;
    await supabaseAdmin.from('convites').insert({
      user_id: user.id,
      email_convidado: email.toLowerCase().trim(),
      papel: cargo,
      nome: nome.trim(),
      senha_temporaria: password,
      empresas_ids: pgArray,
      status: 'pendente'
    });

    // Enviar e-mail via Resend
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || 'no-reply@ksgestaofinanceira.com';
    const APP_URL = Deno.env.get('APP_URL') || 'https://ksgestaofinanceira.com';

    if (RESEND_API_KEY) {
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: sans-serif; color: #333; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; }
            .header { font-size: 18px; font-weight: bold; margin-bottom: 20px; color: #1e3a8a; }
            .btn { display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
            .footer { font-size: 12px; color: #64748b; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">Convite de Acesso — KS Gestão Financeira</div>
            <p>Olá, <strong>${nome}</strong>!</p>
            <p>Você foi convidado a acessar o sistema de gestão financeira da <strong>KS Gestão BPO</strong>.</p>
            <p>Aqui estão seus dados de acesso temporários:</p>
            <ul>
              <li><strong>E-mail:</strong> ${email}</li>
              <li><strong>Senha Temporária:</strong> ${password}</li>
            </ul>
            <p>Recomendamos que você altere sua senha no menu de configurações após o primeiro acesso.</p>
            <a href="${APP_URL}" class="btn" style="color: #ffffff;">Acessar o Sistema</a>
            <div class="footer">
              Esta é uma mensagem automática. Por favor, não responda a este e-mail.
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: EMAIL_FROM,
            to: [email],
            subject: 'Seu acesso ao sistema KS Gestão Financeira',
            html: emailHtml,
          }),
        });
      } catch (e) {
        console.error('Erro ao enviar e-mail via Resend:', e);
      }
    }

    return new Response(JSON.stringify({ success: true, user: novoUsuario.user }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('Edge Function Error:', error.message, error.stack);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
