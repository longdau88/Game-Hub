const express = require('express');
const router = express.Router();
const supportController = require('../controllers/support.controller');

router.post('/', supportController.createTicket);

module.exports = router;
