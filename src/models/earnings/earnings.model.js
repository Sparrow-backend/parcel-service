const Earnings = require('./earnings.mongo');
const CommissionSettings = require('../commissionSettings/commissionSettings.mongo');
const Delivery = require('../deliveries/deliveries.mongo');
const User = require('../user/user.mongo');

/**
 * Get commission settings for a delivery type
 */
async function getCommissionSettings(deliveryType) {
    try {
        let settings = await CommissionSettings.findOne({ 
            deliveryType, 
            isActive: true 
        });
        
        if (!settings) {
            // Get default settings
            settings = await CommissionSettings.findOne({ 
                deliveryType: 'default',
                isActive: true 
            });
        }
        
        return settings;
    } catch (error) {
        console.error('Error getting commission settings:', error);
        throw error;
    }
}

/**
 * Create earnings record for a delivery
 */
async function createEarnings(earningsData) {
    try {
        console.log('📝 Creating earnings record...');
        
        // Validate driver exists
        const driver = await User.findById(earningsData.driver);
        if (!driver) {
            throw new Error('Driver not found');
        }
        if (driver.role !== 'Driver') {
            throw new Error('User is not a driver');
        }
        
        // Validate delivery exists
        const delivery = await Delivery.findById(earningsData.delivery)
            .populate('assignedDriver');
        if (!delivery) {
            throw new Error('Delivery not found');
        }
        
        // Verify driver is assigned to this delivery
        const deliveryDriverId = delivery.assignedDriver._id || delivery.assignedDriver;
        if (deliveryDriverId.toString() !== earningsData.driver.toString()) {
            throw new Error('Driver not assigned to this delivery');
        }
        
        // Check if earnings already exist for this delivery
        const existingEarnings = await Earnings.findOne({ delivery: earningsData.delivery });
        if (existingEarnings) {
            console.log('⚠️ Earnings already exist for this delivery');
            return existingEarnings;
        }
        
        // Get commission settings if not provided
        if (!earningsData.commissionRate && earningsData.commissionRate !== 0) {
            const settings = await getCommissionSettings(delivery.deliveryType);
            earningsData.commissionRate = settings?.commissionRate || 10;
            if (!earningsData.baseAmount && settings?.baseAmount) {
                earningsData.baseAmount = settings.baseAmount;
            }
        }
        
        // Ensure required fields have defaults
        if (!earningsData.bonusAmount) {
            earningsData.bonusAmount = 0;
        }
        if (!earningsData.deductions) {
            earningsData.deductions = 0;
        }
        if (!earningsData.status) {
            earningsData.status = 'pending';
        }
        if (!earningsData.deliveryCompletedAt) {
            earningsData.deliveryCompletedAt = new Date();
        }
        
        const earnings = new Earnings(earningsData);
        await earnings.save();
        
        console.log('✅ Earnings record created successfully');
        console.log(`   Driver: ${driver.userName}`);
        console.log(`   Total Earnings: Rs. ${earnings.totalEarnings}`);
        
        return earnings;
    } catch (error) {
        console.error('Error creating earnings:', error);
        throw error;
    }
}

/**
 * Get all earnings with filters
 */
async function getAllEarnings(filters = {}) {
    try {
        const earnings = await Earnings.find(filters)
            .populate('driver', 'userName entityId')
            .populate({
                path: 'delivery',
                populate: [
                    { path: 'parcels' },
                    { path: 'consolidation' }
                ]
            })
            .sort({ deliveryCompletedAt: -1 });
        return earnings;
    } catch (error) {
        console.error('Error fetching earnings:', error);
        throw error;
    }
}

/**
 * Get earnings by driver
 */
async function getEarningsByDriver(driverId, filters = {}) {
    try {
        const query = { driver: driverId, ...filters };
        const earnings = await Earnings.find(query)
            .populate({
                path: 'delivery',
                populate: [
                    { path: 'parcels' },
                    { path: 'consolidation' }
                ]
            })
            .sort({ deliveryCompletedAt: -1 });
        return earnings;
    } catch (error) {
        console.error('Error fetching driver earnings:', error);
        throw error;
    }
}

/**
 * Get earnings summary for a driver
 */
async function getDriverEarningsSummary(driverId, startDate, endDate) {
    try {
        const query = { driver: driverId };
        
        if (startDate || endDate) {
            query.deliveryCompletedAt = {};
            if (startDate) query.deliveryCompletedAt.$gte = new Date(startDate);
            if (endDate) query.deliveryCompletedAt.$lte = new Date(endDate);
        }
        
        const earnings = await Earnings.find(query);
        
        const summary = {
            totalEarnings: 0,
            totalCommission: 0,
            totalBonus: 0,
            totalDeductions: 0,
            pendingAmount: 0,
            approvedAmount: 0,
            paidAmount: 0,
            deliveryCount: 0,
            byStatus: {
                pending: { count: 0, amount: 0 },
                approved: { count: 0, amount: 0 },
                paid: { count: 0, amount: 0 },
                cancelled: { count: 0, amount: 0 }
            }
        };
        
        earnings.forEach(earning => {
            summary.totalEarnings += earning.totalEarnings;
            summary.totalCommission += earning.commissionAmount;
            summary.totalBonus += earning.bonusAmount;
            summary.totalDeductions += earning.deductions;
            summary.deliveryCount++;
            
            summary.byStatus[earning.status].count++;
            summary.byStatus[earning.status].amount += earning.totalEarnings;
            
            if (earning.status === 'pending') {
                summary.pendingAmount += earning.totalEarnings;
            } else if (earning.status === 'approved') {
                summary.approvedAmount += earning.totalEarnings;
            } else if (earning.status === 'paid') {
                summary.paidAmount += earning.totalEarnings;
            }
        });
        
        return summary;
    } catch (error) {
        console.error('Error getting driver earnings summary:', error);
        throw error;
    }
}

/**
 * Update earnings
 */
async function updateEarnings(earningsId, updateData) {
    try {
        const earnings = await Earnings.findByIdAndUpdate(
            earningsId,
            updateData,
            { new: true, runValidators: true }
        )
            .populate('driver', 'userName entityId')
            .populate('delivery');
        
        if (!earnings) {
            throw new Error('Earnings record not found');
        }
        
        console.log('✅ Earnings updated successfully');
        
        return earnings;
    } catch (error) {
        console.error('Error updating earnings:', error);
        throw error;
    }
}

/**
 * Update earnings status
 */
async function updateEarningsStatus(earningsId, status, notes) {
    try {
        const updateData = { status };
        
        if (status === 'paid') {
            updateData.paidAt = new Date();
        }
        
        if (notes) {
            updateData.notes = notes;
        }
        
        const earnings = await Earnings.findByIdAndUpdate(
            earningsId,
            updateData,
            { new: true }
        )
            .populate('driver', 'userName entityId')
            .populate('delivery');
        
        if (!earnings) {
            throw new Error('Earnings record not found');
        }
        
        console.log(`✅ Earnings status updated to: ${status}`);
        
        return earnings;
    } catch (error) {
        console.error('Error updating earnings status:', error);
        throw error;
    }
}

/**
 * Delete earnings
 */
async function deleteEarnings(earningsId) {
    try {
        const earnings = await Earnings.findByIdAndDelete(earningsId);
        
        if (!earnings) {
            throw new Error('Earnings record not found');
        }
        
        console.log('✅ Earnings deleted successfully');
        
        return earnings;
    } catch (error) {
        console.error('Error deleting earnings:', error);
        throw error;
    }
}

module.exports = {
    createEarnings,
    getAllEarnings,
    getEarningsByDriver,
    getDriverEarningsSummary,
    updateEarnings,
    updateEarningsStatus,
    deleteEarnings,
    getCommissionSettings
};