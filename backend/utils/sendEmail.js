const nodemailer = require('nodemailer');

module.exports = async (email, subject, text, html) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD 
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        console.log('Email transporter configured');

        const mailOptions = {
            from: `"ESG Platform" <${process.env.SMTP_FROM}>`,
            to: email,
            subject: subject,
            text: text,
            html: html || text
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', {
            messageId: info.messageId,
            to: email,
            subject: subject
        });
        
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Email sending error:', {
            message: error.message,
            code: error.code,
            command: error.command
        });
        
        return { 
            success: false, 
            error: error.message,
            details: {
                code: error.code,
                command: error.command
            }
        };
    }
}
