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
            settings.updatedTimestamp = new Date();
            await settings.save();
            console.log(`✅ Commission settings updated for: ${settingsData.deliveryType}`);
        } else {
            // Create new settings
            settings = new CommissionSettings(settingsData);
            await settings.save();
            console.log(`✅ Commission settings created for: ${settingsData.deliveryType}`);
        }
        
        return settings;
    } catch (error) {
        console.error('Error creating/updating commission settings:', error);
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
        console.error('Error fetching commission settings:', error);
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
        
        if (!settings) {
            console.log(`⚠️ No settings found for ${deliveryType}, trying default...`);
            // Try to get default settings as fallback
            const defaultSettings = await CommissionSettings.findOne({ 
                deliveryType: 'default',
                isActive: true 
            });
            return defaultSettings;
        }
        
        return settings;
    } catch (error) {
        console.error('Error fetching commission settings by type:', error);
        throw error;
    }
}

/**
 * Update commission settings
 */
async function updateCommissionSettings(deliveryType, updateData) {
    try {
        updateData.updatedTimestamp = new Date();
        
        const settings = await CommissionSettings.findOneAndUpdate(
            { deliveryType },
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!settings) {
            throw new Error('Commission settings not found');
        }
        
        console.log(`✅ Commission settings updated for: ${deliveryType}`);
        
        return settings;
    } catch (error) {
        console.error('Error updating commission settings:', error);
        throw error;
    }
}

/**
 * Delete commission settings
 */
async function deleteCommissionSettings(deliveryType) {
    try {
        const settings = await CommissionSettings.findOneAndDelete({ deliveryType });
        
        if (!settings) {
            throw new Error('Commission settings not found');
        }
        
        console.log(`✅ Commission settings deleted for: ${deliveryType}`);
        
        return settings;
    } catch (error) {
        console.error('Error deleting commission settings:', error);
        throw error;
    }
}

/**
 * Initialize default commission settings
 */
async function initializeDefaultSettings() {
    try {
        console.log('🔧 Initializing default commission settings...');
        
        const defaultTypes = [
            {
                deliveryType: 'default',
                commissionRate: 10,
                baseAmount: 50,
                description: 'Default commission for all delivery types',
                isActive: true
            },
            {
                deliveryType: 'address_to_warehouse',
                commissionRate: 12,
                baseAmount: 75,
                description: 'Commission for address to warehouse deliveries (pickups)',
                isActive: true
            },
            {
                deliveryType: 'warehouse_to_warehouse',
                commissionRate: 8,
                baseAmount: 50,
                description: 'Commission for warehouse to warehouse transfers',
                isActive: true
            },
            {
                deliveryType: 'warehouse_to_address',
                commissionRate: 15,
                baseAmount: 100,
                description: 'Commission for warehouse to address deliveries (last-mile)',
                isActive: true
            }
        ];
        
        let created = 0;
        let existing = 0;
        
        for (const settingData of defaultTypes) {
            const existingSettings = await CommissionSettings.findOne({ 
                deliveryType: settingData.deliveryType 
            });
            
            if (!existingSettings) {
                await CommissionSettings.create(settingData);
                created++;
                console.log(`   ✅ Created settings for: ${settingData.deliveryType}`);
            } else {
                existing++;
                console.log(`   ⏭️ Settings already exist for: ${settingData.deliveryType}`);
            }
        }
        
        console.log(`✅ Initialization complete: ${created} created, ${existing} existing`);
        
        return { created, existing };
    } catch (error) {
        console.error('Error initializing default settings:', error);
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