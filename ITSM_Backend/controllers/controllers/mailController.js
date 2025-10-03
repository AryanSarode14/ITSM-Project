const { generateOTP } = require("../helper/otp");
const pool = require('../db/db');
const { sendOTPEmail } = require("../mailer/nodemailer");
const { hashPassword } = require("../middleware/hashPassword");
const e = require("express");

const forgotPasswordController = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        // Check if user exists and get their user_id
        const userResult = await pool.query(
            'SELECT user_id FROM user_details WHERE email_id = $1',
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userId = userResult.rows[0].user_id;

        // Generate OTP
        const otp = generateOTP();

        // Check if OTP record exists for the user, update or insert accordingly
        const otpResult = await pool.query(
            'SELECT id FROM user_passwords WHERE user_id = $1',
            [userId]
        );

        console.log("Otp res ",otpResult.rows.length);

        console.log("Otp res ",otp);

        console.log("Otp res ",userId);
        if (otpResult.rows.length > 0) {
            // Update existing OTP
            await pool.query(
                'UPDATE user_passwords SET otp = $1 WHERE user_id = $2',
                [otp, userId]
            );
        } else {
            // Insert new OTP record
            await pool.query(
                'INSERT INTO user_passwords (user_id, otp) VALUES ($1, $2)',
                [userId, otp]
            );
        }

        // Send OTP email
        await sendOTPEmail(email, otp);

        res.status(200).json({ message: 'OTP sent to email' });
    } catch (error) {
        console.error('Error in forgotPasswordController:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



const verifyOTPController = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }

    try {
        // Fetch user_id using email
        const userResult = await pool.query('SELECT user_id FROM user_details WHERE email_id = $1', [email]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userId = userResult.rows[0].user_id;

        // Check if the OTP matches the one in the database
        const otpResult = await pool.query('SELECT otp FROM user_passwords WHERE user_id = $1', [userId]);

        if (otpResult.rows.length === 0) {
            return res.status(400).json({ error: 'OTP not found' });
        }

        const otpFromDb = otpResult.rows[0].otp.toString().trim();
        const otpToVerify = otp.toString().trim();

        console.log('Requested OTP:', otpToVerify);
        console.log('Stored OTP:', otpFromDb);

        if (otpFromDb !== otpToVerify) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        // Hash the new password
        const hashedPassword = await hashPassword(newPassword);

        // Update the user's password and clear the OTP
        await pool.query('UPDATE user_passwords SET hashed_password = $1, otp = NULL WHERE user_id = $2', [hashedPassword, userId]);

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error in verifyOTPController:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    forgotPasswordController,
    verifyOTPController
};