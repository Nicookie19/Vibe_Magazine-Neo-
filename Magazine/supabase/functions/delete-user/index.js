// supabase/functions/delete-user/index.js
// Supabase Edge Function for deleting users

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Hard-coded UUIDs of protected users
const ADMIN_UUID = "cf6f292d-9800-49d6-b7ff-bc733067ca99";
const SUPER_ADMIN_UUID = "5314c060-f221-4bf8-a63e-4b80cd8fa648";

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
    const { user_id } = requestData

    // Validate required fields
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: user_id is required.' }),
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

    // Verify the requesting user is authorized (must be superadmin)
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

    // Only superadmins can delete users
    if (callerProfile.role !== 'superadmin') {
      return new Response(
        JSON.stringify({ error: 'Only superadmins can delete users.' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get info about the user to be deleted
    const { data: userToDelete, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .select('role, id')
      .eq('id', user_id)
      .single()

    if (userError) {
      return new Response(
        JSON.stringify({ error: 'User not found.' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Prevent deletion of superadmins or protected accounts
    if (userToDelete.role === 'superadmin' || 
        user_id === ADMIN_UUID || 
        user_id === SUPER_ADMIN_UUID) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete superadmins or protected accounts.' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Delete from user_profiles first
    const { error: deleteProfileError } = await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('id', user_id)

    if (deleteProfileError) {
      return new Response(
        JSON.stringify({ error: `Failed to delete user profile: ${deleteProfileError.message}` }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Delete from auth
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(user_id)

    if (deleteAuthError) {
      // Log this issue as it requires manual cleanup
      console.error(`Failed to delete auth user ${user_id}: ${deleteAuthError.message}`)
      
      return new Response(
        JSON.stringify({ 
          warning: 'User profile deleted but auth record deletion failed. Manual cleanup may be required.',
          details: deleteAuthError.message 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Log the user deletion activity
    await supabaseAdmin
      .from('user_activity_logs')
      .insert({
        user_id: callingUser.id,
        action: 'delete_user',
        details: {
          deleted_user_id: user_id
        }
      })
      .catch(err => console.error('Failed to log user deletion activity:', err))

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'User deleted successfully'
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
