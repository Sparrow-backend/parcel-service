const express = require('express');
const {
    httpCreateOrUpdateCommissionSettings,
    httpGetAllCommissionSettings,
    httpGetCommissionSettingsByType,
    httpUpdateCommissionSettings,
    httpDeleteCommissionSettings,
    httpInitializeDefaultSettings
} = require('./commissionSettings.controller');

const commissionRouter = express.Router();

// Initialize default settings
commissionRouter.post('/initialize', httpInitializeDefaultSettings);

// Create or update commission settings
commissionRouter.post('/', httpCreateOrUpdateCommissionSettings);

// Get all commission settings
commissionRouter.get('/', httpGetAllCommissionSettings);

// Get commission settings by delivery type
commissionRouter.get('/:deliveryType', httpGetCommissionSettingsByType);

// Update commission settings
commissionRouter.put('/:deliveryType', httpUpdateCommissionSettings);

// Delete commission settings
commissionRouter.delete('/:deliveryType', httpDeleteCommissionSettings);

module.exports = commissionRouter;