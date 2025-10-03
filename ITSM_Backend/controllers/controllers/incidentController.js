const pool = require("../db/db");
const { use } = require("../routes");
const email = require("../controllers/Chatbot/chatbotMailer.js");

const getUserAssets = async (req, res) => {
  const { userId } = req.params;

  // Validate userId parameter
  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const query = `
      SELECT 
        a.asset_id AS id,
        a.asset_name AS name,
        a.asset_serial_no AS serial_no,
        a.purchase_date AS purchase_date,
        a.assigned_date AS assigned_date,
        a.expiry_date AS expiry_date,
        a.ci_name AS ci_name,
        a.description AS asset_description
      FROM 
        public.asset_details a
      INNER JOIN 
        public.user_asset_relation uar 
        ON a.asset_id = uar.asset_id
      WHERE 
        uar.asset_owner_id = $1;
    `;

    const values = [userId];

    const result = await pool.query(query, values);

    // Check if any assets were found for the user
    if (result.rows.length === 0) {
      return res.status(200).json({ message: "No assets found for this user" });
    }

    // Return the assets
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching user assets:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const createIncident = async (req, res) => {
  console.log(req.body);
  const {
    issue_description,
    sla_id,
    call_type_id,
    status_id,
    call_mode_id,
    priority_id,
    support_group_id, //not req hardcode
    ci_details_id, // not req hardcode
    initiated_for_user_id, //not req hardcode and add assigned to id of sagar
  } = req.body;

  // Validate required fields (excluding user_assigned_to_id)
  if (
    !issue_description ||
    !sla_id ||
    !call_type_id ||
    !status_id ||
    !call_mode_id ||
    !priority_id ||
    !support_group_id ||
    !ci_details_id
  ) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Insert into the incident table
    const incidentResult = await pool.query(
      `INSERT INTO public.incident (issue_description)
       VALUES ($1)
       RETURNING incident_id`,
      [issue_description]
    );

    let img;

    const incidentId = incidentResult.rows[0].incident_id;

    // Insert into the incident_relation table
    await pool.query(
      `INSERT INTO public.incident_relation 
       (call_type_id, status_id, call_mode_id, priority_id, sla_id, incident_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [call_type_id, status_id, call_mode_id, priority_id, sla_id, incidentId]
    );
    const userId = req.user.userId;
    // Insert into the incident_asset_user_details table
    await pool.query(
      `INSERT INTO public.incident_asset_user_details 
       (incident_details_id, ci_details_id, user_assigned_to_id, user_opened_by_id, support_group_id, initiated_for_user_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        incidentId,
        ci_details_id,
        null,
        req.user.userId,
        support_group_id,
        initiated_for_user_id, 
      ]
    );

    if (req.files) {
      const path =
        "http://172.16.16.66:4000/assets/attachments/incident_attachment/";
      for (let i = 0; i < req.files.length; i++) {
        findAllQuery = `INSERT INTO incident_attachment (incident_id, file_path) VALUES(${incidentId},'${path}${req.files[i].filename}');`;
        // console.log('incident_attachement:', findAllQuery);
        img = await db.query(findAllQuery);
      }
    }

    const ownerDetailsResult = await pool.query(
      `SELECT 
         ud.email_id, 
         ud.first_name || ' ' || ud.last_name AS full_name 
       FROM 
         public.support_group_detail sgd
       JOIN 
         public.user_details ud 
       ON 
         sgd.owner_id = ud.user_id
       WHERE 
         sgd.support_group_id = $1`,
      [support_group_id]
    );

    console.log("Support Group Owner Result:", ownerDetailsResult.rows[0]);

    if (supportGroupOwnerResult.rowCount > 0) {
      const { email_id, full_name } = supportGroupOwnerResult.rows[0];

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER, 
          pass: process.env.EMAIL_PASS, 
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email_id,
        subject: `New Incident Created: ${incidentId}`,
        text: `Hello ${full_name},\n\nA new incident has been created with the following details:\n\nIncident ID: ${incidentId}\nDescription: ${issue_description}\n\nPlease take the necessary action.\n\nBest Regards,\nIncident Management Team`,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Notification email sent to ${email_id}`);
    }

    res.status(201).json({
      incident_id: incidentId,
      message: "Incident created successfully",
    });
  } catch (err) {
    console.error("Error creating incident:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getIncidents = async (req, res) => {
  const client = await pool.connect(); // Use a client to manage transactions

  try {
    const query = `
      SELECT
        i.incident_id,
        i.issue_description,
        ir.call_type_id,
        ct.call_type_name,           -- Call type name from call_type table
        ir.status_id,
        st.status_name,              -- Status name from status table
        ir.call_mode_id,
        cm.mode AS call_mode,        -- Call mode name from call_mode table
        ir.priority_id,
        p.priority_name,             -- Priority name from priority table
        ir.sla_id,
        sla.sla_time,                -- SLA time from sla table
        iaud.ci_details_id,
        ci.ci_name AS ci_detail_name, -- CI name from ci table
        iaud.user_assigned_to_id,
        CASE WHEN u_assigned.first_name IS NOT NULL AND u_assigned.last_name IS NOT NULL
             THEN concat(u_assigned.first_name, ' ', u_assigned.last_name)
             ELSE NULL END AS user_assigned_to_name,  -- Name of the user assigned to the incident
        iaud.user_opened_by_id,
        CASE WHEN u_opened.first_name IS NOT NULL AND u_opened.last_name IS NOT NULL
             THEN concat(u_opened.first_name, ' ', u_opened.last_name)
             ELSE NULL END AS user_opened_by_name,      -- Name of the user who opened the incident
        iaud.support_group_id,
        sg.support_group_name AS support_group_name,    -- Support group name
        iaud.initiated_for_user_id,
        CASE WHEN u_initiator.first_name IS NOT NULL AND u_initiator.last_name IS NOT NULL
             THEN concat(u_initiator.first_name, ' ', u_initiator.last_name)
             ELSE NULL END AS initiated_for_user_name    -- Name of the user from the dropdown (initiator)

      FROM
        public.incident i
      JOIN
        public.incident_relation ir ON i.incident_id = ir.incident_id
      JOIN
        public.incident_asset_user_details iaud ON i.incident_id = iaud.incident_details_id
      JOIN
        public.ci ci ON iaud.ci_details_id = ci.ci_id
      LEFT JOIN
        public.user_details u_assigned ON iaud.user_assigned_to_id = u_assigned.user_id
      LEFT JOIN
        public.user_details u_opened ON iaud.user_opened_by_id = u_opened.user_id
      LEFT JOIN
        public.user_details u_initiator ON iaud.initiated_for_user_id = u_initiator.user_id
      LEFT JOIN
        public.support_group_detail sg ON iaud.support_group_id = sg.support_group_id
      LEFT JOIN
        public.call_type ct ON ir.call_type_id = ct.id
      LEFT JOIN
        public.status st ON ir.status_id = st.id
      LEFT JOIN
        public.call_mode cm ON ir.call_mode_id = cm.id
      LEFT JOIN
        public.priority p ON ir.priority_id = p.priority_id
      LEFT JOIN
        public.sla sla ON ir.sla_id = sla.sla_id;
    `;

    const result = await client.query(query);

    if (result.rows.length === 0) {
      return res.status(200).json({ message: "No incidents found" });
    }

    // Handle log notes insertion if log_notes are provided in the request body
    const { log_notes } = req.body; // Assuming log_notes are sent in the request body

    if (log_notes) {
      const incidentId = result.rows[0].incident_id; // Use the incident_id from the first incident
      const user = req.user.userId; // Get the current user's ID

      await client.query(
        `INSERT INTO public.incident_log_notes (incident_id, user_id, log_notes)
        VALUES ($1, $2, $3)`,
        [incidentId, user, log_notes]
      );
    }

    res.status(200).json(result.rows); // Return all incidents, now including log notes in array format
  } catch (err) {
    console.error("Error fetching all incidents:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    client.release(); // Release the client back to the pool
  }
};

const getIncidentById = async (req, res) => {
  const { incident_id } = req.params;

  const client = await pool.connect(); // Obtain a client from the pool

  try {
    const query = `
      SELECT
        i.incident_id,
        i.issue_description,
        ir.call_type_id,
        ct.call_type_name, -- Call type name from call_type table
        ir.status_id,
        st.status_name, -- Status name from status table
        ir.call_mode_id,
        cm.mode AS call_mode, -- Call mode name from call_mode table
        ir.priority_id,
        p.priority_name, -- Priority name from priority table
        ir.sla_id,
        sla.sla_time, -- SLA time from sla table
        iaud.ci_details_id,
        ci.ci_name AS ci_detail_name, -- CI name from ci table
        iaud.user_assigned_to_id,
        CASE WHEN u_assigned.first_name IS NOT NULL AND u_assigned.last_name IS NOT NULL
             THEN CONCAT(u_assigned.first_name, ' ', u_assigned.last_name)
             ELSE NULL END AS user_assigned_to_name, -- Name of the user assigned to the incident
        iaud.user_opened_by_id,
        CASE WHEN u_opened.first_name IS NOT NULL AND u_opened.last_name IS NOT NULL
             THEN CONCAT(u_opened.first_name, ' ', u_opened.last_name)
             ELSE NULL END AS user_opened_by_name, -- Name of the user who opened the incident
        iaud.support_group_id,
        sg.support_group_name AS support_group_name, -- Support group name
        iaud.initiated_for_user_id,
        CASE WHEN u_initiator.first_name IS NOT NULL AND u_initiator.last_name IS NOT NULL
             THEN CONCAT(u_initiator.first_name, ' ', u_initiator.last_name)
             ELSE NULL END AS initiated_for_user_name -- Name of the user from the dropdown (initiator)
      FROM
        public.incident i
      JOIN
        public.incident_relation ir ON i.incident_id = ir.incident_id
      JOIN
        public.incident_asset_user_details iaud ON i.incident_id = iaud.incident_details_id
      JOIN
        public.ci ci ON iaud.ci_details_id = ci.ci_id
      LEFT JOIN
        public.user_details u_assigned ON iaud.user_assigned_to_id = u_assigned.user_id
      LEFT JOIN
        public.user_details u_opened ON iaud.user_opened_by_id = u_opened.user_id
      LEFT JOIN
        public.user_details u_initiator ON iaud.initiated_for_user_id = u_initiator.user_id
      LEFT JOIN
        public.support_group_detail sg ON iaud.support_group_id = sg.support_group_id
      LEFT JOIN
        public.call_type ct ON ir.call_type_id = ct.id
      LEFT JOIN
        public.status st ON ir.status_id = st.id
      LEFT JOIN
        public.call_mode cm ON ir.call_mode_id = cm.id
      LEFT JOIN
        public.priority p ON ir.priority_id = p.priority_id
      LEFT JOIN
        public.sla sla ON ir.sla_id = sla.sla_id
      WHERE i.incident_id = $1;
    `;

    const result = await client.query(query, [incident_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Incident not found" });
    }

    const incident = result.rows[0];

    // Fetch all log notes for the given incident_id and order by creation date
    const logNoteQuery = `
      SELECT log_notes, TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') AS created_at
      FROM public.incident_log_notes
      WHERE incident_id = $1
      ORDER BY created_at ASC;
    `;
    const logNoteResult = await client.query(logNoteQuery, [incident_id]);

    // Fetch all attachments for the given incident_id
    const attachmentQuery = `SELECT file_path FROM incident_attachment WHERE incident_id = $1;`;
    const attachmentResult = await client.query(attachmentQuery, [incident_id]);

    // Prepare the response with incident details, log notes, and attachments
    const response = {
      incident,
      logNotes: logNoteResult.rows.map((log) => ({
        note: log.log_notes,
        created_at: log.created_at,
      })),
      attachments: attachmentResult.rows.map(
        (attachment) => attachment.file_path
      ), // Return only file paths
    };

    res.status(200).json({
      message: "Incident retrieved successfully",
      data: response,
    });
  } catch (err) {
    console.error("Error fetching incident:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    client.release(); // Release the client back to the pool
  }
};

const getClosedIncidents = async (req, res) => {
  const userId = req.user.userId; // Extract userId directly from the token
  const client = await pool.connect(); // Obtain a client from the pool

  try {
    const query = `
      SELECT
        i.incident_id,
        i.issue_description,
        ir.call_type_id,
        ct.call_type_name, -- Call type name from call_type table
        ir.status_id,
        st.status_name, -- Status name from status table
        ir.call_mode_id,
        cm.mode AS call_mode, -- Call mode name from call_mode table
        ir.priority_id,
        p.priority_name, -- Priority name from priority table
        ir.sla_id,
        sla.sla_time, -- SLA time from sla table
        iaud.ci_details_id,
        ci.ci_name AS ci_detail_name, -- CI name from ci table
        iaud.user_assigned_to_id,
        CASE WHEN u_assigned.first_name IS NOT NULL AND u_assigned.last_name IS NOT NULL
             THEN CONCAT(u_assigned.first_name, ' ', u_assigned.last_name)
             ELSE NULL END AS user_assigned_to_name, -- Name of the user assigned to the incident
        iaud.user_opened_by_id,
        CASE WHEN u_opened.first_name IS NOT NULL AND u_opened.last_name IS NOT NULL
             THEN CONCAT(u_opened.first_name, ' ', u_opened.last_name)
             ELSE NULL END AS user_opened_by_name, -- Name of the user who opened the incident
        iaud.support_group_id,
        sg.support_group_name AS support_group_name, -- Support group name
        iaud.initiated_for_user_id,
        CASE WHEN u_initiator.first_name IS NOT NULL AND u_initiator.last_name IS NOT NULL
             THEN CONCAT(u_initiator.first_name, ' ', u_initiator.last_name)
             ELSE NULL END AS initiated_for_user_name -- Name of the user from the dropdown (initiator)
      FROM
        public.incident i
      JOIN
        public.incident_relation ir ON i.incident_id = ir.incident_id
      JOIN
        public.incident_asset_user_details iaud ON i.incident_id = iaud.incident_details_id
      JOIN
        public.ci ci ON iaud.ci_details_id = ci.ci_id
      LEFT JOIN
        public.user_details u_assigned ON iaud.user_assigned_to_id = u_assigned.user_id
      LEFT JOIN
        public.user_details u_opened ON iaud.user_opened_by_id = u_opened.user_id
      LEFT JOIN
        public.user_details u_initiator ON iaud.initiated_for_user_id = u_initiator.user_id
      LEFT JOIN
        public.support_group_detail sg ON iaud.support_group_id = sg.support_group_id
      LEFT JOIN
        public.call_type ct ON ir.call_type_id = ct.id
      LEFT JOIN
        public.status st ON ir.status_id = st.id
      LEFT JOIN
        public.call_mode cm ON ir.call_mode_id = cm.id
      LEFT JOIN
        public.priority p ON ir.priority_id = p.priority_id
      LEFT JOIN
        public.sla sla ON ir.sla_id = sla.sla_id
     WHERE
      (iaud.user_assigned_to_id = $1 OR iaud.user_opened_by_id = $1)
      AND st.status_name = 'Close';
    `;

    const result = await client.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(200).json([]); // Send an empty array if no closed incidents found
    }

    // Return the closed incidents
    res.status(200).json(result.rows); // Send the retrieved incidents
  } catch (err) {
    console.error("Error fetching closed incidents:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    client.release(); // Release the client back to the pool
  }
};

const getInProgressIncidents = async (req, res) => {
  const userId = req.user.userId; // Extract userId directly from the token

  const client = await pool.connect(); // Use a client to manage transactions

  try {
    const query = `
      SELECT
        i.incident_id,
        i.issue_description,
        ir.call_type_id,
        ct.call_type_name, -- Call type name from call_type table
        ir.status_id,
        st.status_name, -- Status name from status table
        ir.call_mode_id,
        cm.mode AS call_mode, -- Call mode name from call_mode table
        ir.priority_id,
        p.priority_name, -- Priority name from priority table
        ir.sla_id,
        sla.sla_time, -- SLA time from sla table
        iaud.ci_details_id,
        ci.ci_name AS ci_detail_name, -- CI name from ci table
        iaud.user_assigned_to_id,
        CASE WHEN u_assigned.first_name IS NOT NULL AND u_assigned.last_name IS NOT NULL
             THEN CONCAT(u_assigned.first_name, ' ', u_assigned.last_name)
             ELSE NULL END AS user_assigned_to_name, -- Name of the user assigned to the incident
        iaud.user_opened_by_id,
        CASE WHEN u_opened.first_name IS NOT NULL AND u_opened.last_name IS NOT NULL
             THEN CONCAT(u_opened.first_name, ' ', u_opened.last_name)
             ELSE NULL END AS user_opened_by_name, -- Name of the user who opened the incident
        iaud.support_group_id,
        sg.support_group_name AS support_group_name, -- Support group name
        iaud.initiated_for_user_id,
        CASE WHEN u_initiator.first_name IS NOT NULL AND u_initiator.last_name IS NOT NULL
             THEN CONCAT(u_initiator.first_name, ' ', u_initiator.last_name)
             ELSE NULL END AS initiated_for_user_name -- Name of the user from the dropdown (initiator)
      FROM
        public.incident i
      JOIN
        public.incident_relation ir ON i.incident_id = ir.incident_id
      JOIN
        public.incident_asset_user_details iaud ON i.incident_id = iaud.incident_details_id
      JOIN
        public.ci ci ON iaud.ci_details_id = ci.ci_id
      LEFT JOIN
        public.user_details u_assigned ON iaud.user_assigned_to_id = u_assigned.user_id
      LEFT JOIN
        public.user_details u_opened ON iaud.user_opened_by_id = u_opened.user_id
      LEFT JOIN
        public.user_details u_initiator ON iaud.initiated_for_user_id = u_initiator.user_id
      LEFT JOIN
        public.support_group_detail sg ON iaud.support_group_id = sg.support_group_id
      LEFT JOIN
        public.call_type ct ON ir.call_type_id = ct.id
      LEFT JOIN
        public.status st ON ir.status_id = st.id
      LEFT JOIN
        public.call_mode cm ON ir.call_mode_id = cm.id
      LEFT JOIN
        public.priority p ON ir.priority_id = p.priority_id
      LEFT JOIN
        public.sla sla ON ir.sla_id = sla.sla_id
     WHERE
      (iaud.user_assigned_to_id = $1 OR iaud.user_opened_by_id = $1)
      AND st.status_name = 'In Progress';
    `;

    const result = await client.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(200).json({
        message: "No in-progress incidents found for this user's support group",
      });
    }

    // Return the result rows
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching In Progress incidents:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    client.release(); // Release the client back to the pool
  }
};

const getOpenIncidents = async (req, res) => {
  const userId = req.user.userId; // Extract userId directly from the token

  const client = await pool.connect(); // Use a client to manage transactions

  try {
    const query = `
      SELECT
        i.incident_id,
        i.issue_description,
        ir.call_type_id,
        ct.call_type_name, -- Call type name from call_type table
        ir.status_id,
        st.status_name, -- Status name from status table
        ir.call_mode_id,
        cm.mode AS call_mode, -- Call mode name from call_mode table
        ir.priority_id,
        p.priority_name, -- Priority name from priority table
        ir.sla_id,
        sla.sla_time, -- SLA time from sla table
        iaud.ci_details_id,
        ci.ci_name AS ci_detail_name, -- CI name from ci table
        iaud.user_assigned_to_id,
        CASE WHEN u_assigned.first_name IS NOT NULL AND u_assigned.last_name IS NOT NULL
             THEN CONCAT(u_assigned.first_name, ' ', u_assigned.last_name)
             ELSE NULL END AS user_assigned_to_name, -- Name of the user assigned to the incident
        iaud.user_opened_by_id,
        CASE WHEN u_opened.first_name IS NOT NULL AND u_opened.last_name IS NOT NULL
             THEN CONCAT(u_opened.first_name, ' ', u_opened.last_name)
             ELSE NULL END AS user_opened_by_name, -- Name of the user who opened the incident
        iaud.support_group_id,
        sg.support_group_name AS support_group_name, -- Support group name
        iaud.initiated_for_user_id,
        CASE WHEN u_initiator.first_name IS NOT NULL AND u_initiator.last_name IS NOT NULL
             THEN CONCAT(u_initiator.first_name, ' ', u_initiator.last_name)
             ELSE NULL END AS initiated_for_user_name -- Name of the user from the dropdown (initiator)
      FROM
        public.incident i
      JOIN
        public.incident_relation ir ON i.incident_id = ir.incident_id
      JOIN
        public.incident_asset_user_details iaud ON i.incident_id = iaud.incident_details_id
      JOIN
        public.ci ci ON iaud.ci_details_id = ci.ci_id
      LEFT JOIN
        public.user_details u_assigned ON iaud.user_assigned_to_id = u_assigned.user_id
      LEFT JOIN
        public.user_details u_opened ON iaud.user_opened_by_id = u_opened.user_id
      LEFT JOIN
        public.user_details u_initiator ON iaud.initiated_for_user_id = u_initiator.user_id
      LEFT JOIN
        public.support_group_detail sg ON iaud.support_group_id = sg.support_group_id
      LEFT JOIN
        public.call_type ct ON ir.call_type_id = ct.id
      LEFT JOIN
        public.status st ON ir.status_id = st.id
      LEFT JOIN
        public.call_mode cm ON ir.call_mode_id = cm.id
      LEFT JOIN
        public.priority p ON ir.priority_id = p.priority_id
      LEFT JOIN
        public.sla sla ON ir.sla_id = sla.sla_id
     WHERE
      (iaud.user_assigned_to_id = $1 OR iaud.user_opened_by_id = $1)
      AND st.status_name = 'Open';
    `;

    const result = await client.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(200).json({
        message: "No Open incidents found for this user's support group",
      });
    }

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching Open incidents:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    client.release(); // Release the client back to the pool
  }
};

const getonholdIncidents = async (req, res) => {
  const userId = req.user.userId; // Extract userId directly from the token

  const client = await pool.connect(); // Use a client to manage transactions

  try {
    const query = `
      SELECT
        i.incident_id,
        i.issue_description,
        ir.call_type_id,
        ct.call_type_name, -- Call type name from call_type table
        ir.status_id,
        st.status_name, -- Status name from status table
        ir.call_mode_id,
        cm.mode AS call_mode, -- Call mode name from call_mode table
        ir.priority_id,
        p.priority_name, -- Priority name from priority table
        ir.sla_id,
        sla.sla_time, -- SLA time from sla table
        iaud.ci_details_id,
        ci.ci_name AS ci_detail_name, -- CI name from ci table
        iaud.user_assigned_to_id,
        CASE WHEN u_assigned.first_name IS NOT NULL AND u_assigned.last_name IS NOT NULL
             THEN CONCAT(u_assigned.first_name, ' ', u_assigned.last_name)
             ELSE NULL END AS user_assigned_to_name, -- Name of the user assigned to the incident
        iaud.user_opened_by_id,
        CASE WHEN u_opened.first_name IS NOT NULL AND u_opened.last_name IS NOT NULL
             THEN CONCAT(u_opened.first_name, ' ', u_opened.last_name)
             ELSE NULL END AS user_opened_by_name, -- Name of the user who opened the incident
        iaud.support_group_id,
        sg.support_group_name AS support_group_name, -- Support group name
        iaud.initiated_for_user_id,
        CASE WHEN u_initiator.first_name IS NOT NULL AND u_initiator.last_name IS NOT NULL
             THEN CONCAT(u_initiator.first_name, ' ', u_initiator.last_name)
             ELSE NULL END AS initiated_for_user_name -- Name of the user from the dropdown (initiator)
      FROM
        public.incident i
      JOIN
        public.incident_relation ir ON i.incident_id = ir.incident_id
      JOIN
        public.incident_asset_user_details iaud ON i.incident_id = iaud.incident_details_id
      JOIN
        public.ci ci ON iaud.ci_details_id = ci.ci_id
      LEFT JOIN
        public.user_details u_assigned ON iaud.user_assigned_to_id = u_assigned.user_id
      LEFT JOIN
        public.user_details u_opened ON iaud.user_opened_by_id = u_opened.user_id
      LEFT JOIN
        public.user_details u_initiator ON iaud.initiated_for_user_id = u_initiator.user_id
      LEFT JOIN
        public.support_group_detail sg ON iaud.support_group_id = sg.support_group_id
      LEFT JOIN
        public.call_type ct ON ir.call_type_id = ct.id
      LEFT JOIN
        public.status st ON ir.status_id = st.id
      LEFT JOIN
        public.call_mode cm ON ir.call_mode_id = cm.id
      LEFT JOIN
        public.priority p ON ir.priority_id = p.priority_id
      LEFT JOIN
        public.sla sla ON ir.sla_id = sla.sla_id
     WHERE
      (iaud.user_assigned_to_id = $1 OR iaud.user_opened_by_id = $1)
      AND st.status_name = 'On Hold';
    `;

    const result = await client.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(200).json({
        message: "No On-Hold incidents found for this user's support group",
      });
    }

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching On-Hold incidents:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    client.release(); // Release the client back to the pool
  }
};

const getUserIncidentsBySupportGroup = async (req, res) => {
  const userId = req.user.userId; // Extract userId directly from the token

  // Validate userId to ensure it's a valid integer
  if (isNaN(userId) || !Number.isInteger(parseInt(userId))) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  const client = await pool.connect(); // Use a client to manage transactions

  try {
    // Check if the user belongs to a support group
    const supportGroupCheckQuery = `
      SELECT support_group_id
      FROM public.user_relation
      WHERE user_id = $1
    `;
    const supportGroupCheckResult = await client.query(supportGroupCheckQuery, [
      parseInt(userId),
    ]);

    if (supportGroupCheckResult.rows.length === 0) {
      return res
        .status(200)
        .json({ message: "User does not belong to any support group" });
    }

    const supportGroupId = supportGroupCheckResult.rows[0].support_group_id;

    const query = `
      SELECT
        i.incident_id,
        i.issue_description,
        ir.call_type_id,
        ct.call_type_name, -- Call type name from call_type table
        ir.status_id,
        st.status_name, -- Status name from status table
        ir.call_mode_id,
        cm.mode AS call_mode, -- Call mode name from call_mode table
        ir.priority_id,
        p.priority_name, -- Priority name from priority table
        ir.sla_id,
        sla.sla_time, -- SLA time from sla table
        iaud.ci_details_id,
        ci.ci_name AS ci_detail_name, -- CI name from ci table
        iaud.user_assigned_to_id,
        concat(u_assigned.first_name, ' ', u_assigned.last_name) AS user_assigned_to_name, -- Name of the user assigned to the incident
        iaud.user_opened_by_id,
        concat(u_opened.first_name, ' ', u_opened.last_name) AS user_opened_by_name, -- Name of the user who opened the incident
        iaud.support_group_id,
        sg.support_group_name AS support_group_name, -- Support group name
        iaud.initiated_for_user_id,
        concat(u_initiator.first_name, ' ', u_initiator.last_name) AS initiated_for_user_name -- Name of the user from the dropdown (initiator)
      FROM
        public.incident i
      JOIN
        public.incident_relation ir ON i.incident_id = ir.incident_id
      JOIN
        public.incident_asset_user_details iaud ON i.incident_id = iaud.incident_details_id
      -- Join with CI table to get the CI name
      JOIN
        public.ci ci ON iaud.ci_details_id = ci.ci_id
      -- Join with user_details table for user_assigned_to_id
      LEFT JOIN
        public.user_details u_assigned ON iaud.user_assigned_to_id = u_assigned.user_id
      -- Join with user_details table for user_opened_by_id
      LEFT JOIN
        public.user_details u_opened ON iaud.user_opened_by_id = u_opened.user_id
      -- Join with user_details table for initiated_for_user_id (initiator)
      LEFT JOIN
        public.user_details u_initiator ON iaud.initiated_for_user_id = u_initiator.user_id
      -- Join with support_group_detail table to get the support group name
      LEFT JOIN
        public.support_group_detail sg ON iaud.support_group_id = sg.support_group_id
      -- Join with call_type table to get the call type name
      LEFT JOIN
        public.call_type ct ON ir.call_type_id = ct.id
      -- Join with status table to get the status name
      LEFT JOIN
        public.status st ON ir.status_id = st.id
      -- Join with call_mode table to get the call mode name
      LEFT JOIN
        public.call_mode cm ON ir.call_mode_id = cm.id
      -- Join with priority table to get the priority name
      LEFT JOIN
        public.priority p ON ir.priority_id = p.priority_id
      -- Join with sla table to get the SLA time
      LEFT JOIN
        public.sla sla ON ir.sla_id = sla.sla_id

      WHERE sg.support_group_id = $1 and st.status_name = 'Open' or st.status_name = 'In Progress';
    `;

    const result = await client.query(query, [supportGroupId]); // Use userId

    if (result.rows.length === 0) {
      return res.status(200).json({
        message: "No incidents found for this user's support group",
      });
    }

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching Open incidents:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    client.release(); // Release the client back to the pool
  }
};

const getUserIncidents = async (req, res) => {
  const userId = req.user.userId; // Extract userId directly from the token
  console.log("Requested User ID:", userId);

  const client = await pool.connect(); // Use a client to manage transactions

  try {
    const query = `
      SELECT
        i.incident_id,
        i.issue_description,
        ir.call_type_id,
        ct.call_type_name,           -- Call type name from call_type table
        ir.status_id,
        st.status_name,              -- Status name from status table
        ir.call_mode_id,
        cm.mode AS call_mode,        -- Call mode name from call_mode table
        ir.priority_id,
        p.priority_name,             -- Priority name from priority table
        ir.sla_id,
        sla.sla_time,                -- SLA time from sla table
        iaud.ci_details_id,
        ci.ci_name AS ci_detail_name, -- CI name from ci table
        iaud.user_assigned_to_id,
        concat(u_assigned.first_name,' ',u_assigned.last_name) AS user_assigned_to_name,  -- Name of the user assigned to the incident
        iaud.user_opened_by_id,
        concat(u_opened.first_name,' ',u_opened.last_name) AS user_opened_by_name,      -- Name of the user who opened the incident
        iaud.support_group_id,
        sg.support_group_name AS support_group_name,    -- Support group name
        iaud.initiated_for_user_id,
        concat(u_initiator.first_name,' ',u_initiator.last_name) AS initiated_for_user_name -- Name of the user from the dropdown (initiator)
      
      FROM
        public.incident i
      JOIN
        public.incident_relation ir ON i.incident_id = ir.incident_id
      JOIN
        public.incident_asset_user_details iaud ON i.incident_id = iaud.incident_details_id
      JOIN
        public.ci ci ON iaud.ci_details_id = ci.ci_id
      LEFT JOIN
        public.user_details u_assigned ON iaud.user_assigned_to_id = u_assigned.user_id
      LEFT JOIN
        public.user_details u_opened ON iaud.user_opened_by_id = u_opened.user_id
      LEFT JOIN
        public.user_details u_initiator ON iaud.initiated_for_user_id = u_initiator.user_id
      LEFT JOIN
        public.support_group_detail sg ON iaud.support_group_id = sg.support_group_id
      LEFT JOIN
        public.incident_log_notes ln ON i.incident_id = ln.incident_id
      LEFT JOIN
        public.call_type ct ON ir.call_type_id = ct.id
      LEFT JOIN
        public.status st ON ir.status_id = st.id
      LEFT JOIN
        public.call_mode cm ON ir.call_mode_id = cm.id
      LEFT JOIN
        public.priority p ON ir.priority_id = p.priority_id
      LEFT JOIN
        public.sla sla ON ir.sla_id = sla.sla_id
      WHERE
        iaud.initiated_for_user_id = $1;  -- Filter by the user_id
    `;

    const result = await client.query(query, [userId]); // Pass userId as array

    if (result.rows.length === 0) {
      return res
        .status(200)
        .json({ message: "No incidents found for this user" });
    }

    res.status(200).json(result.rows); // Return all incidents for the user
  } catch (err) {
    console.error("Error fetching user incidents:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    client.release(); // Release the client back to the pool
  }
};

const getIncidentAssetUserDetailsByAssignedUser = async (req, res) => {
  try {
    const userId = req.user.userId; // Extract the user ID from the authenticated request

    const query = `
      SELECT
        i.incident_id,
        i.issue_description,
        ir.call_type_id,
        ct.call_type_name, -- Call type name from call_type table
        ir.status_id,
        st.status_name, -- Status name from status table
        ir.call_mode_id,
        cm.mode AS call_mode, -- Call mode name from call_mode table
        ir.priority_id,
        p.priority_name, -- Priority name from priority table
        ir.sla_id,
        sla.sla_time, -- SLA time from sla table
        iaud.ci_details_id,
        ci.ci_name AS ci_detail_name, -- CI name from ci table
        iaud.user_assigned_to_id,
        concat(u_assigned.first_name, ' ', u_assigned.last_name) AS user_assigned_to_name, -- Name of the user assigned to the incident
        iaud.user_opened_by_id,
        concat(u_opened.first_name, ' ', u_opened.last_name) AS user_opened_by_name, -- Name of the user who opened the incident
        iaud.support_group_id,
        sg.support_group_name AS support_group_name, -- Support group name
        iaud.initiated_for_user_id,
        concat(u_initiator.first_name, ' ', u_initiator.last_name) AS initiated_for_user_name -- Name of the user from the dropdown (initiator)
      FROM
        public.incident i
      JOIN
        public.incident_relation ir ON i.incident_id = ir.incident_id
      JOIN
        public.incident_asset_user_details iaud ON i.incident_id = iaud.incident_details_id
      JOIN
        public.ci ci ON iaud.ci_details_id = ci.ci_id
      LEFT JOIN
        public.user_details u_assigned ON iaud.user_assigned_to_id = u_assigned.user_id
      LEFT JOIN
        public.user_details u_opened ON iaud.user_opened_by_id = u_opened.user_id
      LEFT JOIN
        public.user_details u_initiator ON iaud.initiated_for_user_id = u_initiator.user_id
      LEFT JOIN
        public.support_group_detail sg ON iaud.support_group_id = sg.support_group_id
      LEFT JOIN
        public.call_type ct ON ir.call_type_id = ct.id
      LEFT JOIN
        public.status st ON ir.status_id = st.id
      LEFT JOIN
        public.call_mode cm ON ir.call_mode_id = cm.id
      LEFT JOIN
        public.priority p ON ir.priority_id = p.priority_id
      LEFT JOIN
        public.sla sla ON ir.sla_id = sla.sla_id
      WHERE
        iaud.user_assigned_to_id = $1;`;

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return res
        .status(200)
        .json({ message: "No incidents found for the assigned user" });
    }

    res.status(200).json(result.rows); // Return the fetched incidents
  } catch (err) {
    console.error(
      "Error fetching incidents for the assigned user:",
      err.message
    );
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const updateIncident = async (req, res) => {
  const incidentId = req.params.id;
  const user = req.user.userId;
  const {
    issue_description,
    sla_id,
    call_type_id, //fetch id
    status_id, // fetch id close and surrender
    call_mode_id,
    priority_id,
    user_assigned_to_id,
    user_id,
    support_group_id,
    ci_details_id,
    log_notes,
  } = req.body;
  console.log("Request Body:", req.body);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Set current user in session for any triggers/functions that may use it
    await client.query("SELECT set_config('app.current_user_id', $1, false)", [
      user,
    ]);

    // Fetch old values
    const oldValuesResult = await client.query(
      `SELECT * FROM public.incident i
      LEFT JOIN public.incident_relation ir ON i.incident_id = ir.incident_id
      LEFT JOIN public.incident_asset_user_details iaud ON i.incident_id = iaud.incident_details_id
      WHERE i.incident_id = $1`,
      [incidentId]
    );

    if (oldValuesResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Incident not found" });
    }

    const oldValues = oldValuesResult.rows[0];

    // Update incident table using COALESCE
    const incidentResult = await client.query(
      `UPDATE public.incident
      SET 
        issue_description = COALESCE($1, issue_description),
        updated_at = NOW()
      WHERE incident_id = $2 
      RETURNING *`,
      [issue_description, incidentId]
    );

    // Update incident_relation table using COALESCE
    const relationResult = await client.query(
      `UPDATE public.incident_relation
      SET 
        sla_id = COALESCE($1, sla_id),
        call_type_id = COALESCE($2, call_type_id),
        status_id = COALESCE($3, status_id),
        call_mode_id = COALESCE($4, call_mode_id),
        priority_id = COALESCE($5, priority_id)
      WHERE incident_id = $6 
      RETURNING *`,
      [sla_id, call_type_id, status_id, call_mode_id, priority_id, incidentId]
    );

    // Update incident_asset_user_details table using COALESCE
    const assetUserResult = await client.query(
      `UPDATE public.incident_asset_user_details
      SET 
        user_assigned_to_id = COALESCE($1, user_assigned_to_id),
        initiated_for_user_id = COALESCE($2, initiated_for_user_id),
        support_group_id = COALESCE($3, support_group_id),
        ci_details_id = COALESCE($4, ci_details_id)
      WHERE incident_details_id = $5 
      RETURNING *`,
      [
        user_assigned_to_id,
        user_id,
        support_group_id,
        ci_details_id,
        incidentId,
      ]
    );

    if (status_id === 2 && call_type_id === 6) {
      // Assuming 2 is 'closed' and 6 is 'surrender'
      console.log("Updating asset_assigned_to table...");

      // Step 1: Fetch the ci_id from the incident_asset_user_details table based on incident_id
      const ciResult = await client.query(
        `SELECT ci_details_id FROM public.incident_asset_user_details
         WHERE incident_details_id = $1`,
        [incidentId]
      );

      if (ciResult.rowCount > 0) {
        const ciId = ciResult.rows[0].ci_details_id;

        // Step 2: Fetch the asset_id based on the ci_id from the asset_ci table
        const assetResult = await client.query(
          `SELECT asset_id FROM public.asset_ci
           WHERE ci_id = $1`,
          [ciId]
        );

        if (assetResult.rowCount > 0) {
          const assetId = assetResult.rows[0].asset_id;

          // Step 3: Fetch the current assigned user before updating
          const assignedToResult = await client.query(
            `SELECT asset_owner_id FROM public.asset_assigned_to
             WHERE asset_id = $1`,
            [assetId] // Correct asset_id is used here
          );

          console.log("Assigned To Result:", assignedToResult.rows);

          if (assignedToResult.rowCount > 0) {
            const previousAssignedTo = assignedToResult.rows[0].asset_owner_id;

            // Step 4: Update the `asset_assigned_to` table to reflect the new user (1081)
            await client.query(
              `UPDATE public.asset_assigned_to
               SET asset_owner_id = 1081
               WHERE asset_id = $1`,
              [assetId] // Correct asset_id is used here
            );

            // Step 5: Insert into `asset_history` with both previous and new assigned user
            await client.query(
              `INSERT INTO public.asset_history (asset_id, assigned_to, assigned_date, previous_assigned_to, status_id, updated_by)
               VALUES ($1, $2, NOW(), $3, $4, $5)`,
              [assetId, 1081, previousAssignedTo, status_id, user]
            );
          } else {
            console.log("No asset found for the given asset ID.");
          }
        } else {
          console.log("No asset found for the given CI ID.");
        }
      } else {
        console.log("No CI ID found for the given incident ID.");
      }
    }

    // Insert into incident_audit table if there are changes
    const changes = {
      issue_description: incidentResult.rows[0].issue_description,
      sla_id: relationResult.rows[0].sla_id,
      user_assigned_to_id: assetUserResult.rows[0].user_assigned_to_id,
      // Add other fields as necessary
    };

    if (Object.keys(changes).length > 0) {
      await client.query(
        `INSERT INTO public.incident_audit (incident_id, old_values, new_values, updated_at, user_id)
        VALUES ($1, $2, $3, NOW(), $4)`,
        [incidentId, JSON.stringify(oldValues), JSON.stringify(changes), user]
      );
    }

    // Add log notes if provided
    if (log_notes) {
      await client.query(
        `INSERT INTO public.incident_log_notes (incident_id, user_id, log_notes)
        VALUES ($1, $2, $3)`,
        [incidentId, user, log_notes]
      );
    }

    // Handle file attachments
    if (req.files && req.files.length > 0) {
      const path =
        "http://172.16.16.66:4000/assets/attachments/incident_attachment/";
      await Promise.all(
        req.files.map(async (file) => {
          const filePath = `${path}${file.filename}`;
          await client.query(
            `INSERT INTO incident_attachment (incident_id, file_path) VALUES ($1, $2)`,
            [incidentId, filePath]
          );
        })
      );
    }
    // After updating incident_asset_user_details table
    const oldAssignmentResult = await client.query(
      `SELECT user_assigned_to_id FROM public.incident_asset_user_details
      WHERE incident_details_id = $1`,
      [incidentId]
    );

    const oldAssignedUser = oldAssignmentResult.rows[0]?.user_assigned_to_id;
    const newAssignedUser = assetUserResult.rows[0]?.user_assigned_to_id;
    console.log("Old Assigned User:", oldAssignedUser);
    console.log("New Assigned User:", newAssignedUser);

    if (oldAssignedUser !== newAssignedUser) {
      const newUserDetailsResult = await client.query(
        `SELECT email_id, first_name || ' ' || last_name AS full_name
        FROM public.user_details
        WHERE user_id = $1`,
        [newAssignedUser]
      );

      if (newUserDetailsResult.rowCount > 0) {
        const { email_id, full_name } = newUserDetailsResult.rows[0];

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email_id,
          subject: `Ticket Assigned: ${incidentId}`,
          text: `Hello ${full_name},\n\nA ticket has been assigned to you.\n\nIncident ID: ${incidentId}\nDescription: ${issue_description}\n\nPlease review it at your earliest convenience.\n\nBest Regards,\nIncident Management Team`,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Assignment email sent to ${email_id}`);
      }
    }

        // After all updates and before COMMIT
    if (status_id === 2) { // Assuming '2' represents 'closed' status
      const userDetailsResult = await client.query(
        `SELECT email_id, first_name || ' ' || last_name AS full_name
        FROM public.user_details
        WHERE user_id = $1`,
        [user]
      );

      if (userDetailsResult.rowCount > 0) {
        const { email_id, full_name } = userDetailsResult.rows[0];

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email_id,
          subject: `Ticket Closed: ${incidentId}`,
          text: `Hello ${full_name},\n\nYour ticket with Incident ID: ${incidentId} has been closed.\n\nDescription: ${issue_description}\n\nThank you for using our service.\n\nBest Regards,\nIncident Management Team`,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Closure email sent to ${email_id}`);
      }
    }



    await client.query("COMMIT");
    res.status(200).json({ message: "Incident updated successfully" });
  } catch (err) {
    console.error("Error updating incident:", err);
    await client.query("ROLLBACK");
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    client.release();
  }
};

const deleteIncidentAttachmentById = async (req, res) => {
  const { id } = req.params;
  let client;

  try {
    client = await pool.connect();
    const query = `DELETE FROM public.incident_attachment WHERE id = $1;`;
    const result = await client.query(query, [id]);

    if (result.rowCount === 0) {
      // No rows were affected, meaning the attachment with the provided ID does not exist
      return res.status(404).json({ message: "Incident attachment not found" });
    }

    res
      .status(200)
      .json({ message: "Incident attachment deleted successfully" });
  } catch (err) {
    console.error("Error deleting incident attachment:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    if (client) client.release();
  }
};

module.exports = {
  getUserAssets,
  createIncident,
  getIncidents,
  updateIncident,
  getClosedIncidents,
  getInProgressIncidents,
  getOpenIncidents,
  getIncidentById,
  getonholdIncidents,
  getUserIncidents,
  getUserIncidentsBySupportGroup,
  getIncidentAssetUserDetailsByAssignedUser,
  deleteIncidentAttachmentById,
};

// SELECT
//     i.incident_id,
//     i.issue_description,
//     ir.call_type_id,
//     ct.call_type_name,           -- Call type name from call_type table
//     ir.status_id,
//     st.status_name,              -- Status name from status table
//     ir.call_mode_id,
//     cm.mode AS call_mode,        -- Call mode name from call_mode table
//     ir.priority_id,
//     p.priority_name,             -- Priority name from priority table
//     ir.sla_id,
//     sla.sla_time,                -- SLA time from sla table
//     iaud.ci_details_id,
//     ci.ci_name AS ci_detail_name, -- CI name from ci table
//     iaud.user_assigned_to_id,
//     concat(u_assigned.first_name,' ',u_assigned.last_name) AS user_assigned_to_name,  -- Name of the user assigned to the incident
//     iaud.user_opened_by_id,
//     concat(u_opened.first_name,' ',u_opened.last_name) AS user_opened_by_name,      -- Name of the user who opened the incident
//     iaud.support_group_id,
//     sg.support_group_name AS support_group_name,    -- Support group name
//     iaud.initiated_for_user_id,
//     concat(u_initiator.first_name,' ',u_initiator.last_name) AS initiated_for_user_name    -- Name of the user from the dropdown (initiator)
// FROM
//     public.incident i
// JOIN
//     public.incident_relation ir ON i.incident_id = ir.incident_id
// JOIN
//     public.incident_asset_user_details iaud ON i.incident_id = iaud.incident_details_id
// -- Join with CI table to get the CI name
// JOIN
//     public.ci ci ON iaud.ci_details_id = ci.ci_id
// -- Join with user_details table for user_assigned_to_id
// LEFT JOIN
//     public.user_details u_assigned ON iaud.user_assigned_to_id = u_assigned.user_id
// -- Join with user_details table for user_opened_by_id
// LEFT JOIN
//     public.user_details u_opened ON iaud.user_opened_by_id = u_opened.user_id
// -- Join with user_details table for initiated_for_user_id (initiator)
// LEFT JOIN
//     public.user_details u_initiator ON iaud.initiated_for_user_id = u_initiator.user_id
// -- Join with support_group_detail table to get the support group name
// LEFT JOIN
//     public.support_group_detail sg ON iaud.support_group_id = sg.support_group_id
// -- Join with call_type table to get the call type name
// LEFT JOIN
//     public.call_type ct ON ir.call_type_id = ct.id
// -- Join with status table to get the status name
// LEFT JOIN
//     public.status st ON ir.status_id = st.id
// -- Join with call_mode table to get the call mode name
// LEFT JOIN
//     public.call_mode cm ON ir.call_mode_id = cm.id
// -- Join with priority table to get the priority name
// LEFT JOIN
//     public.priority p ON ir.priority_id = p.priority_id
// -- Join with sla table to get the SLA time
// LEFT JOIN
//     public.sla sla ON ir.sla_id = sla.sla_id;
