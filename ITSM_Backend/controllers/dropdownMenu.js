const config = require("../db/config.json");
const pool = require("../db/db");

const getAllService = async (req, res) => {
  try {
    const query = `SELECT * FROM service`;
    const result = await pool.query(query);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

const addService = async (req, res) => {
  try {
    const { service_name } = req.body;

    // Check if the service already exists
    const existingService = await pool.query(
      "SELECT * FROM service WHERE service_name = $1",
      [service_name]
    );

    // If it exists, return a conflict response
    if (existingService.rows.length > 0) {
      return res.status(409).json({ error: "Service already exists" });
    }

    // If it does not exist, insert the new service
    const result = await pool.query(
      "INSERT INTO service (service_name) VALUES ($1) RETURNING *",
      [service_name]
    );

    // Return the newly added service
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error adding service:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllCiClassification = async (req, res) => {
  try {
    const query = `SELECT * FROM ci_classification`;
    const result = await pool.query(query);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

const getAllCiCategory = async (req, res) => {
  try {
    const query = `SELECT * FROM ci_category`;
    const result = await pool.query(query);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

const getAllBom = async (req, res) => {
  try {
    const query = `SELECT * FROM bom`;
    const result = await pool.query(query);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

const getAllUserNames = async (req, res) => {
  try {
    const query = `
    SELECT
      u1.user_id,
      u1.first_name,
      u1.last_name,
      u1.email_id,
      u1.user_name,
      level_detail.level_name,
      CONCAT(u2.first_name, ' ', u2.last_name) AS reporting_to_name
    FROM
      user_details u1
    JOIN
      user_relation ON u1.user_id = user_relation.user_id
    JOIN
      level_detail ON user_relation.level_id = level_detail.level_id
    LEFT JOIN
      user_details u2 ON user_relation.reporting_to = u2.user_id;
  `;

    const result = await pool.query(query);

    res.status(200).json(result.rows);
    ``;
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

const getAllWarranyNames = async (req, res) => {
  try {
    const query = `SELECT * FROM warranty`;
    const result = await pool.query(query);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

const getAllOem = async (req, res) => {
  try {
    const query = `SELECT * FROM oem`;
    const result = await pool.query(query);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

const getUserRoles = async (req, res) => {
  try {
    const result = await pool.query("SELECT role_id, role_name FROM user_role");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching user roles:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addUserRoles = async (req, res) => {
  try {
    const { role_name } = req.body;

    // Check if the role already exists
    const existingRole = await pool.query(
      "SELECT * FROM user_role WHERE role_name = $1",
      [role_name]
    );

    if (existingRole.rows.length > 0) {
      return res.status(400).json({ error: "Role already exists" });
    }

    // Insert the new role if no duplicate is found
    const result = await pool.query(
      "INSERT INTO user_role (role_name) VALUES ($1) RETURNING *",
      [role_name]
    );

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error adding user role:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getSupportGroups = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT support_group_id::integer, support_group_name FROM support_group_detail"
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching support groups:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addSupportGroups = async (req, res) => {
  try {
    const { support_group_name,owner_id } = req.body;

    // Check if the support group already exists
    const existingGroup = await pool.query(
      "SELECT * FROM support_group_detail WHERE support_group_name = $1",
      [support_group_name]
    );

    if (existingGroup.rows.length > 0) {
      return res.status(400).json({ error: "Support group already exists" });
    }

    // Insert the new support group if no duplicate is found
    const result = await pool.query(
      "INSERT INTO support_group_detail (support_group_name,owner_id) VALUES ($1,$2) RETURNING *",
      [support_group_name,owner_id]
    );

    res.status(200).json({
      message: "Support group added successfully",
    },result.rows[0]);
  } catch (error) {
    console.error("Error adding support group:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getLevels = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT level_id, level_name FROM level_detail"
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching levels:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addLevels = async (req, res) => {
  try {
    const { level_name } = req.body;

    // Check if the level already exists
    const existingLevel = await pool.query(
      "SELECT * FROM level_detail WHERE level_name = $1",
      [level_name]
    );

    if (existingLevel.rows.length > 0) {
      return res.status(400).json({ error: "Level already exists" });
    }

    // Insert the new level if no duplicate is found
    const result = await pool.query(
      "INSERT INTO level_detail (level_name) VALUES ($1) RETURNING *",
      [level_name]
    );

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error adding level:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAssetGroup = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM asset_group");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching levels:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getallassettypes = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM asset_type");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching levels:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addAssetType = async (req, res) => {
  try {
    const { asset_type_name } = req.body;

    // Check if the asset type already exists
    const existingAssetType = await pool.query(
      "SELECT * FROM asset_type WHERE asset_type_name = $1",
      [asset_type_name]
    );

    // If it exists, return an error response
    if (existingAssetType.rows.length > 0) {
      return res.status(409).json({ error: "Asset type already exists" });
    }

    // Insert the new asset type if no duplicate is found
    const result = await pool.query(
      "INSERT INTO asset_type (asset_type_name) VALUES ($1) RETURNING *",
      [asset_type_name]
    );

    // Return the newly added asset type
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error adding asset type:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getallvendors = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM vendor");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching levels:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addVendor = async (req, res) => {
  try {
    const { vendor_name } = req.body;

    // Check if the vendor already exists
    const existingVendor = await pool.query(
      "SELECT * FROM vendor WHERE vendor_name = $1",
      [vendor_name]
    );

    // If it exists, return a conflict response
    if (existingVendor.rows.length > 0) {
      return res.status(409).json({ error: "Vendor already exists" });
    }

    // If it does not exist, insert the new vendor
    const result = await pool.query(
      "INSERT INTO vendor (vendor_name) VALUES ($1) RETURNING *",
      [vendor_name]
    );

    // Return the newly added vendor
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error adding vendor:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getallbranches = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM branch");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching levels:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addBranch = async (req, res) => {
  try {
    const { branch_name } = req.body;

    // Check if the branch already exists
    const existingBranch = await pool.query(
      "SELECT * FROM branch WHERE branch_name = $1",
      [branch_name]
    );

    // If it exists, return a conflict response
    if (existingBranch.rows.length > 0) {
      return res.status(409).json({ error: "Branch already exists" });
    }

    // If it does not exist, insert the new branch
    const result = await pool.query(
      "INSERT INTO branch (branch_name) VALUES ($1) RETURNING *",
      [branch_name]
    );

    // Return the newly added branch
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error adding branch:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getallmodels = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM model");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching levels:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addModel = async (req, res) => {
  try {
    const { model_name } = req.body;

    // Check if the model already exists
    const existingModel = await pool.query(
      "SELECT * FROM model WHERE model_name = $1",
      [model_name]
    );

    // If it exists, return a conflict response
    if (existingModel.rows.length > 0) {
      return res.status(409).json({ error: "Model already exists" });
    }

    // If it does not exist, insert the new model
    const result = await pool.query(
      "INSERT INTO model (model_name) VALUES ($1) RETURNING *",
      [model_name]
    );

    // Return the newly added model
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error adding model:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllGender = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM gender");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching levels:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllDepartment = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM department");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching levels:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Fetch all data from the call_mode table
const getAllCallModes = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM public.call_mode");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching call modes:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const getAllCallTypes = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM public.call_type");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching call types:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const createSLA = async (req, res) => {
  try {
    const { sla_time } = req.body;

    // Check if the SLA already exists
    const existingSLA = await pool.query(
      "SELECT * FROM public.sla WHERE sla_time = $1",
      [sla_time]
    );

    if (existingSLA.rows.length > 0) {
      return res.status(409).json({ error: "SLA already exists" });
    }

    // Insert the new SLA if no duplicate is found
    const result = await pool.query(
      "INSERT INTO public.sla (sla_time) VALUES ($1) RETURNING *",
      [sla_time]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating SLA:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const callType = async (req, res) => {
  try {
    const { call_type_name } = req.body;

    // Check if the call type already exists
    const existingCallType = await pool.query(
      "SELECT * FROM public.call_type WHERE call_type_name = $1",
      [call_type_name]
    );

    if (existingCallType.rows.length > 0) {
      return res.status(409).json({ error: "Call type already exists" });
    }

    // Insert the new call type if no duplicate is found
    const result = await pool.query(
      "INSERT INTO public.call_type (call_type_name) VALUES ($1) RETURNING *",
      [call_type_name]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating call type:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const getAllSLAs = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM public.sla");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching SLAs:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const getAllStatuses = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM public.status");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching statuses:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const getAllPriorities = async (req, res) => {
  const client = await pool.connect();
  try {
    const query = "SELECT * FROM public.priority";
    const result = await client.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching priorities:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

const addDepartment = async (req, res) => {
  try {
    const { department_name } = req.body;

    // Check if the department already exists
    const existingDepartment = await pool.query(
      "SELECT * FROM department WHERE department = $1",
      [department_name]
    );

    if (existingDepartment.rows.length > 0) {
      return res.status(409).json({ error: "Department already exists" });
    }

    // Insert the new department if no duplicate is found
    const result = await pool.query(
      "INSERT INTO department (department) VALUES ($1) RETURNING *",
      [department_name]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error adding department:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addCiCategory = async (req, res) => {
  try {
    const { ci_category_name } = req.body;

    // Check if the CI category already exists
    const existingCategory = await pool.query(
      "SELECT * FROM ci_category WHERE ci_category_name = $1",
      [ci_category_name]
    );

    if (existingCategory.rows.length > 0) {
      return res.status(409).json({ error: "CI Category already exists" });
    }

    // Insert the new CI category if no duplicate is found
    const result = await pool.query(
      "INSERT INTO ci_category (ci_category_name) VALUES ($1) RETURNING *",
      [ci_category_name]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error adding CI Category:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addCiClassification = async (req, res) => {
  try {
    const { ci_classification_name } = req.body;

    // Check if the CI classification already exists
    const existingClassification = await pool.query(
      "SELECT * FROM ci_classification WHERE ci_classification_name = $1",
      [ci_classification_name]
    );

    if (existingClassification.rows.length > 0) {
      return res
        .status(409)
        .json({ error: "CI Classification already exists" });
    }

    // Insert the new CI classification if no duplicate is found
    const result = await pool.query(
      "INSERT INTO ci_classification (ci_classification_name) VALUES ($1) RETURNING *",
      [ci_classification_name]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error adding CI Classification:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getChangeType = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM change_type");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching change types:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const getApprovalStates = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM approval_states");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching approval states:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const getAllOrgs = async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM public.org');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching org data:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    client.release();
  }
};

const getAllBranches = async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM public.branch');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching branch data:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    client.release();
  }
};


module.exports = {
  addCiCategory,
  getApprovalStates,
  getChangeType,
  addCiClassification,
  getAllUserNames,
  getAllService,
  getAllCiClassification,
  getAllCiCategory,
  getAllBom,
  getAllWarranyNames,
  getAllOem,
  getUserRoles,
  addUserRoles,
  getSupportGroups,
  addSupportGroups,
  getLevels,
  addLevels,
  getAssetGroup,
  getallassettypes,
  getallvendors,
  getallbranches,
  getallmodels,
  getAllGender,

  getAllDepartment,
  addDepartment,
  getAllCallModes,
  getAllCallTypes,
  getAllSLAs,
  getAllStatuses,
  getAllPriorities,
  createSLA,
  callType,
  addAssetType,
  addService,
  addVendor,
  addBranch,
  addModel,
  getAllOrgs,
  getAllBranches,
};
