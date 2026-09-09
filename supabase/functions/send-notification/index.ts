// Supabase Edge Function: send-notification
// Inserts a notification and optionally sends an email via Resend.
// Called from database triggers or other Edge Functions.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  user_id: string;
  company_id?: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  send_email?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const payload: NotificationPayload = await req.json();

    // 1. Insert in-app notification
    const { error: insertErr } = await supabase.from('notifications').insert({
      user_id: payload.user_id,
      company_id: payload.company_id,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      link: payload.link,
    });

    if (insertErr) throw insertErr;

    // 2. Optionally send email via Resend
    if (payload.send_email) {
      const resendKey = Deno.env.get('RESEND_API_KEY');
      if (resendKey) {
        // Get user email
        const { data: userData } = await supabase.auth.admin.getUserById(payload.user_id);
        const email = userData?.user?.email;

        if (email) {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Qimatak <notifications@qimatak.app>',
              to: email,
              subject: payload.title,
              html: `
                <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #1a1a2e;">${payload.title}</h2>
                  ${payload.body ? `<p style="color: #666;">${payload.body}</p>` : ''}
                  ${payload.link ? `<a href="${Deno.env.get('SITE_URL') || ''}${payload.link}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; margin-top: 16px;">View in Qimatak</a>` : ''}
                  <p style="color: #999; font-size: 12px; margin-top: 32px;">— Qimatak</p>
                </div>
              `,
            }),
          });
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
