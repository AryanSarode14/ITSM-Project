const nodemailer = require('nodemailer');

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset OTP</title>
    <style>
        
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>ITSM Portal</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>You have requested to reset your password. Please use the following OTP (One-Time Password) to complete the process:</p>
            <div class="otp">{{OTP}}</div>
            <p>This OTP is valid for the next 10 minutes. If you did not request a password reset, please ignore this email or contact support.</p>
            <p>Thank you,<br>ITSM Portal Team</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 ITSM Portal. All rights reserved.</p>
            <p><a href="https://itsm.com">Visit our website</a></p>
        </div>
    </div>
</body>
</html>
`;

// Replace {{OTP}} with the actual OTP value

const sendOTPEmail = async (email, otp) => {
    const htmlWithOTP = htmlContent.replace('{{OTP}}', otp);
    try {
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: `"ITSM Portal" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Password Reset OTP',
            html: htmlWithOTP
        });

        console.log('OTP email sent');
    } catch (error) {
        console.error('Error sending OTP email:', error.message);
        throw new Error('Could not send OTP email');
    }
};

module.exports = {
    sendOTPEmail
};