import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || 'KS Gestão <noreply@ksgestao.com.br>'
const APP_URL = Deno.env.get('APP_URL') || 'https://ksgestao.vercel.app'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } });
  }

  try {
    const { lancamento_id, user_id } = await req.json()
    
    // Buscar lançamento
    const { data: lanc } = await db.from('lancamentos').select('*, empresas(nome)').eq('id', lancamento_id).single()
    // Buscar perfil
    const { data: perfil } = await db.from('perfis').select('*').eq('id', user_id).single()
    
    if (!lanc || !perfil) return new Response('Not found', { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } })

    // Buscar preferencias
    const { data: prefs } = await db.from('preferencias_notificacao').select('*').eq('user_id', user_id).single()
    if (!prefs?.email_novo_lancamento) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
    }

    const html = `<!DOCTYPE html>
    <html><head><meta charset="utf-8">
    <style>
      body{font-family:Arial,sans-serif;padding:32px;color:#0B1D39;background:#F7F9FB}
      .card{background:#fff;border-radius:12px;padding:24px;max-width:500px;margin:0 auto;
            box-shadow:0 2px 8px rgba(11,29,57,.08)}
      .header{background:#0B1D39;color:#fff;padding:16px 24px;border-radius:8px;
              margin-bottom:20px;font-weight:700;font-size:16px}
      .row{display:flex;justify-content:space-between;padding:8px 0;
           border-bottom:1px solid #D4E3EF;font-size:13px}
      .label{color:#4A6580}.valor{font-weight:600}
      .btn{display:inline-block;background:#2F5D8A;color:#fff;padding:10px 20px;
           border-radius:8px;text-decoration:none;font-weight:600;margin-top:20px;font-size:13px}
    </style></head>
    <body><div class="card">
      <div class="header">🔔 Novo lançamento registrado</div>
      <div class="row"><span class="label">Empresa</span>
        <span class="valor">${lanc.empresas?.nome || 'N/A'}</span></div>
      <div class="row"><span class="label">Tipo</span>
        <span class="valor" style="color:${lanc.tipo==='entrada'?'#16a34a':'#dc2626'}">
          ${lanc.tipo === 'entrada' ? '↓ Entrada' : '↑ Saída'}
        </span></div>
      <div class="row"><span class="label">Descrição</span>
        <span class="valor">${lanc.descricao}</span></div>
      <div class="row"><span class="label">Valor</span>
        <span class="valor">${lanc.valor.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</span></div>
      <div class="row"><span class="label">Vencimento</span>
        <span class="valor">${new Date(lanc.vencimento+'T00:00:00').toLocaleDateString('pt-BR')}</span></div>
      <a href="${APP_URL}" class="btn">Ver no sistema</a>
    </div></body></html>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [perfil.email],
        subject: `Novo lançamento: ${lanc.descricao} - ${lanc.empresas?.nome || ''}`,
        html,
      }),
    })

    return new Response(JSON.stringify({ ok: res.ok }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } })
  }
})
