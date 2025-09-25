// functions/create_admin/index.ts
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function buildCorsHeaders(origin: string | null) {
  const allowOrigin = origin ?? '*'
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400'
  }
}

serve(async (req) => {
  // Respond to CORS preflight
  const origin = req.headers.get('Origin')
  const corsHeaders = buildCorsHeaders(origin)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    // Prefer non-SUPABASE_ custom secret names (dashboard disallows SUPABASE_ prefix for user secrets)
    const supabaseUrl = Deno.env.get('PROJECT_URL') || Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const anonKey = Deno.env.get('ANON_KEY') || Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !serviceKey || !anonKey) {
      const missing = [
        !supabaseUrl ? 'PROJECT_URL (or SUPABASE_URL)' : null,
        !serviceKey ? 'SERVICE_ROLE_KEY (or SUPABASE_SERVICE_ROLE_KEY)' : null,
        !anonKey ? 'ANON_KEY (or SUPABASE_ANON_KEY)' : null,
      ].filter(Boolean)
      return new Response(
        JSON.stringify({ code: 'CONFIG_ERROR', message: `Missing function secrets: ${missing.join(', ')}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Authenticated caller client (uses caller JWT to check role)
    const caller = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } }
    })

    const { data: { user }, error: userErr } = await caller.auth.getUser()
    if (userErr || !user) {
      return new Response(
        JSON.stringify({ code: 'UNAUTHORIZED', message: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: profile, error: profileErr } = await caller
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single()
    if (profileErr || !profile || profile.role !== 'super_admin') {
      return new Response(
        JSON.stringify({ code: 'FORBIDDEN', message: 'Only super_admin can perform this action' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let payload: { name?: string; email?: string; password?: string }
    try {
      payload = await req.json()
    } catch (_) {
      return new Response(
        JSON.stringify({ code: 'BAD_REQUEST', message: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { name, email, password } = payload
    if (!email || !name || !password || password.trim().length === 0) {
      return new Response(
        JSON.stringify({ code: 'BAD_REQUEST', message: 'Missing name/email/password' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Service role client for admin operations
    const svc = createClient(supabaseUrl, serviceKey)

    // Direct create with provided password
    let newUserId: string | null = null
    {
      const { data: created, error: createErr } = await svc.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role: 'admin' }
      })
      if (createErr) {
        const msg = (createErr as any)?.message?.toString?.() ?? String(createErr)
        const duplicate = /already\s+registered|already\s+exists|duplicate|User already registered/i.test(msg)
        if (duplicate) {
          return new Response(
            JSON.stringify({ code: 'EMAIL_EXISTS', message: 'Email already registered' }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        return new Response(
          JSON.stringify({ code: 'CREATE_USER_ERROR', message: msg }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      newUserId = created.user!.id
    }

    // Upsert into public.users with role=admin
    if (newUserId) {
      // Upsert minimal fields to avoid enum/type issues (e.g., user_role)
      const upsertPayload: Record<string, unknown> = { user_id: newUserId, email, name }
      const { error: upsertErr } = await svc
        .from('users')
        .upsert(upsertPayload, { onConflict: 'user_id' })
      if (upsertErr) {
        const msg = (upsertErr as any)?.message?.toString?.() ?? String(upsertErr)
        const typeMissing = /type\s+\"?user_role\"?\s+does\s+not\s+exist|42704|25P02/i.test(msg)
        if (!typeMissing) throw upsertErr
        // If enum/table mismatch, skip role write and still return success
      }
    }

    // Best-effort: set role='admin' in public.users if the column exists and accepts it
    if (newUserId) {
      const { error: roleUpdateErr } = await svc
        .from('users')
        .update({ role: 'admin' as unknown as undefined }) // cast to avoid TS inference complaints
        .eq('user_id', newUserId)
      if (roleUpdateErr) {
        // Ignore if column/type not present; the auth metadata already carries role=admin
        const msg = (roleUpdateErr as any)?.message?.toString?.() ?? String(roleUpdateErr)
        const roleColMissingOrType = /column\s+\"?role\"?\s+does\s+not\s+exist|type\s+\"?user_role\"?\s+does\s+not\s+exist|42703|42704|25P02/i.test(msg)
        if (!roleColMissingOrType) {
          return new Response(
            JSON.stringify({ code: 'ROLE_UPDATE_ERROR', message: msg }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, user_id: newUserId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (e) {
    const err: any = e
    const message = err?.message ?? String(e)
    const code = err?.code ?? err?.name ?? 'UNKNOWN_ERROR'
    const details = err?.details ?? undefined
    const hint = err?.hint ?? undefined
    return new Response(
      JSON.stringify({ code, message, details, hint }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})