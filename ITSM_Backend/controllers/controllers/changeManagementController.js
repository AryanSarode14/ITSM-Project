const { user } = require("pg/lib/defaults");
const config = require("../db/config.json");
const pool = require("../db/db");
const { sendMail, sendMailUpdate } = require("../mailer/approvalMail");

const createChangeManagement = async (req, res) => {
  const {
    description,
    impact_id,
    implementation_plan,
    risk_assessment,
    change_type_id,
    priority_id,
    status_id,
    assigned_to_id,
    approval_status_id,
    approver_ids,
    affected_product_id,
    scheduled_start_date,
    scheduled_end_date,
    review_date,
  } = req.body;

  const created_by_id = req.user.userId;
  const fullName = `${req.user.firstName} ${req.user.lastName}`;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Insert into change_management table
    const insertquery = `
      INSERT INTO change_management (description, implementation_plan, risk_assessment, scheduled_start_date,
      scheduled_end_date, review_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      returning id`;

    const changeManagementValues = [
      description,
      implementation_plan,
      risk_assessment,
      scheduled_start_date,
      scheduled_end_date,
      review_date,
    ];

    const changeManagementResult = await client.query(
      insertquery,
      changeManagementValues
    );
    const id = changeManagementResult.rows[0].id;

    // Insert into relation table
    const insertRelationQuery = `
      INSERT INTO change_management_relation 
      (change_management_id, change_type_id, priority_id, status_id, assigned_to_id, affected_product_id, created_by_id, approval_status_id, impact_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;

    const relationValues = [
      id,
      change_type_id,
      priority_id,
      status_id,
      assigned_to_id,
      affected_product_id,
      created_by_id,
      1,
      impact_id,
    ];

    await client.query(insertRelationQuery, relationValues);

    // Insert approver data and send emails
    let approverIdsArray = Array.isArray(approver_ids)
      ? approver_ids
      : [approver_ids];

    // Insert approver data and send emails
    if (approverIdsArray.length > 0) {
      for (const approver_id of approverIdsArray) {
        const insertApprovalQuery = `
      INSERT INTO change_management_user_approval (change_id, user_approver_id, approval_status_id)
      VALUES ($1, $2, $3)`;
        const approvalValues = [id, approver_id, 1]; // Assuming approval_status_id can be null initially
        await client.query(insertApprovalQuery, approvalValues);
      }

      // Fetch and send emails
      const approverEmailsQuery = `SELECT email_id FROM user_details WHERE user_id = ANY($1::int[])`;
      const approverEmailResult = await client.query(approverEmailsQuery, [
        approverIdsArray,
      ]);

      for (const row of approverEmailResult.rows) {
        await sendMail(row.email_id, fullName, description);
      }
    }

    // Insert file attachments linked to the logged-in user (not to approvers)
    if (req.files && req.files.length > 0) {
      const path =
        "http://172.16.16.66:4000/assets/attachments/incident_attachment/";
      const userId = req.user.userId; // Logged-in user ID

      for (let i = 0; i < req.files.length; i++) {
        const attachmentQuery = `
          INSERT INTO change_management_attachment (change_id, file_path, user_id) 
          VALUES ($1, $2, $3)`;
        const attachmentValues = [
          id,
          `${path}${req.files[i].filename}`,
          userId,
        ];
        await client.query(attachmentQuery, attachmentValues);
      }
    }

    await client.query("COMMIT");
    res.status(201).json(changeManagementResult.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err.message);
    res.status(500).json({ error: "Server Error" });
  } finally {
    client.release();
  }
};

const getChangeManagement = async (req, res) => {
  try {
    const query = `
    SELECT 
      cm.id,
      cm.description,
      i.impact_id,
      i.impact_level,
      cm.implementation_plan,
      cm.risk_assessment,
      TO_CHAR(cm.scheduled_start_date, 'DD/MM/YYYY') AS scheduled_start_date,
      TO_CHAR(cm.scheduled_end_date, 'DD/MM/YYYY') AS scheduled_end_date,
      TO_CHAR(cm.review_date, 'DD/MM/YYYY') AS review_date,
      TO_CHAR(cm.created_at, 'DD/MM/YYYY') AS created_at,
      ct.id as change_type_id,
      ct.change_type,
      p.priority_id,
      p.priority_name,
      s.id as status_id,
      s.status_name,
      cid.ci_id::integer as affected_product_id, -- Casting as integer
      cid.ci_name as affected_product_name,
      ud.user_id as assigned_to_id,
      CONCAT(ud.first_name, ' ', ud.last_name) as assigned_to_username,
      ud2.user_id as created_by_id,
      CONCAT(ud2.first_name, ' ', ud2.last_name) as created_by_username,
      ast.id as approval_state_id,
      ast.approval_state,
  
      -- Approvers aggregation including rejection reason
      COALESCE(
          json_agg(
              json_build_object(
                  'user_approver_id', approvers.user_approver_id,
                  'approver_name', CONCAT(ud3.first_name, ' ', ud3.last_name),
                  'approval_state_id', astate.id, 
                  'approval_state', astate.approval_state,
                  'approver_reason_to_reject', 
                  CASE 
                      WHEN astate.approval_state = 'Rejected' THEN (
                          SELECT ln.reason 
                          FROM change_management_log_notes ln 
                          WHERE ln.user_id = approvers.user_approver_id AND ln.change_id = cm.id
                          LIMIT 1
                      )
                      ELSE NULL 
                  END
              )
          ) FILTER (WHERE approvers.user_approver_id IS NOT NULL), '[]'
      ) as approvers,

      -- Attachments aggregation
      (
          SELECT COALESCE(
              json_agg(
                  json_build_object(
                      'attachment_id', attachments.attachment_id, 
                      'file_path', attachments.file_path
                  )
              ) FILTER (WHERE attachments.attachment_id IS NOT NULL), '[]'
          )
          FROM change_management_attachment attachments
          WHERE attachments.change_id = cm.id
      ) as attachment
      
    FROM change_management cm
      LEFT JOIN change_management_relation cmr ON cm.id = cmr.change_management_id
      LEFT JOIN ci cid ON cmr.affected_product_id = cid.ci_id
      LEFT JOIN approval_states ast ON cmr.approval_status_id = ast.id
      LEFT JOIN change_type ct ON cmr.change_type_id = ct.id    
      LEFT JOIN priority p ON cmr.priority_id = p.priority_id
      LEFT JOIN status s ON cmr.status_id = s.id
      LEFT JOIN user_details ud ON cmr.assigned_to_id = ud.user_id
      LEFT JOIN user_details ud2 ON cmr.created_by_id = ud2.user_id
      LEFT JOIN change_management_user_approval approvers ON cm.id = approvers.change_id
      LEFT JOIN user_details ud3 ON approvers.user_approver_id = ud3.user_id
      LEFT JOIN approval_states astate ON approvers.approval_status_id = astate.id
      LEFT JOIN impacts i ON cmr.impact_id = i.impact_id
  
    GROUP BY 
      cm.id, ct.id, p.priority_id, s.id, cid.ci_id, ud.user_id, ud2.user_id, i.impact_id, ast.id
  `;

    const result = await pool.query(query);
    if (result.rows.length === 0) {
      return res
        .status(200)
        .json({ error: "No Data for Change Management Found" });
    }

    res.status(200).json(result.rows);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: "Server Error" });
  }
};

const getChangeManagementById = async (req, res) => {
  try {
    const { id } = req.params; // Get the ID from request parameters

    const query = `
    SELECT 
        cm.id,
        cm.description,
        i.impact_id,
        i.impact_level,
        cm.implementation_plan,
        cm.risk_assessment,
        TO_CHAR(cm.scheduled_start_date, 'DD/MM/YYYY') AS scheduled_start_date,
        TO_CHAR(cm.scheduled_end_date, 'DD/MM/YYYY') AS scheduled_end_date,
        TO_CHAR(cm.review_date, 'DD/MM/YYYY') AS review_date,
        TO_CHAR(cm.created_at, 'DD/MM/YYYY') AS created_at,
        ct.id as change_type_id,
        ct.change_type,
        p.priority_id,
        p.priority_name,
        s.id as status_id,
        s.status_name,
        cid.ci_id::integer as affected_product_id, -- Casting as integer
        cid.ci_name as affected_product_name,
        ud.user_id as assigned_to_id,
        CONCAT(ud.first_name, ' ', ud.last_name) as assigned_to_username,
        ud2.user_id as created_by_id,
        CONCAT(ud2.first_name, ' ', ud2.last_name) as created_by_username,
        ast.id as approval_state_id, 
        ast.approval_state,
    
        -- Approvers aggregation
        COALESCE(
            json_agg(
                json_build_object(
                    'user_approver_id', approvers.user_approver_id,
                    'approver_name', CONCAT(ud3.first_name, ' ', ud3.last_name),
                    'approval_state_id', astate.id,
                    'approval_state', astate.approval_state
                )
            ) FILTER (WHERE approvers.user_approver_id IS NOT NULL), '[]'
        ) as approvers,
    
        -- Attachments aggregation in a separate subquery to avoid duplicates from approvers
        (
            SELECT COALESCE(
                json_agg(
                    json_build_object(
                        'attachment_id', attachments.attachment_id, 
                        'file_path', attachments.file_path
                    )
                ) FILTER (WHERE attachments.attachment_id IS NOT NULL), '[]'
            )
            FROM change_management_attachment attachments
            WHERE attachments.change_id = cm.id
        ) as attachment,
    
            -- Log notes aggregation including created_by_id and created_by_username
(
    SELECT COALESCE(
        json_agg(
            json_build_object(
                'log_note_id', ln.id, 
                'log_note', ln.log_notes,
                'created_by_id', ln.user_id,  -- Assuming you have this field in log_notes table
                'created_by_username', CONCAT(ud4.first_name, ' ', ud4.last_name)  -- Fetching username
            )
        ) FILTER (WHERE ln.id IS NOT NULL), '[]'
    )
    FROM change_management_log_notes ln
    LEFT JOIN user_details ud4 ON ln.user_id = ud4.user_id  -- Join to get user details
    WHERE ln.change_id = cm.id
) as log_notes,
    
    FROM change_management cm
        LEFT JOIN change_management_relation cmr ON cm.id = cmr.change_management_id
        LEFT JOIN ci cid ON cmr.affected_product_id = cid.ci_id
        LEFT JOIN change_type ct ON cmr.change_type_id = ct.id    
        LEFT JOIN approval_states astate ON cmr.approval_status_id = astate.id
        LEFT JOIN approval_states ast ON cmr.approval_status_id = ast.id
        LEFT JOIN priority p ON cmr.priority_id = p.priority_id
        LEFT JOIN status s ON cmr.status_id = s.id
        LEFT JOIN user_details ud ON cmr.assigned_to_id = ud.user_id
        LEFT JOIN user_details ud2 ON cmr.created_by_id = ud2.user_id
        LEFT JOIN change_management_user_approval approvers ON cm.id = approvers.change_id
        LEFT JOIN user_details ud3 ON approvers.user_approver_id = ud3.user_id -- Joining user_details for approvers' names
        LEFT JOIN impacts i ON cmr.impact_id = i.impact_id 
    
    WHERE cm.id = $1
    GROUP BY 
        cm.id, ct.id, p.priority_id, s.id, ud.user_id, ud2.user_id, cid.ci_id, i.impact_id, ast.id, astate.id
    `;

    const result = await pool.query(query, [id]); // Pass id as a parameter
    if (result.rows.length === 0) {
      return res
        .status(200)
        .json({ error: `No Data for Change Management with ID ${id} Found` }); // Clarified error message
    }

    res.status(200).json(result.rows[0]); // Return the first row since we expect one entry
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: "Server Error" });
  }
};

const updateChangeManagement = async (req, res) => {
  const { id } = req.params; // Change management ID from request parameters
  const loggedInUser = req.user.userId; // Logged in user ID
  console.log(id);
  const {
    description,
    implementation_plan,
    risk_assessment,
    impact_id,
    change_type_id,
    priority_id,
    status_id,
    assigned_to_id,
    approval_status_id,
    approver_ids,
    scheduled_start_date,
    scheduled_end_date,
    review_date,
    log_notes,
  } = req.body;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Get the current assigned_to_id before updating
    const { rows: currentAssignmentRows } = await client.query(
      `SELECT assigned_to_id FROM change_management_relation WHERE change_management_id = $1`,
      [id]
    );
    const oldAssignedToId = currentAssignmentRows[0]?.assigned_to_id;

    // Constructing the update query dynamically
    const updateFields = [];
    const updateValues = [];

    // Add fields to update if provided
    if (description) {
      updateFields.push(`description = $${updateFields.length + 1}`);
      updateValues.push(description);
    }

    if (implementation_plan) {
      updateFields.push(`implementation_plan = $${updateFields.length + 1}`);
      updateValues.push(implementation_plan);
    }
    if (risk_assessment) {
      updateFields.push(`risk_assessment = $${updateFields.length + 1}`);
      updateValues.push(risk_assessment);
    }

    if (scheduled_start_date) {
      updateFields.push(`scheduled_start_date = $${updateFields.length + 1}`);
      updateValues.push(scheduled_start_date);
    }
    if (scheduled_end_date) {
      updateFields.push(`scheduled_end_date = $${updateFields.length + 1}`);
      updateValues.push(scheduled_end_date);
    }
    if (review_date) {
      updateFields.push(`review_date = $${updateFields.length + 1}`);
      updateValues.push(review_date);
    }

    // Check if there are fields to update
    if (updateFields.length > 0) {
      const updateQuery = `
        UPDATE change_management
        SET ${updateFields.join(", ")}
        WHERE id = $${updateFields.length + 1}
      `;
      updateValues.push(id);
      await client.query(updateQuery, updateValues);
    }

    // Update file attachments
    if (req.files && req.files.length > 0) {
      const path =
        "http://172.16.16.66:4000/assets/attachments/incident_attachment/";
      for (let i = 0; i < req.files.length; i++) {
        const attachmentQuery = `
          INSERT INTO change_management_attachment (change_id, file_path) 
          VALUES ($1, $2)`;
        const attachmentValues = [id, `${path}${req.files[i].filename}`];
        await client.query(attachmentQuery, attachmentValues);
      }
    }

    // Log Notes Query
    if (log_notes) {
      const logNoteQuery = `INSERT INTO change_management_log_notes (change_id, log_notes, user_id, created_at) VALUES ($1, $2, $3, NOW())`;
      const logNoteValues = [id, log_notes, loggedInUser];

      await client.query(logNoteQuery, logNoteValues);
    }

    console.log("approval_status_id : ", approval_status_id);

    // Approval Status change in change_management_user_approval by logged in user
    const updateApprovalStatusByLoggedInUserQuery = `UPDATE change_management_user_approval SET approval_status_id = $1 WHERE change_id = $2 AND user_approver_id = $3`;
    const updateApprovalStatusByLoggedInUserValues = [
      approval_status_id,
      parseInt(id, 10),
      loggedInUser,
    ];
    console.log(updateApprovalStatusByLoggedInUserQuery);
    console.log(updateApprovalStatusByLoggedInUserValues);
    await client.query(
      updateApprovalStatusByLoggedInUserQuery,
      updateApprovalStatusByLoggedInUserValues
    );

    // Check and update relevant fields in change_management_relation
    const updateRelationFields = [];
    const updateRelationValues = [];

    if (impact_id) {
      updateRelationFields.push(
        `impact_id = $${updateRelationFields.length + 1}`
      );
      updateRelationValues.push(impact_id);
    }
    if (change_type_id) {
      updateRelationFields.push(
        `change_type_id = $${updateRelationFields.length + 1}`
      );
      updateRelationValues.push(change_type_id);
    }
    if (priority_id) {
      updateRelationFields.push(
        `priority_id = $${updateRelationFields.length + 1}`
      );
      updateRelationValues.push(priority_id);
    }
    if (status_id) {
      updateRelationFields.push(
        `status_id = $${updateRelationFields.length + 1}`
      );
      updateRelationValues.push(status_id);
    }
    if (assigned_to_id) {
      updateRelationFields.push(
        `assigned_to_id = $${updateRelationFields.length + 1}`
      );
      updateRelationValues.push(assigned_to_id);
    }

    // Update change_management_relation if needed
    if (updateRelationFields.length > 0) {
      const updateRelationQuery = `
        UPDATE change_management_relation
        SET ${updateRelationFields.join(", ")}
        WHERE change_management_id = $${updateRelationFields.length + 1}
      `;
      updateRelationValues.push(id);
      await client.query(updateRelationQuery, updateRelationValues);
    }

    // Handle approver_ids update
    if (approver_ids) {
      // Ensure approver_ids is handled as an array, even if it's a single integer
      let approverIdsArray = Array.isArray(approver_ids)
        ? approver_ids
        : [approver_ids];

      console.log("approverIdsArray : ", approverIdsArray);

      // First, get the old approvers (current approvers for the given change_id)
      const { rows: currentApprovers } = await client.query(
        `SELECT user_approver_id FROM change_management_user_approval WHERE change_id = $1`,
        [id]
      );

      const currentApproverIds = currentApprovers.map(
        (a) => a.user_approver_id
      );
      console.log("currentApprovers : ", currentApproverIds);

      // Identify approvers to add (only those not already in current approvers)
      const approversToAdd = approverIdsArray.filter(
        (newId) => !currentApproverIds.includes(parseInt(newId)) // Ensure comparison is done between same types
      );
      console.log("To add : ", approversToAdd);

      // Identify approvers to remove (only those currently assigned not in new list)
      const approversToRemove = currentApproverIds.filter(
        (currentId) => !approverIdsArray.includes(currentId.toString()) // Convert currentId to string for comparison
      );
      console.log("To remove : ", approversToRemove);

      // Remove old approvers that are not in the new list
      if (approversToRemove.length > 0) {
        const removeApproversQuery = `DELETE FROM change_management_user_approval WHERE change_id = $1 AND user_approver_id = ANY($2::int[])`;
        await client.query(removeApproversQuery, [id, approversToRemove]);
        console.log("Removed approvers: ", approversToRemove);
      }

      // Add new approvers and send emails
      for (const approverId of approversToAdd) {
        const insertApproverQuery = `INSERT INTO change_management_user_approval (change_id, user_approver_id, approval_status_id) VALUES ($1, $2, $3)`;
        await client.query(insertApproverQuery, [id, approverId, 1]);

        // Fetch approver details for sending email
        const approverEmailQuery = `SELECT email_id, first_name, last_name FROM user_details WHERE user_id = $1`;
        const approverResult = await client.query(approverEmailQuery, [
          approverId,
        ]);

        const newApprover = approverResult.rows[0];
        if (newApprover) {
          const newApproverName = `${newApprover.first_name} ${newApprover.last_name}`;
          await sendMail(newApprover.email_id, newApproverName, description); // Ensure description is defined elsewhere
          console.log(
            "Change management email sent to new approver: ",
            newApproverName
          );
        }
      }
    }

    // Send email when assigned_to_id is set initially or changed
    if (!oldAssignedToId && assigned_to_id) {
      const { rows: newAssignedUserDetails } = await client.query(
        `SELECT email_id, first_name, last_name FROM user_details WHERE user_id = $1`,
        [assigned_to_id]
      );

      const newAssignedEmail = newAssignedUserDetails[0]?.email_id;
      const newAssignedFullName = `${newAssignedUserDetails[0]?.first_name} ${newAssignedUserDetails[0]?.last_name}`;

      if (newAssignedEmail) {
        await sendMailUpdate(
          newAssignedEmail,
          newAssignedFullName,
          `You have been assigned to the change management request ID: ${id}.`
        );
      }
    } else if (oldAssignedToId && assigned_to_id) {
      // Both old and new assigned user logic
      const { rows: oldAssignedUserDetails } = await client.query(
        `SELECT email_id, first_name, last_name FROM user_details WHERE user_id = $1`,
        [oldAssignedToId]
      );
      const { rows: newAssignedUserDetails } = await client.query(
        `SELECT email_id, first_name, last_name FROM user_details WHERE user_id = $1`,
        [assigned_to_id]
      );

      const oldAssignedEmail = oldAssignedUserDetails[0]?.email_id;
      const oldAssignedFullName = `${oldAssignedUserDetails[0]?.first_name} ${oldAssignedUserDetails[0]?.last_name}`;
      const newAssignedEmail = newAssignedUserDetails[0]?.email_id;
      const newAssignedFullName = `${newAssignedUserDetails[0]?.first_name} ${newAssignedUserDetails[0]?.last_name}`;

      if (newAssignedEmail) {
        await sendMailUpdate(
          newAssignedEmail,
          newAssignedFullName,
          `You have been assigned to the change management request ID: ${id}.`
        );
      }

      if (oldAssignedEmail) {
        await sendMailUpdate(
          oldAssignedEmail,
          oldAssignedFullName,
          `You have been unassigned from the change management request ID: ${id}.`
        );
      }
    }

    // Check if all approvers have approved or rejected
    const approversCheckQuery = `
      SELECT COUNT(*) FILTER (WHERE approval_status_id = 2) as approved_count,
             COUNT(*) FILTER (WHERE approval_status_id = 3) as rejected_count, 
             COUNT(*) as total_count
      FROM change_management_user_approval
      WHERE change_id = $1`;
    const approversCheckResult = await client.query(approversCheckQuery, [id]);

    const { approved_count, rejected_count, total_count } =
      approversCheckResult.rows[0];
    console.log(approved_count, rejected_count, total_count);

    // Check if all approvers have approved
    if (approved_count === total_count) {
      const updateApprovalStatusInChangeManagementQuery = `
        UPDATE change_management_relation
        SET approval_status_id = 2
        WHERE change_management_id = $1
      `;
      await client.query(updateApprovalStatusInChangeManagementQuery, [id]);

      // Send emails to all approvers about approval
      const approversEmailQuery = `
        SELECT ud.email_id, ud.first_name, ud.last_name
        FROM change_management_user_approval cmu
        LEFT JOIN user_details ud ON cmu.user_approver_id = ud.user_id
        WHERE cmu.change_id = $1
        AND cmu.approval_status_id = 2
      `;
      const approversEmailResult = await client.query(approversEmailQuery, [
        id,
      ]);

      // Send email to all approvers that all have approved
      approversEmailResult.rows.forEach(async (approver) => {
        const approverEmail = approver.email_id;
        const approverName = `${approver.first_name} ${approver.last_name}`;
        if (approverEmail) {
          await sendMailUpdate(
            approverEmail,
            approverName,
            `All approvers have approved the change management request ID: ${id}.`
          );
        }
      });
    }

    // Check if all approvers have rejected
    if (rejected_count === total_count) {
      const updateApprovalStatusInChangeManagementQuery = `
        UPDATE change_management_relation
        SET approval_status_id = 3
        WHERE change_management_id = $1
      `;
      await client.query(updateApprovalStatusInChangeManagementQuery, [id]);

      // Send emails to all approvers about rejection
      const approversEmailQuery = `
        SELECT ud.email_id, ud.first_name, ud.last_name
        FROM change_management_user_approval cmu
        LEFT JOIN user_details ud ON cmu.user_approver_id = ud.user_id
        WHERE cmu.change_id = $1
        AND cmu.approval_status_id = 3
      `;
      const approversEmailResult = await client.query(approversEmailQuery, [
        id,
      ]);

      // Send email to all approvers that all have rejected
      approversEmailResult.rows.forEach(async (approver) => {
        const approverEmail = approver.email_id;
        const approverName = `${approver.first_name} ${approver.last_name}`;
        if (approverEmail) {
          await sendMailUpdate(
            approverEmail,
            approverName,
            `All approvers have rejected the change management request ID: ${id}.`
          );
        }
      });
    }

    await client.query("COMMIT");
    res.status(200).json({
      success: true,
      message: "Change management request updated successfully.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating change management request:", error);
    res.status(500).json({
      success: false,
      message:
        "An error occurred while updating the change management request.",
      error: error.message,
    });
  } finally {
    client.release();
  }
};

const giveApproval = async (req, res) => {
  const user_approver_id = req.user.userId;
  const change_id = req.params.id;
  console.log(change_id);
  const { approval_status_id, reason } = req.body;

  const client = await pool.connect();

  try {
    if (approval_status_id == 3 && reason) {
      const insertReasonQuery = `
      INSERT INTO change_management_log_notes (change_id, user_id, reason, created_at)
      VALUES ($1, $2, $3,Now())
    `;
      const insertReasonValues = [change_id, user_approver_id, reason];
      await client.query(insertReasonQuery, insertReasonValues);
    }

    // Approval Status change in change_management_user_approval by logged in user
    const updateApprovalStatusByLoggedInUserQuery = `
      UPDATE change_management_user_approval 
      SET approval_status_id = $1 
      WHERE change_id = $2 AND user_approver_id = $3
    `;
    const updateApprovalStatusByLoggedInUserValues = [
      approval_status_id,
      change_id,
      user_approver_id,
    ];

    await client.query(
      updateApprovalStatusByLoggedInUserQuery,
      updateApprovalStatusByLoggedInUserValues
    );

    // Check if all approvers are approved
    const approversCheckQuery = `
      SELECT COUNT(*) FILTER (WHERE approval_status_id = 2) AS approved_count, 
            COUNT(*) FILTER (WHERE approval_status_id = 3) AS rejected_count,
             COUNT(*) AS total_count
      FROM change_management_user_approval
      WHERE change_id = $1
    `;
    const approversCheckResult = await client.query(approversCheckQuery, [
      change_id,
    ]);

    const { approved_count, rejected_count, total_count } =
      approversCheckResult.rows[0];
    console.log(approved_count, rejected_count, total_count);

    if (approved_count === total_count) {
      const updateApprovalStatusInChangeManagementQuery = `
        UPDATE change_management_relation
        SET approval_status_id = 2
        WHERE change_management_id = $1
      `;
      await client.query(updateApprovalStatusInChangeManagementQuery, [
        change_id,
      ]);

      const approversEmailQuery = `
        SELECT ud.email_id, ud.first_name, ud.last_name
        FROM change_management_user_approval cmu
        LEFT JOIN user_details ud ON cmu.user_approver_id = ud.user_id
        WHERE cmu.change_id = $1
        AND cmu.approval_status_id = 2 -- Assuming status_id 2 means 'approved'
      `;
      const approversEmailResult = await client.query(approversEmailQuery, [
        change_id,
      ]);

      // Send email to all approvers that all have approved
      const emailPromises = approversEmailResult.rows.map(async (approver) => {
        const approverEmail = approver.email_id;
        const approverName = `${approver.first_name} ${approver.last_name}`;
        if (approverEmail) {
          await sendMailUpdate(
            approverEmail,
            approverName,
            `All approvers have approved the change management request ID: ${change_id}.`
          );
        }
      });

      await Promise.all(emailPromises);
    }

    if (rejected_count === total_count) {
      const updateApprovalStatusInChangeManagementQuery = `
        UPDATE change_management_relation
        SET approval_status_id = 3
        WHERE change_management_id = $1
      `;
      await client.query(updateApprovalStatusInChangeManagementQuery, [
        change_id,
      ]);

      const approversEmailQuery = `
        SELECT ud.email_id, ud.first_name, ud.last_name
        FROM change_management_user_approval cmu
        LEFT JOIN user_details ud ON cmu.user_approver_id = ud.user_id
        WHERE cmu.change_id = $1
        AND cmu.approval_status_id = 3 -- Assuming status_id 3 means 'rejected'
      `;
      const approversEmailResult = await client.query(approversEmailQuery, [
        change_id,
      ]);

      // Send email to all approvers that all have rejected
      const emailPromises = approversEmailResult.rows.map(async (approver) => {
        const approverEmail = approver.email_id;
        const approverName = `${approver.first_name} ${approver.last_name}`;
        if (approverEmail) {
          await sendMailUpdate(
            approverEmail,
            approverName,
            `All approvers have rejected the change management request ID: ${change_id}.`
          );
        }
      });

      await Promise.all(emailPromises);
    }

    // Send a success response
    res.status(200).json({ message: "Approval status updated successfully." });
  } catch (error) {
    console.error("Error in giveApproval:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request." });
  } finally {
    client.release();
  }
};

const getChangeManagementByUser = async (req, res) => {
  try {
    const user_id = req.user.userId;
    console.log(user_id);

    const query = `
    SELECT 

        cm.id,
        cm.description,
        i.impact_id,
        i.impact_level,
        cm.implementation_plan,
        cm.risk_assessment,
        TO_CHAR(cm.scheduled_start_date, 'DD/MM/YYYY') AS scheduled_start_date,
        TO_CHAR(cm.scheduled_end_date, 'DD/MM/YYYY') AS scheduled_end_date,
        TO_CHAR(cm.review_date, 'DD/MM/YYYY') AS review_date,
        TO_CHAR(cm.created_at, 'DD/MM/YYYY') AS created_at,
        ct.id as change_type_id,
        ct.change_type,
        p.priority_id,
        p.priority_name,
        s.id as status_id,
        s.status_name,
        cid.ci_id::integer as affected_product_id, -- Casting as integer
        cid.ci_name as affected_product_name,
        ud.user_id as assigned_to_id,
        CONCAT(ud.first_name, ' ', ud.last_name) as assigned_to_username,
        ud2.user_id as created_by_id,
        CONCAT(ud2.first_name, ' ', ud2.last_name) as created_by_username,
        astate.id as approval_state_id, -- Renamed alias from "as" to "astate"
        astate.approval_state,
        COALESCE(
            json_agg(
                json_build_object(
                    'user_approver_id', approvers.user_approver_id,
                    'approver_name', CONCAT(ud3.first_name, ' ', ud3.last_name),
                    'approval_state_id', astate.id,
                    'approval_state', astate.approval_state
                )
            ) FILTER (WHERE approvers.user_approver_id IS NOT NULL), '[]'
        ) as approvers,
        COALESCE(
            json_agg(
                json_build_object(
                    'log_note_id', log_notes.id,
                    'log_note', log_notes.log_notes
                )
            ) FILTER (WHERE log_notes.id IS NOT NULL), '[]'
        ) as log_notes -- Aggregate log notes
    FROM change_management cm
        LEFT JOIN change_management_relation cmr ON cm.id = cmr.change_management_id
        LEFT JOIN ci cid ON cmr.affected_product_id = cid.ci_id
        LEFT JOIN change_type ct ON cmr.change_type_id = ct.id    
        LEFT JOIN priority p ON cmr.priority_id = p.priority_id
        LEFT JOIN status s ON cmr.status_id = s.id
        LEFT JOIN user_details ud ON cmr.assigned_to_id = ud.user_id
        LEFT JOIN user_details ud2 ON cmr.created_by_id = ud2.user_id
        LEFT JOIN change_management_user_approval approvers ON cm.id = approvers.change_id
        LEFT JOIN user_details ud3 ON approvers.user_approver_id = ud3.user_id -- Joining user_details for approvers' names
        LEFT JOIN status st ON approvers.approval_status_id = st.id -- Joining status for approvers' status name
        LEFT JOIN impacts i ON cmr.impact_id = i.impact_id
        LEFT JOIN approval_states astate ON approvers.approval_status_id = astate.id -- Changed alias from "as" to "astate"
        LEFT JOIN change_management_log_notes log_notes ON cm.id = log_notes.change_id -- Join log notes table

    WHERE approvers.user_approver_id = $1
    GROUP BY 
        cm.id, ct.id, p.priority_id, s.id, ud.user_id, ud2.user_id, cid.ci_id, i.impact_id, astate.id
    `;

    const result = await pool.query(query, [user_id]);
    if (result.rows.length === 0) {
      return res
        .status(200)
        .json({ error: "No Data for Change Management Found" });
    }

    res.status(200).json(result.rows); // Return all rows for the user
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: "Server Error" });
  }
};

const deleteChangeAttachmentById = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { id } = req.params;
    console.log(id);
    const { rows: attachment } = await client.query(
      `SELECT * FROM change_management_attachment WHERE attachment_id = $1`,
      [id]
    );

    if (attachment.length === 0) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    const { file_path } = attachment[0];
    const deleteAttachmentQuery = `DELETE FROM change_management_attachment WHERE attachment_id = $1`;
    await client.query(deleteAttachmentQuery, [id]);

    await client.query("COMMIT");
    return res.status(200).json({ message: "Attachment deleted successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error in deleteAttachment:", error);
    return res.status(500).json({ error: "Failed to delete attachment" });
  } finally {
    client.release();
  }
};

const getPendingApprovalCount = async (req, res) => {
  try {
    const user_id = req.user.userId;
    const query = `
    SELECT COUNT(*) FILTER (WHERE approval_status_id = 1 or approval_status_id IS NULL) as pending_approval_count
    FROM change_management_user_approval
    WHERE user_approver_id = $1
    `;
    const result = await pool.query(query, [user_id]);
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error in getPendingApprovalCount:", error);
    return res
      .status(500)
      .json({ error: "Failed to get pending approval count" });
  }
};

const getPendingApproval = async (req, res) => {
  try {
    // Extracting userId from the request object
    const userId = req.user.userId; // Ensure this matches your req.user structure
    console.log(userId);
    const query = `
  SELECT 

        cm.id,
        cm.description,
        i.impact_id,
        i.impact_level,
        cm.implementation_plan,
        cm.risk_assessment,
        TO_CHAR(cm.scheduled_start_date, 'DD/MM/YYYY') AS scheduled_start_date,
        TO_CHAR(cm.scheduled_end_date, 'DD/MM/YYYY') AS scheduled_end_date,
        TO_CHAR(cm.review_date, 'DD/MM/YYYY') AS review_date,
        TO_CHAR(cm.created_at, 'DD/MM/YYYY') AS created_at,
        ct.id as change_type_id,
        ct.change_type,
        p.priority_id,
        p.priority_name,
        s.id as status_id,
        s.status_name,
        cid.ci_id::integer as affected_product_id, -- Casting as integer
        cid.ci_name as affected_product_name,
        ud.user_id as assigned_to_id,
        CONCAT(ud.first_name, ' ', ud.last_name) as assigned_to_username,
        ud2.user_id as created_by_id,
        CONCAT(ud2.first_name, ' ', ud2.last_name) as created_by_username,
        astate.id as approval_state_id, -- Renamed alias from "as" to "astate"
        astate.approval_state,
        COALESCE(
            json_agg(
                json_build_object(
                    'user_approver_id', approvers.user_approver_id,
                    'approver_name', CONCAT(ud3.first_name, ' ', ud3.last_name),
                    'approval_state_id', astate.id,
                    'approval_state', astate.approval_state
                )
            ) FILTER (WHERE approvers.user_approver_id IS NOT NULL), '[]'
        ) as approvers,
        COALESCE(
            json_agg(
                json_build_object(
                    'log_note_id', log_notes.id,
                    'log_note', log_notes.log_notes
                )
            ) FILTER (WHERE log_notes.id IS NOT NULL), '[]'
        ) as log_notes -- Aggregate log notes
    FROM change_management cm
        LEFT JOIN change_management_relation cmr ON cm.id = cmr.change_management_id
        LEFT JOIN ci cid ON cmr.affected_product_id = cid.ci_id
        LEFT JOIN change_type ct ON cmr.change_type_id = ct.id    
        LEFT JOIN priority p ON cmr.priority_id = p.priority_id
        LEFT JOIN status s ON cmr.status_id = s.id
        LEFT JOIN user_details ud ON cmr.assigned_to_id = ud.user_id
        LEFT JOIN user_details ud2 ON cmr.created_by_id = ud2.user_id
        LEFT JOIN change_management_user_approval approvers ON cm.id = approvers.change_id
        LEFT JOIN user_details ud3 ON approvers.user_approver_id = ud3.user_id -- Joining user_details for approvers' names
        LEFT JOIN status st ON approvers.approval_status_id = st.id -- Joining status for approvers' status name
        LEFT JOIN impacts i ON cmr.impact_id = i.impact_id
        LEFT JOIN approval_states astate ON approvers.approval_status_id = astate.id -- Changed alias from "as" to "astate"
        LEFT JOIN change_management_log_notes log_notes ON cm.id = log_notes.change_id -- Join log notes table

    WHERE approvers.user_approver_id = $1 and approvers.approval_status_id = 1
    GROUP BY 
        cm.id, ct.id, p.priority_id, s.id, ud.user_id, ud2.user_id, cid.ci_id, i.impact_id, astate.id

  `;

    const result = await pool.query(query, [userId]); // Pass userId as a parameter

    if (result.rows.length === 0) {
      return res.status(200).json({ error: "No Pending Approvals Found" });
    }

    res.status(200).json(result.rows);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: "Server Error" });
  }
};

const getApprovedApproval = async (req, res) => {
  try {
    // Extracting userId from the request object
    const userId = req.user.userId; // Ensure this matches your req.user structure
    console.log(userId);
    const query = `
  SELECT 

        cm.id,
        cm.description,
        i.impact_id,
        i.impact_level,
        cm.implementation_plan,
        cm.risk_assessment,
        TO_CHAR(cm.scheduled_start_date, 'DD/MM/YYYY') AS scheduled_start_date,
        TO_CHAR(cm.scheduled_end_date, 'DD/MM/YYYY') AS scheduled_end_date,
        TO_CHAR(cm.review_date, 'DD/MM/YYYY') AS review_date,
        TO_CHAR(cm.created_at, 'DD/MM/YYYY') AS created_at,
        ct.id as change_type_id,
        ct.change_type,
        p.priority_id,
        p.priority_name,
        s.id as status_id,
        s.status_name,
        cid.ci_id::integer as affected_product_id, -- Casting as integer
        cid.ci_name as affected_product_name,
        ud.user_id as assigned_to_id,
        CONCAT(ud.first_name, ' ', ud.last_name) as assigned_to_username,
        ud2.user_id as created_by_id,
        CONCAT(ud2.first_name, ' ', ud2.last_name) as created_by_username,
        astate.id as approval_state_id, -- Renamed alias from "as" to "astate"
        astate.approval_state,
        COALESCE(
            json_agg(
                json_build_object(
                    'user_approver_id', approvers.user_approver_id,
                    'approver_name', CONCAT(ud3.first_name, ' ', ud3.last_name),
                    'approval_state_id', astate.id,
                    'approval_state', astate.approval_state
                )
            ) FILTER (WHERE approvers.user_approver_id IS NOT NULL), '[]'
        ) as approvers,
        COALESCE(
            json_agg(
                json_build_object(
                    'log_note_id', log_notes.id,
                    'log_note', log_notes.log_notes
                )
            ) FILTER (WHERE log_notes.id IS NOT NULL), '[]'
        ) as log_notes -- Aggregate log notes
    FROM change_management cm
        LEFT JOIN change_management_relation cmr ON cm.id = cmr.change_management_id
        LEFT JOIN ci cid ON cmr.affected_product_id = cid.ci_id
        LEFT JOIN change_type ct ON cmr.change_type_id = ct.id    
        LEFT JOIN priority p ON cmr.priority_id = p.priority_id
        LEFT JOIN status s ON cmr.status_id = s.id
        LEFT JOIN user_details ud ON cmr.assigned_to_id = ud.user_id
        LEFT JOIN user_details ud2 ON cmr.created_by_id = ud2.user_id
        LEFT JOIN change_management_user_approval approvers ON cm.id = approvers.change_id
        LEFT JOIN user_details ud3 ON approvers.user_approver_id = ud3.user_id -- Joining user_details for approvers' names
        LEFT JOIN status st ON approvers.approval_status_id = st.id -- Joining status for approvers' status name
        LEFT JOIN impacts i ON cmr.impact_id = i.impact_id
        LEFT JOIN approval_states astate ON approvers.approval_status_id = astate.id -- Changed alias from "as" to "astate"
        LEFT JOIN change_management_log_notes log_notes ON cm.id = log_notes.change_id -- Join log notes table

    WHERE approvers.user_approver_id = $1 and approvers.approval_status_id = 2
    GROUP BY 
        cm.id, ct.id, p.priority_id, s.id, ud.user_id, ud2.user_id, cid.ci_id, i.impact_id, astate.id

  `;

    const result = await pool.query(query, [userId]); // Pass userId as a parameter

    if (result.rows.length === 0) {
      return res.status(200).json({ error: "No Pending Approvals Found" });
    }

    res.status(200).json(result.rows);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: "Server Error" });
  }
};

const getRejectedApproval = async (req, res) => {
  try {
    // Extracting userId from the request object
    const userId = req.user.userId; // Ensure this matches your req.user structure
    console.log(userId);
    const query = `
  SELECT 

        cm.id,
        cm.description,
        i.impact_id,
        i.impact_level,
        cm.implementation_plan,
        cm.risk_assessment,
        TO_CHAR(cm.scheduled_start_date, 'DD/MM/YYYY') AS scheduled_start_date,
        TO_CHAR(cm.scheduled_end_date, 'DD/MM/YYYY') AS scheduled_end_date,
        TO_CHAR(cm.review_date, 'DD/MM/YYYY') AS review_date,
        TO_CHAR(cm.created_at, 'DD/MM/YYYY') AS created_at,
        ct.id as change_type_id,
        ct.change_type,
        p.priority_id,
        p.priority_name,
        s.id as status_id,
        s.status_name,
        cid.ci_id::integer as affected_product_id, -- Casting as integer
        cid.ci_name as affected_product_name,
        ud.user_id as assigned_to_id,
        CONCAT(ud.first_name, ' ', ud.last_name) as assigned_to_username,
        ud2.user_id as created_by_id,
        CONCAT(ud2.first_name, ' ', ud2.last_name) as created_by_username,
        astate.id as approval_state_id, -- Renamed alias from "as" to "astate"
        astate.approval_state,
        COALESCE(
            json_agg(
                json_build_object(
                    'user_approver_id', approvers.user_approver_id,
                    'approver_name', CONCAT(ud3.first_name, ' ', ud3.last_name),
                    'approval_state_id', astate.id,
                    'approval_state', astate.approval_state
                )
            ) FILTER (WHERE approvers.user_approver_id IS NOT NULL), '[]'
        ) as approvers,
        COALESCE(
            json_agg(
                json_build_object(
                    'log_note_id', log_notes.id,
                    'log_note', log_notes.log_notes
                )
            ) FILTER (WHERE log_notes.id IS NOT NULL), '[]'
        ) as log_notes -- Aggregate log notes
    FROM change_management cm
        LEFT JOIN change_management_relation cmr ON cm.id = cmr.change_management_id
        LEFT JOIN ci cid ON cmr.affected_product_id = cid.ci_id
        LEFT JOIN change_type ct ON cmr.change_type_id = ct.id    
        LEFT JOIN priority p ON cmr.priority_id = p.priority_id
        LEFT JOIN status s ON cmr.status_id = s.id
        LEFT JOIN user_details ud ON cmr.assigned_to_id = ud.user_id
        LEFT JOIN user_details ud2 ON cmr.created_by_id = ud2.user_id
        LEFT JOIN change_management_user_approval approvers ON cm.id = approvers.change_id
        LEFT JOIN user_details ud3 ON approvers.user_approver_id = ud3.user_id -- Joining user_details for approvers' names
        LEFT JOIN status st ON approvers.approval_status_id = st.id -- Joining status for approvers' status name
        LEFT JOIN impacts i ON cmr.impact_id = i.impact_id
        LEFT JOIN approval_states astate ON approvers.approval_status_id = astate.id -- Changed alias from "as" to "astate"
        LEFT JOIN change_management_log_notes log_notes ON cm.id = log_notes.change_id -- Join log notes table

    WHERE approvers.user_approver_id = $1 and approvers.approval_status_id = 3
    GROUP BY 
        cm.id, ct.id, p.priority_id, s.id, ud.user_id, ud2.user_id, cid.ci_id, i.impact_id, astate.id

  `;

    const result = await pool.query(query, [userId]); // Pass userId as a parameter

    if (result.rows.length === 0) {
      return res.status(200).json({ error: "No Pending Approvals Found" });
    }

    res.status(200).json(result.rows);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: "Server Error" });
  }
};

const addMessage = async (req, res) => {
  const { id } = req.params;
  console.log(id);
  console.log(req.params);
  const { message } = req.body;
  const userId = req.user.userId;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const query = `INSERT INTO change_management_message (change_id, created_by_logged_in_user, message) VALUES ($1, $2, $3)`;
    await client.query(query, [id, userId, message]);
    await client.query("COMMIT");
    res.status(200).json({ message: "Message added successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error in addMessage:", error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

const getMessage = async (req, res) => {
  const { id } = req.params;
  const loggedInUserId = req.user.userId; // Assuming userId is available in req.user
  const client = await pool.connect();
  try {
    const query = `
      SELECT 
        cm.message, 
        CASE 
          WHEN cm.created_by_logged_in_user = $2 THEN 'You' 
          ELSE CONCAT(ud.first_name, ' ', ud.last_name) 
        END AS sender
      FROM change_management_message cm
      JOIN user_details ud ON cm.created_by_logged_in_user = ud.user_id
      WHERE cm.change_id = $1
    `;
    const result = await client.query(query, [id, loggedInUserId]);

    // Format the response as desired
    const formattedMessages = result.rows.map((row) => ({
      sender: row.sender,
      text: row.message,
    }));

    res.status(200).json(formattedMessages);
  } catch (error) {
    console.error("Error in getMessage:", error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

module.exports = {
  createChangeManagement,
  getChangeManagement,
  getChangeManagementById,
  updateChangeManagement,
  getChangeManagementByUser,
  giveApproval,
  deleteChangeAttachmentById,
  getPendingApprovalCount,
  getPendingApproval,
  getApprovedApproval,
  getRejectedApproval,
  addMessage,
  getMessage,
};
