// supabase/functions/create-admin-user/index.js
// Supabase Edge Function for creating admin users

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Handle CORS preflight requests
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export const handle = async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Check request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use POST.' }),
        { 
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get request body
    const requestData = await req.json()
    const { email, password, username, display_name, role } = requestData

    // Validate required fields
    if (!email || !password || !username || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, password, username, and role are required.' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate role is one of the allowed values
    const allowedRoles = ['admin', 'faculty', 'superadmin']
    if (!allowedRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: `Invalid role. Must be one of: ${allowedRoles.join(', ')}` }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header.' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create Supabase client with user token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        },
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      }
    )

    // Verify the requesting user is authorized (must be admin or superadmin)
    const {
      data: { user: callingUser },
      error: getUserError
    } = await supabaseClient.auth.getUser()

    if (getUserError || !callingUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized. Invalid session.' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get the role of the calling user
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', callingUser.id)
      .single()

    if (profileError || !callerProfile) {
      return new Response(
        JSON.stringify({ error: 'Could not verify admin permissions.' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Only superadmins can create superadmins
    if (role === 'superadmin' && callerProfile.role !== 'superadmin') {
      return new Response(
        JSON.stringify({ error: 'Only superadmins can create other superadmins.' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Only admins or superadmins can create users
    if (callerProfile.role !== 'admin' && callerProfile.role !== 'superadmin') {
      return new Response(
        JSON.stringify({ error: 'Only admins and superadmins can create users.' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create the user with Supabase Auth
    const { data: authData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        username,
        display_name: display_name || username,
        role
      }
    })

    if (createUserError) {
      return new Response(
        JSON.stringify({ error: `Failed to create user: ${createUserError.message}` }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const newUserId = authData.user.id

    // Create user profile entry
    const { error: insertError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: newUserId,
        username,
        email,
        display_name: display_name || username,
        role,
        is_active: true,
        created_by: callingUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (insertError) {
      // Try to clean up the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(newUserId)
      
      return new Response(
        JSON.stringify({ error: `Failed to create user profile: ${insertError.message}` }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Log the user creation activity
    await supabaseAdmin
      .from('user_activity_logs')
      .insert({
        user_id: callingUser.id,
        action: 'create_user',
        details: {
          created_user_id: newUserId,
          created_user_email: email,
          created_user_role: role
        }
      })
      .catch(err => console.error('Failed to log user creation activity:', err))

    return new Response(
      JSON.stringify({ 
        message: 'User created successfully',
        user: {
          id: newUserId,
          email,
          username,
          role
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Server error: ${error.message}` }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

Deno.serve(handle)
