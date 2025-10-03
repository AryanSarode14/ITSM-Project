const db= require("../../db/db");

const express = require('express');
const userEmail=require("../Chatbot/chatbotMailer");
const userMail = require("../Chatbot/chatbotMailer");





var questions = [
    {
      srNo: 1,
      question: "Enter your valid email id",
      options: ["Back"],
      type: ""
    },
    {
      srNo: 2,
      question: "We have sent a OTP to your registered email address. Please check your inbox and enter OTP.",
      options: ["Back"],
      type: ""
    },
    {
      srNo: 3,
      question: "Enter your phone number",
      options: ["Back"],
      type: ""
    },
    {
      srNo: 4,
      question: "Choose your organization",
      options: ["OTW", "Back"],
      type: ""
    },
  
    {
      srNo: 5,
      question: "Choose your location",
      type: "OTW",
      options: ["Pune", "Mumbai", "Goa", "Back"]
    },
  
    {
      srNo: 6,
      question: "Choose your branch",
      type: "Pune",
      options: ["Shivneri", "Bavdhan", "Warehouse", "Back"]
    },
    {
      srNo: 6,
      question: "Choose your branch",
      type: "Mumbai",
      options: ["Bhandup", "Marol", "Back"]
    },
    {
      srNo: 6,
      question: "Choose your branch",
      type: "Goa",
      options: ["Goa", "Back"]
    },
    {
      srNo: 7,
      question: "Choose your service",
      options: ["IT", "Back"],
      type: ""
    },
    {
      srNo: 8,
      question: "Choose your issue related To",
      options: ["Laptop", "Windows", "MS Office", "SAP", "HRMS", "Back"],
      type: ""
    },
  
    {
      srNo: 9,
      question: "Choose your Asset",
      options: [],
      type: ""
    },
    {
      srNo: 10,
      question: "Enter detailed description of issue",
      options: ["Back"],
      type: ""
    },
    {
      srNo: 11,
      question: "Are you sure you want to create the ticket ? ",
      options: ["Yes", "No"],
      type: ""
    }
  ];
  
  
  const questions2 = [
    {
      srNo: 1,
      question: "Please enter your ticket no",
  
    },
    {
      srNo: 2,
      question: "Choose your organization",
      options: ["OTW", "Back"],
      type: ""
    },
  
  ];
  
  const questions3 = [
    {
      srNo: 1,
      question: "Please enter your ticket no",
  
    },
    {
      srNo: 2,
      question: "Are you sure you want to escalate",
      options: ["Yes", "No"],
  
    },
    {
      srNo: 2,
      question: "Are you sure you want to escalate",
      options: ["Yes", "No"],
  
    }
  ];
  
  const isValidEmail = (email) => {
    const allowedDomains = ['@augtrans.com', '@orbit.net', '@orbit.india', '@gmail.com'];
    return allowedDomains.some(domain => email.endsWith(domain));
  };
  
  const findAssetForUser = async (user) => {
    console.log(user)
    const asset = [];
    try {
      const query2 = `SELECT asset_id FROM asset_assigned_to WHERE asset_owner_id = $1`;
      const values2 = [user];
      let result2 = await db.query(query2, values2);
      console.log(198, result2.rows);
      if (result2.rows.length > 0) {
        for (let item of result2.rows) {
          console.log(77, item)
          const query2 = `SELECT asset_name AS Asset_Name, asset_serial_no AS Serial_Number FROM asset_details WHERE asset_id = $1`;
          const values2 = [item.asset_id];
          let { rows } = await db.query(query2, values2);
          console.log(555, rows)
          if (rows.length > 0) {
            const query3 = `SELECT ci.ci_id AS cicd_id,ci.ci_name FROM asset_ci 
            left join ci on ci.ci_id=asset_ci.ci_id
            WHERE asset_ci.asset_id = $1`;
            const values3 = [item.asset_id];
            let { rows: ci } = await db.query(query3, values3);
            console.log(55577, ci)
            if (ci.length > 0) {
              const obj = { cicd_id: ci[0]?.cicd_id ? ci[0]?.cicd_id : 0, asset_name: rows[0]?.Asset_Name ? rows[0]?.Asset_Name : ci[0]?.ci_name }
              console.log(999999, obj)
              asset.push(obj);
            }
          }
  
        }
  
  
      } else {
        console.log("dsjhfuejnm")
        const id = 910;
        const query3 = `SELECT ci_id AS cicd_id,ci.* FROM ci WHERE ci_id = $1`;
        const values3 = [id];
        console.log(176, query3, values3)
        let { rows: ci } = await db.query(query3, values3);
        console.log(176, ci)
        const obj = { cicd_id: ci[0]?.cicd_id, asset_name: ci[0]?.ci_name }
        asset.push(obj)
        // console.log(2222, questions);
  
      }
  
  
      if (user) {
        const query3 = `SELECT * FROM ci_assigned_to
        left join ci on ci.ci_id=ci_assigned_to.ci_id
         WHERE ci_assigned_to.user_id = $1 AND ci_assigned_to.ci_id NOT IN (
    SELECT ci_id FROM asset_ci
  );`;
        const values3 = [user];
        let { rows: ci } = await db.query(query3, values3);
        if (ci.length > 0) {
          const obj = { cicd_id: ci[0]?.ci_id ? ci[0]?.ci_id : 0, asset_name: ci[0]?.ci_name ? ci[0]?.ci_name : "null" }
          console.log(999999, obj)
          asset.push(obj);
        }
  
  
      }
  
      questions.map((item) => {
        if (item.srNo === 9) {
          return item.options = asset
        }
      })
  
  
  
      console.log(1111, asset)
      return { data: questions[10] }
  
    } catch (err) {
      console.log(19888, err)
    }
  }
  
  
  const sendOtp = async (email) => {
  
    if (!isValidEmail(email)) {
      return { status: 400, message: 'Invalid email domain. Please use a valid email address.' };
    }
  
  
    const unRegisterd = [];
    try {
      let otp = Math.floor(Math.random() * 9000) + 1000;
      let findUserQuery = `SELECT * FROM user_details WHERE email_id = $1`;
      const { rows } = await db.query(findUserQuery, [email]);
      if (rows.length > 0) {
        const updateQuery = `UPDATE user_details SET otp = $1 WHERE user_id = $2`;
        await db.query(updateQuery, [otp, rows[0].id]);
      } else {
        const insertQuery = `INSERT INTO bot_detail_table (email, otp) VALUES ($1, $2)`;
        await db.query(insertQuery, [email, otp]);
        const id = 1075;
        const findDummyUser = `select * from user_details where user_id=${id};`;
        const { rows: unregistered } = await db.query(findDummyUser)
        unRegisterd.push({ ...unregistered[0] })
      }
  
      const mailRes = await userMail.ChatBotMailer(otp, [email], ["support@orbitindia.net"]);
      console.log(113, mailRes)
      if (mailRes[0].status === 202) {
  
  
        return rows.length > 0 ? { message: questions[1], user: rows[0] ,type:"Registered" } : { message: questions[1], user: unRegisterd[0] ,type:"Not Registered" }
  
      } else {
        return { message: 'OTP not sent try again' };
      }
    } catch (err) {
      return { error: err, message: 'Error' };
    }
  };
  
  const validateOtpForBot = async (email, otp, user_id) => {
    const data = [];
    try {
      const query = `SELECT COUNT(*) FROM user_details WHERE email_id=$1 AND otp = $2`;
      const values = [email, otp];
      let result = await db.query(query, values);
      console.log("result", result)
      const query1 = `SELECT COUNT(*) FROM bot_detail_table WHERE email=$1 AND otp = $2`;
      const values1 = [email, otp];
      console.log(values, values1)
      let result1 = await db.query(query1, values1);
      res0 = result.rows[0].count;
      res = result1.rows[0].count;
  
  
      //console.log(200,res0,res,otp)
  
      if (res != 0) {
        const query1 = `delete from bot_detail_table WHERE email = $1 AND otp=$2`;
        const values1 = [email, otp];
        let result1 = await db.query(query1, values1);
      }
  
      if (res0 != 0 || res != 0) {
        return { status: 200, message: 'Welcome, you have logged in to the bot.', question: questions[2], assets: data };
      } else {
        return { status: 401, message: 'Enter Valid OTP' };
      }
    } catch (error) {
      console.error('Error:', error.message);
      return { status: 500, message: 'Internal server error please contact your administrator' };
    }
  }




    const chatbotdetails= async(req,res)=>{
        console.log(777, req.body)
        let response = "";
        try {
    
          if (req.body.userOption === 1) {
            console.log("hiytt")
            if (!req.body.otp && req.body.email) {
              const emailRes = await sendOtp(req.body.email)
              //console.log(182, emailRes)
              response = emailRes
            }
            if (req.body.otp && req.body.email) {
              const emailRes = await validateOtpForBot(req.body.email, req.body.otp, req.body.user_id)
              response = emailRes
            }
    
            if (req.body.type || req.body.srNo) {
              console.log(192, "type", req.body);
              if (req.body.srNo === 9) {
    
                const data = await findAssetForUser(req.body.user_id)
                console.log(data);
    
                response = data
    
    
              } else {
                const email = questions.find((item) => {
                  return item.type === req.body?.type && item.srNo === req.body.srNo
                })
                response = email
              }
    
            }
    
          }
    
          if (req.body.userOption === 2) {
            if (req.body.srNo === 2 && req.body.ticketno) {
    
            
             
    
              const q1 = `select incident.incident_id AS Ticket_No,incident.issue_description AS Issue from incident
            LEFT JOIN incident_relation ON incident.incident_id = incident_relation.incident_id
            LEFT JOIN status on status.id=incident_relation.status_id
            where incident.incident_id=${req.body.ticketno};
            `;
    
              const { rows } = await db.query(q1)
              //console.log(356, rows)
    
              let q3 = `SELECT incident_log_notes.id::text, incident.incident_id, incident_log_notes.log_notes AS "Log Notes", CONCAT(user_details.first_name,' ',user_details.last_name) AS "User Name", to_char(incident_log_notes.created_at, 'DD-MM-YYYY HH24:MI:SS') AS "created"
            FROM incident_log_notes
            LEFT JOIN incident ON incident.incident_id = incident_log_notes.incident_id
            LEFT JOIN user_details ON user_details.user_id = incident_log_notes.user_id
            WHERE incident.incident_id = ${req.body.ticketno}`;
              // // console.log(query);
              let logNotes = await db.query(q3);
              logNotes = logNotes.rows;
    
              const obj = { ...rows[0], logNote: logNotes, messages: "Thank You" }
              //console.log(obj)
              response = obj
    
            } else {
              const email = questions2.find((item) => {
                return item.srNo === req.body.srNo
              })
              response = email
            }
    
          }
    
          if (req.body.userOption === 3) {
    
            if (req.body.srNo) {
              const email = questions3.find((item) => {
                return item.srNo === req.body.srNo
              })
              response = email
            }
    
            if (req.body.res === "Yes" && req.body.ticketno) {
    
              const findUser = `select incident_asset_user_details.user_id AS user,
    incident_asset_user_details.incident_details_id AS ticketno,incident.issue_description AS Issue,
    incident_asset_user_details.user_assigned_to_id AS user_assigned,incident_relation.sla_id AS SLA,incident.created_at AS created, status.status_name AS Status from incident_asset_user_details
     LEFT JOIN incident_relation ON incident_relation.incident_id = incident_asset_user_details.incident_details_id
     LEFT JOIN incident ON incident.incident_id = incident_asset_user_details.incident_details_id
            LEFT JOIN status on status.id=incident_relation.status_id
            where incident_asset_user_details.incident_details_id=${req.body.ticketno};`
              //console.log(313, findUser)
              const { rows } = await db.query(findUser);
              //console.log(315,rows)
    
              const getAssignedUserName = `select user_details.first_name AS firstname,user_details.last_name AS lastname from user_details where user_details.user_id=${rows[0].user_assigned};`
              const { rows: assigned } = await db.query(getAssignedUserName);
    
              const getIssueRaisedUserName = `select user_details.first_name AS firstname,user_details.lastname AS lastname from user_details where user_details.user_id=${rows[0].user};`
              const { rows: issue } = await db.query(getIssueRaisedUserName);
    
              let q3 = `SELECT incident_log_notes.id::text, incident.incident_id, log_notes AS "Log Notes", CONCAT(user_details.first_name,' ',user_details.lastname) AS "User Name", to_char(incident_log_notes.created_at, 'DD-MM-YYYY HH24:MI:SS') AS "created"
              FROM incident_log_notes
              LEFT JOIN incident ON incident.incident_id = incident_log_notes.incident_id
              LEFT JOIN user_details ON user_details.user_id = incident_log_notes.user_id
              WHERE incident.incident_id = ${req.body.ticketno}`;
              // // console.log(query);
              let logNotes = await db.query(q3);
              logNotes = logNotes.rows;
    
              const obj = {
                issueRaisedBy: issue[0].firstname + " "+ issue[0].lastname,
                issueAssignedTo: assigned[0].firstname + " "+ assigned[0].lastname,
                status: rows[0].status,
                ticketno: rows[0].ticketno,
                Issue: rows[0].issue,
                logNote: logNotes
              }
    
              const createdAt = moment(rows[0].created, 'YYYY-MM-DD HH:mm:ss');
              const now = moment();
              const differenceInHours = now.diff(createdAt, 'hours');
              if (differenceInHours > 8) {
                console.log('The createdAt timestamp exceeds 8 hours from the current time.');
                const sendEmail = await userMail.ticketEscalation(obj, ["neha.rajbhar@augtrans.com"], [])
                console.log("email", sendEmail)
                const obj2 = { ...sendEmail[0], result: "Thank you" }
                response = obj2
              } else {
                console.log('The createdAt timestamp is within 8 hours from the current time.');
    
                const obj2 = { result: "Your SLA has not yet exceeded. Please try escalating the ticket again after some hours." }
                response = obj2
              }
            }
    
          }
         
 res.status(200).json({ status: 200, data: response })    
        } catch (err) {
          console.log(44, err)
 res.status(500).json({ status: 500, message: "Internal Server Error", error: err })         
        }
    }


 


const createIncidentForBot = async (req, res) => {
  console.log(2222,req.body);
  const {
    issue_description,
    sla_id,
    call_type_id,
    status_id,
    call_mode_id,
    priority_id,
    support_group_id,
    ci_details_id,
    user_id,
  } = req.body;

  


  try {
    // Insert into the incident table
    const incidentResult = await db.query(
      `INSERT INTO public.incident (issue_description)
       VALUES ($1)
       RETURNING incident_id`,
      [issue_description]
    );

    const incidentId = incidentResult.rows[0].incident_id;

    // Insert into the incident_relation table
    await db.query(
      `INSERT INTO public.incident_relation 
       (call_type_id, status_id, call_mode_id, priority_id, sla_id, incident_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [call_type_id, status_id, call_mode_id, priority_id, sla_id, incidentId]
    );
    // const userId = req.user.userId;
    // Insert into the incident_asset_user_details table
     const q1 = `INSERT INTO public.incident_asset_user_details 
       (incident_details_id, ci_details_id, user_assigned_to_id, user_opened_by_id, support_group_id, user_id)
       VALUES ($1, $2, $3, $4, $5, $6) returning *;`;
    const values = [
      incidentId,
      req.body.ci_details_id,
      req.body.assign_to, // Set user_assigned_to_id as null when creating
      req.body.user_id, // Current logged-in user ID
      req.body.support_group_id,
      req.body.user_id, // Employee ID from dropdown
    ]

console.log(888,values);
    const { rows } = await db.query(q1, values);
    console.log(555, rows[0])

    if (call_mode_id == 5) {

      let query = `SELECT * FROM user_details WHERE user_id = ${req.body.assignto_id}`;
      let result = await db.query(query);
      console.log(231, result.rows[0])

      const q1 = `
      SELECT inc.*, rel.* FROM incident inc LEFT JOIN incident_relation rel ON inc.incident_id = rel.incident_id WHERE inc.incident_id = ${incidentId};
    `;
      const { rows: incidentDetails } = await db.query(q1);

      const q2 = `select * from user_details where user_id=${req.body.user_id};`;
      const { rows: name } = await db.query(q2)
      const data2 = {
        case_id: incidentDetails[0].incident_id,
        case_title: incidentDetails[0].issue_description,
        assign_to: result.rows[0].first_name + " " + result.rows[0].last_name,
        user_name: name[0].first_name + " " + name[0].last_name,
        user_email: req.body.emailid,
        user_phone: req.body.mobileno,
        org_name: req.body.org_name,
        location: req.body.location,
        branch: req.body.branch,
        service: req.body.service,
        issueRelatedTo: req.body.issueRelatedTo



      }
      console.log(2222, data2)
      const mail = await userEmail.IncidentCreationMail(data2, result.rows[0]?.email_id, "neha.rajbhar@augtrans.com");
      const mailUser = await userEmail.userNotifyMail(data2, req.body.emailid, "neha.rajbhar@augtrans.com")
      console.log(2999, mail)


      if (mail.status == 202) {
        result = { message: `Your Ticket No ${incidentDetails[0].incident_id} submitted successfully` };
        return res.status(201).json(result)
      } else {
        result = { message: `Your Ticket No ${incidentDetails[0].incident_id} submitted successfully` };
        return res.status(201).json(result)
      }


    }


  } catch (err) {
    console.error("Error creating incident:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }

};






module.exports= {chatbotdetails,createIncidentForBot }