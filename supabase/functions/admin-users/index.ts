import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://esm.sh/zod@3.23.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const createUserSchema = z.object({
  action: z.literal('create'),
  email: z.string().email().max(255),
  password: z.string().min(8).max(100),
  firstName: z.string().min(1).max(100).regex(/^[a-zA-ZÀ-ÿ\s.\-']+$/),
  lastName: z.string().min(1).max(100).regex(/^[a-zA-ZÀ-ÿ\s.\-']+$/),
  middleName: z.string().max(100).regex(/^[a-zA-ZÀ-ÿ\s.\-']*$/).optional().nullable(),
  age: z.union([z.string().regex(/^\d+$/).transform(Number), z.number()]).pipe(z.number().int().min(0).max(150)).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  contact: z.string().max(50).regex(/^[0-9+\s()\-]*$/).optional().nullable(),
})

const deleteUserSchema = z.object({
  action: z.literal('delete'),
  userId: z.string().uuid(),
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey = Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!

  // Verify caller is admin
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey)
  const { data: roleData } = await adminClient.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').single()
  if (!roleData) {
    return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const { action } = body as { action?: string }

  if (req.method === 'POST' && action === 'create') {
    const parsed = createUserSchema.safeParse(body)
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: parsed.error.issues.map(i => i.message) }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { email, password, firstName, lastName, middleName, age, address, contact } = parsed.data

    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        middle_name: middleName || null,
        age: age ?? null,
        address: address || null,
        contact: contact || null,
      },
    })

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Set profile status to Active since admin created this user
    await adminClient.from('profiles').update({ status: 'Active' }).eq('user_id', data.user.id)

    return new Response(JSON.stringify({ success: true, userId: data.user.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (req.method === 'POST' && action === 'delete') {
    const parsed = deleteUserSchema.safeParse(body)
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: parsed.error.issues.map(i => i.message) }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { userId } = parsed.data

    // Delete profile first
    await adminClient.from('profiles').delete().eq('user_id', userId)
    await adminClient.from('user_roles').delete().eq('user_id', userId)

    const { error } = await adminClient.auth.admin.deleteUser(userId)
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
