const config = require("../db/config.json");
const pool = require("../db/db");
const upload = require("../helper/storage.js");
const { use } = require("../routes/roles.js");

const getAllUsers = async (req, res) => {
  try {
    // Query to fetch user details along with related data (including has_access)
    const result = await pool.query(`
      SELECT 
    ud.user_id,
    ud.first_name AS "firstName", 
    ud.middle_name AS "middleName",
    ud.last_name AS "lastName",
    ud.description, 
    ud.mobile_no AS "mobileNumber", 
    ud.email_id AS "email",
    ud.user_name AS "userName", 
    ud.has_access AS "has_access",  -- Added has_access field
    ur2.role_id AS "role_id", -- Fetching role_id instead of role_name
    ur2.role_name AS "role_name", -- Fetching role_id instead of role_name
    l.level_id AS "level_id",
    l.level_name AS "level_name",  -- Fetching level_id instead of level_name
    g.id AS "gender_id", -- Fetching gender_id directly
    g.gender_name AS "gender_name", -- Fetching gender_id directly
    sg.support_group_id AS "support_group_id", -- Fetching support_group_id instead of name
    sg.support_group_name AS "support_group_name", -- Fetching support_group_id instead of name
    ur.reporting_to AS "reportingTo",  -- Fetching reporting_to user_id instead of names
    rto.first_name AS "reportingToFirstName",  -- Fetching reporting_to user's first name
    rto.last_name AS "reportingToLastName"     -- Fetching reporting_to user's last name
FROM 
    user_details ud
LEFT JOIN 
    user_relation ur ON ud.user_id = ur.user_id
LEFT JOIN 
    user_role ur2 ON ur.role_id = ur2.role_id
LEFT JOIN 
    level_detail l ON ur.level_id = l.level_id
LEFT JOIN 
    gender g ON ur.gender_id = g.id
LEFT JOIN 
    support_group_detail sg ON ur.support_group_id = sg.support_group_id
LEFT JOIN 
    user_details rto ON ur.reporting_to = rto.user_id  -- Join to get the reporting_to user details

    `);

    const users = result.rows;
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getUser = async (req, res) => {
  const { id } = req.params;

  try {
    // Main query to get user details along with roles, levels, etc.
    const userQuery = `
      SELECT 
        ud.*, 
        r.role_id AS role_id,
        r.role_name AS role_name,
        s.support_group_id AS support_group_id,
        s.support_group_name AS support_group_name,
        l.level_id AS level_id,
        l.level_name AS level_name,
        g.id AS gender_id,
        g.gender_name AS gender_name,
        ur.reporting_to AS reporting_to_id,
        ur2.first_name AS reporting_to_first_name,
        ur2.last_name AS reporting_to_last_name
      FROM 
        user_details AS ud
      
      LEFT JOIN 
        user_relation AS ur
      ON 
        ud.user_id = ur.user_id
        LEFT JOIN
        user_details AS ur2
      ON
        ur.user_id = ur2.user_id
      LEFT JOIN 
        user_role AS r
      ON 
        ur.role_id = r.role_id
      LEFT JOIN 
        support_group_detail AS s
      ON 
        ur.support_group_id = s.support_group_id
      LEFT JOIN 
        level_detail AS l
      ON 
        ur.level_id = l.level_id
      LEFT JOIN 
        gender AS g
      ON 
        ur.gender_id = g.id
      WHERE 
        ud.user_id = $1
    `;

    const userResult = await pool.query(userQuery, [id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userResult.rows[0];

    // Query to get attachments for the user
    const attachmentsQuery = `
      SELECT 
        id, 
        file_path 
      FROM 
        user_attachments 
      WHERE 
        user_id = $1
    `;

    const attachmentsResult = await pool.query(attachmentsQuery, [id]);

    const attachments = attachmentsResult.rows.map((row) => ({
      id: row.id,
      filePath: row.file_path,
    }));

    // Return the user details along with the attachments in the response
    res.status(200).json({
      ...user,
      attachments: attachments, // Include the attachments array in the response
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const {
    firstName,
    middleName,
    lastName,
    mobileNumber,
    userName,
    genderId,
    userRole,
    supportGroup,
    level,
    description,
    email,
    reportingTo,
  } = req.body;

  const imageFile = req.file;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Fetch old values for auditing
    const oldValuesResult = await client.query(
      "SELECT * FROM user_details WHERE user_id = $1",
      [id]
    );
    const oldValues = oldValuesResult.rows[0];

    if (!oldValues) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "User not found" });
    }

    // Construct dynamic SQL for updating user_details
    let userDetailsSetClause = [];
    let userDetailsValues = [];

    if (firstName) {
      userDetailsSetClause.push(
        `first_name = $${userDetailsSetClause.length + 1}`
      );
      userDetailsValues.push(firstName);
    }
    if (middleName) {
      userDetailsSetClause.push(
        `middle_name = $${userDetailsSetClause.length + 1}`
      );
      userDetailsValues.push(middleName);
    }
    if (lastName) {
      userDetailsSetClause.push(
        `last_name = $${userDetailsSetClause.length + 1}`
      );
      userDetailsValues.push(lastName);
    }
    if (email) {
      userDetailsSetClause.push(
        `email_id = $${userDetailsSetClause.length + 1}`
      );
      userDetailsValues.push(email);
    }
    if (mobileNumber) {
      userDetailsSetClause.push(
        `mobile_no = $${userDetailsSetClause.length + 1}`
      );
      userDetailsValues.push(mobileNumber);
    }
    if (userName) {
      userDetailsSetClause.push(
        `user_name = $${userDetailsSetClause.length + 1}`
      );
      userDetailsValues.push(userName);
    }
    if (description) {
      userDetailsSetClause.push(
        `description = $${userDetailsSetClause.length + 1}`
      );
      userDetailsValues.push(description);
    }

    if (imageFile) {
      userDetailsSetClause.push(
        `profile_picture = $${userDetailsSetClause.length + 1}`
      );
      userDetailsValues.push(imageFile.path);
    }

    // Only perform the update if there are fields to update
    if (userDetailsSetClause.length > 0) {
      const userDetailsQuery = `
        UPDATE user_details
        SET ${userDetailsSetClause.join(", ")}
        WHERE user_id = $${userDetailsSetClause.length + 1}
        RETURNING *`;

      userDetailsValues.push(id); // Add the user ID as the final parameter

      await client.query(userDetailsQuery, userDetailsValues);
    }

    // Update user_relation table with relation fields
    let userRelationSetClause = [];
    let userRelationValues = [];

    if (userRole !== undefined) {
      userRelationSetClause.push(
        `role_id = $${userRelationSetClause.length + 1}`
      );
      userRelationValues.push(userRole);
    }
    if (supportGroup !== undefined) {
      userRelationSetClause.push(
        `support_group_id = $${userRelationSetClause.length + 1}`
      );
      userRelationValues.push(supportGroup);
    }
    if (level !== undefined) {
      userRelationSetClause.push(
        `level_id = $${userRelationSetClause.length + 1}`
      );
      userRelationValues.push(level);
    }
    if (genderId !== undefined) {
      userRelationSetClause.push(
        `gender_id = $${userRelationSetClause.length + 1}`
      );
      userRelationValues.push(genderId);
    }
    if (reportingTo !== undefined) {
      userRelationSetClause.push(
        `reporting_to = $${userRelationSetClause.length + 1}`
      );
      userRelationValues.push(reportingTo);
    }

    // Check if there are updates to be made for the user_relation table
    if (userRelationSetClause.length > 0) {
      const userRelationQuery = `
        UPDATE user_relation
        SET ${userRelationSetClause.join(", ")}
        WHERE user_id = $${userRelationSetClause.length + 1}`;

      userRelationValues.push(id); // Add the user ID as the final parameter for WHERE clause

      await client.query(userRelationQuery, userRelationValues);
    }

    // Audit log: capture old and new values
    const newValues = {
      first_name: firstName || oldValues.first_name,
      middle_name: middleName || oldValues.middle_name,
      last_name: lastName || oldValues.last_name,
      mobile_no: mobileNumber || oldValues.mobile_no,
      user_name: userName || oldValues.user_name,
      gender_id: genderId || oldValues.gender_id,
      role_id: userRole || oldValues.role_id,
      support_group_id: supportGroup || oldValues.support_group_id,
      level_id: level || oldValues.level_id,
      description: description || oldValues.description,
      email_id: email || oldValues.email_id,
      reporting_to: reportingTo || oldValues.reporting_to,
      profile_picture: imageFile ? imageFile.path : oldValues.profile_picture, // Keep old file if no new file is uploaded
    };

    // Insert into audit log
    await client.query(
      `
      INSERT INTO user_audit_log (old_values, new_values, change_timestamp, user_id)
      VALUES (
        $1::jsonb, 
        $2::jsonb, 
        CURRENT_TIMESTAMP, 
        $3
      )
    `,
      [JSON.stringify(oldValues), JSON.stringify(newValues), id]
    );

    await client.query("COMMIT");
    res.status(200).json({ message: "User updated successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error:", err.message);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
};

const getUserNamesController = async (req, res) => {
  try {
    // Query to fetch user_id and full name (concatenation of first_name and last_name)
    const result = await pool.query(`
      SELECT
        ud.user_id,
        CONCAT(ud.first_name, ' ', ud.last_name) AS full_name,
        email_id
      FROM
        user_details ud
    `);

    const users = result.rows;
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching user names:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateAccessController = async (req, res) => {
  const { userId, has_access } = req.body;

  if (!userId || typeof has_access === "undefined") {
    return res
      .status(400)
      .json({ error: "userId and has_access are required" });
  }

  const client = await pool.connect();

  try {
    const updateResult = await client.query(
      "UPDATE user_details SET has_access = $1 WHERE user_id = $2 RETURNING *",
      [has_access, userId]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return success response with updated user details
    res.status(200).json({
      message: "User access updated successfully",
      user: updateResult.rows[0],
    });
  } catch (error) {
    console.error("Error updating access:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release(); // Release the client back to the pool
  }
};

const updateProfilePicture = async (req, res) => {
  console.log(88, req.body);
  const id = req.body.id;
  console.log(88, id);
  try {
    const q1 = `select count(*) from user_attachments where id=${id};`;
    const { rows } = await pool.query(q1);
    console.log(88, rows);
    let result;
    if (req.file) {
      const path =
        "http://172.16.16.66:4000/assets/attachments/profile_pictures/";
      console.log(6666, path);
      const filePath = `'${path}${req.file.filename}'`;
      console.log(filePath);

      if (rows[0].count == 0) {
        const query = `insert into user_attachments (user_id,attachment_type,file_path) values($1,$2,$3) returning *;`;
        const values = [req.body.user_id, req.file.mimetype, filePath];
        result = await pool.query(query, values);
      } else {
        const query = `update user_attachments set attachment_type=$2, file_path=$3 where id=$1 returning *;`;
        const values = [id, req.file.mimetype, filePath];
        console.log(777, query, values);
        result = await pool.query(query, values);
      }
    }

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Not Uploded Please try again" });
    }

    res.status(200).json({ data: result.rows[0], message: "Picture Uploaded" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

const getProfilePicture = async (req, res) => {
  const id = req.params.id;
  try {
    const query = `select * from user_attachments where user_id=${id};`;
    const result = await pool.query(query);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Profile picture not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getUser,
  updateUser,
  getAllUsers,
  getUserNamesController,
  updateAccessController,
  updateProfilePicture,
  getProfilePicture,
};
