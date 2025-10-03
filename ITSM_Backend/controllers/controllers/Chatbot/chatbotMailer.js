


const axios=require("axios")

// async function mail(req,toMailes,ccMailes){
//     let res=[];
   
//     // Authentication information
//     const app_id = '1d83ca1e-9aa2-4072-a93c-91366891f305';
//     const client_secret = 'vOT8Q~1Az1PHHx3ifE7o6_PnNij-ql5O6KAxwanI';
//     const tenant_id = '323bd849-9700-48fc-a12e-fd204620ebe2';
//     const token_url = `https://login.microsoftonline.com/${tenant_id}/oauth2/token`;

//     // Get access token
//     const token_data = {
//         grant_type: 'client_credentials',
//         client_id: app_id,
//         client_secret: client_secret,
//         resource: 'https://graph.microsoft.com'
//     };


//     try {
//         // Get access token
//         const token_response = await axios.post(token_url, new URLSearchParams({
//             grant_type: 'client_credentials',
//             client_id: app_id,
//             client_secret: client_secret,
//             resource: 'https://graph.microsoft.com'
//         }));
//         const token = token_response.data.access_token;

//         // Email information
//         const email_url = 'https://graph.microsoft.com/v1.0/users/{user_id}/sendMail';
//         const headers = {
//             Authorization: `Bearer ${token}`,
//             'Content-Type': 'application/json'
//         };

//         const email_data = {
//             'message': {
//                 'subject': `${req.subject}`,
//                 'body': {
//                     'contentType': 'html',
//                     'content': `${req.html}`
//                 },
//                 'toRecipients': toMailes.map(email => ({
//                     'emailAddress': {
//                         'address': email
//                     }
//                 })),
//                 'ccRecipients': ccMailes.map(email => ({
//                     'emailAddress': {
//                         'address': email
//                     }
//                 }))
//             },
//             'saveToSentItems': true
//         };

//         // Send email
//         const user_obj_id = '7b19bd3a-112f-4b23-a941-0b565d01cbae';
//         const email_response = await axios.post(email_url.replace('{user_id}', user_obj_id), email_data, { headers });

//         if (email_response.status === 202) {
//             res.push({ status: email_response.status, message: "Email sent successfully." });
//             console.log(res, 'Email sent successfully.');
//         } else {
//             console.log('Failed to send email.');
//             console.log(email_response.data);
//         }
//     } catch (error) {
//         console.error('Failed to send email:', error);
//     }

//     return res;
// };

const userMail={

    async mail(req, toMailes, ccMailes) {
        let res = [];

        // Authentication information
        const app_id = '1d83ca1e-9aa2-4072-a93c-91366891f305';
        const client_secret = 'vOT8Q~1Az1PHHx3ifE7o6_PnNij-ql5O6KAxwanI';
        const tenant_id = '323bd849-9700-48fc-a12e-fd204620ebe2';
        const token_url = `https://login.microsoftonline.com/${tenant_id}/oauth2/token`;

        // Get access token
        const token_data = {
            grant_type: 'client_credentials',
            client_id: app_id,
            client_secret: client_secret,
            resource: 'https://graph.microsoft.com'
        };

        try {
            // Get access token
            const token_response = await axios.post(token_url, new URLSearchParams(token_data));
            const token = token_response.data.access_token;

            // Email information
            const email_url = 'https://graph.microsoft.com/v1.0/users/{user_id}/sendMail';
            const headers = {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            const email_data = {
                'message': {
                    'subject': `${req.subject}`,
                    'body': {
                        'contentType': 'html',
                        'content': `${req.html}`
                    },
                    'toRecipients': toMailes.map(email => ({
                        'emailAddress': {
                            'address': email
                        }
                    })),
                    'ccRecipients': ccMailes.map(email => ({
                        'emailAddress': {
                            'address': email
                        }
                    }))
                },
                'saveToSentItems': true
            };

            // Send email
            const user_obj_id = '7b19bd3a-112f-4b23-a941-0b565d01cbae';
            const email_response = await axios.post(email_url.replace('{user_id}', user_obj_id), email_data, { headers });

            if (email_response.status === 202) {
                res.push({ status: email_response.status, message: "Email sent successfully." });
                console.log(res, 'Email sent successfully.');
            } else {
                console.log('Failed to send email.');
                console.log(email_response.data);
            }
        } catch (error) {
            console.error('Failed to send email:', error);
        }

        return res;
    },


    async ChatBotMailer(req, toMailes, ccMailes) {
        try {
          // console.log("mailData:", mailData);
          // console.log('toMailes:', toMailes);
          // console.log('ccMailes:', ccMailes);
          // console.log(req);
      
          const mailOptions = {
            from: "support@orbitindia.net",
            subject: `OTP For Email Verification`,
            // html: `${req.content}`
            html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width" />
                <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                <title>OTP for Chatbot Login</title>
                <style>
                    body {
                        font-family: sans-serif;
                        margin: 0;
                        padding: 0;
                        width: 100%;
                        height: 100%;
                    }
                    .container {
                        width: 100%;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    }
                    .header {
                        text-align: center;
                        padding-bottom: 20px;
                    }
                    .content {
                        font-size: 14px;
                    }
                    .footer {
                        text-align: center;
                        padding-top: 20px;
                        font-size: 14px;
                        color: #777;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h4>OTP For Email Verification</h4>
                    </div>
                    <div class="content">
                        <p>Dear User,</p>
                        <p>Your One-Time Password (OTP) for email verification into the chatbot is:</p>
                        <h3 style="font-family: 'Poppins'; font-style: normal; font-weight: 600; font-size: 24px;">${req}</h3>
                        <p>Please enter this OTP to proceed with logging in and raising your issue through the chatbot.</p>
                        <p>If you did not request this OTP, please ignore this email or contact support.</p>
                    </div>
                    <div class="footer">
                        <p>Thank you,</p>
                        <p>The Support Team</p>
                        <p>support@orbitindia.net</p>
                    </div>
                </div>
            </body>
            </html>
        `
          };
      
          // console.log("mailOptions:", mailOptions);
          const mailres=await this.mail(mailOptions, toMailes, ccMailes);
          console.log(34,mailres)
          return mailres
      
        } catch (error) {
          console.log(error);
          return { status: 500, message: "Mail not sent" };
        }
      },

      async ticketEscalation(req, toMailes, ccMailes) {
        try {
          // console.log("mailData:", mailData);
          // console.log('toMailes:', toMailes);
          // console.log('ccMailes:', ccMailes);
          // console.log(req);
      
          const mailOptions = {
            from: "support@orbitindia.net",
            subject: `Ticket Has Been Escalated By ${req.issueRaisedBy}`,
            // html: `${req.content}`
            html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width" />
                <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                <title>Ticket Escalation Notification</title>
                <style>
                    body {
                        font-family: sans-serif;
                        margin: 0;
                        padding: 0;
                        width: 100%;
                        height: 100%;
                    }
                    .container {
                        width: 100%;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    }
                    .header {
                        text-align: center;
                        padding-bottom: 20px;
                    }
                    .content {
                        font-size: 14px;
                    }
                    .footer {
                        text-align: center;
                        padding-top: 20px;
                        font-size: 14px;
                        color: #777;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h4>Ticket Escalation Notification</h4>
                    </div>
                    <div class="content">
                        <p>Dear Manager,</p>
                        <p>Ticket Assigned To : ${req.issueAssignedTo}</p>
                        <p>The following ticket has been escalated by ${req.issueRaisedBy} </p>
                        <ul>
                            <li>Ticket Number : ${req.ticketno}</li>
                            <li>Status : ${req.status}</li>
                            <li>Issue : ${req.Issue}</li>
                        </ul>
                        <p>Log Notes :</p>
                        <ul>
                            ${req.logNote.map(note => `
                                <li>
                                    ${note.created} - ${note['User Name']}: ${note['Log Notes']}
                                </li>
                            `).join('')}
                        </ul>
                       
                    </div>
                    <div class="footer">
                        <p>If you have any questions, please contact us at support@orbitindia.net.</p>
                    </div>
                </div>
            </body>
            </html>`
          };
      
          // console.log("mailOptions:", mailOptions);
          const mailres=await this.mail(mailOptions, toMailes, ccMailes);
          console.log(34,mailres)
          return mailres
      
        } catch (error) {
          console.log(error);
          return { status: 500, message: "Mail not sent" };
        }
      }

  ,
    async IncidentCreationMail(req, toMailes, ccMailes) {
        console.log('toMailes incident:', toMailes, ccMailes);
        console.log(req);

        try {
            const email_data = {
                from: "support@orbitindia.net",
                subject: 'The Ticket has been Assigned to you',
                html: `<!DOCTYPE html>
                <html>
                <head>
                    <meta name="viewport" content="width=device-width" />
                    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                    <title>Ticket Assignment Notification</title>
                    <style>
                        body {
                            font-family: sans-serif;
                            margin: 0;
                            padding: 0;
                            width: 100%;
                            height: 100%;
                        }
                        .container {
                            width: 100%;
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        }
                        .header {
                            text-align: center;
                            padding-bottom: 20px;
                        }
                        .content {
                            font-size: 14px;
                        }
                        .footer {
                            text-align: center;
                            padding-top: 20px;
                            font-size: 14px;
                            color: #777;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>Ticket Assignment Notification</h2>
                        </div>
                        <div class="content">
                            <p>Dear ${req.assign_to},</p>
                            <p>The following ticket has been assigned to you:</p>
                            <ul>
                                <li>Issue Description: ${req.case_title}</li>
                                <li>Case ID: ${req.case_id}</li>
                                <li>Assigned To: ${req.assign_to}</li>
                                <li>User Name: ${req.user_name}</li>
                                <li>User Email: ${req.user_email}</li>
                                <li>User Phone Number: ${req.user_phone}</li>
                                <li>User Organization: ${req.org_name}</li>
                                <li>User Location: ${req.location}</li>
                                <li>User Branch Name: ${req.branch}</li>
                                <li>Selected Service: ${req.service}</li>
                                <li>Issue Related To: ${req.issueRelatedTo}</li>
                            </ul>
                        </div>
                        <div class="footer">
                            <p>Thank you,</p>
                            <p>The Support Team</p>
                            <p>support@orbitindia.net</p>
                        </div>
                    </div>
                </body>
                </html>`
            };

            const mailres = await this.mail(email_data, [toMailes], [ccMailes]);
            console.log(34, mailres);
            return mailres;

        } catch (error) {
            console.error('Error occurred:', error);
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
                console.error('Response headers:', error.response.headers);
            }
        }
    },

    async userNotifyMail(req, toMailes, ccMailes) {
        console.log('toMailes incident:', toMailes);
        console.log(req);
        try {

            const email_data = {
                from: "support@orbitindia.net",
                subject: 'Ticket Creation Notification',
                html: `<!DOCTYPE html>
                    <html>
                    <head>
                        <meta name="viewport" content="width=device-width" />
                        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                        <title>Ticket Creation Notification</title>
                        <style>
                            body {
                                font-family: 'Poppins', sans-serif;
                                margin: 0;
                                padding: 0;
                                width: 100%;
                                height: 100%;
                            }
                            .container {
                                width: 100%;
                                max-width: 600px;
                                margin: 0 auto;
                                padding: 20px;
                                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                            }
                            .header {
                                text-align: center;
                                padding-bottom: 20px;
                            }
                            .content {
                                font-size: 16px;
                            }
                            .footer {
                                text-align: center;
                                padding-top: 20px;
                                font-size: 14px;
                                color: #777;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h2>Ticket Creation Notification</h2>
                            </div>
                            <div class="content">
                                <p>Dear ${req.user_name},</p>
                                <p>Your ticket has been created successfully with the following details:</p>
                                <ul>
                                    <li>Issue Description: ${req.case_title}</li>
                                    <li>Case ID: ${req.case_id}</li>
                                    <li>Assigned To: ${req.assign_to}</li>
                                    <li>User Name: ${req.user_name}</li>
                                    <li>User Email: ${req.user_email}</li>
                                    <li>User Phone Number: ${req.user_phone}</li>
                                    <li>User Organization: ${req.org_name}</li>
                                    <li>User Location: ${req.location}</li>
                                    <li>User Branch Name: ${req.branch}</li>
                                    <li>Selected Service: ${req.service}</li>
                                    <li>Issue Related To: ${req.issueRelatedTo}</li>
                                </ul>
                            </div>
                            <div class="footer">
                                <p>Thank you,</p>
                                <p>The Support Team</p>
                                <p>support@orbitindia.net</p>
                            </div>
                        </div>
                    </body>
                    </html>`
            };

            const mailres = await this.mail(email_data, [toMailes], [ccMailes]);
            console.log(34, mailres);
            return mailres;

        } catch (error) {
            console.error('Error occurred:', error);
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
                console.error('Response headers:', error.response.headers);
            }
        }
    },
}




module.exports = userMail;
