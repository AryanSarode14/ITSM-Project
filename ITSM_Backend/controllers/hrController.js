const pool = require("../db/db");
const upload = require("../helper/storage.js");

// Controller to create a new HR request
const createHrRequest = async (req, res) => {
  const {
    issue_desc,
    call_mode_id,
    status_id,
    call_type_id,
    sla_id,
    service_id,
    support_group_id,
    ci_id,
  } = req.body;

  console.log(req.body);

  try {
    const user_id = req.user.userId;
    console.log(user_id);

    // Insert into the HR request table
    const hrRequestQuery = `
          INSERT INTO public.hr_request (issue_desc) 
          VALUES ($1) 
          RETURNING hr_id;
      `;
    const hrRequestValues = [issue_desc];
    const hrRequestResult = await pool.query(hrRequestQuery, hrRequestValues);
    const hr_id = hrRequestResult.rows[0].hr_id;

    // Insert into the hr_request_relation table
    const relationQuery = `
          INSERT INTO public.hr_request_relation (
              call_mode_id, status_id, call_type_id, 
              sla_id, service_id, 
              support_group_id, hr_request_id, owner_id, ci_id
          ) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
      `;
    const relationValues = [
      call_mode_id,
      status_id,
      call_type_id,
      sla_id,
      service_id,
      support_group_id,
      hr_id,
      user_id,
      ci_id,
    ];
    await pool.query(relationQuery, relationValues);

    // Fetch all valid ci_ids for the given service_id
    const validCiIdsQuery = `
          SELECT ci_id 
          FROM public.user_ci_relation 
          WHERE ci_service_id = $1;
      `;
    const validCiIdsResult = await pool.query(validCiIdsQuery, [service_id]);
    const validCiIds = validCiIdsResult.rows.map((row) => parseInt(row.ci_id));

    console.log(ci_id);
    console.log(service_id);
    console.log(validCiIds);

    // Ensure ci_detail_id is a string for comparison
    if (!validCiIds.includes(ci_id)) {
      throw new Error("Selected CI ID is not valid for the given service ID");
    }

    // Fetch ci_name based on selected_ci_id
    const ciNameQuery = `
          SELECT ci_name 
          FROM public.ci 
          WHERE ci_id = $1;
      `;
    const ciNameResult = await pool.query(ciNameQuery, [ci_id]);
    const ci_name = ciNameResult.rows[0]?.ci_name;

    if (!ci_name) {
      throw new Error("CI Name not found for the given CI ID");
    }

    // Insert into the hr_assigned_to table
    const assignedToQuery = `
          INSERT INTO public.hr_assigned_to (
              hr_detail_id, ci_detail_id, service_detail_id, 
               support_group_id
          ) 
          VALUES ($1, $2, $3, $4);
      `;
    const assignedToValues = [hr_id, ci_id, service_id, support_group_id];
    await pool.query(assignedToQuery, assignedToValues);

    if (req.files) {
      const path =
        "http://172.16.16.66:4000/assets/attachments/incident_attachment/";
      for (let i = 0; i < req.files.length; i++) {
        const findAllQuery = `
          INSERT INTO hr_attachment (hr_id, file_path) 
          VALUES ($1, $2);
        `;
        const attachmentValues = [hr_id, `${path}${req.files[i].filename}`];
        await pool.query(findAllQuery, attachmentValues);
      }
    }

    res.status(201).json({
      message: "HR request created successfully",
      hr_id: hr_id,
      ci_name: ci_name, // Optional: include ci_name in the response if needed
    });
  } catch (err) {
    console.error("Error creating HR request:", err.message);
    res.status(500).json({ message: err.message }); // Return specific error message
  }
};

// Controller to get CI by service_id
const getCibyService = async (req, res) => {
  try {
    const { service_id } = req.params;

    const query = `
      SELECT ci.ci_id, ci.ci_name
      FROM public.ci
      JOIN public.user_ci_relation ucr
      ON ci.ci_id = ucr.ci_id
      WHERE ucr.ci_service_id = $1;
    `;

    const result = await pool.query(query, [service_id]);

    // Check if data is found and return it
    if (result.rows.length > 0) {
      res.status(200).json(result.rows);
    } else {
      res.status(200).json({ message: "No CI found for the given service_id" });
    }
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Controller to get all HR requests
const getAllHrRequests = async (req, res) => {
  const client = await pool.connect(); // Obtain a client from the pool

  try {
    console.log(req.user);
    // Query to get data from hr_request, hr_request_relation, and related tables
    const query = `
         SELECT 
        hr.hr_id,
        hr.issue_desc,
        cm.mode AS mode,
        cm.id AS call_mode_id,
        s.status_name AS status_name,
        s.id AS status_id,
        ct.call_type_name AS call_type_name,
        ct.id AS call_type_id,
        sla.sla_time AS sla_time,
        sla.sla_id AS sla_id,
        se.service_name AS service_name,
        se.service_id AS service_id,
        sg.support_group_name AS support_group_name,
        sg.support_group_id AS support_group_id,
        ci.ci_name AS ci_name,
        ci.ci_id AS ci_id,
        ud.user_id AS user_id,
        CONCAT(ud.first_name, ' ', ud.last_name) AS user_name,
        hat.user_assigned_to_id AS user_assigned_to_id,
        CONCAT(assigned_to.first_name, ' ', assigned_to.last_name) AS user_assigned_to_name
    FROM public.hr_request hr
    LEFT JOIN public.hr_request_relation hr_rel
        ON hr.hr_id = hr_rel.hr_request_id
    LEFT JOIN public.call_mode cm
        ON hr_rel.call_mode_id = cm.id
    LEFT JOIN public.status s
        ON hr_rel.status_id = s.id
    LEFT JOIN public.call_type ct
        ON hr_rel.call_type_id = ct.id
    LEFT JOIN public.sla sla
        ON hr_rel.sla_id = sla.sla_id
    LEFT JOIN public.service se
        ON hr_rel.service_id = se.service_id
    LEFT JOIN public.support_group_detail sg
        ON hr_rel.support_group_id = sg.support_group_id
    LEFT JOIN public.ci ci
        ON hr_rel.ci_id = ci.ci_id
    LEFT JOIN public.user_details ud
        ON hr_rel.owner_id = ud.user_id
    LEFT JOIN hr_assigned_to hat
        ON hat.hr_detail_id = hr.hr_id
    LEFT JOIN public.user_details assigned_to
        ON hat.user_assigned_to_id = assigned_to.user_id
      `;

    const result = await client.query(query);

    res.status(200).json({
      message: "HR requests retrieved successfully",
      data: result.rows,
    });
  } catch (err) {
    console.error("Error retrieving HR requests:", err.message);
    res.status(500).json({
      message: "Server error",
      error: err.message, // Be cautious with exposing internal error details
    });
  } finally {
    client.release(); // Release the client back to the pool
  }
};

// Controller to get User Tickets
const getUserTickets = async (req, res) => {
  const client = await pool.connect(); // Obtain a client from the pool
  const user_id = req.user.userId;
  console.log(user_id);
  try {
    // Query to get data from hr_request, hr_request_relation, and related tables for a specific user
    const query = `
   
         SELECT 
        hr.hr_id,
        hr.issue_desc,
        cm.mode AS mode,
        cm.id AS call_mode_id,
        s.status_name AS status_name,
        s.id AS status_id,
        ct.call_type_name AS call_type_name,
        ct.id AS call_type_id,
        sla.sla_time AS sla_time,
        sla.sla_id AS sla_id,
        se.service_name AS service_name,
        se.service_id AS service_id,
        sg.support_group_name AS support_group_name,
        sg.support_group_id AS support_group_id,
        ci.ci_name AS ci_name,
        ci.ci_id AS ci_id,
        cast(ud.user_id AS TEXT) AS user_id,
        CONCAT(ud.first_name, ' ', ud.last_name) AS user_name,
        cast(hat.user_assigned_to_id AS TEXT) AS user_assigned_to_id,
        CONCAT(assigned_to.first_name, ' ', assigned_to.last_name) AS user_assigned_to_name
    FROM public.hr_request hr
    LEFT JOIN public.hr_request_relation hr_rel
        ON hr.hr_id = hr_rel.hr_request_id
    LEFT JOIN public.call_mode cm
        ON hr_rel.call_mode_id = cm.id
    LEFT JOIN public.status s
        ON hr_rel.status_id = s.id
    LEFT JOIN public.call_type ct
        ON hr_rel.call_type_id = ct.id
    LEFT JOIN public.sla sla
        ON hr_rel.sla_id = sla.sla_id
    LEFT JOIN public.service se
        ON hr_rel.service_id = se.service_id
    LEFT JOIN public.support_group_detail sg
        ON hr_rel.support_group_id = sg.support_group_id
    LEFT JOIN public.ci ci
        ON hr_rel.ci_id = ci.ci_id
    LEFT JOIN public.user_details ud
        ON hr_rel.owner_id = ud.user_id
    LEFT JOIN hr_assigned_to hat
        ON hat.hr_detail_id = hr.hr_id
    LEFT JOIN public.user_details assigned_to
        ON hat.user_assigned_to_id = assigned_to.user_id
      WHERE hr_rel.owner_id = $1;
    `;

    const result = await client.query(query, [user_id]);

    if (result.rows.length === 0) {
      return res
        .status(200)
        .json({ message: "No HR requests found for this user" });
    }

    // Return all rows associated with the user
    res.status(200).json({
      message: "HR requests retrieved successfully",
      data: result.rows, // Return the entire array of HR requests
    });
  } catch (err) {
    console.error("Error retrieving HR requests:", err.message);
    res.status(500).json({
      message: "Server error",
      error: err.message, // Be cautious with exposing internal error details
    });
  } finally {
    client.release(); // Release the client back to the pool
  }
};

// Controller to get all HR by support group
const getHrRequestBySupportGroup = async (req, res) => {
  const user_id = req.user.userId;
  const client = await pool.connect(); // Obtain a client from the pool

  try {
    // Query to get the support_group_id for the user
    const supportGroupQuery = `SELECT support_group_id FROM user_relation WHERE user_id = $1`;
    const supportGroupResult = await client.query(supportGroupQuery, [user_id]);

    if (supportGroupResult.rows.length === 0) {
      return res
        .status(200)
        .json({ message: "Support group not found for the user" });
    }

    const support_group_id = supportGroupResult.rows[0].support_group_id;

    // Query to retrieve HR requests based on support_group_id
    const hrRequestQuery = `
      SELECT 
        hr.hr_id,
        hr.issue_desc,
        cm.mode AS mode,
        cm.id AS call_mode_id,
        s.status_name AS status_name,
        s.id AS status_id,
        ct.call_type_name AS call_type_name,
        ct.id AS call_type_id,
        sla.sla_time AS sla_time,
        sla.sla_id AS sla_id,
        se.service_name AS service_name,
        se.service_id AS service_id,
        sg.support_group_name AS support_group_name,
        sg.support_group_id AS support_group_id,
        ci.ci_name AS ci_name,
        ci.ci_id AS ci_id,
        CAST(ud.user_id AS TEXT) AS user_id,
        CONCAT(ud.first_name, ' ', ud.last_name) AS user_name,
        CAST(hat.user_assigned_to_id AS TEXT) AS user_assigned_to_id,
        CONCAT(assigned_to.first_name, ' ', assigned_to.last_name) AS user_assigned_to_name
      FROM public.hr_request hr
      LEFT JOIN public.hr_request_relation hr_rel ON hr.hr_id = hr_rel.hr_request_id
      LEFT JOIN public.call_mode cm ON hr_rel.call_mode_id = cm.id
      LEFT JOIN public.status s ON hr_rel.status_id = s.id
      LEFT JOIN public.call_type ct ON hr_rel.call_type_id = ct.id
      LEFT JOIN public.sla sla ON hr_rel.sla_id = sla.sla_id
      LEFT JOIN public.service se ON hr_rel.service_id = se.service_id
      LEFT JOIN public.support_group_detail sg ON hr_rel.support_group_id = sg.support_group_id
      LEFT JOIN public.ci ci ON hr_rel.ci_id = ci.ci_id
      LEFT JOIN public.user_details ud ON hr_rel.owner_id = ud.user_id
      LEFT JOIN hr_assigned_to hat ON hat.hr_detail_id = hr.hr_id
      LEFT JOIN public.user_details assigned_to ON hat.user_assigned_to_id = assigned_to.user_id
      WHERE hr_rel.support_group_id = $1 AND (s.status_name = 'Open' or s.status_name='In Progress');`;

    // Execute the query to retrieve HR requests
    const hrRequestResult = await client.query(hrRequestQuery, [
      support_group_id,
    ]);

    if (hrRequestResult.rows.length === 0) {
      return res
        .status(200)
        .json({ message: "No HR requests found for this support group" });
    }

    // Return the retrieved HR requests
    res.status(200).json({
      message: "HR requests retrieved successfully",
      data: hrRequestResult.rows, // Return all matching rows
    });
  } catch (err) {
    console.error("Error retrieving HR requests:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    client.release(); // Release the client back to the pool
  }
};

// Controller to get HR request by assigned_to
const getHrRequestForAssignedTo = async (req, res) => {
  const user_id = req.user.userId; // Get user ID from the request
  const client = await pool.connect(); // Obtain a client from the pool

  try {
    // Query to find HR requests assigned to this user from hr_assigned_to
    const assignedToQuery = `
      SELECT hr_detail_id 
      FROM public.hr_assigned_to 
      WHERE user_assigned_to_id = $1
    `;
    const assignedToResult = await client.query(assignedToQuery, [user_id]);
    console.log("Assigned Users : ", assignedToResult);
    if (assignedToResult.rows.length === 0) {
      return res
        .status(200)
        .json({ message: "No HR requests assigned to this user" });
    }

    // Extract hr_id values from the result
    const hr_ids = assignedToResult.rows.map((row) => row.hr_detail_id);
    console.log(hr_ids);
    // Query to retrieve HR request details based on hr_id(s) found
    const hrRequestQuery = `
      SELECT 
        hr.hr_id,
        hr.issue_desc,
        cm.mode AS mode,
        cm.id AS call_mode_id,
        s.status_name AS status_name,
        s.id AS status_id,
        ct.call_type_name AS call_type_name,
        ct.id AS call_type_id,
        sla.sla_time AS sla_time,
        sla.sla_id AS sla_id,
        se.service_name AS service_name,
        se.service_id AS service_id,
        sg.support_group_name AS support_group_name,
        sg.support_group_id AS support_group_id,
        ci.ci_name AS ci_name,
        ci.ci_id AS ci_id,
        cast(ud.user_id AS TEXT) AS user_id,
        CONCAT(ud.first_name, ' ', ud.last_name) AS user_name,
        cast(hat.user_assigned_to_id AS TEXT) AS user_assigned_to_id,
        CONCAT(assigned_to.first_name, ' ', assigned_to.last_name) AS user_assigned_to_name
    FROM public.hr_request hr
    LEFT JOIN public.hr_request_relation hr_rel
        ON hr.hr_id = hr_rel.hr_request_id
    LEFT JOIN public.call_mode cm
        ON hr_rel.call_mode_id = cm.id
    LEFT JOIN public.status s
        ON hr_rel.status_id = s.id
    LEFT JOIN public.call_type ct
        ON hr_rel.call_type_id = ct.id
    LEFT JOIN public.sla sla
        ON hr_rel.sla_id = sla.sla_id
    LEFT JOIN public.service se
        ON hr_rel.service_id = se.service_id
    LEFT JOIN public.support_group_detail sg
        ON hr_rel.support_group_id = sg.support_group_id
    LEFT JOIN public.ci ci
        ON hr_rel.ci_id = ci.ci_id
    LEFT JOIN public.user_details ud
        ON hr_rel.owner_id = ud.user_id
    LEFT JOIN hr_assigned_to hat
        ON hat.hr_detail_id = hr.hr_id
    LEFT JOIN public.user_details assigned_to
        ON hat.user_assigned_to_id = assigned_to.user_id
      WHERE hat.hr_detail_id = ANY($1::int[]);
    `;

    // Execute the HR request query
    const hrRequestResult = await client.query(hrRequestQuery, [hr_ids]);

    if (hrRequestResult.rows.length === 0) {
      return res.status(200).json({
        message: "No HR request details found for the assigned HR requests",
      });
    }

    // Return the retrieved HR requests
    res.status(200).json({
      message: "HR requests retrieved successfully for the assigned user",
      data: hrRequestResult.rows, // Return all matching HR requests
    });
  } catch (err) {
    console.error("Error retrieving HR requests:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    client.release(); // Release the client back to the pool
  }
};

// Controller to get HR request by ID
const getHrRequestById = async (req, res) => {
  const { id } = req.params; // Get the hr_id from the request parameters
  const client = await pool.connect(); // Obtain a client from the pool

  try {
    // Query to get data from hr_request, hr_request_relation, and related tables for a specific hr_id
    const query = `
    SELECT 
        hr.hr_id,
        hr.issue_desc,
        cm.mode AS mode,
        cm.id AS call_mode_id,
        s.status_name AS status_name,
        s.id AS status_id,
        ct.call_type_name AS call_type_name,
        ct.id AS call_type_id,
        sla.sla_time AS sla_time,
        sla.sla_id AS sla_id,
        se.service_name AS service_name,
        se.service_id AS service_id,
        sg.support_group_name AS support_group_name,
        sg.support_group_id AS support_group_id,
        ci.ci_name AS ci_name,
        ci.ci_id AS ci_id,
        ud.user_id AS user_id,
        CONCAT(ud.first_name, ' ', ud.last_name) AS user_name,
        hat.user_assigned_to_id AS user_assigned_to_id,
        CONCAT(assigned_to.first_name, ' ', assigned_to.last_name) AS user_assigned_to_name,
        hra.file_path as attachment
    FROM public.hr_request hr
    LEFT JOIN public.hr_attachment hra
        ON hr.hr_id = hra.hr_id
    LEFT JOIN public.hr_request_relation hr_rel
        ON hr.hr_id = hr_rel.hr_request_id
    LEFT JOIN public.call_mode cm
        ON hr_rel.call_mode_id = cm.id
    LEFT JOIN public.status s
        ON hr_rel.status_id = s.id
    LEFT JOIN public.call_type ct
        ON hr_rel.call_type_id = ct.id
    LEFT JOIN public.sla sla
        ON hr_rel.sla_id = sla.sla_id
    LEFT JOIN public.service se
        ON hr_rel.service_id = se.service_id
    LEFT JOIN public.support_group_detail sg
        ON hr_rel.support_group_id = sg.support_group_id
    LEFT JOIN public.ci ci
        ON hr_rel.ci_id = ci.ci_id
    LEFT JOIN public.user_details ud
        ON hr_rel.owner_id = ud.user_id
    LEFT JOIN public.hr_assigned_to hat
        ON hat.hr_detail_id = hr.hr_id
    LEFT JOIN public.user_details assigned_to
        ON hat.user_assigned_to_id = assigned_to.user_id
    WHERE hr.hr_id = $1;
`;

    const result = await client.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(200).json({ message: "HR request not found" });
    }

    // Fetch all log notes for the given hr_id
    const logNoteQuery = `
SELECT hr_log_note.log_note, hr_log_note.created_at, ud.user_id, CONCAT(ud.first_name, ' ', ud.last_name) AS user_name
FROM public.hr_log_note
LEFT JOIN public.user_details ud ON hr_log_note.user_id = ud.user_id
WHERE hr_log_note.hr_id = $1
ORDER BY hr_log_note.created_at ASC;
`;
    const logNoteResult = await client.query(logNoteQuery, [id]);

    console.log(logNoteResult.rows);
    res.status(200).json({
      message: "HR request retrieved successfully",
      data: {
        hrRequest: result.rows[0], // Main HR request details
        logNotes: logNoteResult.rows, // All log notes related to the hr_id
      },
    });
  } catch (err) {
    console.error("Error retrieving HR request:", err.message);
    res.status(500).json({
      message: "Server error",
      error: err.message, // Be cautious with exposing internal error details
    });
  } finally {
    client.release(); // Release the client back to the pool
  }
};

// Controller for Open Status (status_id = 1)
const getHrRequestByStatusOpen = async (req, res) => {
  const client = await pool.connect(); // Obtain a client from the pool

  try {
    // Query to get data from hr_request, hr_request_relation, and related tables where status_id = 1 (open)
    const query = `
           SELECT 
        hr.hr_id,
        hr.issue_desc,
        cm.mode AS mode,
        cm.id AS call_mode_id,
        s.status_name AS status_name,
        s.id AS status_id,
        ct.call_type_name AS call_type_name,
        ct.id AS call_type_id,
        sla.sla_time AS sla_time,
        sla.sla_id AS sla_id,
        se.service_name AS service_name,
        se.service_id AS service_id,
        sg.support_group_name AS support_group_name,
        sg.support_group_id AS support_group_id,
        ci.ci_name AS ci_name,
        ci.ci_id AS ci_id,
        cast(ud.user_id AS TEXT) AS user_id,
        CONCAT(ud.first_name, ' ', ud.last_name) AS user_name,
        cast(hat.user_assigned_to_id AS TEXT) AS user_assigned_to_id,
        CONCAT(assigned_to.first_name, ' ', assigned_to.last_name) AS user_assigned_to_name
    FROM public.hr_request hr
    LEFT JOIN public.hr_request_relation hr_rel
        ON hr.hr_id = hr_rel.hr_request_id
    LEFT JOIN public.call_mode cm
        ON hr_rel.call_mode_id = cm.id
    LEFT JOIN public.status s
        ON hr_rel.status_id = s.id
    LEFT JOIN public.call_type ct
        ON hr_rel.call_type_id = ct.id
    LEFT JOIN public.sla sla
        ON hr_rel.sla_id = sla.sla_id
    LEFT JOIN public.service se
        ON hr_rel.service_id = se.service_id
    LEFT JOIN public.support_group_detail sg
        ON hr_rel.support_group_id = sg.support_group_id
    LEFT JOIN public.ci ci
        ON hr_rel.ci_id = ci.ci_id
    LEFT JOIN public.user_details ud
        ON hr_rel.owner_id = ud.user_id
    LEFT JOIN hr_assigned_to hat
        ON hat.hr_detail_id = hr.hr_id
    LEFT JOIN public.user_details assigned_to
        ON hat.user_assigned_to_id = assigned_to.user_id
          WHERE hr_rel.status_id = 1;  -- Filtering for status 'open'
        `;

    const result = await client.query(query);

    if (result.rows.length === 0) {
      return res.status(200).json({ message: "No open HR requests found" });
    }

    res.status(200).json({
      message: "Open HR requests retrieved successfully",
      data: result.rows,
    });
  } catch (err) {
    console.error("Error retrieving open HR requests:", err.message);
    res.status(500).json({
      message: "Server error",
      error: err.message, // Be cautious with exposing internal error details
    });
  } finally {
    client.release(); // Release the client back to the pool
  }
};

// Controller for Closed Status (status_id = 2)
const getHrRequestByStatusClosed = async (req, res) => {
  const client = await pool.connect();

  try {
    const query = `
           SELECT 
        hr.hr_id,
        hr.issue_desc,
        cm.mode AS mode,
        cm.id AS call_mode_id,
        s.status_name AS status_name,
        s.id AS status_id,
        ct.call_type_name AS call_type_name,
        ct.id AS call_type_id,
        sla.sla_time AS sla_time,
        sla.sla_id AS sla_id,
        se.service_name AS service_name,
        se.service_id AS service_id,
        sg.support_group_name AS support_group_name,
        sg.support_group_id AS support_group_id,
        ci.ci_name AS ci_name,
        ci.ci_id AS ci_id,
        cast(ud.user_id AS TEXT) AS user_id,
        CONCAT(ud.first_name, ' ', ud.last_name) AS user_name,
        cast(hat.user_assigned_to_id AS TEXT) AS user_assigned_to_id,
        CONCAT(assigned_to.first_name, ' ', assigned_to.last_name) AS user_assigned_to_name
    FROM public.hr_request hr
    LEFT JOIN public.hr_request_relation hr_rel
        ON hr.hr_id = hr_rel.hr_request_id
    LEFT JOIN public.call_mode cm
        ON hr_rel.call_mode_id = cm.id
    LEFT JOIN public.status s
        ON hr_rel.status_id = s.id
    LEFT JOIN public.call_type ct
        ON hr_rel.call_type_id = ct.id
    LEFT JOIN public.sla sla
        ON hr_rel.sla_id = sla.sla_id
    LEFT JOIN public.service se
        ON hr_rel.service_id = se.service_id
    LEFT JOIN public.support_group_detail sg
        ON hr_rel.support_group_id = sg.support_group_id
    LEFT JOIN public.ci ci
        ON hr_rel.ci_id = ci.ci_id
    LEFT JOIN public.user_details ud
        ON hr_rel.owner_id = ud.user_id
    LEFT JOIN hr_assigned_to hat
        ON hat.hr_detail_id = hr.hr_id
    LEFT JOIN public.user_details assigned_to
        ON hat.user_assigned_to_id = assigned_to.user_id
          WHERE hr_rel.status_id = 2;
        `;

    const result = await client.query(query);

    if (result.rows.length === 0) {
      return res.status(200).json({ message: "No closed HR requests found" });
    }

    res.status(200).json({
      message: "Closed HR requests retrieved successfully",
      data: result.rows,
    });
  } catch (err) {
    console.error("Error retrieving closed HR requests:", err.message);
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  } finally {
    client.release();
  }
};

// Controller for In Progress Status (status_id = 3)
const getHrRequestByStatusInProgress = async (req, res) => {
  const client = await pool.connect();

  try {
    const query = `
           SELECT 
        hr.hr_id,
        hr.issue_desc,
        cm.mode AS mode,
        cm.id AS call_mode_id,
        s.status_name AS status_name,
        s.id AS status_id,
        ct.call_type_name AS call_type_name,
        ct.id AS call_type_id,
        sla.sla_time AS sla_time,
        sla.sla_id AS sla_id,
        se.service_name AS service_name,
        se.service_id AS service_id,
        sg.support_group_name AS support_group_name,
        sg.support_group_id AS support_group_id,
        ci.ci_name AS ci_name,
        ci.ci_id AS ci_id,
        cast(ud.user_id AS TEXT) AS user_id,
        CONCAT(ud.first_name, ' ', ud.last_name) AS user_name,
        cast(hat.user_assigned_to_id AS TEXT) AS user_assigned_to_id,
        CONCAT(assigned_to.first_name, ' ', assigned_to.last_name) AS user_assigned_to_name
    FROM public.hr_request hr
    LEFT JOIN public.hr_request_relation hr_rel
        ON hr.hr_id = hr_rel.hr_request_id
    LEFT JOIN public.call_mode cm
        ON hr_rel.call_mode_id = cm.id
    LEFT JOIN public.status s
        ON hr_rel.status_id = s.id
    LEFT JOIN public.call_type ct
        ON hr_rel.call_type_id = ct.id
    LEFT JOIN public.sla sla
        ON hr_rel.sla_id = sla.sla_id
    LEFT JOIN public.service se
        ON hr_rel.service_id = se.service_id
    LEFT JOIN public.support_group_detail sg
        ON hr_rel.support_group_id = sg.support_group_id
    LEFT JOIN public.ci ci
        ON hr_rel.ci_id = ci.ci_id
    LEFT JOIN public.user_details ud
        ON hr_rel.owner_id = ud.user_id
    LEFT JOIN hr_assigned_to hat
        ON hat.hr_detail_id = hr.hr_id
    LEFT JOIN public.user_details assigned_to
        ON hat.user_assigned_to_id = assigned_to.user_id
          WHERE hr_rel.status_id = 3;
        `;

    const result = await client.query(query);

    if (result.rows.length === 0) {
      return res
        .status(200)
        .json({ message: "No in progress HR requests found" });
    }

    res.status(200).json({
      message: "In progress HR requests retrieved successfully",
      data: result.rows,
    });
  } catch (err) {
    console.error("Error retrieving in progress HR requests:", err.message);
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  } finally {
    client.release();
  }
};

// Controller for On Hold Status (status_id = 4)
const getHrRequestByStatusOnHold = async (req, res) => {
  const client = await pool.connect();

  try {
    const query = `
           SELECT 
        hr.hr_id,
        hr.issue_desc,
        cm.mode AS mode,
        cm.id AS call_mode_id,
        s.status_name AS status_name,
        s.id AS status_id,
        ct.call_type_name AS call_type_name,
        ct.id AS call_type_id,
        sla.sla_time AS sla_time,
        sla.sla_id AS sla_id,
        se.service_name AS service_name,
        se.service_id AS service_id,
        sg.support_group_name AS support_group_name,
        sg.support_group_id AS support_group_id,
        ci.ci_name AS ci_name,
        ci.ci_id AS ci_id,
        cast(ud.user_id AS TEXT) AS user_id,
        CONCAT(ud.first_name, ' ', ud.last_name) AS user_name,
        cast(hat.user_assigned_to_id AS TEXT) AS user_assigned_to_id,
        CONCAT(assigned_to.first_name, ' ', assigned_to.last_name) AS user_assigned_to_name
    FROM public.hr_request hr
    LEFT JOIN public.hr_request_relation hr_rel
        ON hr.hr_id = hr_rel.hr_request_id
    LEFT JOIN public.call_mode cm
        ON hr_rel.call_mode_id = cm.id
    LEFT JOIN public.status s
        ON hr_rel.status_id = s.id
    LEFT JOIN public.call_type ct
        ON hr_rel.call_type_id = ct.id
    LEFT JOIN public.sla sla
        ON hr_rel.sla_id = sla.sla_id
    LEFT JOIN public.service se
        ON hr_rel.service_id = se.service_id
    LEFT JOIN public.support_group_detail sg
        ON hr_rel.support_group_id = sg.support_group_id
    LEFT JOIN public.ci ci
        ON hr_rel.ci_id = ci.ci_id
    LEFT JOIN public.user_details ud
        ON hr_rel.owner_id = ud.user_id
    LEFT JOIN hr_assigned_to hat
        ON hat.hr_detail_id = hr.hr_id
    LEFT JOIN public.user_details assigned_to
        ON hat.user_assigned_to_id = assigned_to.user_id
          WHERE hr_rel.status_id = 4;
        `;

    const result = await client.query(query);

    if (result.rows.length === 0) {
      return res.status(200).json({ message: "No on hold HR requests found" });
    }

    res.status(200).json({
      message: "On hold HR requests retrieved successfully",
      data: result.rows,
    });
  } catch (err) {
    console.error("Error retrieving on hold HR requests:", err.message);
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  } finally {
    client.release();
  }
};

// Controller to update HR request by ID
const updateHrById = async (req, res) => {
  const { id } = req.params;
  const user = req.user.userId;
  const {
    issue_desc,
    call_mode_id,
    status_id,
    call_type_id,
    sla_id,
    service_id,
    support_group_id,
    log_note,
    user_assigned_to_id,
    ci_detail_id, // New field for updating
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Fetch old values from hr_request before updating
    const oldValuesQuery = "SELECT * FROM public.hr_request WHERE hr_id = $1";
    const oldValuesResult = await client.query(oldValuesQuery, [id]);

    if (oldValuesResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "HR request not found" });
    }

    const oldValues = oldValuesResult.rows[0];

    // Update hr_request table
    let hrRequestQuery = "UPDATE public.hr_request SET updated_at = NOW(), ";
    const hrRequestFields = [];
    const hrRequestValues = [];

    if (issue_desc !== undefined) {
      hrRequestFields.push(`issue_desc = $${hrRequestFields.length + 1}`);
      hrRequestValues.push(issue_desc);
    }

    if (hrRequestFields.length > 0) {
      hrRequestQuery += hrRequestFields.join(", ");
      hrRequestQuery += ` WHERE hr_id = $${
        hrRequestFields.length + 1
      } RETURNING *;`;
      hrRequestValues.push(id);

      const hrRequestResult = await client.query(
        hrRequestQuery,
        hrRequestValues
      );

      if (hrRequestResult.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "HR request not found" });
      }

      const newValues = hrRequestResult.rows[0];

      // Check if user_id exists in user_details table before inserting into hr_audit
      const userCheckQuery =
        "SELECT user_id FROM public.user_details WHERE user_id = $1";
      const userCheckResult = await client.query(userCheckQuery, [user]);

      if (userCheckResult.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Invalid user ID" });
      }

      // Insert into hr_audit table
      const auditQuery = `
        INSERT INTO public.hr_audit (user_id, hr_id, old_values, new_values, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
      `;
      await client.query(auditQuery, [user, id, oldValues, newValues]);
    }

    // Insert into hr_log_note table only if log_note is present and not empty
    if (log_note && log_note.trim() !== "") {
      const logNoteQuery = `
    INSERT INTO public.hr_log_note (hr_id, log_note, user_id, created_at)
    VALUES ($1, $2, $3, NOW())
  `;
      await client.query(logNoteQuery, [id, log_note, user]);
    }

    // Update hr_request_relation table
    let relationQuery = "UPDATE public.hr_request_relation SET ";
    const relationFields = [];
    const relationValues = [];

    if (call_mode_id !== undefined) {
      relationFields.push(
        `call_mode_id = $${relationFields.length + 1}::integer`
      );
      relationValues.push(call_mode_id);
    }
    if (status_id !== undefined) {
      relationFields.push(`status_id = $${relationFields.length + 1}::integer`);
      relationValues.push(status_id);
    }
    if (call_type_id !== undefined) {
      relationFields.push(
        `call_type_id = $${relationFields.length + 1}::integer`
      );
      relationValues.push(call_type_id);
    }
    if (sla_id !== undefined) {
      relationFields.push(`sla_id = $${relationFields.length + 1}::integer`);
      relationValues.push(sla_id);
    }
    if (service_id !== undefined) {
      relationFields.push(
        `service_id = $${relationFields.length + 1}::integer`
      );
      relationValues.push(service_id);
    }
    if (support_group_id !== undefined) {
      relationFields.push(
        `support_group_id = $${relationFields.length + 1}::integer`
      );
      relationValues.push(support_group_id);
    }

    if (relationFields.length > 0) {
      relationQuery += relationFields.join(", ");
      relationQuery += ` WHERE hr_request_id = $${
        relationFields.length + 1
      }::integer;`;
      relationValues.push(id);

      await client.query(relationQuery, relationValues);
    }

    // Update hr_assigned_to table
    const assignedToQuery = `
      SELECT * FROM public.hr_assigned_to WHERE hr_detail_id = $1;
    `;
    const assignedToResult = await client.query(assignedToQuery, [id]);

    if (assignedToResult.rowCount > 0) {
      // Existing record, update it
      const assignedToFields = [];
      const assignedToValues = [];

      if (ci_detail_id !== undefined) {
        assignedToFields.push(`ci_detail_id = $${assignedToFields.length + 1}`);
        assignedToValues.push(ci_detail_id);
      }
      if (service_id !== undefined) {
        assignedToFields.push(
          `service_detail_id = $${assignedToFields.length + 1}`
        );
        assignedToValues.push(service_id);
      }
      if (support_group_id !== undefined) {
        assignedToFields.push(
          `support_group_id = $${assignedToFields.length + 1}`
        );
        assignedToValues.push(support_group_id);
      }
      if (user_assigned_to_id !== undefined) {
        assignedToFields.push(
          `user_assigned_to_id = $${assignedToFields.length + 1}`
        );
        assignedToValues.push(user_assigned_to_id);
      }

      if (assignedToFields.length > 0) {
        const updateAssignedToQuery = `
          UPDATE public.hr_assigned_to 
          SET ${assignedToFields.join(", ")} 
          WHERE hr_detail_id = $${assignedToFields.length + 1};
        `;
        assignedToValues.push(id);
        await client.query(updateAssignedToQuery, assignedToValues);
      }
    } else {
      // Insert new record if it doesn't exist (if that's the desired behavior)
      if (
        user_assigned_to_id !== undefined ||
        ci_detail_id !== undefined ||
        service_id !== undefined ||
        support_group_id !== undefined
      ) {
        const insertAssignedToQuery = `
          INSERT INTO public.hr_assigned_to (hr_detail_id, ci_detail_id, service_detail_id, support_group_id, user_assigned_to_id)
          VALUES ($1, $2, $3, $4, $5);
        `;
        const newAssignedToValues = [
          id,
          ci_detail_id,
          service_id,
          support_group_id,
          user_assigned_to_id,
        ].filter((v) => v !== undefined); // Filter out undefined values
        await client.query(insertAssignedToQuery, newAssignedToValues);
      }
    }

    await client.query("COMMIT");
    res.status(200).json({ message: "HR request updated successfully" });
  } catch (err) {
    console.error("Error:", err.message);
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
};

module.exports = {
  createHrRequest,
  getAllHrRequests,
  getHrRequestById,
  getHrRequestByStatusOpen,
  getHrRequestByStatusClosed,
  getHrRequestByStatusInProgress,
  getHrRequestByStatusOnHold,
  updateHrById,
  getCibyService,
  getUserTickets,
  getHrRequestBySupportGroup,
  getHrRequestForAssignedTo,
};
