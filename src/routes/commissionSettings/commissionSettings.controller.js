const {
    createOrUpdateCommissionSettings,
    getAllCommissionSettings,
    getCommissionSettingsByType,
    updateCommissionSettings,
    deleteCommissionSettings,
    initializeDefaultSettings
} = require('../../models/commissionSettings/commissionSettings.model');

/**
 * Create or update commission settings
 */
async function httpCreateOrUpdateCommissionSettings(req, res) {
    try {
        const settingsData = req.body;
        
        if (!settingsData.deliveryType) {
            return res.status(400).json({
                success: false,
                message: 'deliveryType is required'
            });
        }
        
        if (settingsData.commissionRate === undefined) {
            return res.status(400).json({
                success: false,
                message: 'commissionRate is required'
            });
        }
        
        const settings = await createOrUpdateCommissionSettings(settingsData);
        
        return res.status(200).json({
            success: true,
            message: 'Commission settings saved successfully',
            data: settings
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: 'Failed to save commission settings',
            error: error.message
        });
    }
}

/**
 * Get all commission settings
 */
async function httpGetAllCommissionSettings(req, res) {
    try {
        const settings = await getAllCommissionSettings();
        
        return res.status(200).json({
            success: true,
            count: settings.length,
            data: settings
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch commission settings',
            error: error.message
        });
    }
}

/**
 * Get commission settings by delivery type
 */
async function httpGetCommissionSettingsByType(req, res) {
    try {
        const { deliveryType } = req.params;
        const settings = await getCommissionSettingsByType(deliveryType);
        
        if (!settings) {
            return res.status(404).json({
                success: false,
                message: 'Commission settings not found for this delivery type'
            });
        }
        
        return res.status(200).json({
            success: true,
            data: settings
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch commission settings',
            error: error.message
        });
    }
}

/**
 * Update commission settings
 */
async function httpUpdateCommissionSettings(req, res) {
    try {
        const { deliveryType } = req.params;
        const updateData = req.body;
        
        const settings = await updateCommissionSettings(deliveryType, updateData);
        
        if (!settings) {
            return res.status(404).json({
                success: false,
                message: 'Commission settings not found'
            });
        }
        
        return res.status(200).json({
            success: true,
            message: 'Commission settings updated successfully',
            data: settings
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: 'Failed to update commission settings',
            error: error.message
        });
    }
}

/**
 * Delete commission settings
 */
async function httpDeleteCommissionSettings(req, res) {
    try {
        const { deliveryType } = req.params;
        
        if (deliveryType === 'default') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete default commission settings'
            });
        }
        
        const settings = await deleteCommissionSettings(deliveryType);
        
        if (!settings) {
            return res.status(404).json({
                success: false,
                message: 'Commission settings not found'
            });
        }
        
        return res.status(200).json({
            success: true,
            message: 'Commission settings deleted successfully',
            data: settings
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to delete commission settings',
            error: error.message
        });
    }
}

/**
 * Initialize default settings
 */
async function httpInitializeDefaultSettings(req, res) {
    try {
        await initializeDefaultSettings();
        
        return res.status(200).json({
            success: true,
            message: 'Default commission settings initialized successfully'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to initialize default settings',
            error: error.message
        });
    }
}

module.exports = {
    httpCreateOrUpdateCommissionSettings,
    httpGetAllCommissionSettings,
    httpGetCommissionSettingsByType,
    httpUpdateCommissionSettings,
    httpDeleteCommissionSettings,
    httpInitializeDefaultSettings
};