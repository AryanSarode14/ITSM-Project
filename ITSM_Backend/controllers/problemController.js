const { user } = require("pg/lib/defaults");
const pool = require("../db/db");

exports.createProblemWithRelationship = async (req, res) => {
    const {
        description,
        work_around,
        root_cause,
        sla_id,
        support_group_id,
        configuration_item_id,
        service_id,
        priority_id,
        related_incident,
        category_id,
        impact_id,
        state_id,
    } = req.body;
    console.log("Request Body:", req.body);

    try {
        // Start a transaction
        await pool.query('BEGIN');

        // Insert into problem_details
        const problemResult = await pool.query(
            `INSERT INTO public.problem_details (
                description,
                work_around,
                root_cause
            ) VALUES ($1, $2, $3) RETURNING problem_id`, // Fixed to have 3 placeholders
            [description, work_around, root_cause]
        );

        const problem_id = problemResult.rows[0].problem_id;

        const relationshipResult = await pool.query(
            `INSERT INTO public.problem_relationships (
                problem_id,
                sla_id,
                support_group_id,
                assigned_to_id,
                configuration_item_id,
                service_id,
                priority_id,
                related_incident,
                category_id,
                impact_id,
                state_id,
                created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
            [
                problem_id,
                sla_id,
                support_group_id,
                null,
                configuration_item_id,
                service_id,
                priority_id,
                related_incident,
                category_id,
                impact_id,
                state_id,
                req.user.userId
            ]
        );

        if (req.files) {
            const basePath = "http://172.16.16.66:4000/assets/attachments/incident_attachment/"; 
            console.log("Base Path:", basePath);
        
            for (let i = 0; i < req.files.length; i++) {
                const filePath = `${basePath}${req.files[i].filename}`; // Construct file path
                const fileName = req.files[i].originalname;  // Extract original file name
                console.log("File Path:", filePath);
                console.log("File Name:", fileName);
        
                // Insert query for problem_attachments, now including file_name
                const insertQuery = `
                    INSERT INTO public.problem_attachments (problem_id, file_path, file_name)
                    VALUES ($1, $2, $3)
                    RETURNING attachment_id, problem_id, file_path, file_name;
                `;
        
                try {
                    // Use parameterized query to avoid SQL injection
                    const result = await pool.query(insertQuery, [problem_id, filePath, fileName]);
                    console.log("Problem Attachment Inserted:", result.rows[0]);
                } catch (error) {
                    console.error("Error inserting problem attachment:", error);
                }
            }
        }
        
        
        // Commit the transaction
        await pool.query('COMMIT');

        res.status(201).json({
            message: 'Problem and relationship created successfully',
            data: {
                problem: problemResult.rows[0],
                relationship: relationshipResult.rows[0],
            },
        });
    } catch (error) {
        await pool.query('ROLLBACK'); // Rollback transaction on error
        console.error('Error creating problem and relationship:', error);
        res.status(500).json({
            message: 'Error creating problem and relationship',
            error: error.message,
        });
    }
};

exports.updateProblemRelationship = async (req, res) => {
    const {
        description,
        work_around,
        root_cause,
        sla_id,
        support_group_id,
        assigned_to_id,
        configuration_item_id,
        service_id,
        priority_id,
        related_incident,
        category_id,
        impact_id,
        state_id,
        log_note 
    } = req.body;
    console.log("Request Body:", req.body);
    const { id } = req.params;

    let problemResult = null;

    try {
        // Start a transaction
        await pool.query('BEGIN');

        // Update problem_details if fields are provided
        if (description || work_around || root_cause) {
            const updateProblemQuery = `
                UPDATE public.problem_details
                SET 
                    description = COALESCE($1, description),
                    work_around = COALESCE($2, work_around),
                    root_cause = COALESCE($3, root_cause)
                WHERE problem_id = $4
                RETURNING *;
            `;

            problemResult = await pool.query(updateProblemQuery, [
                description,
                work_around,
                root_cause,
                id,
            ]);
            console.log('Problem updated:', problemResult.rows);
        }

        // Update problem_relationships
        console.log('assigned_to_id:', assigned_to_id); // Log the value of assigned_to_id
        const updateRelationshipQuery = `
            UPDATE public.problem_relationships
            SET 
                sla_id = COALESCE($1, sla_id),
                support_group_id = COALESCE($2, support_group_id),
                assigned_to_id = COALESCE($3, assigned_to_id),
                configuration_item_id = COALESCE($4, configuration_item_id),
                service_id = COALESCE($5, service_id),
                priority_id = COALESCE($6, priority_id),
                related_incident = COALESCE($7, related_incident),
                category_id = COALESCE($8, category_id),
                impact_id = COALESCE($9, impact_id),
                state_id = COALESCE($10, state_id)
            WHERE problem_id = $11
            RETURNING *;
        `;

        const relationshipResult = await pool.query(updateRelationshipQuery, [
            sla_id,
            support_group_id,
            assigned_to_id,
            configuration_item_id,
            service_id,
            priority_id,
            related_incident,
            category_id,
            impact_id,
            state_id,
            id,
        ]);

        console.log('Relationship updated:', relationshipResult.rows);

        // Insert log note if provided
        try {
            if (log_note) {
                const insertLogNoteQuery = `
                    INSERT INTO public.problem_log_note (problem_id, log_note, user_id)
                    VALUES ($1, $2, $3)
                    RETURNING *;
                `;
                console.log('Log note values:', id, log_note, req.user.id); // Log the values
                const logNoteResult = await pool.query(insertLogNoteQuery, [id, log_note, req.user.id]);
                console.log('Log note inserted:', logNoteResult.rows);
            }
        } catch (logNoteError) {
            console.error('Error inserting log note:', logNoteError);
        }

        // Handle file attachments if they exist
        if (req.files && req.files.length > 0) {
            const path = "http://172.16.16.66:4000/assets/attachments/incident_attachment/";
            for (let i = 0; i < req.files.length; i++) {
                const filePath = `${path}${req.files[i].filename}`;
                const fileName = req.files[i].originalname;
        
                const insertAttachmentQuery = `
                    INSERT INTO public.problem_attachments (problem_id, file_path, file_name)
                    VALUES ($1, $2, $3)
                    RETURNING *;
                `;
                await pool.query(insertAttachmentQuery, [id, filePath, fileName]);
            }
        }

        // Commit the transaction
        await pool.query('COMMIT');

        res.status(200).json({
            status: 200,
            message: 'Problem, relationship, and log note updated successfully',
            data: {
                problem: problemResult ? (problemResult.rows.length > 0 ? problemResult.rows[0] : null) : null,
                relationship: relationshipResult.rows[0],
            },
        });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error updating problem, relationship, and log note:', error);
        res.status(500).json({
            status: 500,
            message: 'Error updating problem, relationship, and log note',
            error: error.message,
        });
    }
};

exports.getAllProblemsWithRelationships = async (req, res) => {
    try {
        const query = `
            SELECT 
                pd.problem_id,
                pd.description,
                pd.work_around,
                pd.root_cause,
                pr.sla_id,
                s.sla_time, 
                pr.support_group_id,
                sg.support_group_name, 
                pr.assigned_to_id,
                CONCAT(u.first_name, ' ', u.last_name) AS assigned_to_name,
                pr.configuration_item_id,
                ci.ci_name AS configuration_item_name, 
                pr.service_id,
                svc.service_name AS service_name, 
                pr.priority_id,
                p.priority_name, 
                pr.related_incident,
                inc.issue_description, 
                pr.category_id,
                c.category_name, 
                pr.impact_id,
                i.impact_level, 
                pr.state_id,
                st.state_name, 
                pr.created_by, 
                u2.user_name AS created_by_name,
                pa.attachment_id,
                pa.file_path,
                pa.file_name,
                pl.user_id,
                pl.log_id AS log_note_id,
                pl.log_note,
                pl.created_at,
                u3.user_name AS log_note_user_name -- Fetching username for the log notes
            FROM 
                public.problem_details pd
            LEFT JOIN 
                public.problem_relationships pr ON pd.problem_id = pr.problem_id
            LEFT JOIN 
                public.sla s ON pr.sla_id = s.sla_id 
            LEFT JOIN 
                public.support_group_detail sg ON pr.support_group_id = sg.support_group_id 
            LEFT JOIN 
                public.priority p ON pr.priority_id = p.priority_id 
            LEFT JOIN 
                public.categories c ON pr.category_id = c.category_id 
            LEFT JOIN 
                public.impacts i ON pr.impact_id = i.impact_id 
            LEFT JOIN 
                public.states st ON pr.state_id = st.state_id 
            LEFT JOIN 
                public.user_details u ON pr.assigned_to_id = u.user_id 
            LEFT JOIN 
                public.user_details u2 ON pr.created_by = u2.user_id 
            LEFT JOIN 
                public.ci ci ON pr.configuration_item_id = ci.ci_id 
            LEFT JOIN 
                public.service svc ON pr.service_id = svc.service_id 
            LEFT JOIN 
                public.incident inc ON pr.related_incident = inc.incident_id 
            LEFT JOIN 
                public.problem_attachments pa ON pd.problem_id = pa.problem_id 
            LEFT JOIN 
                public.problem_log_note pl ON pd.problem_id = pl.problem_id 
            LEFT JOIN 
                public.user_details u3 ON pl.user_id = u3.user_id -- Join for log notes user
        `;

        const result = await pool.query(query);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'No problems found',
            });
        }

        // Use a map to aggregate problem data by problem_id
        const problemMap = {};

        result.rows.forEach(row => {
            if (!problemMap[row.problem_id]) {
                // Initialize a new problem entry if not already present
                problemMap[row.problem_id] = {
                    problem_id: row.problem_id,
                    description: row.description,
                    work_around: row.work_around || null,
                    root_cause: row.root_cause || null,
                    sla_id: row.sla_id,
                    sla_time: row.sla_time,
                    support_group_id: row.support_group_id,
                    support_group_name: row.support_group_name,
                    assigned_to_id: row.assigned_to_id,
                    assigned_to_name: row.assigned_to_name,
                    configuration_item_id: row.configuration_item_id,
                    configuration_item_name: row.configuration_item_name,
                    service_id: row.service_id,
                    service_name: row.service_name,
                    priority_id: row.priority_id,
                    priority_name: row.priority_name,
                    related_incident: row.related_incident,
                    issue_description: row.issue_description,
                    category_id: row.category_id,
                    category_name: row.category_name,
                    impact_id: row.impact_id,
                    impact_level: row.impact_level,
                    state_id: row.state_id,
                    state_name: row.state_name,
                    created_by: row.created_by,
                    created_by_name: row.created_by_name,
                    attachments: [],
                    log_notes: []
                };
            }

            // Add unique attachments
            if (row.attachment_id) {
                const attachmentExists = problemMap[row.problem_id].attachments.some(
                    attachment => attachment.attachment_id === row.attachment_id && attachment.file_path === row.file_path
                );

                if (!attachmentExists) {
                    problemMap[row.problem_id].attachments.push({
                        attachment_id: row.attachment_id,
                        file_path: row.file_path,
                        file_name: row.file_name
                    });
                }
            }

            // Add log notes if they exist and ensure uniqueness
            if (row.log_note_id) {
                const logNoteExists = problemMap[row.problem_id].log_notes.some(note => note.log_note_id === row.log_note_id);

                if (!logNoteExists) {
                    problemMap[row.problem_id].log_notes.push({
                        user_id: row.user_id,
                        log_note_id: row.log_note_id,
                        note: row.log_note,
                        created_at: row.created_at,
                        user_name: row.log_note_user_name
                    });
                }
            }
        });

        // Convert problemMap into an array
        const problems = Object.values(problemMap);

        // Send the result
        res.status(200).json({
            status: 200,
            message: 'Problems retrieved successfully',
            data: problems
        });
    } catch (error) {
        console.error('Error retrieving problems with relationships:', error);
        res.status(500).json({
            message: 'Error retrieving problems with relationships',
            error: error.message,
        });
    }
};

exports.getProblemById = async (req, res) => {
    const problemId = req.params.id; // Get the problem ID from the request parameters

    try {
        const query = `
            SELECT 
                pd.problem_id,
                pd.description,
                pd.work_around,
                pd.root_cause,
                pr.sla_id,
                s.sla_time, 
                pr.support_group_id,
                sg.support_group_name, 
                pr.assigned_to_id,
                Concat(u.first_name, ' ', u.last_name) AS assigned_to_name,
                pr.configuration_item_id,
                ci.ci_name AS configuration_item_name, 
                pr.service_id,
                svc.service_name AS service_name, 
                pr.priority_id,
                p.priority_name, 
                pr.related_incident,
                inc.issue_description, 
                pr.category_id,
                c.category_name, 
                pr.impact_id,
                i.impact_level, 
                pr.state_id,
                st.state_name, 
                pr.created_by, 
                u2.user_name AS created_by_name,
                pa.attachment_id,
                pa.file_path,
                pa.file_name,
                pl.user_id,
                pl.log_id AS log_note_id,
                pl.log_note,
                pl.created_at,
                u3.user_name AS log_note_user_name -- Fetching username for the log notes
            FROM 
                public.problem_details pd
            LEFT JOIN 
                public.problem_relationships pr ON pd.problem_id = pr.problem_id
            LEFT JOIN 
                public.sla s ON pr.sla_id = s.sla_id 
            LEFT JOIN 
                public.support_group_detail sg ON pr.support_group_id = sg.support_group_id 
            LEFT JOIN 
                public.priority p ON pr.priority_id = p.priority_id 
            LEFT JOIN 
                public.categories c ON pr.category_id = c.category_id 
            LEFT JOIN 
                public.impacts i ON pr.impact_id = i.impact_id 
            LEFT JOIN 
                public.states st ON pr.state_id = st.state_id 
            LEFT JOIN 
                public.user_details u ON pr.assigned_to_id = u.user_id 
            LEFT JOIN 
                public.user_details u2 ON pr.created_by = u2.user_id 
            LEFT JOIN 
                public.ci ci ON pr.configuration_item_id = ci.ci_id 
            LEFT JOIN 
                public.service svc ON pr.service_id = svc.service_id 
            LEFT JOIN 
                public.incident inc ON pr.related_incident = inc.incident_id 
            LEFT JOIN 
                public.problem_attachments pa ON pd.problem_id = pa.problem_id 
            LEFT JOIN 
                public.problem_log_note pl ON pd.problem_id = pl.problem_id 
            LEFT JOIN 
                public.user_details u3 ON pl.user_id = u3.user_id -- Join for log notes user
            WHERE 
                pd.problem_id = $1
        `;

        const result = await pool.query(query, [problemId]);
        console.log("Result:", result.rows);
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Problem not found',
            });
        }

        // Initialize the problem object
        let problemData = null;

        result.rows.forEach(row => {
            // If problemData is not initialized, create the object structure
            if (!problemData) {
                problemData = {
                    problem_id: row.problem_id,
                    description: row.description,
                    work_around: row.work_around || null,
                    root_cause: row.root_cause || null,
                    sla_id: row.sla_id,
                    sla_time: row.sla_time,
                    support_group_id: row.support_group_id,
                    assigned_to_id: row.assigned_to_id,
                    configuration_item_id: row.configuration_item_id,
                    service_id: row.service_id,
                    priority_id: row.priority_id,
                    related_incident: row.related_incident,
                    category_id: row.category_id,
                    impact_id: row.impact_id,
                    state_id: row.state_id,
                    created_by: row.created_by,
                    assigned_to_name: row.assigned_to_name,
                    configuration_item_name: row.configuration_item_name,
                    service_name: row.service_name,
                    priority_name: row.priority_name,
                    issue_description: row.issue_description,
                    category_name: row.category_name,
                    impact_level: row.impact_level,
                    state_name: row.state_name,
                    created_by_name: row.created_by_name,
                    attachments: [], // Initialize as an empty array
                    log_notes: [] // Initialize as an empty array
                };
            }

            // Add unique attachments
            if (row.attachment_id) {
                const attachmentExists = problemData.attachments.some(
                    (attachment) => attachment.attachment_id === row.attachment_id && attachment.file_path === row.file_path
                );

                if (!attachmentExists) {
                    problemData.attachments.push({
                        attachment_id: row.attachment_id,
                        file_path: row.file_path,
                        file_name: row.file_name
                    });
                }
            }

            // Add log notes if they exist and ensure uniqueness
            if (row.log_note_id) {
                const logNoteExists = problemData.log_notes.some(note => note.log_note_id === row.log_note_id);

                if (!logNoteExists) {
                    problemData.log_notes.push({
                        user_id: row.user_id,
                        log_note_id: row.log_note_id,
                        note: row.log_note,
                        created_at: row.created_at,
                        user_name: row.log_note_user_name // Add the user_name for log notes
                    });
                }
            }
        });

        // Send the result as an object (not array)
        res.status(200).json({
            status: 200,
            message: 'Problem retrieved successfully',
            data: problemData, // Returning as an object, not an array
        });
    } catch (error) {
        console.error('Error retrieving problem by ID:', error);
        res.status(500).json({
            message: 'Error retrieving problem by ID',
            error: error.message,
        });
    }
};

exports.getAllCIs = async (req, res) => {
    try {
        const query = `
            SELECT 
                ci_id,
                ci_name
            FROM 
                public.ci;
        `;

        const result = await pool.query(query);

        res.status(200).json({
            message: 'CIs retrieved successfully',
            data: result.rows,
        });
    } catch (error) {
        console.error('Error retrieving CIs:', error);
        res.status(500).json({
            message: 'Error retrieving CIs',
            error: error.message,
        });
    }
};

exports.getAllIncidentsname = async (req, res) => {
    try {
        const query = `
            SELECT 
                incident_id,
                issue_description
            FROM 
                public.incident;
        `;

        const result = await pool.query(query);

        res.status(200).json({
            message: 'Incidents retrieved successfully',
            data: result.rows,
        });
    } catch (error) {
        console.error('Error retrieving incidents:', error);
        res.status(500).json({
            message: 'Error retrieving incidents',
            error: error.message,
        });
    }
};

// Controller: Fetch all categories with category_id and category_name
exports.getAllCategories = async (req, res) => {
    try {
        const query = `
            SELECT 
                category_id, 
                category_name 
            FROM 
                public.categories 
        `;

        const result = await pool.query(query);

        res.status(200).json({
            message: 'Categories retrieved successfully',
            data: result.rows,
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            message: 'Error fetching categories',
            error: error.message,
        });
    }
};

exports.getAllStates = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM public.states');
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAllImpacts = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM public.impacts');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while retrieving impacts.' });
    }
};

exports.deleteProblemAttachmentById = async (req, res) => {
    const { id } = req.params;
    let client;
   
    try {
      client = await pool.connect();
      const query = `DELETE FROM public.problem_attachments WHERE attachment_id = $1;`;
      const result = await client.query(query, [id]);
   
      if (result.rowCount === 0) {
        // No rows were affected, meaning the attachment with the provided ID does not exist
        return res.status(404).json({ message: "Incident attachment not found" });
      }
   
      res
        .status(200)
        .json({ message: "Problem attachment deleted successfully" });
    } catch (err) {
      console.error("Error deleting Problem attachment:", err.message);
      res.status(500).json({ message: "Server error", error: err.message });
    } finally {
      if (client) client.release();
    }
};