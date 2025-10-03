const config = require("../db/config.json");
const pool = require("../db/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const XLSX = require("xlsx");
const { sendMailForRegister } = require("../mailer/approvalMail");

const registerController = async (req, res) => {
  const {
    firstName,
    middleName,
    lastName,
    description,
    mobileNumber,
    email,
    password,
    supportGroup,
    userRole,
    level,
    userName,
    genderId,
    reportingTo,
    asset_reqired,
    employee_id,
    org_id,
    branch_id,
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Insert into user_details
    const userDetailsResult = await client.query(
      `INSERT INTO user_details (
        first_name, middle_name, last_name, description, mobile_no, email_id, user_name,created_at,asset_reqired, employee_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, Now(),$8, $9
      ) RETURNING user_id`,
      [
        firstName,
        middleName,
        lastName,
        description,
        mobileNumber,
        email,
        userName,
        asset_reqired,
        employee_id
      ]
    );

    const userId = userDetailsResult.rows[0].user_id;

    // Hash the password and generate a salt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert into user_passwords
    await client.query(
      `INSERT INTO user_passwords (
        user_id, hashed_password, salt
      ) VALUES (
        $1, $2, $3
      )`,
      [userId, hashedPassword, salt]
    );

    // Insert into user_relation
    await client.query(
      `INSERT INTO user_relation (
        user_id, role_id, support_group_id, level_id, gender_id,reporting_to,org_id,branch_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8
      )`,
      [userId, userRole, supportGroup, level, genderId, reportingTo, org_id, branch_id]
    );

    // Send a registration email
    await sendMailForRegister(email, password);

    // Commit the transaction
    await client.query("COMMIT");

    res.status(201).json({ message: "User created successfully", userId });
  } catch (error) {
    // Rollback the transaction on error
    await client.query("ROLLBACK");
    console.error("Error inserting data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

const loginController = async (req, res) => {
  const { email, username, password } = req.body;

  // Check if either email or username, and password are provided
  if ((!email && !username) || !password) {
    return res
      .status(400)
      .json({ error: "Email/Username and password are required" });
  }

  const client = await pool.connect(); // Get a database client for consistent handling

  try {
    // Determine if the request uses email or username
    const identifier = email || username;
    const isEmail = !!email; // If email is present, it's an email-based login

    // Fetch user details along with related data (role name, level name, gender name, etc.)
    const result = await client.query(
      `
      SELECT 
        ud.user_id,
        ud.first_name AS "firstName", 
        ud.middle_name AS "middleName",
        ud.last_name AS "lastName",
        ud.description, 
        ud.mobile_no AS "mobileNumber", 
        ud.email_id AS "email",
        ud.user_name AS "userName", 
        ud.has_access AS "hasAccess",  
        ur2.role_name AS "userRole",   -- Fetch role name
        l.level_name AS "level",       -- Fetch level name
        g.gender_name AS "gender",     -- Fetch gender name
        sg.support_group_name AS "supportGroup", -- Fetch support group name
        (SELECT CONCAT_WS(' ', r.first_name, r.last_name) 
         FROM user_details r 
         WHERE r.user_id = ur.reporting_to 
         LIMIT 1) AS "reportingTo" -- Fetch reporting to name
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
      WHERE 
        ${isEmail ? "ud.email_id" : "ud.user_name"} = $1
    `,
      [identifier]
    );

    // Check if the user exists
    if (result.rows.length === 0) {
      return res
        .status(401)
        .json({ error: "Invalid email/username or password" });
    }

    const user = result.rows[0];
    const userId = user.user_id;
    const firstName = user.firstName;
    const lastName = user.lastName;
    const email_id = user.email;

    // Check if the user has access to login
    if (!user.hasAccess) {
      return res
        .status(403)
        .json({ error: "Access denied. Please contact the administrator." });
    }

    // Fetch hashed password from user_passwords table
    const passwordResult = await client.query(
      "SELECT hashed_password FROM user_passwords WHERE user_id = $1",
      [userId]
    );

    if (passwordResult.rows.length === 0) {
      return res
        .status(401)
        .json({ error: "Invalid email/username or password" });
    }

    const { hashed_password: storedPassword } = passwordResult.rows[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, storedPassword);

    if (isMatch) {
      // Create a token

      const token = jwt.sign(
        { userId, firstName, lastName, email_id },
        config.secret,
        {
          expiresIn: "5h",
        }
      );

      // Return full user details along with the role name and the token
      res.status(200).json({
        message: "Login successful",
        token,
        user: {
          user_id: userId,
          firstName: user.firstName,
          middleName: user.middleName,
          lastName: user.lastName,
          description: user.description,
          mobileNumber: user.mobileNumber,
          email: user.email,
          userName: user.userName,
          hasAccess: user.hasAccess,
          role: user.userRole, // Role name
          level: user.level, // Level name
          gender: user.gender, // Gender name
          supportGroup: user.supportGroup, // Support group name
          reportingTo: user.reportingTo, // Reporting to name
        },
      });
    } else {
      res.status(401).json({ error: "Invalid email/username or password" });
    }
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release(); // Release the client back to the pool
  }
};

const userBulkUpload = async (req, res) => {
  const client = await pool.connect(); // Get a client from the pool

  try {
    const file = req.file;
    console.log("Uploaded file:", file);

    const workbook = XLSX.readFile(file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert the sheet data to JSON format
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    console.log("Parsed data:", data);

    if (data.length < 3) {
      throw new Error("The uploaded file doesn't contain enough rows.");
    }

    // First row: user known headings
    const userKnownHeadings = data[0];
    console.log("User Known Headings:", userKnownHeadings);

    // Second row: body headings
    const bodyHeadings = data[1];
    console.log("Body Headings:", bodyHeadings);

    // Remaining rows: user data
    const userRows = data.slice(2); // Start from the 3rd row for actual data
    console.log("User Data Rows:", userRows);

    // Begin transaction
    await client.query("BEGIN");

    for (const row of userRows) {
      const [
        firstName,
        middleName,
        lastName,
        description,
        mobileNumber,
        email,
        password,
        supportGroupName,
        userRoleName,
        levelName,
        userName,
        genderName,
        reportingTo, // Fetching reportingTo
      ] = row;

      // Fetch support_group_id
      const supportGroupQuery = `
        SELECT support_group_id FROM support_group_detail WHERE support_group_name = $1
      `;
      const supportGroupResult = await client.query(supportGroupQuery, [
        supportGroupName,
      ]);
      const supportGroupId = supportGroupResult.rows.length
        ? supportGroupResult.rows[0].support_group_id
        : null;
      if (!supportGroupId)
        throw new Error(`Support group ${supportGroupName} not found`);

      // Fetch user_role_id
      const roleQuery = `SELECT role_id FROM user_role WHERE role_name = $1`;
      const roleResult = await client.query(roleQuery, [userRoleName]);
      const userRoleId = roleResult.rows.length
        ? roleResult.rows[0].role_id
        : null;
      if (!userRoleId) throw new Error(`User role ${userRoleName} not found`);

      // Fetch level_id
      const levelQuery = `SELECT level_id FROM level_detail WHERE level_name = $1`;
      const levelResult = await client.query(levelQuery, [levelName]);
      const levelId = levelResult.rows.length
        ? levelResult.rows[0].level_id
        : null;
      if (!levelId) throw new Error(`Level ${levelName} not found`);

      // Fetch gender_id
      const genderQuery = `SELECT id FROM gender WHERE gender_name = $1`;
      const genderResult = await client.query(genderQuery, [genderName]);
      const genderId = genderResult.rows.length
        ? genderResult.rows[0].id
        : null;
      if (!genderId) throw new Error(`Gender ${genderName} not found`);

      // Split reportingTo name into first and last names
      const [reportingFirstName, reportingLastName] = reportingTo.split(" ");

      // Fetch reportingTo user_id
      const reportingToQuery = `
        SELECT user_id
        FROM user_details
        WHERE CONCAT(first_name, ' ', last_name) = $1
      `;
      const reportingToResult = await client.query(reportingToQuery, [
        [reportingFirstName, reportingLastName].join(" "),
      ]);
      const reportingToId = reportingToResult.rows.length
        ? reportingToResult.rows[0].user_id
        : null;

      if (!reportingToId) throw new Error(`User ${reportingTo} not found`);

      // Insert into user_details
      const userDetailsResult = await client.query(
        `INSERT INTO user_details (
          first_name, middle_name, last_name, description, mobile_no, email_id, user_name
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7
        ) RETURNING user_id`,
        [
          firstName,
          middleName,
          lastName,
          description,
          mobileNumber,
          email,
          userName,
        ]
      );
      const userId = userDetailsResult.rows[0].user_id;

      // Hash the password and generate a salt
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Insert into user_passwords
      await client.query(
        `INSERT INTO user_passwords (
          user_id, hashed_password, salt
        ) VALUES (
          $1, $2, $3
        )`,
        [userId, hashedPassword, salt]
      );

      // Insert into user_relation
      await client.query(
        `INSERT INTO user_relation (
          user_id, role_id, support_group_id, level_id, gender_id, reporting_to
        ) VALUES (
          $1, $2, $3, $4, $5, $6
        )`,
        [userId, userRoleId, supportGroupId, levelId, genderId, reportingToId] // Use reportingToId here
      );
    }

    // Commit transaction
    await client.query("COMMIT");

    res.status(201).json({
      message: "Users uploaded successfully.",
      uploadedUsers: userRows.length,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error uploading users:", err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release(); // Release the client back to the pool
  }
};

module.exports = {
  registerController,
  loginController,
  userBulkUpload,
};
