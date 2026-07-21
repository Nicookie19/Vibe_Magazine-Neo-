// supabase/functions/send-notification/index.js

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get request body
    const { to, subject, body, submission_id, status } = await req.json();

    // Validate required fields
    if (!to || !subject || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`📧 Sending ${status} notification to ${to} for submission ${submission_id}`);

    // For now, we'll simulate sending the email and log it
    // In a production environment, you would integrate with a real email service like:
    // - Resend
    // - SendGrid
    // - AWS SES
    // - Mailgun
    // - etc.

    const emailData = {
      to,
      subject,
      body,
      submission_id,
      status,
      sent_at: new Date().toISOString(),
      service: 'simulated'
    };

    console.log('📧 Email notification details:', emailData);

    // You can also log this to a notifications table in your database
    try {
      const { error: logError } = await supabaseClient
        .from('email_notifications')
        .insert({
          recipient: to,
          subject,
          body,
          submission_id,
          status: status.toLowerCase(),
          sent_at: new Date().toISOString(),
          delivery_status: 'simulated'
        });

      if (logError) {
        console.warn('Failed to log notification:', logError);
      }
    } catch (logErr) {
      console.warn('Error logging notification:', logErr);
    }

    // Simulate successful email sending
    // Replace this with actual email service integration
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notification sent to ${to}`,
        delivery_status: 'simulated',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('📧 Error sending notification:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send notification',
        details: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

/* 
To deploy this Edge Function:

1. Make sure you have Supabase CLI installed
2. Run: supabase functions deploy send-notification

To integrate with a real email service, replace the simulation section with:

Example for Resend:
```javascript
const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const emailResult = await resend.emails.send({
  from: 'noreply@vibemagazine.com',
  to: [to],
  subject,
  html: body.replace(/\n/g, '<br>'),
});
```

Example for SendGrid:
```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(Deno.env.get('SENDGRID_API_KEY'));

const msg = {
  to,
  from: 'noreply@vibemagazine.com',
  subject,
  html: body.replace(/\n/g, '<br>'),
};

await sgMail.send(msg);
```
*/
