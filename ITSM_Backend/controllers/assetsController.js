const pool = require("../db/db");
const XLSX = require("xlsx");

// Create Asset
const createAssetDetails = async (req, res) => {
  const client = await pool.connect(); // Get a client from the pool
  console.log("createAssetDetails", req.body);
  try {
    const {
      asset_name,
      asset_serial_no,
      purchase_date,
      assigned_date,
      expiry_date,
      ci_name,
      asset_owner_id, // This should be asset_owner_id
      asset_ci_classification_id,
      asset_ci_category_id,
      asset_service_id,
      asset_support_group_detail_id,
      description,
      vendor_id,
      branch_id,
      model_id,
      asset_type_id,
      assetstatus_id,
    } = req.body;

    // Begin transaction
    await client.query("BEGIN");

    // Check if asset_owner_id exists in user_details
    const userCheckQuery = `SELECT 1 FROM user_details WHERE user_id = $1`;
    const userCheckResult = await client.query(userCheckQuery, [
      asset_owner_id,
    ]);

    if (userCheckResult.rowCount === 0) {
      throw new Error(
        `Asset owner with ID ${asset_owner_id} does not exist in user_details.`
      );
    }

    // Insert into ci table
    const ciQuery = `
      INSERT INTO public.ci (
        ci_name,
        description
      ) VALUES ($1, $2)
      RETURNING ci_id
    `;
    const ciValues = [ci_name, description];
    const ciResult = await client.query(ciQuery, ciValues);
    const ci_id = ciResult.rows[0].ci_id;
    console.log("ci_id", ci_id);

    // Insert into asset_details table
    const assetQuery = `
      INSERT INTO asset_details (
        asset_name,
        asset_serial_no,
        purchase_date,
        assigned_date,
        expiry_date,
        ci_name,
        description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING asset_id
    `;
    const assetValues = [
      asset_name,
      asset_serial_no,
      purchase_date,
      assigned_date,
      expiry_date,
      ci_name,
      description,
    ];
    const assetResult = await client.query(assetQuery, assetValues);
    const asset_id = assetResult.rows[0].asset_id;
    console.log("asset_id", asset_id);

    // Insert into user_asset_relation table
    const relationQuery = `
      INSERT INTO user_asset_relation (
        asset_owner_id,
        asset_type_id,
        asset_ci_classification_id,
        asset_ci_category_id,
        asset_service_id,
        asset_support_group_detail_id,
        vendor_id,
        branch_id,
        model_id,
        asset_id,
        assetstatus_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `;

    const relationValues = [
      asset_owner_id,
      asset_type_id,
      asset_ci_classification_id,
      asset_ci_category_id,
      asset_service_id,
      asset_support_group_detail_id,
      vendor_id,
      branch_id,
      model_id,
      asset_id,
      assetstatus_id,
    ];
    await client.query(relationQuery, relationValues);

    // Insert into user_ci_relation table
    const userCiRelationQuery = `
      INSERT INTO public.user_ci_relation (
        user_id,
        ci_service_id,
        ci_classification_id,
        ci_category_id,
        ci_id
      ) VALUES ($1, $2, $3, $4, $5)
    `;
    const userCiRelationValues = [
      asset_owner_id,
      asset_service_id,
      asset_ci_classification_id,
      asset_ci_category_id,
      ci_id,
    ];
    await client.query(userCiRelationQuery, userCiRelationValues);

    // Insert into asset_ci table
    const assetCiQuery = `
      INSERT INTO public.asset_ci (
        asset_id,
        ci_id
      ) VALUES ($1, $2)
    `;
    const assetCiValues = [asset_id, ci_id];
    await client.query(assetCiQuery, assetCiValues);

    // Insert into asset_assigned_to table
    const assignedToQuery = `
      INSERT INTO public.asset_assigned_to (
        asset_id,
        asset_owner_id
      ) VALUES ($1, $2)
    `;
    const assignedToValues = [asset_id, asset_owner_id];
    await client.query(assignedToQuery, assignedToValues);

    // Commit the transaction
    await client.query("COMMIT");

    // Return the created asset and CI information
    res.status(201).json({
      message: "Asset, CI, and relations created successfully",
      asset_id,
      ci_id,
    });
  } catch (error) {
    // Rollback the transaction in case of error
    await client.query("ROLLBACK");
    console.error("Error creating asset and relations:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    // Release the database client back to the pool
    client.release();
  }
};

// Get All Assets --- Done
// const getAllAssets = async (req, res) => {
//   const client = await pool.connect();
//   console.log("getAllAssets");
//   try {
//     const query = `
//       SELECT
//         ad.asset_id AS id,  -- Renamed asset_id to id
//         ad.asset_name AS name,  -- Renamed asset_name to name
//         ad.asset_serial_no AS serial_no,  -- Renamed asset_serial_no to serial_no
//         TO_CHAR(ad.assigned_date, 'DD/MM/YYYY') AS warranty_start,  -- Format assigned_date to dd/mm/yyyy
//         TO_CHAR(ad.expiry_date, 'DD/MM/YYYY') AS warranty_end,      -- Format expiry_date to dd/mm/yyyy
//         TO_CHAR(ad.purchase_date, 'DD/MM/YYYY') AS purchase_date,    -- Format purchase_date to dd/mm/yyyy
//         ad.description AS asset_description,  -- Renamed description to asset_description
//         ud.user_name AS owner_name,  -- Renamed asset_owner_name to owner_name
//         cic.ci_classification_name AS classification_name,  -- Renamed asset_ci_classification_name to classification_name
//         cicat.ci_category_name AS category_name,  -- Renamed asset_ci_category_name to category_name
//         s.service_name AS service_name,  -- Kept this column as is
//         sg.support_group_name AS support_group,  -- Renamed asset_support_group_name to support_group
//         v.vendor_name AS vendor,  -- Renamed asset_vendor_name to vendor
//         b.branch_name AS branch,  -- Renamed asset_branch_name to branch
//         m.model_name AS model,  -- Renamed asset_model_name to model
//         at.asset_type_name AS type_name,  -- Renamed asset_type_name to type_name
//         ast.status_name AS status_name  -- Renamed assetstatus_id to status_name
//       FROM asset_details ad
//       LEFT JOIN user_asset_relation uar ON ad.asset_id = uar.asset_id
//       LEFT JOIN user_details ud ON uar.asset_owner_id = ud.user_id
//       LEFT JOIN ci_classification cic ON uar.asset_ci_classification_id = cic.ci_classification_id
//       LEFT JOIN ci_category cicat ON uar.asset_ci_category_id = cicat.ci_category_id
//       LEFT JOIN service s ON uar.asset_service_id = s.service_id
//       LEFT JOIN support_group_detail sg ON uar.asset_support_group_detail_id = sg.support_group_id
//       LEFT JOIN vendor v ON uar.vendor_id = v.vendor_id
//       LEFT JOIN branch b ON uar.branch_id = b.branch_id
//       LEFT JOIN model m ON uar.model_id = m.model_id
//       LEFT JOIN asset_type at ON uar.asset_type_id = at.asset_type_id
//       LEFT JOIN asset_status ast ON uar.assetstatus_id = ast.status_id
//       ORDER BY ad.asset_id;
//     `;

//     const result = await client.query(query);

//     res.status(200).json(result.rows);
//   } catch (error) {
//     console.error("Error fetching assets:", error.message);
//     res.status(500).json({ error: "Internal Server Error" });
//   } finally {
//     client.release();
//   }
// };

const getAllAssets = async (req, res) => {
  const client = await pool.connect();
  console.log("getAllAssets");
  try {
    // Step 1: Fetch all assets with their details
    const query = `
      SELECT
        ad.asset_id AS id,  -- Renamed asset_id to id
        ad.asset_name AS name,  -- Renamed asset_name to name
        ad.asset_serial_no AS serial_no,  -- Renamed asset_serial_no to serial_no
        TO_CHAR(ad.assigned_date, 'DD/MM/YYYY') AS warranty_start,  -- Format assigned_date to dd/mm/yyyy
        TO_CHAR(ad.expiry_date, 'DD/MM/YYYY') AS warranty_end,      -- Format expiry_date to dd/mm/yyyy
        TO_CHAR(ad.purchase_date, 'DD/MM/YYYY') AS purchase_date,    -- Format purchase_date to dd/mm/yyyy
        ad.description AS asset_description,  -- Renamed description to asset_description
        ud.user_name AS owner_name,  -- Renamed asset_owner_name to owner_name
        cic.ci_classification_name AS classification_name,  -- Renamed asset_ci_classification_name to classification_name
        cicat.ci_category_name AS category_name,  -- Renamed asset_ci_category_name to category_name
        s.service_name AS service_name,  -- Kept this column as is
        sg.support_group_name AS support_group,  -- Renamed asset_support_group_name to support_group
        v.vendor_name AS vendor,  -- Renamed asset_vendor_name to vendor
        b.branch_name AS branch,  -- Renamed asset_branch_name to branch
        m.model_name AS model,  -- Renamed asset_model_name to model
        at.asset_type_name AS type_name,  -- Renamed asset_type_name to type_name
        ast.status_name AS status_name  -- Renamed assetstatus_id to status_name
      FROM asset_details ad
      LEFT JOIN user_asset_relation uar ON ad.asset_id = uar.asset_id
      LEFT JOIN user_details ud ON uar.asset_owner_id = ud.user_id
      LEFT JOIN ci_classification cic ON uar.asset_ci_classification_id = cic.ci_classification_id
      LEFT JOIN ci_category cicat ON uar.asset_ci_category_id = cicat.ci_category_id
      LEFT JOIN service s ON uar.asset_service_id = s.service_id
      LEFT JOIN support_group_detail sg ON uar.asset_support_group_detail_id = sg.support_group_id
      LEFT JOIN vendor v ON uar.vendor_id = v.vendor_id
      LEFT JOIN branch b ON uar.branch_id = b.branch_id
      LEFT JOIN model m ON uar.model_id = m.model_id
      LEFT JOIN asset_type at ON uar.asset_type_id = at.asset_type_id
      LEFT JOIN asset_status ast ON uar.assetstatus_id = ast.status_id
      ORDER BY ad.asset_id;
    `;

    const result = await client.query(query);

    // Step 2: Extract asset IDs for further querying
    const assetIds = result.rows.map(asset => asset.id);
    
    // Step 3: Retrieve CI IDs associated with asset IDs
    const ciIdsQuery = `
      SELECT ci_id, asset_id
      FROM public.asset_ci
      WHERE asset_id = ANY($1::int[]);
    `;
    const ciIdsResult = await client.query(ciIdsQuery, [assetIds]);

    const ciToAssetMap = {};
    ciIdsResult.rows.forEach(row => {
      ciToAssetMap[row.ci_id] = row.asset_id;
    });

    // Step 4: Get incident IDs associated with the CI IDs
    const incidentIdsQuery = `
      SELECT incident_details_id, ci_details_id 
      FROM public.incident_asset_user_details
      WHERE ci_details_id = ANY($1::int[]);
    `;
    const incidentIdsResult = await client.query(incidentIdsQuery, [Object.keys(ciToAssetMap)]);

    if (incidentIdsResult.rowCount === 0) {
      return res.status(200).json({
        success: true,
        assets: result.rows.map(asset => ({ ...asset, status: "Active" })),
      });
    }

    const incidentIds = incidentIdsResult.rows.map(row => row.incident_details_id);

    // Step 5: Check if incident IDs have call_type_id = 6 in the incident_relation table
    const surrenderInProgressQuery = `
      SELECT incident_id 
      FROM public.incident_relation
      WHERE incident_id = ANY($1::int[])
        AND call_type_id = 6;
    `;
    const surrenderInProgressResult = await client.query(surrenderInProgressQuery, [incidentIds]);

    // Map of ci_details_id that have incidents in "Surrender in Progress" status
    const surrenderInProgressIds = new Set(surrenderInProgressResult.rows.map(row => row.incident_id));
    const surrenderAssets = new Set();

    // Identify asset IDs that should be marked as "Surrender in Progress"
    incidentIdsResult.rows.forEach(row => {
      if (surrenderInProgressIds.has(row.incident_details_id)) {
        const assetId = ciToAssetMap[row.ci_details_id];
        if (assetId) surrenderAssets.add(assetId);
      }
    });

    // Step 6: Prepare final asset details with correct status
    const assetDetails = result.rows.map(asset => {
      const assetIdInt = String(asset.id); // Ensure asset_id is an integer
      if (surrenderAssets.has(assetIdInt)) {
        return {
          ...asset,
          status: "Surrender in Progress",
        };
      } else {
        return {
          ...asset,
          status: "Active",
        };
      }
    });

    return res.status(200).json({
      success: true,
      assets: assetDetails,
    });

  } catch (error) {
    console.error("Error fetching assets:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};


const getAllAssetsdropdown = async (req, res) => {
  const client = await pool.connect();
  console.log("getAllAssets");
  try {
    const query = `
      SELECT
        ad.asset_id AS id,  -- Asset ID
        ad.asset_name AS name  -- Asset Name
      FROM asset_details ad
      ORDER BY ad.asset_id;
    `;

    const result = await client.query(query);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching assets:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

// Get Asset by Id -------- Done
const getAssetDetails = async (req, res) => {
  const client = await pool.connect();
  const { asset_id } = req.params;

  try {
    // Query to fetch asset details along with related data from referenced tables
    const query = `
      SELECT
        ad.asset_id,
        ad.asset_name,
        ad.asset_serial_no,
        ad.purchase_date,  
        ad.assigned_date,  
        ad.expiry_date,    
        ad.description,
        ad.ci_name,
        uar.asset_owner_id,
        uar.asset_type_id,
        uar.asset_ci_classification_id,
        uar.asset_ci_category_id,
        uar.asset_service_id,
        uar.asset_support_group_detail_id,
        uar.vendor_id,
        uar.branch_id,
        uar.model_id,
        ud.user_name AS asset_owner_name,
        cic.ci_classification_name AS asset_ci_classification_name,
        cicat.ci_category_name AS asset_ci_category_name,
        s.service_name AS asset_service_name,
        sg.support_group_name AS asset_support_group_name,
        v.vendor_name AS asset_vendor_name,
        b.branch_name AS asset_branch_name,
        m.model_name AS asset_model_name,
        at.asset_type_name AS asset_type_name,
        ast.status_name AS assetstatus_name
      FROM asset_details ad
      LEFT JOIN user_asset_relation uar ON ad.asset_id = uar.asset_id
      LEFT JOIN user_details ud ON uar.asset_owner_id = ud.user_id
      LEFT JOIN ci_classification cic ON uar.asset_ci_classification_id = cic.ci_classification_id
      LEFT JOIN ci_category cicat ON uar.asset_ci_category_id = cicat.ci_category_id
      LEFT JOIN service s ON uar.asset_service_id = s.service_id
      LEFT JOIN support_group_detail sg ON uar.asset_support_group_detail_id = sg.support_group_id
      LEFT JOIN vendor v ON uar.vendor_id = v.vendor_id
      LEFT JOIN branch b ON uar.branch_id = b.branch_id
      LEFT JOIN model m ON uar.model_id = m.model_id
      LEFT JOIN asset_type at ON uar.asset_type_id = at.asset_type_id
      LEFT JOIN asset_status ast ON uar.assetstatus_id = ast.status_id

      WHERE ad.asset_id = $1
    `;

    const result = await client.query(query, [asset_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Asset not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching asset details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

const getUserAssets = async (req, res) => {
  const { userId } = req.params;
  console.log(userId);
  try {
    const query = `
          SELECT 
              a.asset_id AS id,  -- Renamed asset_id to id
              a.asset_name AS name,  -- Renamed asset_name to name
              a.asset_serial_no AS serial_no,  -- Renamed asset_serial_no to serial_no
              a.purchase_date AS purchase_date,  -- Updated from invoice_date to purchase_date
              a.assigned_date AS assigned_date,  -- Updated from warranty_start_date to assigned_date
              a.expiry_date AS expiry_date,  -- Updated from warranty_end_date to expiry_date
              a.ci_name AS ci_name,
              a.description AS asset_description  -- Renamed description to asset_description
          FROM 
              public.asset_details a
          JOIN 
              public.user_asset_relation uar 
              ON a.asset_id = uar.asset_id
          WHERE 
              uar.asset_owner_id = $1;
      `;

    const values = [userId];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No assets found for this user" });
    }

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching user assets:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete Asset by Id ------ Done
const deleteAssetDetails = async (req, res) => {
  const client = await pool.connect();
  const { asset_id } = req.params;

  try {
    await client.query("BEGIN");

    // Check if asset exists
    const checkAssetQuery = `SELECT * FROM asset_details WHERE asset_id = $1`;
    const checkResult = await client.query(checkAssetQuery, [asset_id]);
    if (checkResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Asset not found" });
    }

    // Delete from user_asset_relation
    const deleteRelationQuery = `
      DELETE FROM user_asset_relation
      WHERE asset_id = $1
    `;
    await client.query(deleteRelationQuery, [asset_id]);

    // Delete from asset_details
    const deleteAssetQuery = `
      DELETE FROM asset_details
      WHERE asset_id = $1
    `;
    await client.query(deleteAssetQuery, [asset_id]);

    await client.query("COMMIT");
    res.status(200).json({ message: "Asset deleted successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error deleting asset:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

// Update Asset by Id ------ Done
const updateAssetDetails = async (req, res) => {
  const client = await pool.connect();

  if (!client) {
    return res.status(500).json({ error: "Failed to connect to the database" });
  }

  console.log("updateAssetDetails", req.body);

  try {
    const {
      asset_name,
      asset_serial_no,
      purchase_date,
      assigned_date,
      expiry_date,
      ci_name,
      asset_owner_id,
      asset_ci_classification_id,
      asset_ci_category_id,
      asset_service_id,
      asset_support_group_detail_id,
      description,
      vendor_id,
      branch_id,
      model_id,
      asset_type_id,
      assetstatus_id,
    } = req.body;

    const { asset_id } = req.params;

    await client.query("BEGIN");

    // Check if asset exists
    const assetCheckResult = await client.query(
      `SELECT 1 FROM asset_details WHERE asset_id = $1`,
      [asset_id]
    );
    if (assetCheckResult.rowCount === 0) {
      return res
        .status(404)
        .json({ error: `Asset with ID ${asset_id} does not exist.` });
    }

    // Check if asset owner exists
    const userCheckResult = await client.query(
      `SELECT 1 FROM user_details WHERE user_id = $1`,
      [asset_owner_id]
    );
    if (userCheckResult.rowCount === 0) {
      return res.status(404).json({
        error: `Asset owner with ID ${asset_owner_id} does not exist.`,
      });
    }

    // Get ci_id
    const ciIdResult = await client.query(
      `SELECT ci_id FROM public.asset_ci WHERE asset_id = $1`,
      [asset_id]
    );
    const ci_id = ciIdResult.rows[0]?.ci_id;
    if (!ci_id) {
      throw new Error(`CI not found for asset_id ${asset_id}`);
    }

    // Update CI
    await client.query(
      `UPDATE public.ci SET ci_name = $1, description = $2 WHERE ci_id = $3`,
      [ci_name, description, ci_id]
    );

    // Update asset_details
    await client.query(
      `UPDATE asset_details SET asset_name = $1, asset_serial_no = $2, purchase_date = $3, 
      assigned_date = $4, expiry_date = $5, description = $6 WHERE asset_id = $7`,
      [
        asset_name,
        asset_serial_no,
        purchase_date,
        assigned_date,
        expiry_date,
        description,
        asset_id,
      ]
    );

    // Update user_asset_relation
    await client.query(
      `UPDATE user_asset_relation SET asset_owner_id = $1, asset_type_id = $2, asset_ci_classification_id = $3, 
      asset_ci_category_id = $4, asset_service_id = $5, asset_support_group_detail_id = $6, vendor_id = $7, 
      branch_id = $8, model_id = $9, assetstatus_id = $10 WHERE asset_id = $11`,
      [
        asset_owner_id,
        asset_type_id,
        asset_ci_classification_id,
        asset_ci_category_id,
        asset_service_id,
        asset_support_group_detail_id,
        vendor_id,
        branch_id,
        model_id,
        assetstatus_id,
        asset_id,
      ]
    );

    // Update user_ci_relation
    await client.query(
      `UPDATE public.user_ci_relation SET user_id = $1, ci_service_id = $2, ci_classification_id = $3, 
      ci_category_id = $4 WHERE ci_id = $5`,
      [
        asset_owner_id,
        asset_service_id,
        asset_ci_classification_id,
        asset_ci_category_id,
        ci_id,
      ]
    );

    // Update asset_assigned_to
    await client.query(
      `UPDATE public.asset_assigned_to SET asset_owner_id = $1 WHERE asset_id = $2`,
      [asset_owner_id, asset_id]
    );

    await client.query("COMMIT");
    res.status(200).json({
      message: "Asset, CI, and relations updated successfully",
      asset_id,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating asset and relations:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

const assetHistory = async (req, res) => {};

function excelSerialToJsDate(serial) {
  const excelEpoch = new Date(1899, 11, 30); // Excel epoch starts from December 30, 1899
  const jsDate = new Date(excelEpoch.getTime() + serial * 86400000); // Multiply by milliseconds per day
  return jsDate.toISOString().split("T")[0]; // Return in YYYY-MM-DD format
}

const assetBulkUpload = async (req, res) => {
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

    // First row: header
    const header = data[0];
    console.log("Header:", header);

    // Second row: body headings (these are assumed to be consistent with the columns in the DB)
    const bodyHeading = data[1];
    console.log("Body Heading:", bodyHeading);

    // Remaining rows: asset data
    const assetRows = data.slice(2);
    console.log("Asset Data Rows:", assetRows);

    // Begin transaction
    await client.query("BEGIN");

    for (const row of assetRows) {
      const [
        asset_name,
        asset_serial_no,
        purchase_date_serial,
        assigned_date_serial,
        expiry_date_serial,
        ci_name,
        asset_owner_name,
        asset_ci_classification_name,
        asset_ci_category_name,
        asset_service_name,
        asset_support_group_name,
        description,
        vendor_name,
        branch_name,
        model_name,
        asset_type_name,
      ] = row;

      // Convert Excel serial numbers to dates
      const purchase_date = excelSerialToJsDate(purchase_date_serial);
      const assigned_date = excelSerialToJsDate(assigned_date_serial);
      const expiry_date = excelSerialToJsDate(expiry_date_serial);

      const [first_name, last_name] = asset_owner_name.split(" ");
      // Fetch asset_owner_id
      const ownerQuery = `
        SELECT user_id 
        FROM user_details 
        WHERE CONCAT(first_name, ' ', last_name) = $1
      `;
      const ownerResult = await client.query(ownerQuery, [
        [first_name, last_name].join(" "),
      ]);
      const asset_owner_id = ownerResult.rows.length
        ? ownerResult.rows[0].user_id
        : null;
      if (!asset_owner_id)
        throw new Error(`User ${asset_owner_name} not found`);

      // Fetch asset_service_id
      const serviceQuery = `SELECT service_id FROM service WHERE service_name = $1`;
      const serviceResult = await client.query(serviceQuery, [
        asset_service_name,
      ]);
      const asset_service_id = serviceResult.rows.length
        ? serviceResult.rows[0].service_id
        : null;
      if (!asset_service_id)
        throw new Error(`Service ${asset_service_name} not found`);

      // Fetch asset_support_group_detail_id
      const supportGroupQuery = `
        SELECT support_group_id FROM support_group_detail WHERE support_group_name = $1
      `;
      const supportGroupResult = await client.query(supportGroupQuery, [
        asset_support_group_name,
      ]);
      const asset_support_group_detail_id = supportGroupResult.rows.length
        ? supportGroupResult.rows[0].support_group_id
        : null;
      if (!asset_support_group_detail_id)
        throw new Error(`Support group ${asset_support_group_name} not found`);

      // Fetch asset_ci_classification_id
      const ciClassificationQuery = `
        SELECT ci_classification_id FROM ci_classification WHERE ci_classification_name = $1
      `;
      const ciClassificationResult = await client.query(ciClassificationQuery, [
        asset_ci_classification_name,
      ]);
      const asset_ci_classification_id = ciClassificationResult.rows.length
        ? ciClassificationResult.rows[0].ci_classification_id
        : null;
      if (!asset_ci_classification_id)
        throw new Error(
          `CI Classification ${asset_ci_classification_name} not found`
        );

      // Fetch asset_ci_category_id
      const ciCategoryQuery = `
        SELECT ci_category_id FROM ci_category WHERE ci_category_name = $1
      `;
      const ciCategoryResult = await client.query(ciCategoryQuery, [
        asset_ci_category_name,
      ]);
      const asset_ci_category_id = ciCategoryResult.rows.length
        ? ciCategoryResult.rows[0].ci_category_id
        : null;
      if (!asset_ci_category_id)
        throw new Error(`CI Category ${asset_ci_category_name} not found`);

      // Fetch vendor_id
      const vendorQuery = `SELECT vendor_id FROM vendor WHERE vendor_name = $1`;
      const vendorResult = await client.query(vendorQuery, [vendor_name]);
      const vendor_id = vendorResult.rows.length
        ? vendorResult.rows[0].vendor_id
        : null;
      if (!vendor_id) throw new Error(`Vendor ${vendor_name} not found`);

      // Fetch branch_id
      const branchQuery = `SELECT branch_id FROM branch WHERE branch_name = $1`;
      const branchResult = await client.query(branchQuery, [branch_name]);
      const branch_id = branchResult.rows.length
        ? branchResult.rows[0].branch_id
        : null;
      if (!branch_id) throw new Error(`Branch ${branch_name} not found`);

      // Fetch model_id
      const modelQuery = `SELECT model_id FROM model WHERE model_name = $1`;
      const modelResult = await client.query(modelQuery, [model_name]);
      const model_id = modelResult.rows.length
        ? modelResult.rows[0].model_id
        : null;
      if (!model_id) throw new Error(`Model ${model_name} not found`);

      // Fetch asset_type_id
      const assetTypeQuery = `
        SELECT asset_type_id FROM asset_type WHERE asset_type_name = $1
      `;
      const assetTypeResult = await client.query(assetTypeQuery, [
        asset_type_name,
      ]);
      const asset_type_id = assetTypeResult.rows.length
        ? assetTypeResult.rows[0].asset_type_id
        : null;
      if (!asset_type_id)
        throw new Error(`Asset Type ${asset_type_name} not found`);

      // Insert CI details
      const ciQuery = `
        INSERT INTO public.ci (ci_name, description) VALUES ($1, $2)
        RETURNING ci_id
      `;
      const ciValues = [ci_name, description];
      const ciResult = await client.query(ciQuery, ciValues);
      const ci_id = ciResult.rows[0].ci_id;

      // Insert asset details
      const assetQuery = `
        INSERT INTO asset_details (
          asset_name,
          asset_serial_no,
          purchase_date,
          assigned_date,
          expiry_date,
          ci_name,
          description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING asset_id
      `;
      const assetValues = [
        asset_name,
        asset_serial_no,
        purchase_date,
        assigned_date,
        expiry_date,
        ci_name,
        description,
      ];
      const assetResult = await client.query(assetQuery, assetValues);
      const asset_id = assetResult.rows[0].asset_id;

      // Insert into user_asset_relation
      const relationQuery = `
        INSERT INTO user_asset_relation (
          asset_owner_id,
          asset_type_id,
          asset_ci_classification_id,
          asset_ci_category_id,
          asset_service_id,
          asset_support_group_detail_id,
          vendor_id,
          branch_id,
          model_id,
          asset_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `;
      const relationValues = [
        asset_owner_id,
        asset_type_id,
        asset_ci_classification_id,
        asset_ci_category_id,
        asset_service_id,
        asset_support_group_detail_id,
        vendor_id,
        branch_id,
        model_id,
        asset_id,
      ];
      await client.query(relationQuery, relationValues);

      // Insert into asset_ci
      const assetCiQuery = `
        INSERT INTO public.asset_ci (asset_id, ci_id) VALUES ($1, $2)
      `;
      const assetCiValues = [asset_id, ci_id];
      await client.query(assetCiQuery, assetCiValues);

      // Insert into asset_assigned_to
      const assignedToQuery = `
        INSERT INTO public.asset_assigned_to (asset_id, asset_owner_id) VALUES ($1, $2)
      `;
      const assignedToValues = [asset_id, asset_owner_id];
      await client.query(assignedToQuery, assignedToValues);

      // Insert into user_ci_relation
      const userCiRelationQuery = `
        INSERT INTO user_ci_relation (
          user_id,
          ci_id,
          ci_service_id,
          ci_classification_id,
          ci_category_id
        ) VALUES ($1, $2, $3, $4, $5)
      `;
      const userCiRelationValues = [
        asset_owner_id, // user_id (assuming asset_owner_id is the same as user_id)
        ci_id,
        asset_service_id, // ci_service_id
        asset_ci_classification_id, // ci_classification_id
        asset_ci_category_id, // ci_category_id
      ];
      await client.query(userCiRelationQuery, userCiRelationValues);
    }

    // Commit transaction
    await client.query("COMMIT");

    res.status(201).json({
      message: "Assets uploaded successfully.",
      uploadedAssets: assetRows.length,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error uploading assets:", err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release(); // Release the client back to the pool
  }
};

const getAssetStatuses = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT status_id, status_name FROM asset_status"
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching asset statuses:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const surrenderAsset = async (req, res) => {
  console.log(req.body);
  const { asset_id } = req.body;

  // Validate required fields
  if (!asset_id) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Step 1: Fetch initiated_for_user_id based on asset_id
    const userResult = await client.query(
      `SELECT asset_owner_id FROM public.user_asset_relation WHERE asset_id = $1`,
      [asset_id]
    );
    const initiatedForUserId = userResult.rows[0]?.asset_owner_id;

    if (!initiatedForUserId) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ success: false 
          ,message: "User for the specified asset not found" });
    }

    // Step 2: Fetch ci_id from asset_ci based on asset_id
    const ciResult = await client.query(
      `SELECT ci_id FROM public.asset_ci WHERE asset_id = $1`,
      [asset_id]
    );
    const ciId = ciResult.rows[0]?.ci_id;

    if (!ciId) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ success: false , message: "CI for the specified asset not found" });
    }

    // Step 3: Fetch dynamic values from the respective tables

    const callTypeResult = await client.query(
      `SELECT id FROM public.call_type WHERE call_type_name = $1`,
      ["surrender"] // Using parameterized queries for safety
    );
    const callTypeId = callTypeResult.rows[0]?.id; // Make sure to access the correct property

    if (!callTypeId) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({success: false , message: "Call type 'surrender' not found" });
    }
    // Fetch statusId from status table
    const statusResult = await client.query(
      `SELECT * FROM public.status WHERE (status_name) = $1`,
      ["Close"] // Use lowercase for both the database and parameter
    );
    const statusId = 1; // Hardcoded

    if (!statusId) {
      await client.query("ROLLBACK");
      return res.status(404).json({success: false , message: "Status 'open' not found" });
    }

    // Fetch callModeId from call_mode table
    const callModeResult = await client.query(
      `SELECT id FROM public.call_mode WHERE mode = $1`, // Adjust the mode value accordingly
      ["web"] // Using parameterized queries for safety
    );
    const callModeId = 1;

    if (!callModeId) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Call mode not found" });
    }

    // Fetch priorityId from priority table
    // const priorityResult = await client.query(
    //   `SELECT priority_id FROM public.priority WHERE priority = 'Medium'` // Adjust the priority value accordingly
    // );
    const priorityId = 2;

    if (!priorityId) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Priority not found" });
    }

    // Fetch slaId from sla table
    const slaResult = await client.query(
      `SELECT sla_id FROM public.sla WHERE sla_time = '8.00'` 
    );
    const slaId =7;

    if (!slaId) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "SLA level not found" });
    }

    // Step 4: Create the incident
    const issueDescription = `Surrendering asset with ID ${asset_id}`;

    // Insert into the incident table
    const incidentResult = await client.query(
      `INSERT INTO public.incident (issue_description)
       VALUES ($1) RETURNING incident_id`,
      [issueDescription]
    );

    const incidentId = incidentResult.rows[0].incident_id;

    // Step 5: Insert into the incident_relation table
    await client.query(
      `INSERT INTO public.incident_relation 
       (call_type_id, status_id, call_mode_id, priority_id, sla_id, incident_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [callTypeId, statusId, callModeId, priorityId, slaId, incidentId]
    );

    // Step 6: Insert into the incident_asset_user_details table
    const supportGroupResult = await client.query(
      `SELECT support_group_id FROM public.support_group_detail WHERE support_group_name = 'IT Support'`
    );
    const supportGroupId = supportGroupResult.rows[0]?.support_group_id;

    await client.query(
      `INSERT INTO public.incident_asset_user_details 
       (incident_details_id, ci_details_id, user_assigned_to_id, user_opened_by_id, support_group_id, initiated_for_user_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        incidentId,
        ciId, // Using the fetched ciId here
        1081, // Replace with Sagar's ID or fetch dynamically if needed
        req.user.userId, // Current logged-in user ID
        supportGroupId,
        initiatedForUserId, // Fetched user ID from the user_asset_relation
      ]
    );

    await client.query("COMMIT");
    res.status(201).json({
      success: true,
      incident_id: incidentId,
      message: "Asset surrendered successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error surrendering asset:", error);
    res.status(500).json({success: false , message: "Server error", error: error.message });
  } finally {
    client.release();
  }
};

const getAssetsByOwnerId = async (req, res) => {
  const ownerId = req.params.userId;
  console.log("ownerId", ownerId);
  
  try {
    // Step 1: Fetch all asset IDs associated with the given owner ID
    const assetIdsQuery = `
      SELECT asset_id 
      FROM public.user_asset_relation
      WHERE asset_owner_id = $1;
    `;
    const assetIdsResult = await pool.query(assetIdsQuery, [ownerId]);

    if (assetIdsResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "No assets found for the given owner ID.",
      });
    }

    const assetIds = assetIdsResult.rows.map(row => row.asset_id);

    // Step 2: Use the asset_id values to retrieve all asset details
    const assetDetailsQuery = `
      SELECT asset_id, asset_name, asset_serial_no, purchase_date, 
             assigned_date, expiry_date, ci_name, description, created_at, updated_at
      FROM public.asset_details
      WHERE asset_id = ANY($1::int[]);
    `;
    const assetDetailsResult = await pool.query(assetDetailsQuery, [assetIds]);

    // Step 2.1: Retrieve ci_id values from the asset_ci table
    const ciIdsQuery = `
      SELECT ci_id, asset_id
      FROM public.asset_ci
      WHERE asset_id = ANY($1::int[]);
    `;
    const ciIdsResult = await pool.query(ciIdsQuery, [assetIds]);

    if (ciIdsResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "No CI IDs found for the given asset IDs.",
      });
    }

    const ciToAssetMap = {};
    ciIdsResult.rows.forEach(row => {
      ciToAssetMap[row.ci_id] = row.asset_id;
    });

    // Step 3: Get incident IDs associated with the CI IDs
    const incidentIdsQuery = `
      SELECT incident_details_id, ci_details_id 
      FROM public.incident_asset_user_details
      WHERE ci_details_id = ANY($1::int[]);
    `;
    const incidentIdsResult = await pool.query(incidentIdsQuery, [Object.keys(ciToAssetMap)]);
    console.log("Incident rows:", incidentIdsResult.rows);

    if (incidentIdsResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "No incident IDs found for the given CI IDs.",
      });
    }

    const incidentIds = incidentIdsResult.rows.map(row => row.incident_details_id);

    // Step 4: Check if the incident IDs have call_type_id = 6 in the incident_relation table
    const surrenderInProgressQuery = `
      SELECT incident_id 
      FROM public.incident_relation
      WHERE incident_id = ANY($1::int[])
        AND call_type_id = 6;
    `;
    const surrenderInProgressResult = await pool.query(surrenderInProgressQuery, [incidentIds]);
    console.log("Surrender in progress:", surrenderInProgressResult.rows);

    // Map of ci_details_id that have incidents in "Surrender in Progress" status
    const surrenderInProgressIds = new Set(surrenderInProgressResult.rows.map(row => row.incident_id));
    const surrenderAssets = new Set();

    // Identify asset IDs that should be marked as "Surrender in Progress"
    incidentIdsResult.rows.forEach(row => {
      if (surrenderInProgressIds.has(row.incident_details_id)) {
        const assetId = ciToAssetMap[row.ci_details_id];
        if (assetId) surrenderAssets.add(assetId);
      }
    });
    surrenderAssets.forEach(assetId => console.log("Surrender asset ID:", typeof assetId, assetId));
    // Prepare final asset details with correct status
    const assetDetails = assetDetailsResult.rows.map(asset => {
      const assetIdInt = String(asset.asset_id); // Ensure asset_id is an integer
      console.log("Comparing asset.asset_id (type and value):", typeof assetIdInt, assetIdInt);
    
      if (surrenderAssets.has(assetIdInt)) {
        console.log("Asset marked as Surrender in Progress:", assetIdInt);
        return {
          ...asset,
          status: "Surrender in Progress",
        };
      } else {
        console.log("Asset marked as Active:", assetIdInt);
        return {
          ...asset,
          status: "Active",
        };
      }
    });    
    return res.status(200).json({
      success: true,
      assets: assetDetails,
    });

  } catch (error) {
    console.error("Error fetching asset details:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching asset details.",
    });
  }
};




const getAssetHistory = async (req, res) => {
  const assetId = req.params.assetId;

  try {
    // SQL query to fetch history for the specific asset
    const historyQuery = `
      SELECT ah.asset_id, 
             ad.asset_name,
             ad.asset_serial_no,
             ad.purchase_date,
             ad.assigned_date,
             ad.expiry_date,
             uar.asset_type_id,
             at.asset_type_name,
             uar.asset_support_group_detail_id,
             sg.support_group_name,
             uar.assetstatus_id,
             ast.status_name,
             uar.vendor_id,
             v.vendor_name,
             uar.branch_id,
             b.branch_name,
             jsonb_agg(DISTINCT jsonb_build_object(  
                 'id', ah.previous_assigned_to, 
                 'name', concat(ud2.first_name, ' ', ud2.last_name)
             )) AS previous_assigned_to_info,  
             MAX(ah.assigned_date) AS assigned_date,  
             ah.status_id,
             s.status_name,
             ah.updated_by,
             concat(ud3.first_name, ' ', ud3.last_name) AS updated_by_name,
             ah.assigned_to,
             concat(ud4.first_name, ' ', ud4.last_name) AS assigned_to_name
      FROM asset_history ah
      LEFT JOIN user_details ud2 ON ah.previous_assigned_to = ud2.user_id  
      LEFT JOIN user_details ud3 ON ah.updated_by = ud3.user_id
      LEFT JOIN asset_status s ON ah.status_id = s.status_id
      LEFT JOIN user_asset_relation uar ON ah.asset_id = uar.asset_id
      LEFT JOIN asset_details ad ON ah.asset_id = ad.asset_id
      LEFT JOIN vendor v ON uar.vendor_id = v.vendor_id
      LEFT JOIN branch b ON uar.branch_id = b.branch_id
      LEFT JOIN asset_type at ON uar.asset_type_id = at.asset_type_id
      LEFT JOIN support_group_detail sg ON uar.asset_support_group_detail_id = sg.support_group_id
      LEFT JOIN asset_status ast ON uar.assetstatus_id = ast.status_id
      LEFT JOIN user_details ud4 ON ah.assigned_to = ud4.user_id
      WHERE ah.asset_id = $1
      GROUP BY ah.asset_id, ah.status_id, s.status_name, ah.updated_by, ud3.first_name, ud3.last_name, ad.asset_name, ad.asset_serial_no, ad.purchase_date, ad.assigned_date, uar.asset_type_id, at.asset_type_name, uar.asset_support_group_detail_id, sg.support_group_name, uar.assetstatus_id, ast.status_name, uar.vendor_id, v.vendor_name, uar.branch_id, b.branch_name, ah.assigned_to, ud4.first_name, ud4.last_name,ad.expiry_date  
      ORDER BY MAX(ah.assigned_date) DESC;  -- Change to MAX(ah.assigned_date)
    `;

    const historyResult = await pool.query(historyQuery, [assetId]); // Pass the assetId as a parameter

    // Check if there are any history records for the asset
    if (historyResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "No history found for the specified asset ID.",
      });
    }

    // Send the asset history in the response
    return res.status(200).json({
      success: true,
      history: historyResult.rows,
    });
  } catch (error) {
    console.error("Error fetching asset history:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching asset history.",
    });
  }
};

module.exports = {
  createAssetDetails,
  getAssetDetails,
  updateAssetDetails,
  deleteAssetDetails,
  getAllAssets,
  getUserAssets,
  getAllAssetsdropdown,
  assetHistory,
  assetBulkUpload,
  getAssetStatuses,
  surrenderAsset,
  getAssetsByOwnerId,
  getAssetHistory,
};
