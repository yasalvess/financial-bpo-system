import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || 'KS Gestão <noreply@ksgestao.com.br>'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

serve(async (req) => {
  // Evitar execuções indevidas a não ser que seja um cron ou tenha secret
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${SUPABASE_SERVICE_KEY}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const { data: usuarios } = await db.from('perfis').select('*')
    if (!usuarios) return new Response('Nenhum usuário', { status: 200 })

    let envios = 0

    for (const u of usuarios) {
      const { data: prefs } = await db.from('preferencias_notificacao').select('*').eq('user_id', u.id).single()
      if (!prefs) continue

      const hoje = new Date().toISOString().split('T')[0]
      
      // Buscar inadimplentes
      let msgInad = ''
      if (prefs.email_inadimplencia) {
        const { data: inad } = await db.from('lancamentos')
          .select('*, empresas(nome)')
          .eq('pago', false)
          .lt('vencimento', hoje)
        
        if (inad && inad.length > 0) {
          msgInad = `<h3>Títulos Vencidos (${inad.length})</h3><ul>`
          inad.slice(0,10).forEach(l => {
            msgInad += `<li>${l.descricao} - ${l.empresas?.nome || ''} - R$ ${l.valor.toFixed(2)}</li>`
          })
          if (inad.length > 10) msgInad += `<li>... e mais ${inad.length - 10}</li>`
          msgInad += `</ul>`
        }
      }

      if (msgInad) {
        const html = `<html><body><h2>Resumo de Notificações - KS Gestão</h2>${msgInad}</body></html>`
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: EMAIL_FROM,
            to: [u.email],
            subject: `Resumo de Pendências - KS Gestão`,
            html,
          }),
        })
        envios++
      }
    }

    return new Response(JSON.stringify({ ok: true, envios }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
