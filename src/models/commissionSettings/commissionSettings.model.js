const CommissionSettings = require('./commissionSettings.mongo');

/**
 * Create or update commission settings
 */
async function createOrUpdateCommissionSettings(settingsData) {
    try {
        let settings = await CommissionSettings.findOne({ 
            deliveryType: settingsData.deliveryType 
        });
        
        if (settings) {
            // Update existing settings
            Object.assign(settings, settingsData);
            await settings.save();
        } else {
            // Create new settings
            settings = new CommissionSettings(settingsData);
            await settings.save();
        }
        
        return settings;
    } catch (error) {
        throw error;
    }
}

/**
 * Get all commission settings
 */
async function getAllCommissionSettings() {
    try {
        const settings = await CommissionSettings.find()
            .populate('createdBy', 'userName')
            .populate('updatedBy', 'userName')
            .sort({ deliveryType: 1 });
        return settings;
    } catch (error) {
        throw error;
    }
}

/**
 * Get commission settings by delivery type
 */
async function getCommissionSettingsByType(deliveryType) {
    try {
        const settings = await CommissionSettings.findOne({ 
            deliveryType,
            isActive: true 
        });
        return settings;
    } catch (error) {
        throw error;
    }
}

/**
 * Update commission settings
 */
async function updateCommissionSettings(deliveryType, updateData) {
    try {
        const settings = await CommissionSettings.findOneAndUpdate(
            { deliveryType },
            updateData,
            { new: true, runValidators: true }
        );
        return settings;
    } catch (error) {
        throw error;
    }
}

/**
 * Delete commission settings
 */
async function deleteCommissionSettings(deliveryType) {
    try {
        const settings = await CommissionSettings.findOneAndDelete({ deliveryType });
        return settings;
    } catch (error) {
        throw error;
    }
}

/**
 * Initialize default commission settings
 */
async function initializeDefaultSettings() {
    try {
        const defaultTypes = [
            {
                deliveryType: 'default',
                commissionRate: 10,
                baseAmount: 50,
                description: 'Default commission for all delivery types'
            },
            {
                deliveryType: 'address_to_warehouse',
                commissionRate: 12,
                baseAmount: 60,
                description: 'Commission for address to warehouse deliveries'
            },
            {
                deliveryType: 'warehouse_to_warehouse',
                commissionRate: 8,
                baseAmount: 40,
                description: 'Commission for warehouse to warehouse transfers'
            },
            {
                deliveryType: 'warehouse_to_address',
                commissionRate: 15,
                baseAmount: 70,
                description: 'Commission for warehouse to address deliveries'
            }
        ];
        
        for (const settingData of defaultTypes) {
            const existing = await CommissionSettings.findOne({ 
                deliveryType: settingData.deliveryType 
            });
            
            if (!existing) {
                await CommissionSettings.create(settingData);
            }
        }
        
        return true;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    createOrUpdateCommissionSettings,
    getAllCommissionSettings,
    getCommissionSettingsByType,
    updateCommissionSettings,
    deleteCommissionSettings,
    initializeDefaultSettings
};