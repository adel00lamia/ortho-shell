import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const clip = (value: unknown, max = 800) => String(value ?? '').slice(0, max);

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Authentication required' }, 401);
    const url = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const aiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!url || !anonKey || !serviceKey || !aiKey) return json({ error: 'Service not configured' }, 500);

    const authClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) return json({ error: 'Invalid session' }, 401);
    const service = createClient(url, serviceKey);
    const [{ data: companyId }, { data: allowed }] = await Promise.all([
      service.rpc('get_user_company_id', { _user_id: user.id }),
      service.rpc('is_admin_or_hr', { _user_id: user.id }),
    ]);
    if (!companyId || !allowed) return json({ error: 'Access denied' }, 403);

    const body = await req.json();
    const question = clip(body?.question, 1200).trim();
    const language = body?.language === 'en' ? 'en' : 'fr';
    if (!question) return json({ error: 'Question required' }, 400);

    const queries = await Promise.all([
      service.from('strategic_objectives').select('id,title,category,priority,target_kpi').eq('company_id', companyId).limit(100),
      service.from('business_capabilities').select('id,name,domain,current_maturity,target_maturity').eq('company_id', companyId).limit(150),
      service.from('objective_capabilities').select('objective_id,capability_id,criticality').eq('company_id', companyId).limit(300),
      service.from('business_processes').select('id,capability_id,name,owner_role').eq('company_id', companyId).limit(250),
      service.from('process_tasks').select('id,process_id,name,role_name,hours_per_week,criteria,operating_mode').eq('company_id', companyId).limit(500),
      service.from('positions').select('id,title,is_critical,skills_required').eq('company_id', companyId).limit(250),
      service.from('skills').select('id,name_fr,name_en,description').eq('company_id', companyId).limit(250),
      service.from('root_cause_diagnostics').select('id,title,training_fit_score,ai_verdict,status,cause_breakdown').eq('company_id', companyId).limit(50),
      service.from('hr_knowledge_articles').select('id,title,summary,category,tags,content').eq('company_id', companyId).limit(30),
    ]);
    const failed = queries.find((result) => result.error);
    if (failed?.error) return json({ error: 'Unable to read authorized company context' }, 500);

    const context = {
      objectives: queries[0].data,
      capabilities: queries[1].data,
      links: queries[2].data,
      processes: queries[3].data,
      tasks: queries[4].data,
      positions: queries[5].data,
      skills: queries[6].data,
      diagnostics: queries[7].data,
      knowledge: (queries[8].data ?? []).map((article) => ({ ...article, content: clip(article.content, 1200) })),
    };
    const prompt = `You are Qimatak's read-only Business Transformation analyst. Answer ${language === 'fr' ? 'entirely in French' : 'entirely in English'} using ONLY the authorized company context below.
Rules:
- Never claim to create, edit, delete or execute anything.
- Distinguish facts from hypotheses. If data is missing, say so.
- Never invent benchmarks, costs, savings, skills, links, people or impacts.
- Existing numeric scores are facts from deterministic engines; explain but do not recalculate them.
- Cite sources inline using [Objective: name], [Capability: name], [Process: name], [Task: name], [Role: title], [Diagnostic: title], or [Knowledge: title].
- End with "Confiance: élevée/moyenne/faible" (or English equivalent) and a short reason.
- Be concise and decision-oriented.

AUTHORIZED COMPANY CONTEXT:
${JSON.stringify(context)}

QUESTION: ${question}`;
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST', headers: { Authorization: `Bearer ${aiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'google/gemini-3-flash-preview', messages: [{ role: 'user', content: prompt }], temperature: 0.15 }),
    });
    if (!response.ok) return json({ error: response.status === 429 ? 'Rate limited' : 'AI service unavailable' }, response.status === 429 ? 429 : 502);
    const result = await response.json();
    const answer = result.choices?.[0]?.message?.content;
    if (!answer) return json({ error: 'Empty analysis' }, 502);
    const sourceMap = [
      ...((queries[0].data ?? []).map((item) => ({ label: item.title, type: 'objective' }))),
      ...((queries[1].data ?? []).map((item) => ({ label: item.name, type: 'capability' }))),
      ...((queries[3].data ?? []).map((item) => ({ label: item.name, type: 'process' }))),
      ...((queries[4].data ?? []).map((item) => ({ label: item.name, type: 'task' }))),
      ...((queries[8].data ?? []).map((item) => ({ label: item.title, type: 'knowledge' }))),
    ];
    const sources = sourceMap.filter((source) => answer.includes(source.label)).slice(0, 8);
    const confidence = /faible|low/i.test(answer) ? 'low' : /élevée|high/i.test(answer) ? 'high' : 'medium';
    return json({ answer, sources, confidence });
  } catch (error) {
    console.error('transformation-analyst error', error);
    return json({ error: 'Analysis failed' }, 500);
  }
});