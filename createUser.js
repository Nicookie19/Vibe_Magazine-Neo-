import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env file
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in your .env file.');
  process.exit(1);
}

// Create a special Supabase client with admin privileges

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const createAdminUser = async () => {
  const role = process.env.NEW_USER_ROLE || 'admin';
  const email = process.env.NEW_USER_EMAIL;
  const password = process.env.NEW_USER_PASSWORD;
  const username = process.env.NEW_USER_USERNAME;
  const displayName = process.env.NEW_USER_DISPLAY_NAME || username;
  if (!email || !password || !username || !['admin', 'superadmin'].includes(role) || password.length < 8) {
    throw new Error('Set NEW_USER_EMAIL, NEW_USER_USERNAME, and NEW_USER_PASSWORD (at least 8 characters). NEW_USER_ROLE must be admin or superadmin.');
  }

  console.log(`Attempting to create user: ${email}`);

  try { 
    // 1. Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Automatically confirm the user's email
    });

    if (authError) {
      throw new Error(`Auth Error: ${authError.message}`);
    }

    const user = authData.user;
    console.log(`Successfully created user in Auth with ID: ${user.id}`);

    // 2. Create the user's profile in the user_profiles table
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: user.id, // This ID comes from the auth user created above
        username: username,
        email: email,
        display_name: displayName,
        role: role,
        is_active: true,
      });

    if (profileError) {
      // If the profile creation fails, we should delete the auth user to keep things clean
      console.error(`Profile Error: ${profileError.message}`);
      console.log(`Rolling back Auth user creation for ${user.id}...`);
      await supabaseAdmin.auth.admin.deleteUser(user.id);
      throw new Error(`Profile Error: ${profileError.message}`);
    }

    console.log('✅ Successfully created user and profile!');
    console.log(`- Username: ${username}`);
    console.log(`- Role: ${role}`);

  } catch (error) {
    console.error('❌ Failed to create user:', error.message);
    process.exit(1);
  }
};

createAdminUser().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
