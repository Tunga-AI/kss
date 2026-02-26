#!/usr/bin/env node

/**
 * Test Email Sending
 * This script tests the email service by sending a test email
 */

async function testEmail() {
    console.log('🧪 Testing email service...\n');

    const testEmailData = {
        to: 'test@example.com', // Change this to your email to receive a test
        subject: 'KSS Test Email - System is Working!',
        html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Email System Test</h1>
            </div>
            <div style="padding: 30px; background: white; border: 1px solid #e0e0e0;">
              <p>This is a test email from the KSS email system.</p>
              <p>If you're reading this, it means the email configuration is working correctly!</p>
              <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            </div>
          </div>
        </body>
      </html>
    `,
        text: 'This is a test email from the KSS email system. If you\'re reading this, it means the email configuration is working correctly!'
    };

    try {
        const response = await fetch('http://localhost:9002/api/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testEmailData)
        });

        const result = await response.json();

        if (response.ok) {
            console.log('✅ Email sent successfully!');
            console.log('📧 Message ID:', result.messageId);
            console.log('\nEmail configuration is working correctly! 🎉');
        } else {
            console.error('❌ Failed to send email');
            console.error('Error:', result.error);
        }
    } catch (error: any) {
        console.error('❌ Error testing email:', error.message);
    }
}

testEmail();
