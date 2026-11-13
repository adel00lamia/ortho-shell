import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return json({ error: 'Authentication required' }, 401);
    const url = Deno.env.get('SUPABASE_URL')!, anon = Deno.env.get('SUPABASE_ANON_KEY')!, svc = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, ai = Deno.env.get('LOVABLE_API_KEY');
    if (!ai) return json({ error: 'AI not configured' }, 500);
    const { data: { user } } = await createClient(url, anon, { global: { headers: { Authorization: auth } } }).auth.getUser();
    if (!user) return json({ error: 'Invalid session' }, 401);
    const service = createClient(url, svc);
    const [{ data: companyId }, { data: allowed }] = await Promise.all([
      service.rpc('get_user_company_id', { _user_id: user.id }), service.rpc('is_admin_or_hr', { _user_id: user.id }),
    ]);
    if (!companyId || !allowed) return json({ error: 'Access denied' }, 403);

    const body = await req.json();
    const positionId = String(body?.positionId ?? '');
    const lang = body?.language === 'en' ? 'English' : 'French';
    const { data: pos } = await service.from('positions').select('id,title,level,is_critical,skills_required').eq('id', positionId).eq('company_id', companyId).maybeSingle();
    if (!pos) return json({ error: 'Position not found' }, 404);
    const [{ data: company }, { data: tasks }, { data: objs }] = await Promise.all([
      service.from('companies').select('name,industry,company_size').eq('id', companyId).maybeSingle(),
      service.from('process_tasks').select('name,hours_per_week,role_name').eq('company_id', companyId).ilike('role_name', pos.title).limit(40),
      service.from('strategic_objectives').select('title,target_kpi').eq('company_id', companyId).limit(20),
    ]);

    const prompt = `You are an organisational performance consultant. Propose 4 measurable KPIs for this role, in ${lang}.
Company: ${JSON.stringify(company)}
Role: ${JSON.stringify(pos)}
Tasks: ${JSON.stringify(tasks ?? [])}
Company objectives: ${JSON.stringify(objs ?? [])}
Rules: tie each KPI to a listed task or objective; no invented baseline numbers; give a formula and measurement frequency.
Return ONLY JSON: {"kpis":[{"name":"","formula":"","frequency":"","linked_to":"","why":""}]}`;
    const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST', headers: { Authorization: `Bearer ${ai}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'google/gemini-3-flash-preview', messages: [{ role: 'user', content: prompt }], temperature: 0.2 }),
    });
    if (r.status === 429) return json({ error: 'Rate limit, retry shortly' }, 429);
    if (r.status === 402) return json({ error: 'AI credits exhausted' }, 402);
    if (!r.ok) return json({ error: 'AI error' }, 502);
    const text: string = (await r.json()).choices?.[0]?.message?.content ?? '';
    const m = text.match(/\{[\s\S]*\}/);
    const parsed = m ? JSON.parse(m[0]) : { kpis: [] };
    return json({ kpis: (parsed.kpis ?? []).slice(0, 6) });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500);
  }
});
