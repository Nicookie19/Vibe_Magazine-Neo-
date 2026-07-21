// src/utils/edgeFunctionTest.js

/**
 * Tests if the Edge Functions are properly deployed and configured
 * This function will try to ping the Edge Functions and verify their response
 */
export async function testEdgeFunctions() {
  try {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    
    if (!session) {
      return {
        success: false,
        message: "No active session found. Please log in first to test Edge Functions."
      };
    }
    
    // Test array for Edge Functions
    const functionsToTest = [
      'create-admin-user',
      'delete-user'
    ];
    
    const results = {};
    
    // Test each function with an OPTIONS request (CORS preflight)
    for (const funcName of functionsToTest) {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${funcName}`;
        console.log(`Testing Edge Function: ${funcName} at ${url}`);
        
        // First test an OPTIONS request for CORS
        const optionsResponse = await fetch(url, {
          method: 'OPTIONS',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        results[funcName] = {
          cors: optionsResponse.status === 200,
          status: optionsResponse.status,
          url
        };
        
      } catch (error) {
        console.error(`Error testing ${funcName}:`, error);
        results[funcName] = {
          error: error.message,
          cors: false,
          url: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${funcName}`
        };
      }
    }
    
    return {
      success: Object.values(results).every(r => r.cors),
      details: results,
      message: "Edge Function test completed. Check the console for details."
    };
    
  } catch (error) {
    console.error("Error testing Edge Functions:", error);
    return {
      success: false,
      message: `Error testing Edge Functions: ${error.message}`
    };
  }
}

/**
 * Tests if environment variables are properly set
 */
export function testEnvironmentVariables() {
  const requiredVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  const results = {};
  
  for (const varName of requiredVars) {
    const value = import.meta.env[varName];
    results[varName] = {
      exists: !!value,
      // Only show first few characters for security
      preview: value ? `${value.substring(0, 8)}...` : 'Not set'
    };
  }
  
  return {
    success: Object.values(results).every(r => r.exists),
    details: results,
    message: Object.values(results).every(r => r.exists) 
      ? "All required environment variables are set."
      : "Some environment variables are missing. Check console for details."
  };
}

/**
 * Creates a diagnostic report for troubleshooting
 */
export async function createDiagnosticReport() {
  // Test environment variables
  const envCheck = testEnvironmentVariables();
  
  // Test edge functions
  const funcCheck = await testEdgeFunctions();
  
  // Test authentication
  let authCheck = { success: false, message: "Not logged in" };
  try {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (session) {
      const { user } = session;
      authCheck = {
        success: true,
        message: "Authentication successful",
        user: {
          id: user.id,
          email: user.email,
          lastSignIn: user.last_sign_in_at
        }
      };
    }
  } catch (error) {
    authCheck = {
      success: false,
      message: `Authentication check failed: ${error.message}`
    };
  }
  
  // Compile report
  const report = {
    timestamp: new Date().toISOString(),
    environment: {
      ...envCheck,
      mode: import.meta.env.MODE,
      browser: navigator.userAgent
    },
    edgeFunctions: funcCheck,
    authentication: authCheck
  };
  
  console.log("Diagnostic Report:", report);
  
  return report;
}
