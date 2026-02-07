// scripts/simple-email-test.js
const nodemailer = require('nodemailer');

async function sendDirectEmail() {
    console.log('📧 Testing Direct Email Sending...\n');

    try {
        // Create transporter with YOUR Gmail credentials
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: 'jaykashyap283125@gmail.com',
                pass: 'xntb ghjl rxeb ehti' // Your app password
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        console.log('🔧 Testing SMTP connection...');
        await transporter.verify();
        console.log('✅ SMTP connection verified!');

        console.log('\n📤 Sending test email...');
        const info = await transporter.sendMail({
            from: '"ProcessMail System" <jaykashyap283125@gmail.com>',
            to: 'jagannathkashyap38@gmail.com',
            subject: 'Test Email from ProcessMail Backend',
            text: `Hello!
      
This is a test email sent directly from your ProcessMail backend server.

Sender: jaykashyap283125@gmail.com
Recipient: jagannathkashyap38@gmail.com
Time: ${new Date().toLocaleString()}

If you receive this, your email configuration is working! 🎉

Best regards,
ProcessMail Team`,

            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ProcessMail Test</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .success-badge { background: #10B981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-size: 14px; }
        .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3B82F6; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 ProcessMail Test</h1>
            <p>Email Sending System Verification</p>
        </div>
        
        <div class="content">
            <span class="success-badge">SUCCESS</span>
            <h2>Test Email Delivered!</h2>
            <p>This email confirms that your ProcessMail backend email system is working correctly.</p>
            
            <div class="details">
                <h3>📋 Email Details:</h3>
                <p><strong>From:</strong> jaykashyap283125@gmail.com</p>
                <p><strong>To:</strong> jagannathkashyap38@gmail.com</p>
                <p><strong>Subject:</strong> Test Email from ProcessMail Backend</p>
                <p><strong>Sent:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Method:</strong> Direct SMTP via nodemailer</p>
            </div>
            
            <p>If you're receiving this email, it means:</p>
            <ul>
                <li>✅ Gmail SMTP configuration is correct</li>
                <li>✅ App password is working</li>
                <li>✅ Network connectivity is established</li>
                <li>✅ Email delivery is functioning</li>
            </ul>
            
            <p>You can now proceed to test the full ProcessMail workflow!</p>
        </div>
        
        <div class="footer">
            <p>ProcessMail - AI Email Assistant System</p>
            <p>This is an automated test message</p>
        </div>
    </div>
</body>
</html>`
        });

        console.log('\n✅ Email sent successfully!');
        console.log('📨 Message ID:', info.messageId);
        console.log('📧 Response:', info.response);
        console.log('\n🎉 Email sending is working! Check the recipient\'s inbox.');

    } catch (error) {
        console.error('\n❌ Email sending failed:');
        console.error('   Error:', error.message);

        if (error.code === 'EAUTH') {
            console.error('\n🔑 Authentication failed. Possible issues:');
            console.error('   1. Wrong Gmail app password');
            console.error('   2. 2-Step Verification not enabled');
            console.error('   3. App password not generated');
            console.error('\n💡 How to fix:');
            console.error('   1. Go to: https://myaccount.google.com/security');
            console.error('   2. Enable 2-Step Verification');
            console.error('   3. Generate App Password for "Mail"');
            console.error('   4. Use the 16-character password (like "xntb ghjl rxeb ehti")');
        } else if (error.code === 'ECONNECTION') {
            console.error('\n🌐 Connection failed. Check:');
            console.error('   1. Internet connection');
            console.error('   2. Firewall settings');
            console.error('   3. Port 587 accessibility');
        }
    }
}

// Run the direct test
sendDirectEmail();