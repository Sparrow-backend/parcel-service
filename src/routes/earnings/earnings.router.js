const express = require('express');
const {
    httpCreateEarnings,
    httpGetAllEarnings,
    httpGetEarningsByDriver,
    httpGetDriverEarningsSummary,
    httpUpdateEarnings,
    httpUpdateEarningsStatus,
    httpDeleteEarnings
} = require('./earnings.controller');

const earningsRouter = express.Router();

// Create earnings record
earningsRouter.post('/', httpCreateEarnings);

// Get all earnings (with optional filters via query params)
earningsRouter.get('/', httpGetAllEarnings);

// Get earnings by driver
earningsRouter.get('/driver/:driverId', httpGetEarningsByDriver);

// Get driver earnings summary
earningsRouter.get('/driver/:driverId/summary', httpGetDriverEarningsSummary);

// Update earnings
earningsRouter.put('/:id', httpUpdateEarnings);

// Update earnings status
earningsRouter.patch('/:id/status', httpUpdateEarningsStatus);

// Delete earnings
earningsRouter.delete('/:id', httpDeleteEarnings);

module.exports = earningsRouter;