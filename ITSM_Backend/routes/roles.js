const express = require('express');
const { getUserRoles, getSupportGroups, getLevels } = require('../controllers/dropdownMenu');
const router = express.Router();

console.log('roles.js');

router.get('/user_roles',getUserRoles);

router.get('/support_group_detils',getSupportGroups)

router.get('/level_details',getLevels)

module.exports = router;