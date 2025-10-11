const {
    createDelivery,
    getAllDeliveries,
    getDeliveryById,
    getDeliveryByNumber,
    getDeliveriesByDriver,
    getDeliveriesByStatus,
    getDeliveriesByType,
    getDeliveriesByWarehouse,
    updateDelivery,
    updateDeliveryStatus,
    deleteDelivery,
    reassignDelivery
} = require('../../models/deliveries/deliveries.model');

/**
 * Create a new delivery
 */
async function httpCreateDelivery(req, res) {
    try {
        const deliveryData = req.body;

        // Validate required fields
        if (!deliveryData.assignedDriver) {
            return res.status(400).json({
                success: false,
                message: 'assignedDriver is required'
            });
        }

        if (!deliveryData.fromLocation || !deliveryData.toLocation) {
            return res.status(400).json({
                success: false,
                message: 'fromLocation and toLocation are required'
            });
        }

        if (!deliveryData.fromLocation.type || !deliveryData.toLocation.type) {
            return res.status(400).json({
                success: false,
                message: 'fromLocation.type and toLocation.type are required (must be "warehouse" or "address")'
            });
        }

        if (!deliveryData.parcels || deliveryData.parcels.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one parcel is required'
            });
        }

        const delivery = await createDelivery(deliveryData);

        return res.status(201).json({
            success: true,
            message: 'Delivery created and assigned successfully',
            data: delivery
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: 'Failed to create delivery',
            error: error.message
        });
    }
}

/**
 * Get all deliveries with optional filters
 */
async function httpGetAllDeliveries(req, res) {
    try {
        const filters = {};

        // Optional filtering by query params
        if (req.query.status) filters.status = req.query.status;
        if (req.query.driverId) filters.assignedDriver = req.query.driverId;
        if (req.query.priority) filters.priority = req.query.priority;
        if (req.query.deliveryType) filters.deliveryType = req.query.deliveryType;

        const deliveries = await getAllDeliveries(filters);

        return res.status(200).json({
            success: true,
            count: deliveries.length,
            data: deliveries
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch deliveries',
            error: error.message
        });
    }
}

/**
 * Get delivery by ID
 */
async function httpGetDeliveryById(req, res) {
    try {
        const { id } = req.params;
        const delivery = await getDeliveryById(id);

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: delivery
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch delivery',
            error: error.message
        });
    }
}

/**
 * Get delivery by delivery number
 */
async function httpGetDeliveryByNumber(req, res) {
    try {
        const { deliveryNumber } = req.params;
        const delivery = await getDeliveryByNumber(deliveryNumber);

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found with this delivery number'
            });
        }

        return res.status(200).json({
            success: true,
            data: delivery
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch delivery',
            error: error.message
        });
    }
}

/**
 * Get deliveries by driver
 */
async function httpGetDeliveriesByDriver(req, res) {
    try {
        const { driverId } = req.params;
        const deliveries = await getDeliveriesByDriver(driverId);

        return res.status(200).json({
            success: true,
            count: deliveries.length,
            data: deliveries
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch deliveries by driver',
            error: error.message
        });
    }
}

/**
 * Get deliveries by status
 */
async function httpGetDeliveriesByStatus(req, res) {
    try {
        const { status } = req.params;
        const deliveries = await getDeliveriesByStatus(status);

        return res.status(200).json({
            success: true,
            count: deliveries.length,
            data: deliveries
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch deliveries by status',
            error: error.message
        });
    }
}

/**
 * Get deliveries by delivery type
 */
async function httpGetDeliveriesByType(req, res) {
    try {
        const { deliveryType } = req.params;
        const deliveries = await getDeliveriesByType(deliveryType);

        return res.status(200).json({
            success: true,
            count: deliveries.length,
            data: deliveries
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch deliveries by type',
            error: error.message
        });
    }
}

/**
 * Get deliveries by warehouse
 */
async function httpGetDeliveriesByWarehouse(req, res) {
    try {
        const { warehouseId } = req.params;
        const deliveries = await getDeliveriesByWarehouse(warehouseId);

        return res.status(200).json({
            success: true,
            count: deliveries.length,
            data: deliveries
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch deliveries by warehouse',
            error: error.message
        });
    }
}

/**
 * Update delivery
 */
async function httpUpdateDelivery(req, res) {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const delivery = await updateDelivery(id, updateData);

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Delivery updated successfully',
            data: delivery
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: 'Failed to update delivery',
            error: error.message
        });
    }
}

/**
 * Update delivery status
 */
async function httpUpdateDeliveryStatus(req, res) {
    try {
        const { id } = req.params;
        const statusData = req.body;

        if (!statusData.status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }

        const delivery = await updateDeliveryStatus(id, statusData);

        return res.status(200).json({
            success: true,
            message: 'Delivery status updated successfully',
            data: delivery
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: 'Failed to update delivery status',
            error: error.message
        });
    }
}

/**
 * Reassign delivery to different driver
 */
async function httpReassignDelivery(req, res) {
    try {
        const { id } = req.params;
        const { newDriverId, reassignedBy } = req.body;

        if (!newDriverId) {
            return res.status(400).json({
                success: false,
                message: 'newDriverId is required'
            });
        }

        const delivery = await reassignDelivery(id, newDriverId, reassignedBy);

        return res.status(200).json({
            success: true,
            message: 'Delivery reassigned successfully',
            data: delivery
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: 'Failed to reassign delivery',
            error: error.message
        });
    }
}

/**
 * Delete delivery
 */
async function httpDeleteDelivery(req, res) {
    try {
        const { id } = req.params;
        const delivery = await deleteDelivery(id);

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Delivery deleted successfully',
            data: delivery
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to delete delivery',
            error: error.message
        });
    }
}

module.exports = {
    httpCreateDelivery,
    httpGetAllDeliveries,
    httpGetDeliveryById,
    httpGetDeliveryByNumber,
    httpGetDeliveriesByDriver,
    httpGetDeliveriesByStatus,
    httpGetDeliveriesByType,
    httpGetDeliveriesByWarehouse,
    httpUpdateDelivery,
    httpUpdateDeliveryStatus,
    httpReassignDelivery,
    httpDeleteDelivery
};