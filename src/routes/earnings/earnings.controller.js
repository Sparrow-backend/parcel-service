const {
    createEarnings,
    getAllEarnings,
    getEarningsByDriver,
    getDriverEarningsSummary,
    updateEarnings,
    updateEarningsStatus,
    deleteEarnings
} = require('../../models/earnings/earnings.model');

/**
 * Create earnings record
 */
async function httpCreateEarnings(req, res) {
    try {
        const earningsData = req.body;
        
        if (!earningsData.driver || !earningsData.delivery) {
            return res.status(400).json({
                success: false,
                message: 'driver and delivery are required'
            });
        }
        
        if (!earningsData.baseAmount) {
            return res.status(400).json({
                success: false,
                message: 'baseAmount is required'
            });
        }
        
        if (!earningsData.deliveryCompletedAt) {
            earningsData.deliveryCompletedAt = new Date();
        }
        
        const earnings = await createEarnings(earningsData);
        
        return res.status(201).json({
            success: true,
            message: 'Earnings record created successfully',
            data: earnings
        });
    } catch (error) {
        console.error('Create earnings error:', error);
        return res.status(400).json({
            success: false,
            message: 'Failed to create earnings record',
            error: error.message
        });
    }
}

/**
 * Get all earnings
 */
async function httpGetAllEarnings(req, res) {
    try {
        const filters = {};
        
        if (req.query.status) filters.status = req.query.status;
        if (req.query.driver) filters.driver = req.query.driver;
        
        const earnings = await getAllEarnings(filters);
        
        return res.status(200).json({
            success: true,
            count: earnings.length,
            data: earnings
        });
    } catch (error) {
        console.error('Get all earnings error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch earnings',
            error: error.message
        });
    }
}

/**
 * Get earnings by driver
 */
async function httpGetEarningsByDriver(req, res) {
    try {
        const { driverId } = req.params;
        
        console.log('📡 Fetching earnings for driver:', driverId);
        
        const filters = {};
        
        if (req.query.status) filters.status = req.query.status;
        if (req.query.startDate || req.query.endDate) {
            filters.deliveryCompletedAt = {};
            if (req.query.startDate) {
                filters.deliveryCompletedAt.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                filters.deliveryCompletedAt.$lte = new Date(req.query.endDate);
            }
        }
        
        const earnings = await getEarningsByDriver(driverId, filters);
        
        console.log(`✅ Found ${earnings.length} earnings records for driver`);
        
        return res.status(200).json({
            success: true,
            count: earnings.length,
            data: earnings
        });
    } catch (error) {
        console.error('Get earnings by driver error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch driver earnings',
            error: error.message
        });
    }
}

/**
 * Get driver earnings summary
 */
async function httpGetDriverEarningsSummary(req, res) {
    try {
        const { driverId } = req.params;
        const { startDate, endDate } = req.query;
        
        console.log('📡 Fetching earnings summary for driver:', driverId);
        
        const summary = await getDriverEarningsSummary(driverId, startDate, endDate);
        
        console.log('✅ Summary calculated successfully');
        
        return res.status(200).json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Get earnings summary error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch earnings summary',
            error: error.message
        });
    }
}

/**
 * Update earnings
 */
async function httpUpdateEarnings(req, res) {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        const earnings = await updateEarnings(id, updateData);
        
        if (!earnings) {
            return res.status(404).json({
                success: false,
                message: 'Earnings record not found'
            });
        }
        
        return res.status(200).json({
            success: true,
            message: 'Earnings updated successfully',
            data: earnings
        });
    } catch (error) {
        console.error('Update earnings error:', error);
        return res.status(400).json({
            success: false,
            message: 'Failed to update earnings',
            error: error.message
        });
    }
}

/**
 * Update earnings status
 */
async function httpUpdateEarningsStatus(req, res) {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        
        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }
        
        const earnings = await updateEarningsStatus(id, status, notes);
        
        if (!earnings) {
            return res.status(404).json({
                success: false,
                message: 'Earnings record not found'
            });
        }
        
        return res.status(200).json({
            success: true,
            message: 'Earnings status updated successfully',
            data: earnings
        });
    } catch (error) {
        console.error('Update earnings status error:', error);
        return res.status(400).json({
            success: false,
            message: 'Failed to update earnings status',
            error: error.message
        });
    }
}

/**
 * Delete earnings
 */
async function httpDeleteEarnings(req, res) {
    try {
        const { id } = req.params;
        const earnings = await deleteEarnings(id);
        
        if (!earnings) {
            return res.status(404).json({
                success: false,
                message: 'Earnings record not found'
            });
        }
        
        return res.status(200).json({
            success: true,
            message: 'Earnings deleted successfully',
            data: earnings
        });
    } catch (error) {
        console.error('Delete earnings error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete earnings',
            error: error.message
        });
    }
}

module.exports = {
    httpCreateEarnings,
    httpGetAllEarnings,
    httpGetEarningsByDriver,
    httpGetDriverEarningsSummary,
    httpUpdateEarnings,
    httpUpdateEarningsStatus,
    httpDeleteEarnings
};