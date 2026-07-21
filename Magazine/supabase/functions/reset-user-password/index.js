// supabase/functions/reset-user-password/index.js

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the service role key
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

    // Verify that the request comes from an authenticated user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Get the JWT from the Authorization header
    const jwt = authHeader.replace('Bearer ', '')
    
    // Verify the JWT using the anon key client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt)
    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    // Check if the user has admin privileges
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      throw new Error('Could not verify user permissions')
    }

    if (userProfile.role !== 'superadmin' && userProfile.role !== 'admin') {
      throw new Error('Insufficient permissions - admin or superadmin role required')
    }

    // Parse the request body
    const { user_id, new_password } = await req.json()

    if (!user_id || !new_password) {
      throw new Error('Missing required parameters: user_id and new_password')
    }

    // Validate password length
    if (new_password.length < 6) {
      throw new Error('Password must be at least 6 characters long')
    }

    console.log(`Admin user ${user.id} (${user.email}) is resetting password for user ${user_id}`)

    // Reset the user's password using the admin API
    const { data: updatedUser, error: resetError } = await supabaseAdmin.auth.admin.updateUserById(
      user_id,
      { 
        password: new_password,
        email_confirm: true // Auto-confirm email to avoid confirmation step
      }
    )

    if (resetError) {
      console.error('Password reset error:', resetError)
      throw new Error(`Failed to reset password: ${resetError.message}`)
    }

    console.log(`Password reset successful for user ${user_id}`)

    // Also try to update the user's email_confirmed_at if not set
    try {
      await supabaseAdmin.auth.admin.updateUserById(
        user_id,
        { email_confirm: true }
      )
    } catch (confirmError) {
      console.warn('Could not auto-confirm email, but password was reset:', confirmError)
    }

    // Log the password reset action in user_profiles table
    try {
      await supabaseAdmin
        .from('user_profiles')
        .update({
          password_reset_at: new Date().toISOString(),
          password_reset_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', user_id)
    } catch (logError) {
      console.warn('Could not log password reset action:', logError)
      // Don't fail the main operation if logging fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Password reset successfully',
        user: {
          id: updatedUser.user?.id,
          email: updatedUser.user?.email
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Reset password function error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unexpected error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
