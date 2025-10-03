const pool = require("../db/db");

const getOrganisationalChart = async (req, res) => {
  try {
    // Step 1: Execute the SQL query to get user-manager data, role, email, gender, support group, and aggregated user profile
    const result = await pool.query(`
      SELECT 
        ud.user_id,
        concat(ud.first_name, ' ', ud.last_name) AS user_name,
        ud.email_id,  -- Get user email
        ud.mobile_no,  -- Get user mobile number
        ur.reporting_to,
        ur.id,
        ur.role_id, -- User's role_id
        concat(ur2.first_name, ' ', ur2.last_name) AS manager_name,
        ur2.user_id AS manager_id,
        ur3.role_name AS user_role,  -- User's role
        ur4.role_name AS manager_role,  -- Manager's role
        g.gender_name AS gender,  -- User's gender from gender table
        sgd.support_group_name AS support_group, -- User's support group
        STRING_AGG(DISTINCT ua.file_path, ', ') AS user_profile  -- Aggregating user profile URLs
      FROM 
        user_details ud
      JOIN 
        user_relation ur ON ud.user_id = ur.user_id
      LEFT JOIN 
        user_details ur2 ON ur.reporting_to = ur2.user_id  -- Join to get manager details
      LEFT JOIN 
        user_role ur3 ON ur.role_id = ur3.role_id  -- Join to get user role name
      LEFT JOIN 
        user_relation ur_m ON ur2.user_id = ur_m.user_id  -- Join for manager's role_id
      LEFT JOIN 
        user_role ur4 ON ur_m.role_id = ur4.role_id  -- Join to get manager role name
      LEFT JOIN 
        gender g ON ur.gender_id = g.id  -- Join to get gender name from gender table
      LEFT JOIN 
        support_group_detail sgd ON ur.support_group_id = sgd.support_group_id  -- Join to get support group name
      LEFT JOIN 
        user_attachments ua ON ud.user_id = ua.user_id  -- Join to get user profile from user_attachments
      GROUP BY 
        ud.user_id, ud.first_name, ud.last_name, ud.email_id, ud.mobile_no, ur.reporting_to, ur.id, ur.role_id, ur2.first_name, ur2.last_name, ur2.user_id, ur3.role_name, ur4.role_name, g.gender_name, sgd.support_group_name;
    `);

    const employees = result.rows;

    // Step 2: Recursive function to build the hierarchy with email, role, gender, support group, and aggregated user profile
    const buildHierarchy = (employees, managerId = null) => {
      return employees
        .filter((employee) => employee.reporting_to === managerId)
        .map((employee) => {
          // Recursively get the subordinates (employees under this manager)
          const subordinates = buildHierarchy(employees, employee.user_id);

          // Clean the user_profile URL(s) by removing any unwanted single quotes, double quotes, and backslashes
          const cleanedUserProfile = employee.user_profile
            ? employee.user_profile
                .replace(/^['"]+|['"]+$/g, "")
                .replace(/\\+/g, "") // Remove leading/trailing quotes and backslashes
            : null;

          return {
            user_id: employee.user_id,
            user_name: employee.user_name,
            email_id: employee.email_id, // Include user email
            mobile_no: employee.mobile_no, // Include user mobile number
            user_role: employee.user_role, // Include user role
            gender: employee.gender, // Include user gender
            support_group: employee.support_group, // Include support group
            user_profile: cleanedUserProfile, // Include cleaned user profile data (aggregated)
            subordinates: subordinates.length ? subordinates : [], // Only include if there are subordinates
          };
        });
    };

    // Step 3: Build the organizational chart starting from the top-level admins (manager_id = NULL)
    const orgChart = buildHierarchy(employees);

    // Step 4: Send the organizational chart as a response
    res.status(200).json(orgChart);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      error: "An error occurred while fetching the organizational chart.",
    });
  }
};

module.exports = {
  getOrganisationalChart,
};
