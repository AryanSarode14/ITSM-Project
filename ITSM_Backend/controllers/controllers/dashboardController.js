// User Count
// Assets count  in that count of asset type with name
// asset by category
// incident count  and count by status
// call type count with name
// sla

// Open req and unassigned
// open req by priority
//

const config = require("../db/config.json");
const pool = require("../db/db");

const getUserCount = async (req, res) => {
  let query = `
    SELECT
      ld.level_name,
      COUNT(ur.user_id) AS user_count
    FROM
      level_detail ld
    LEFT JOIN
      user_relation ur ON ld.level_id = ur.level_id
    GROUP BY
      ld.level_name
    UNION ALL
    SELECT
      'Total' AS level_name,
      COUNT(*) AS user_count
    FROM
      user_details
    ORDER BY
      level_name;`;

  try {
    let result = await pool.query(query);

    // Separate total user count and level-wise counts
    let user_levels = result.rows.filter((row) => row.level_name !== "Total");
    let total_user_count = parseInt(
      result.rows.find((row) => row.level_name === "Total")?.user_count || 0,
      10
    ); // Ensure user_count is an integer

    // Ensure user_count is an integer for all level-wise counts
    user_levels = user_levels.map((row) => ({
      ...row,
      user_count: parseInt(row.user_count, 10), // Convert user_count to integer
    }));

    // Construct the final response
    let response = {
      user_levels,
      user_count: total_user_count,
    };

    console.log(response);
    res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
};

const getAssetCount = async (req, res) => {
  let query = `SELECT COUNT(*) AS asset_count FROM asset_details`;
  let query2 = `SELECT COUNT(uar.asset_type_id) AS asset_type_count_by_category, at.asset_type_name
                  FROM user_asset_relation uar
                  JOIN asset_type at
                  ON uar.asset_type_id = at.asset_type_id
                  GROUP BY at.asset_type_name`;

  let query3 = `SELECT COUNT(uar.asset_ci_category_id) AS asset_ci_category_count,
            ci.ci_category_name
            FROM user_asset_relation uar
            JOIN ci_category ci
            ON uar.asset_ci_category_id = ci.ci_category_id
            GROUP BY ci.ci_category_name`;

  let query4 = `SELECT
        as_status.status_name,
        uar.assetstatus_id,
        COUNT(*) AS asset_count
        FROM user_asset_relation uar
        JOIN asset_status as_status ON uar.assetstatus_id = as_status.status_id
        WHERE uar.assetstatus_id IN (1, 2)
        GROUP BY uar.assetstatus_id, as_status.status_name;`;

  try {
    // Execute both queries
    let result1 = await pool.query(query);
    let result2 = await pool.query(query2);
    let result3 = await pool.query(query3);

    // Extract asset count from the first query
    let asset_count = result1.rows[0].asset_count;

    // Initialize array to store asset type data
    let asset_type_data = [];
    let asset_ci_category_data = [];

    // Process rows from the second query (result2) to extract names and counts
    result2.rows.forEach((row) => {
      asset_type_data.push({
        asset_type_name: row.asset_type_name,
        asset_type_count: parseInt(row.asset_type_count_by_category, 10), // Convert string to integer
      });
    });

    result3.rows.forEach((row) => {
      asset_ci_category_data.push({
        ci_category_name: row.ci_category_name,
        asset_ci_category_count: parseInt(row.asset_ci_category_count, 10), // Convert string to integer
      });
    });

    let result4 = await pool.query(query4);

    let asset_status_data = [];
    result4.rows.forEach((row) => {
      asset_status_data.push({
        assetstatus_id: row.assetstatus_id,
        status_name: row.status_name, // Include the assetstatus_name
        asset_count: parseInt(row.asset_count, 10),
      });
    });

    // Return both asset count and asset type data in the response
    res.status(200).json({
      asset_count, // Total asset count from the first query
      asset_type_data, // Array of objects containing asset type names and counts
      asset_ci_category_data,
      asset_status_data,
    });
  } catch (err) {
    console.error("Error fetching asset counts:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getIncidentCount = async (req, res) => {
  const { days, startDate, endDate } = req.query;

  // Base queries
  let query1 = `SELECT COUNT(*) AS incident_count FROM incident;`;

  let query2 = `SELECT COUNT(ir.call_type_id) AS call_type_count, 
                ct.call_type_name
                FROM incident_relation ir
                LEFT JOIN call_type ct
                ON ir.call_type_id = ct.id
                GROUP BY ct.call_type_name;`;

  let query3 = `SELECT COUNT(ir.call_mode_id) AS call_mode_count,
                cm.mode AS call_mode_name
                FROM incident_relation ir
                LEFT JOIN call_mode cm
                ON ir.call_mode_id = cm.id
                GROUP BY cm.mode;`;

  // Constructing the date filter logic
  let dateFilter = "";
  if (startDate && endDate) {
    dateFilter = `WHERE i.created_at BETWEEN '${startDate}' AND '${endDate} 23:59:59'`;
  } else if (days) {
    dateFilter = `WHERE i.created_at >= NOW() - INTERVAL '${days} DAYS'`;
  }

  let query4 = `
    SELECT 
        COUNT(CASE 
            WHEN (NOW() - i.created_at) <= (CAST(sla.sla_time AS INTEGER) * INTERVAL '1 hour') THEN 1 
        END) AS count,
        'Within SLA' AS slaname
    FROM 
        incident_relation ir
    LEFT JOIN 
        sla ON ir.sla_id = sla.sla_id
    JOIN 
        incident i ON ir.incident_id = i.incident_id
        ${dateFilter}

    UNION ALL

    SELECT 
        COUNT(CASE 
            WHEN (NOW() - i.created_at) > (CAST(sla.sla_time AS INTEGER) * INTERVAL '1 hour') THEN 1 
        END) AS count,
        'Out Of SLA' AS slaname
    FROM 
        incident_relation ir
    LEFT JOIN 
        sla ON ir.sla_id = sla.sla_id
    JOIN 
        incident i ON ir.incident_id = i.incident_id
        ${dateFilter};
  `;

  let query5 = `SELECT COUNT(ir.status_id) AS status_count,
                s.status_name
                FROM incident_relation ir
                LEFT JOIN status s
                ON ir.status_id = s.id
                JOIN incident i ON ir.incident_id = i.incident_id
                ${dateFilter}
                GROUP BY s.status_name;`;

  let query6 = `SELECT 
                  CASE 
                    WHEN iaud.user_assigned_to_id IS NULL THEN 'unassigned'
                    ELSE 'assigned'
                  END AS assignment_status,
                  COUNT(iaud.id)::INTEGER AS req_count
                FROM incident_asset_user_details iaud
                JOIN incident_relation ir ON iaud.incident_details_id = ir.incident_id
                WHERE ir.status_id = 1
                GROUP BY assignment_status;`;

  let query7 = `SELECT COUNT(ir.id) AS priority_count, p.priority_name
                FROM incident_relation ir
                JOIN priority p
                ON ir.priority_id = p.priority_id
                WHERE ir.status_id = 1
                GROUP BY p.priority_name;`;

  try {
    let result1 = await pool.query(query1);
    let incident_count = parseInt(result1.rows[0].incident_count);

    let result2 = await pool.query(query2);
    let call_type_data = result2.rows.map((row) => ({
      call_type_name: row.call_type_name,
      call_type_count: parseInt(row.call_type_count, 10),
    }));

    let result3 = await pool.query(query3);
    let call_mode_data = result3.rows.map((row) => ({
      call_mode_name: row.call_mode_name,
      call_mode_count: parseInt(row.call_mode_count, 10),
    }));

    let result4 = await pool.query(query4);
    let sla_data = result4.rows.map((row) => ({
      count: parseInt(row.count, 10), // Use the correct property name
      slaname: row.slaname,
    }));

    let result5 = await pool.query(query5);
    let status_data = result5.rows.map((row) => ({
      status_name: row.status_name,
      status_count: parseInt(row.status_count, 10),
    }));

    let result6 = await pool.query(query6);
    const unassignment_count = result6.rows[0].req_count;

    let result7 = await pool.query(query7);
    let priority_count = result7.rows.map((row) => ({
      priority_name: row.priority_name,
      priority_count: parseInt(row.priority_count, 10),
    }));

    res.status(200).json({
      incident_count,
      call_type_data,
      call_mode_data,
      sla_data, // This now contains the correct structure
      status_data,
      unassignment_count,
      priority_count,
    });
  } catch (err) {
    console.error("Error fetching incident counts:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getIncidentSlaCountByDays = async (req, res) => {
  const { days } = req.query;

  // Apply date filter based on the created_at field in the incident table
  let dateFilter = days
    ? `WHERE i.created_at >= NOW() - INTERVAL '${days} DAYS'`
    : "";

  // Query for SLA count (with date filter using incident.created_at)
  let query4 = `SELECT COUNT(ir.sla_id) AS sla_count,
    sla.sla_time
    FROM incident_relation ir
    LEFT JOIN sla 
    ON ir.sla_id = sla.sla_id
    JOIN incident i ON ir.incident_id = i.incident_id
    ${dateFilter}
    GROUP BY sla.sla_time`;

  try {
    let result4 = await pool.query(query4);
    let sla_data = [];
    result4.rows.forEach((row) => {
      sla_data.push({
        sla_time: row.sla_time,
        sla_count: parseInt(row.sla_count, 10),
      });
    });

    // Send the response
    res.status(200).json({ sla_data });
  } catch (err) {
    console.error("Error fetching SLA counts by days:", err);
    res.status(500).json({ error: err.message });
  }
};

const getIncidentStatusCount = async (req, res) => {
  const { days } = req.query;

  // Apply date filter based on the created_at field in the incident table
  let dateFilter = days
    ? `WHERE i.created_at >= NOW() - INTERVAL '${days} DAYS'`
    : "";

  // Query for status count (with date filter using incident.created_at)
  let query5 = `SELECT COUNT(ir.status_id) AS status_count,
    s.status_name
    FROM incident_relation ir
    LEFT JOIN status s
    ON ir.status_id = s.id
    JOIN incident i ON ir.incident_id = i.incident_id
    ${dateFilter}
    GROUP BY s.status_name`;

  try {
    let result5 = await pool.query(query5);
    let status_data = [];
    result5.rows.forEach((row) => {
      status_data.push({
        status_name: row.status_name,
        status_count: parseInt(row.status_count, 10),
      });
    });

    // Send the response
    res.status(200).json({ status_data });
  } catch (err) {
    console.error("Error fetching incident status counts by days:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getUserCount,
  getAssetCount,
  getIncidentCount,
};
