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
        throw error;
    }
}

/**
 * Create earnings record for a delivery
 */
async function createEarnings(earningsData) {
    try {
        // Validate driver exists
        const driver = await User.findById(earningsData.driver);
        if (!driver || driver.role !== 'Driver') {
            throw new Error('Invalid driver');
        }
        
        // Validate delivery exists
        const delivery = await Delivery.findById(earningsData.delivery)
            .populate('assignedDriver');
        if (!delivery) {
            throw new Error('Delivery not found');
        }
        
        // Verify driver is assigned to this delivery
        if (delivery.assignedDriver._id.toString() !== earningsData.driver.toString()) {
            throw new Error('Driver not assigned to this delivery');
        }
        
        // Get commission settings if not provided
        if (!earningsData.commissionRate) {
            const settings = await getCommissionSettings(delivery.deliveryType);
            earningsData.commissionRate = settings?.commissionRate || 10;
            if (!earningsData.baseAmount && settings?.baseAmount) {
                earningsData.baseAmount = settings.baseAmount;
            }
        }
        
        const earnings = new Earnings(earningsData);
        await earnings.save();
        
        return earnings;
    } catch (error) {
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
        
        return earnings;
    } catch (error) {
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
        
        return earnings;
    } catch (error) {
        throw error;
    }
}

/**
 * Delete earnings
 */
async function deleteEarnings(earningsId) {
    try {
        const earnings = await Earnings.findByIdAndDelete(earningsId);
        return earnings;
    } catch (error) {
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