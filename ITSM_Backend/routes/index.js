const express = require("express");
const upload = require("../middleware/bulkUpload");
const router = express.Router();
const profile = require("../middleware/profilePicture");
const incident = require("../middleware/incidentAttachment");

// Register User
const {
  registerController,
  loginController,
  userBulkUpload,
} = require("../controllers/authController");

//ChatBot
const {
  chatbotdetails,
  createIncidentForBot,
} = require("../controllers/Chatbot/chatbotService");

// Password
const {
  forgotPasswordController,
  verifyOTPController,
} = require("../controllers/mailController");

// Users
const {
  getUser,
  updateUser,
  getAllUsers,
  getUserNamesController,
  updateAccessController,
  updateProfilePicture,
  getProfilePicture,
} = require("../controllers/userController");

// Validate User
const authenticateToken = require("../middleware/validateUser");

// Dropdown Menus
const {
  getApprovalStates,
  getChangeType,
  getAllDepartment,
  getAllUserNames,
  getAllService,
  getAllCiClassification,
  getAllCiCategory,
  getAllBom,
  getAllWarranyNames,
  getAllOem,
  getUserRoles,
  getSupportGroups,
  addSupportGroups,
  getLevels,
  getAssetGroup,
  getallassettypes,
  getallvendors,
  getallbranches,
  getallmodels,
  getAllGender,
  getAllCallModes,
  getAllCallTypes,
  getAllSLAs,
  getAllStatuses,
  getAllPriorities,
  addUserRoles,
  addLevels,
  createSLA,
  callType,
  addCiCategory,
  addCiClassification,
  addDepartment,
  addAssetType,
  addVendor,
  addService,
  addBranch,
  addModel,
  getAllOrgs,
} = require("../controllers/dropdownMenu");

// Assets
const {
  createAssetDetails,
  getAllAssets,
  getAssetDetails,
  updateAssetDetails,
  getAllAssetsdropdown,
  assetHistory,
  assetBulkUpload,
  getAssetStatuses,
  surrenderAsset,
  getAssetsByOwnerId,
  getAssetHistory,
} = require("../controllers/assetsController");

// CI
const {
  addCi,
  getCiData,
  getCiDataById,
  updateCi,
  getCiDetailsByUserId,
  ciBulkUpload,
} = require("../controllers/ciController");

// HR Requests
const {
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
} = require("../controllers/hrController");

// Incidents
const {
  getUserAssets,
  createIncident,
  getIncidents,
  updateIncident,
  getClosedIncidents,
  getInProgressIncidents,
  getOpenIncidents,
  getIncidentById,
  getonholdIncidents,
  getUserIncidents,
  getUserIncidentsBySupportGroup,
  getIncidentAssetUserDetailsByAssignedUser,
  deleteIncidentAttachmentById,
} = require("../controllers/incidentController");

// Service
const {
  createService,
  getService,
  getServiceById,
  updateService,
} = require("../controllers/serviceController");

// Dashboard
const {
  getUserCount,
  getAssetCount,
  getIncidentCount,
} = require("../controllers/dashboardController");

const {
  getOrganisationalChart,
} = require("../controllers/OrganisationalChartController");
const {
  createProblemWithRelationship,
  updateProblemRelationship,
  getAllProblemsWithRelationships,
  getAllCIs,
  getAllIncidentsname,
  getAllCategories,
  getAllStates,
  getAllImpacts,
  getProblemById,
  deleteProblemAttachmentById,
} = require("../controllers/problemController");

const {
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
} = require("../controllers/changeManagementController");

// User Routes
/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     description: Endpoint to register a new user, hash their password, and send a registration email.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - mobileNumber
 *               - email
 *               - password
 *               - userRole
 *               - supportGroup
 *               - level
 *               - userName
 *               - genderId
 *               - reportingTo
 *               - org_id
 *               - branch_id
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: User's first name.
 *               middleName:
 *                 type: string
 *                 description: User's middle name.
 *               lastName:
 *                 type: string
 *                 description: User's last name.
 *               description:
 *                 type: string
 *                 description: Description or bio of the user.
 *               mobileNumber:
 *                 type: string
 *                 description: User's mobile number.
 *               email:
 *                 type: string
 *                 description: User's email address.
 *               password:
 *                 type: string
 *                 description: User's password.
 *               supportGroup:
 *                 type: integer
 *                 description: Support group ID.
 *               userRole:
 *                 type: integer
 *                 description: User role ID.
 *               level:
 *                 type: integer
 *                 description: User's level ID.
 *               userName:
 *                 type: string
 *                 description: User's username.
 *               genderId:
 *                 type: integer
 *                 description: User's gender ID.
 *               reportingTo:
 *                 type: integer
 *                 description: User ID of the reporting manager.
 *               asset_reqired:
 *                 type: boolean
 *                 description: Whether the user requires an asset.
 *               employee_id:
 *                 type: string
 *                 description: Employee ID.
 *               org_id:
 *                 type: integer
 *                 description: Organization ID.
 *               branch_id:
 *                 type: integer
 *                 description: Branch ID.
 *     responses:
 *       201:
 *         description: User created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User created successfully
 *                 userId:
 *                   type: integer
 *                   description: ID of the created user.
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal Server Error
 */

router.post("/register", registerController); //done and tested
/**
 * @swagger
 * /login:
 *   post:
 *     summary: User login
 *     description: Allows a user to log in using either email or username along with a password. Returns a JWT token upon successful authentication.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 description: User's email address. Either email or username is required.
 *                 example: user@example.com
 *               username:
 *                 type: string
 *                 description: User's username. Either username or email is required.
 *                 example: user123
 *               password:
 *                 type: string
 *                 description: User's password.
 *                 example: mysecurepassword
 *     responses:
 *       200:
 *         description: Login successful, returns user details and token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 token:
 *                   type: string
 *                   description: JWT token for authenticated user.
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: integer
 *                       description: User's unique ID.
 *                       example: 1
 *                     firstName:
 *                       type: string
 *                       example: John
 *                     middleName:
 *                       type: string
 *                       example: A
 *                     lastName:
 *                       type: string
 *                       example: Doe
 *                     description:
 *                       type: string
 *                       example: Team Lead
 *                     mobileNumber:
 *                       type: string
 *                       example: 9876543210
 *                     email:
 *                       type: string
 *                       example: user@example.com
 *                     userName:
 *                       type: string
 *                       example: johnDoe
 *                     hasAccess:
 *                       type: boolean
 *                       example: true
 *                     role:
 *                       type: string
 *                       description: Role name.
 *                       example: Admin
 *                     level:
 *                       type: string
 *                       description: User level.
 *                       example: Senior
 *                     gender:
 *                       type: string
 *                       example: Male
 *                     supportGroup:
 *                       type: string
 *                       description: Support group name.
 *                       example: IT Support
 *                     reportingTo:
 *                       type: string
 *                       description: Name of the reporting manager.
 *                       example: Jane Doe
 *       400:
 *         description: Bad request. Missing required fields.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Email/Username and password are required
 *       401:
 *         description: Unauthorized. Invalid email/username or password.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid email/username or password
 *       403:
 *         description: Forbidden. User does not have access to log in.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Access denied. Please contact the administrator.
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal Server Error
 */
router.post("/login", loginController); //done and tested
router.post("/forgotpassword", forgotPasswordController); //done and tested
router.post("/verifyotp", verifyOTPController); //done and tested
router.get("/getusers", authenticateToken, getAllUsers); //done and tested
router.get("/getreporting", authenticateToken, getUserNamesController); //done
router.get("/getuser/:id", authenticateToken, getUser); //done and tested
router.put("/access", authenticateToken, updateAccessController);
router.put("/updateuser/:id", authenticateToken, updateUser); //done and tested
router.post(
  "/userbulkupload",
  upload.single("file"),
  authenticateToken,
  userBulkUpload
);
router.get("/getprofilepicture/:id", authenticateToken, getProfilePicture);

//chatbot
router.post("/getQuestions", chatbotdetails);

// router.post("/createIncidentForBot", createIncidentForBot);

// Assets APIs
router.get("/check-auth", authenticateToken, (req, res) => {
  res.json({ authenticated: true });
});
router.get("/assetstatus", getAssetStatuses);
router.post("/surrenderasset", authenticateToken, surrenderAsset);
router.post("/createasset", authenticateToken, createAssetDetails); //done and tested
router.get("/assets", getAllAssets); //done and tested
router.get("/getassets", authenticateToken, getAllAssetsdropdown); //done and tested
router.get("/assets/:asset_id", authenticateToken, getAssetDetails); //done and tested
router.put("/updateasset/:asset_id", authenticateToken, updateAssetDetails); //done and tested
router.get("/assethistory", assetHistory);
router.get("/getassetsuser/:userId", getAssetsByOwnerId); //done and tested
router.get("/assethistory/:assetId", getAssetHistory);
router.post("/bulkupload", upload.single("file"), assetBulkUpload);
router.post(
  "/uploadProfilePicture",
  profile.single("profile"),
  authenticateToken,
  updateProfilePicture
); //done and tested

// Dropdown APIs
router.get("/getchangetype", getChangeType);
router.get("/getapprovalstates", getApprovalStates);
router.post("/addciclassification", addCiClassification);
router.post("/addcicategory", addCiCategory);
router.get("/getdepartment", getAllDepartment);
router.post("/adddepartment", addDepartment);
router.get("/getwarranty", getAllWarranyNames);
router.get("/getoem", getAllOem);
router.get("/getalluser", getAllUserNames);
router.get("/getallservice", getAllService);
router.get("/getallciclassification", getAllCiClassification);
router.get("/getallcicategory", getAllCiCategory);
router.get("/getallbom", getAllBom);
router.get("/getassetgroup", getAssetGroup);
router.get("/user_roles", getUserRoles);
router.post("/adduserroles", addUserRoles);
router.get("/support_group_details", getSupportGroups);
router.post("/addsupportgroup", addSupportGroups);
router.get("/level_details", getLevels);
router.post("/addlevel", addLevels);
router.get("/getassettype", getallassettypes);
router.get("/getallvendors", getallvendors);
router.get("/getallbranches", getallbranches);
router.get("/getallmodels", getallmodels);
router.get("/getallgender", getAllGender);
router.get("/call_modes", getAllCallModes);
router.get("/call_types", getAllCallTypes);
router.post("/addsla", authenticateToken, createSLA);
router.post("/addcalltype", authenticateToken, callType);
router.get("/slas", getAllSLAs);
router.get("/statuses", getAllStatuses);
router.get("/priorities", getAllPriorities);

router.get("/getorgs",getAllOrgs)

// CI APIs
router.post("/addci", authenticateToken, addCi); //done and tested
router.post(
  "/cibulkupload",
  upload.single("file"),
  authenticateToken,
  ciBulkUpload
);
router.get("/cidetails/:userId", authenticateToken, getCiDetailsByUserId);
router.get("/getcidata", authenticateToken, getCiData); //done and tested
router.get("/getcidatabyid/:id", authenticateToken, getCiDataById); //done and tested
router.put("/updateci/:ci_id", authenticateToken, updateCi); //done and tested

// Incidents APIs
router.get("/getassetsuser/:userId", authenticateToken, getUserAssets);
router.post(
  "/createincidents",
  incident.array("attachment"),
  authenticateToken,
  createIncident
); //done and tested
router.get("/incidents", getIncidents); //done and tested
router.get("/mytickets", authenticateToken, getUserIncidents);
router.get("/incidents/:incident_id", authenticateToken, getIncidentById);
router.get(
  "/getincidentbysupport",
  authenticateToken,
  getUserIncidentsBySupportGroup
);
router.put(
  "/updateincident/:id",
  incident.array("attachment"),
  authenticateToken,
  updateIncident
); //done and tested
router.get("/getClosedIncident", authenticateToken, getClosedIncidents); //done and tested
router.get("/in-progress", authenticateToken, getInProgressIncidents); //done and tested
router.get("/open", authenticateToken, getOpenIncidents); //done and tested
router.get("/onhold", authenticateToken, getonholdIncidents); //done and tested
router.get(
  "/incidentassigned",
  authenticateToken,
  getIncidentAssetUserDetailsByAssignedUser
);

// HR Request APIs
router.post(
  "/createhr",
  incident.array("attachment"),
  authenticateToken,
  createHrRequest
); //done and tested
router.get("/getallhr", authenticateToken, getAllHrRequests); //done and tested
router.get("/gethrbyid/:id", authenticateToken, getHrRequestById); //done and tested
router.get("/hr_request/open", authenticateToken, getHrRequestByStatusOpen); //done and tested
router.get("/hr_request/closed", authenticateToken, getHrRequestByStatusClosed); //done and tested
router.get(
  "/hr_request/in-progress",
  authenticateToken,
  getHrRequestByStatusInProgress
); //done and tested
router.get(
  "/hr_request/on-hold",
  authenticateToken,
  getHrRequestByStatusOnHold
); //done and tested
router.get("/hrmytickets/:userId", authenticateToken, getUserTickets);
router.get(
  "/hrtickeysbysupportgroup/:userId",
  authenticateToken,
  getHrRequestBySupportGroup
);
router.get(
  "/hrticketassignedto/:userId",
  authenticateToken,
  getHrRequestForAssignedTo
);
router.put("/updatehr/:id", authenticateToken, updateHrById); //done and tested
router.get("/getcibyservice/:service_id", authenticateToken, getCibyService);

// Service APIs
router.post("/createservice", createService);
router.get("/getservicebydept", getService);
router.get("/getservicebyid/:service_id", getServiceById);
router.put("/updateservice/:service_id", updateService);

// Dashboard APIs
router.get("/usercount", getUserCount);
router.get("/assetcount", getAssetCount);
router.get("/incidentcount", getIncidentCount);

router.post("/addAssetType", addAssetType);
router.post("/addService", addService);
router.post("/addVendor", addVendor);
router.post("/addBranch", addBranch);
router.post("/addModel", addModel);

router.delete("/deleteincidentattachment/:id", deleteIncidentAttachmentById);

// Organisational Chart
router.get("/organizationalchart", getOrganisationalChart);

// Problem APIs

router.post(
  "/problem",
  authenticateToken,
  incident.array("attachment"),
  createProblemWithRelationship
);

router.put(
  "/problem/:id",
  authenticateToken,
  incident.array("attachment"),
  updateProblemRelationship
);

router.get("/problems", authenticateToken, getAllProblemsWithRelationships);

router.delete("/deleteproblemattachment/:id", deleteProblemAttachmentById);

router.get("/problems/:id", getProblemById);

router.get("/cis", getAllCIs);

router.get("/incidentsname", getAllIncidentsname);

router.get("/categories", getAllCategories);
router.get("/states", getAllStates);

router.post(
  "/addchangemanagement",
  incident.array("attachment"),
  authenticateToken,
  createChangeManagement
);
router.get("/getchangemanagement", authenticateToken, getChangeManagement);
router.get("/getchangemanagementbyid/:id", getChangeManagementById);
router.put(
  "/updatechangemanagement/:id",
  incident.array("attachment"),
  authenticateToken,
  updateChangeManagement
);

router.get(
  "/getpendingchangemanagement",
  authenticateToken,
  getPendingApproval
);
router.get(
  "/getapprovedchangemanagement",
  authenticateToken,
  getApprovedApproval
);
router.get(
  "/getrejectedchangemanagement",
  authenticateToken,
  getRejectedApproval
);

router.get(
  "/getchangemanagementbyuser",
  authenticateToken,
  getChangeManagementByUser
);

router.get(
  "/getpendingapprovalcount",
  authenticateToken,
  getPendingApprovalCount
);
router.put("/giveapproval/:id", authenticateToken, giveApproval);

router.delete("/deletechangeattachment/:id", deleteChangeAttachmentById);


router.post("/addmessage/:id", authenticateToken, addMessage);

router.get("/getmessage/:id", authenticateToken, getMessage);

router.get("/impacts", getAllImpacts);

module.exports = router;
