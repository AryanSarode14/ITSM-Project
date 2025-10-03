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
} = require("./controllers/mailController");

// Users
const {
  getUser,
  updateUser,
  getAllUsers,
  getUserNamesController,
  updateAccessController,
  updateProfilePicture,
  getProfilePicture,
} = require("./controllers/userController");

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
router.post("/register", registerController); //done and tested
router.post("/login", loginController); //done and tested
router.post("/forgotpassword", forgotPasswordController); //done and tested
router.post("/verifyotp", verifyOTPController); //done and tested
router.get("/getusers", getAllUsers); //done and tested
router.get("/getreporting", authenticateToken, getUserNamesController); //done
router.get("/getuser/:id", getUser); //done and tested
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
router.get("/assets", authenticateToken, getAllAssets); //done and tested
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
