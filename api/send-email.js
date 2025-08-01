    // api/send-email.js
    const nodemailer = require('nodemailer');

    // IMPORTANT: These will be replaced by Vercel Environment Variables at deployment
    // Do NOT hardcode your actual email and password here.
    const EMAIL_USER = process.env.EMAIL_USER; // Your Hostinger email: register@kabgmitournaments.com
    const EMAIL_PASS = process.env.EMAIL_PASS; // Your Hostinger email password

    module.exports = async (req, res) => {
      // Ensure it's a POST request
      if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
      }

      // Parse the request body
      const { teamName, email, eventTitle, slotNumber } = req.body;

      // Basic validation
      if (!teamName || !email || !eventTitle || !slotNumber) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      try {
        // Create a Nodemailer transporter using your Hostinger SMTP details
        let transporter = nodemailer.createTransport({
          host: 'smtp.hostinger.com', // Hostinger SMTP host
          port: 465, // Standard port for SMTPS (SMTP over SSL)
          secure: true, // Use SSL/TLS
          auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS,
          },
          tls: {
            // Do not fail on invalid certs (use only if necessary, generally not recommended for production)
            // rejectUnauthorized: false
          }
        });

        // Email content
        const mailOptions = {
          from: `"KA-BGMI TOURNAMENTS" <${EMAIL_USER}>`, // Sender display name and email
          to: email, // Recipient email (from the registration form)
          subject: `Registration Confirmed: ${teamName} - ${eventTitle}`,
          html: `
            <p>Dear ${teamName} Team,</p>
            <p>Thank you for registering for the <strong>${eventTitle}</strong> tournament!</p>
            <p>Your registration has been successfully received.</p>
            <p><strong>Your Slot Number: ${slotNumber}</strong></p>
            <p>Please keep this email for your records. Room ID and password will be shared 1 hour before the match on WhatsApp.</p>
            <p>Good luck!</p>
            <p>Best regards,<br>KA-BGMI TOURNAMENTS</p>
            <hr>
            <small>This is an automated email, please do not reply.</small>
          `,
        };

        // Send email
        await transporter.sendMail(mailOptions);

        // Respond to the client
        res.status(200).json({ message: 'Confirmation email sent successfully!' });
      } catch (error) {
        console.error('Error sending email:', error);
        // Provide a generic error message to the client for security
        res.status(500).json({ error: 'Failed to send confirmation email. Please try again later.' });
      }
    };
    