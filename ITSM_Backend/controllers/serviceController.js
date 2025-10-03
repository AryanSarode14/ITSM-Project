const pool = require("../db/db");
const upload = require("../helper/storage.js");

const createService = async (req, res) => {
  const { service_name, department_id } = req.body;

  try {
    // Start a transaction
    await pool.query("BEGIN");

    // Insert the new service and get the generated service_id
    const newService = await pool.query(
      "INSERT INTO service (service_name) VALUES($1) RETURNING service_id",
      [service_name]
    );

    const serviceId = newService.rows[0].service_id;

    // Insert into service_department_relation with the service_id and department_id
    await pool.query(
      "INSERT INTO service_dept_relation (service_id, department_id) VALUES($1, $2)",
      [serviceId, department_id]
    );

    // Commit the transaction
    await pool.query("COMMIT");

    res.json(newService.rows[0]);
  } catch (err) {
    // Rollback the transaction in case of error
    await pool.query("ROLLBACK");
    console.error(err.message);
    res.status(500).json({ error: "An error occurred" });
  }
};

const getService = async (req, res) => {
  try {
    const allServices = await pool.query(
      `SELECT 
    s.service_id, 
    s.service_name,
    d.dept_id, 
    d.department 
FROM 
    service s 
JOIN 
    service_dept_relation sdr 
    ON s.service_id = sdr.service_id 
JOIN 
    department d
    ON sdr.department_id = d.dept_id;`
    );
    res.json(allServices.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "An error occurred" });
  }
};

const getServiceById = async (req, res) => {
  const { service_id } = req.params;
  try {
    const service = await pool.query(
      `SELECT 
                s.service_id, 
                s.service_name,
                d.dept_id, 
                d.department 
            FROM 
                service s 
            JOIN 
                service_dept_relation sdr 
                ON s.service_id = sdr.service_id 
            JOIN 
                department d
                ON sdr.department_id = d.dept_id
            WHERE 
                s.service_id = $1;`,
      [service_id] // Pass the service_id parameter here
    );

    if (service.rows.length === 0) {
      return res.status(404).json({ error: "Service not found" });
    }

    res.json(service.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "An error occurred" });
  }
};

const updateService = async (req, res) => {
  const { service_id } = req.params;
  const { service_name, department_id } = req.body;

  try {
    let updateFields = [];
    let queryValues = [];
    let queryText = "UPDATE service SET "; // Removed alias 's'

    if (service_name) {
      updateFields.push("service_name = $" + (queryValues.length + 1));
      queryValues.push(service_name);
    }

    if (department_id) {
      // Update department in the service_department_relation table if provided
      await pool.query(
        `UPDATE service_dept_relation SET department_id = $1 WHERE service_id = $2`,
        [department_id, service_id]
      );
    }

    if (updateFields.length > 0) {
      queryText +=
        updateFields.join(", ") +
        " WHERE service_id = $" +
        (queryValues.length + 1);
      queryValues.push(service_id);

      // Update service_name if applicable
      await pool.query(queryText, queryValues);
      res.json({ message: "Service updated successfully" });
    } else {
      // No fields to update
      res.status(400).json({ error: "No fields provided to update" });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "An error occurred" });
  }
};

module.exports = { createService, getService, getServiceById, updateService };
