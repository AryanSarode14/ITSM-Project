const nodemailer = require("nodemailer");

const htmlContentForRegisterMail = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Change Management Request</title>
    <style>
        .email-container {
            font-family: Arial, sans-serif;
        }
        .header h1 {
            color: #333;
        }
        .content {
            margin: 20px 0;
        }
        .footer {
            font-size: 12px;
            color: #888;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>ITSM Portal</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>Admin has created your login credientials of ITSM</p>
            <p>Email ID : <strong>{{email}}</strong></p>
            <p>Password: <strong>{{password}}</strong></p>
        
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

const htmlContentforAssignedUser = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Change Management Request</title>
    <style>
        .email-container {
            font-family: Arial, sans-serif;
        }
        .header h1 {
            color: #333;
        }
        .content {
            margin: 20px 0;
        }
        .footer {
            font-size: 12px;
            color: #888;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>ITSM Portal</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>Admin has assigned you (<strong>{{USERNAME}}</strong>) for given change management request.</p>
            <p>Description: {{DESCRIPTION}}</p>
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

const htmlContentForRemovedAssignedUser = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Change Management Request</title>
    <style>
        .email-container {
            font-family: Arial, sans-serif;
        }
        .header h1 {
            color: #333;
        }
        .content {
            margin: 20px 0;
        }
        .footer {
            font-size: 12px;
            color: #888;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>ITSM Portal</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>Admin has been removed you (<strong>{{USERNAME}}</strong>) as assigned user from the change management request.</p>
            <p>Description: {{DESCRIPTION}}</p>
            <p>If you have any questions, please reach out to your administrator.</p>
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

const htmlContentForApprover = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Change Management Request</title>
    <style>
        .email-container {
            font-family: Arial, sans-serif;
        }
        .header h1 {
            color: #333;
        }
        .content {
            margin: 20px 0;
        }
        .footer {
            font-size: 12px;
            color: #888;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>ITSM Portal</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>User <strong>{{USERNAME}}</strong> has created a new change management request and need your approval for the given request.</p>
            <p>Description: {{DESCRIPTION}}</p>
            <p>Waiting For Approval</p>
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

const htmlContentForRemovalApprovers = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Change Management Request</title>
    <style>
        .email-container {
            font-family: Arial, sans-serif;
        }
        .header h1 {
            color: #333;
        }
        .content {
            margin: 20px 0;
        }
        .footer {
            font-size: 12px;
            color: #888;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>ITSM Portal</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>User <strong>{{USERNAME}}</strong> has removed you from change management request.</p>
            <p>Description: {{DESCRIPTION}}</p>
            <p>No Need For Approval</p>
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

const htmlContentForApprovalConfirmation = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Change Management Request Approved</title>
    <style>
        .email-container {
            font-family: Arial, sans-serif;
        }
        .header h1 {
            color: #333;
        }
        .content {
            margin: 20px 0;
        }
        .footer {
            font-size: 12px;
            color: #888;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>ITSM Portal</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>We are pleased to inform you that the change management request has been approved by all required approvers.</p>
            <p>Description: {{DESCRIPTION}}</p>
            <p>Thank you for your prompt responses and cooperation.</p>
            <p>Best regards,<br>ITSM Portal Team</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 ITSM Portal. All rights reserved.</p>
            <p><a href="https://itsm.com">Visit our website</a></p>
        </div>
    </div>
</body>
</html>
`;

const htmlContentForRejection = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Change Management Request Rejected</title>
    <style>
        .email-container {
            font-family: Arial, sans-serif;
        }
        .header h1 {
            color: #333;
        }
        .content {
            margin: 20px 0;
        }
        .footer {
            font-size: 12px;
            color: #888;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>ITSM Portal</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>We regret to inform you that the change management request has been rejected by one or more approvers.</p>
            <p>Description: {{DESCRIPTION}}</p>
            <p>Please review the request details and make any necessary adjustments before resubmitting.</p>
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

const sendMailToApprover = async (email, username, description) => {
  const htmlWithDetails = htmlContentForApprover
    .replace("{{USERNAME}}", username)
    .replace("{{DESCRIPTION}}", description);

  try {
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"ITSM Portal" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Change Management Request",
      html: htmlWithDetails,
    });

    console.log("Change management email sent");
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw new Error("Could not send email");
  }
};

const sendMailForAssignedUser = async (email, username, description) => {
  const htmlWithDetails = htmlContentforAssignedUser
    .replace("{{USERNAME}}", username)
    .replace("{{DESCRIPTION}}", description);

  try {
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"ITSM Portal" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "User Assigned to Change Management Request",
      html: htmlWithDetails,
    });

    console.log("Change management email sent");
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw new Error("Could not send email");
  }
};

const sendMailForRemovedUser = async (email, username, description) => {
  const htmlWithDetails = htmlContentForRemovedAssignedUser
    .replace("{{USERNAME}}", username)
    .replace("{{DESCRIPTION}}", description);

  try {
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"ITSM Portal" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "User Removed from Change Management Request",
      html: htmlWithDetails,
    });

    console.log("Removed user email sent");
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw new Error("Could not send email");
  }
};

const sendMailForRegister = async (email, password) => {
  const htmlWithDetails = htmlContentForRegisterMail
    .replace("{{email}}", email)
    .replace("{{password}}", password);

  try {
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"ITSM Portal" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Login Credentials",
      html: htmlWithDetails,
    });

    console.log("Change management email sent");
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw new Error("Could not send email");
  }
};

const sendMailForRemovalApprovers = async (email, username, description) => {
  const htmlWithDetails = htmlContentForRemovalApprovers
    .replace("{{USERNAME}}", username)
    .replace("{{DESCRIPTION}}", description);

  try {
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"ITSM Portal" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "User Removed from Change Management Request",
      html: htmlWithDetails,
    });

    console.log("Change management email sent");
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw new Error("Could not send email");
  }
};

const sendmailForApprovalConfirmation = async (email, description) => {
  const htmlWithDetails = htmlContentForApprovalConfirmation.replace(
    "{{DESCRIPTION}}",
    description
  );

  try {
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"ITSM Portal" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Change Management Request Approved",
      html: htmlWithDetails,
    });

    console.log("Change management email sent");
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw new Error("Could not send email");
  }
};

const sendmailForRejection = async (email, description) => {
  const htmlWithDetails = htmlContentForRejection.replace(
    "{{DESCRIPTION}}",
    description
  );

  try {
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"ITSM Portal" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Change Management Request Rejected",
      html: htmlWithDetails,
    });

    console.log("Rejection email sent");
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw new Error("Could not send email");
  }
};

module.exports = {
  sendMailToApprover,
  sendMailForAssignedUser,
  sendMailForRegister,
  sendMailForRemovalApprovers,
  sendMailForRemovedUser,
  sendmailForApprovalConfirmation,
  sendmailForRejection,
};
