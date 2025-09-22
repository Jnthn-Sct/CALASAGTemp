// functions/create_admin/index.ts
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('https://agynaxadrlfvfsguouyh.supabase.co')!
    const serviceKey = Deno.env.get('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFneW5heGFkcmxmdmZzZ3VvdXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4Nzk3MDQsImV4cCI6MjA3MDQ1NTcwNH0.9_JiwiJ1dVQdupsH8KRxrERgv0W_HIOawB9ZkD6Sn5M')!

    // Authenticated caller client (uses caller JWT to check role)
    const caller = createClient(supabaseUrl, anonKey || '', {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } }
    })

    const { data: { user } } = await caller.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    const { data: profile, error: profileErr } = await caller
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single()
    if (profileErr || !profile || profile.role !== 'super_admin') {
      return new Response('Forbidden', { status: 403 })
    }

    const { name, email, password } = await req.json()
    if (!email || !password || !name) {
      return new Response('Missing name/email/password', { status: 400 })
    }

    // Service role client for admin operations
    const svc = createClient(supabaseUrl, serviceKey)

    // Create auth user (confirmed)
    const { data: created, error: createErr } = await svc.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    })
    if (createErr) throw createErr

    const newUserId = created.user!.id

    // Upsert into public.users with role=admin
    const { error: upsertErr } = await svc
      .from('users')
      .upsert(
        { user_id: newUserId, email, name, role: 'admin', status: 'inactive' },
        { onConflict: 'user_id' }
      )
    if (upsertErr) throw upsertErr

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (e) {
    return new Response(`Error: ${e.message}`, { status: 400 })
  }
})