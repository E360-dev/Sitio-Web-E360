// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://crxtzmykprgbgkdbqccd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyeHR6bXlrcHJnYmdrZGJxY2NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2ODI1ODQsImV4cCI6MjA2ODI1ODU4NH0.qfVccp-NdiDSLSWW_yCl1KL9M7Ttel_rzfG27ztuZNA'

export const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Registers a new user and assigns them the default role if they don't have one.
 *
 * @param {string} email - The user's email address.
 * @param {string} password - The user's desired password.
 */
export async function registerUser(email, password) {
  // 1. Register the new user in Supabase Auth
  const { data: { user }, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    console.error('Error during user registration:', signUpError.message);
    return;
  }

  if (!user) {
    console.error('Registration did not return a user object.');
    return;
  }

  console.log(`User ${user.email} registered successfully. Checking for existing role...`);

  // 2. Check if the user_id already exists in the roles_usuario table
  const { data: existingRole, error: selectError } = await supabase
    .from('roles_usuario')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle(); // Use maybeSingle() to avoid an error if no row is found

  if (selectError) {
    console.error('Error checking for existing user role:', selectError.message);
    return;
  }

  if (existingRole) {
    console.log(`User ${user.id} already has a role assigned. Skipping insertion.`);
    return;
  }

  // 3. If it doesn't exist, insert the user_id into the roles_usuario table
  console.log(`No role found for user ${user.id}. Assigning default role...`);
  const { error: insertError } = await supabase
    .from('roles_usuario')
    .insert([{ user_id: user.id }]);

  if (insertError) {
    console.error('Error inserting user role:', insertError.message);
    // Optional: Handle the case where the user was created but role assignment failed.
    return;
  }

  console.log(`Role assigned successfully for user_id: ${user.id}`);
}
