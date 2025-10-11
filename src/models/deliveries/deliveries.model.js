const Delivery = require('./deliveries.mongo');
const Parcel = require('../parcel/parcel.mongo');
const User = require('../user/user.mongo');
const Warehouse = require('../warehouse/warehouse.mongo');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

/**
 * Generate unique delivery number
 */
function generateDeliveryNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `DEL-${timestamp}-${random}`;
}

/**
 * Validate location data
 */
async function validateLocation(location, locationType) {
    if (location.type === 'warehouse') {
        if (!location.warehouseId) {
            throw new Error(`${locationType} warehouseId is required when type is 'warehouse'`);
        }
        const warehouse = await Warehouse.findById(location.warehouseId);
        if (!warehouse) {
            throw new Error(`${locationType} warehouse not found`);
        }
        if (warehouse.status !== 'active') {
            throw new Error(`${locationType} warehouse is not active`);
        }
        return warehouse;
    } else if (location.type === 'address') {
        if (!location.address) {
            throw new Error(`${locationType} address is required when type is 'address'`);
        }
        if (!location.latitude || !location.longitude) {
            throw new Error(`${locationType} latitude and longitude are required when type is 'address'`);
        }
    } else {
        throw new Error(`${locationType} type must be either 'warehouse' or 'address'`);
    }
    return null;
}

/**
 * Determine delivery type based on from/to locations
 */
function determineDeliveryType(fromLocation, toLocation) {
    if (fromLocation.type === 'address' && toLocation.type === 'warehouse') {
        return 'address_to_warehouse';
    } else if (fromLocation.type === 'warehouse' && toLocation.type === 'warehouse') {
        return 'warehouse_to_warehouse';
    } else if (fromLocation.type === 'warehouse' && toLocation.type === 'address') {
        return 'warehouse_to_address';
    } else {
        throw new Error('Invalid delivery route. Deliveries must be: address→warehouse, warehouse→warehouse, or warehouse→address');
    }
}

/**
 * Create a new delivery
 */
async function createDelivery(deliveryData) {
    try {
        // Validate driver exists and has driver role
        const driver = await User.findById(deliveryData.assignedDriver);
        if (!driver) {
            throw new Error('Driver not found');
        }
        if (driver.role !== 'Driver') {
            throw new Error('Assigned user is not a driver');
        }

        // Validate locations
        const fromWarehouse = await validateLocation(deliveryData.fromLocation, 'fromLocation');
        const toWarehouse = await validateLocation(deliveryData.toLocation, 'toLocation');

        // Determine delivery type
        deliveryData.deliveryType = determineDeliveryType(deliveryData.fromLocation, deliveryData.toLocation);

        // Validate parcels exist
        if (deliveryData.parcels && deliveryData.parcels.length > 0) {
            const parcels = await Parcel.find({ _id: { $in: deliveryData.parcels } });
            if (parcels.length !== deliveryData.parcels.length) {
                throw new Error('One or more parcels not found');
            }
        }

        // Generate delivery number if not provided
        if (!deliveryData.deliveryNumber) {
            deliveryData.deliveryNumber = generateDeliveryNumber();
        }

        const delivery = new Delivery(deliveryData);

        // Initialize status history
        delivery.statusHistory.push({
            status: delivery.status,
            timestamp: new Date(),
            note: `Delivery created: ${deliveryData.deliveryType.replace(/_/g, ' ')}`
        });

        await delivery.save();

        // Update parcels status and warehouse association
        if (deliveryData.parcels && deliveryData.parcels.length > 0) {
            const updateData = {
                $set: { 
                    status: 'assigned_to_driver',
                    assignedDriver: deliveryData.assignedDriver
                },
                $push: {
                    statusHistory: {
                        status: 'assigned_to_driver',
                        service: 'delivery-service',
                        timestamp: new Date(),
                        note: `Assigned to delivery ${delivery.deliveryNumber}`
                    }
                }
            };

            // If delivery is to a warehouse, update parcel's warehouseId
            if (toWarehouse) {
                updateData.$set.warehouseId = toWarehouse._id;
            }

            await Parcel.updateMany(
                { _id: { $in: deliveryData.parcels } },
                updateData
            );
        }

        // Send notification to driver
        const deliveryTypeReadable = deliveryData.deliveryType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        await sendNotification({
            userId: deliveryData.assignedDriver,
            type: 'delivery_assignment',
            title: 'New Delivery Assigned',
            message: `You have been assigned ${deliveryTypeReadable} delivery ${delivery.deliveryNumber} with ${deliveryData.parcels?.length || 0} parcel(s)`,
            entityType: 'Delivery',
            entityId: delivery._id,
            channels: ['in_app', 'push']
        });

        // Send notification to staff who created it
        if (deliveryData.assignedBy) {
            await sendNotification({
                userId: deliveryData.assignedBy,
                type: 'delivery_update',
                title: 'Delivery Created',
                message: `${deliveryTypeReadable} delivery ${delivery.deliveryNumber} has been created and assigned to driver`,
                entityType: 'Delivery',
                entityId: delivery._id,
                channels: ['in_app']
            });
        }

        return delivery;
    } catch (error) {
        console.error('Error creating delivery:', error);
        throw error;
    }
}

/**
 * Get all deliveries with optional filters
 */
async function getAllDeliveries(filters = {}) {
    try {
        const deliveries = await Delivery.find(filters)
            .populate('parcels')
            .populate('assignedDriver', 'userName entityId role')
            .populate('assignedBy', 'userName entityId role')
            .populate('fromLocation.warehouseId', 'name code address')
            .populate('toLocation.warehouseId', 'name code address')
            .sort({ createdTimestamp: -1 });
        return deliveries;
    } catch (error) {
        console.error('Error fetching deliveries:', error);
        throw error;
    }
}

/**
 * Get delivery by ID
 */
async function getDeliveryById(deliveryId) {
    try {
        const delivery = await Delivery.findById(deliveryId)
            .populate('parcels')
            .populate('assignedDriver', 'userName entityId role')
            .populate('assignedBy', 'userName entityId role')
            .populate('fromLocation.warehouseId', 'name code address')
            .populate('toLocation.warehouseId', 'name code address');
        return delivery;
    } catch (error) {
        console.error('Error fetching delivery by ID:', error);
        throw error;
    }
}

/**
 * Get delivery by delivery number
 */
async function getDeliveryByNumber(deliveryNumber) {
    try {
        const delivery = await Delivery.findOne({ deliveryNumber })
            .populate('parcels')
            .populate('assignedDriver', 'userName entityId role')
            .populate('assignedBy', 'userName entityId role')
            .populate('fromLocation.warehouseId', 'name code address')
            .populate('toLocation.warehouseId', 'name code address');
        return delivery;
    } catch (error) {
        console.error('Error fetching delivery by number:', error);
        throw error;
    }
}

/**
 * Get deliveries by driver
 */
async function getDeliveriesByDriver(driverId) {
    try {
        const deliveries = await Delivery.find({ assignedDriver: driverId })
            .populate('parcels')
            .populate('assignedBy', 'userName entityId role')
            .populate('fromLocation.warehouseId', 'name code address')
            .populate('toLocation.warehouseId', 'name code address')
            .sort({ createdTimestamp: -1 });
        return deliveries;
    } catch (error) {
        console.error('Error fetching deliveries by driver:', error);
        throw error;
    }
}

/**
 * Get deliveries by status
 */
async function getDeliveriesByStatus(status) {
    try {
        const deliveries = await Delivery.find({ status })
            .populate('parcels')
            .populate('assignedDriver', 'userName entityId role')
            .populate('assignedBy', 'userName entityId role')
            .populate('fromLocation.warehouseId', 'name code address')
            .populate('toLocation.warehouseId', 'name code address')
            .sort({ createdTimestamp: -1 });
        return deliveries;
    } catch (error) {
        console.error('Error fetching deliveries by status:', error);
        throw error;
    }
}

/**
 * Get deliveries by delivery type
 */
async function getDeliveriesByType(deliveryType) {
    try {
        const deliveries = await Delivery.find({ deliveryType })
            .populate('parcels')
            .populate('assignedDriver', 'userName entityId role')
            .populate('assignedBy', 'userName entityId role')
            .populate('fromLocation.warehouseId', 'name code address')
            .populate('toLocation.warehouseId', 'name code address')
            .sort({ createdTimestamp: -1 });
        return deliveries;
    } catch (error) {
        console.error('Error fetching deliveries by type:', error);
        throw error;
    }
}

/**
 * Get deliveries by warehouse (from or to)
 */
async function getDeliveriesByWarehouse(warehouseId) {
    try {
        const deliveries = await Delivery.find({
            $or: [
                { 'fromLocation.warehouseId': warehouseId },
                { 'toLocation.warehouseId': warehouseId }
            ]
        })
            .populate('parcels')
            .populate('assignedDriver', 'userName entityId role')
            .populate('assignedBy', 'userName entityId role')
            .populate('fromLocation.warehouseId', 'name code address')
            .populate('toLocation.warehouseId', 'name code address')
            .sort({ createdTimestamp: -1 });
        return deliveries;
    } catch (error) {
        console.error('Error fetching deliveries by warehouse:', error);
        throw error;
    }
}

/**
 * Update delivery
 */
async function updateDelivery(deliveryId, updateData) {
    try {
        // If reassigning driver, validate new driver
        if (updateData.assignedDriver) {
            const driver = await User.findById(updateData.assignedDriver);
            if (!driver) {
                throw new Error('Driver not found');
            }
            if (driver.role !== 'Driver') {
                throw new Error('Assigned user is not a driver');
            }
        }

        // If updating locations, validate them
        if (updateData.fromLocation) {
            await validateLocation(updateData.fromLocation, 'fromLocation');
        }
        if (updateData.toLocation) {
            await validateLocation(updateData.toLocation, 'toLocation');
        }

        const delivery = await Delivery.findByIdAndUpdate(
            deliveryId,
            updateData,
            { new: true, runValidators: true }
        )
            .populate('parcels')
            .populate('assignedDriver', 'userName entityId role')
            .populate('assignedBy', 'userName entityId role')
            .populate('fromLocation.warehouseId', 'name code address')
            .populate('toLocation.warehouseId', 'name code address');

        return delivery;
    } catch (error) {
        console.error('Error updating delivery:', error);
        throw error;
    }
}

/**
 * Update delivery status
 */
async function updateDeliveryStatus(deliveryId, statusData) {
    try {
        const delivery = await Delivery.findById(deliveryId)
            .populate('assignedDriver')
            .populate('parcels')
            .populate('toLocation.warehouseId');

        if (!delivery) {
            throw new Error('Delivery not found');
        }

        const oldStatus = delivery.status;
        delivery.status = statusData.status;

        // Add to status history
        delivery.statusHistory.push({
            status: statusData.status,
            timestamp: new Date(),
            note: statusData.note || '',
            location: statusData.location || {}
        });

        // Update timestamps based on status
        if (statusData.status === 'picked_up' && !delivery.actualPickupTime) {
            delivery.actualPickupTime = new Date();
        }
        if (statusData.status === 'delivered' && !delivery.actualDeliveryTime) {
            delivery.actualDeliveryTime = new Date();
        }

        await delivery.save();

        // Update parcel statuses based on delivery status
        let parcelStatus = null;
        switch (statusData.status) {
            case 'picked_up':
                parcelStatus = 'in_transit';
                break;
            case 'in_transit':
                parcelStatus = 'in_transit';
                break;
            case 'delivered':
                // If delivered to warehouse, update parcel status to at_warehouse
                if (delivery.toLocation.type === 'warehouse') {
                    parcelStatus = 'at_warehouse';
                } else {
                    parcelStatus = 'delivered';
                }
                break;
        }

        if (parcelStatus && delivery.parcels.length > 0) {
            await Parcel.updateMany(
                { _id: { $in: delivery.parcels.map(p => p._id) } },
                {
                    $set: { status: parcelStatus },
                    $push: {
                        statusHistory: {
                            status: parcelStatus,
                            service: 'delivery-service',
                            timestamp: new Date(),
                            note: `Delivery ${delivery.deliveryNumber} status: ${statusData.status}`
                        }
                    }
                }
            );
        }

        // Send notifications
        if (delivery.assignedDriver && oldStatus !== statusData.status) {
            await sendNotification({
                userId: delivery.assignedDriver._id,
                type: 'delivery_update',
                title: 'Delivery Status Updated',
                message: `Delivery ${delivery.deliveryNumber} status changed to ${statusData.status}`,
                entityType: 'Delivery',
                entityId: delivery._id,
                channels: ['in_app']
            });
        }

        return delivery;
    } catch (error) {
        console.error('Error updating delivery status:', error);
        throw error;
    }
}

/**
 * Delete delivery
 */
async function deleteDelivery(deliveryId) {
    try {
        const delivery = await Delivery.findByIdAndDelete(deliveryId);
        return delivery;
    } catch (error) {
        console.error('Error deleting delivery:', error);
        throw error;
    }
}

/**
 * Reassign delivery to different driver
 */
async function reassignDelivery(deliveryId, newDriverId, reassignedBy) {
    try {
        // Validate new driver
        const newDriver = await User.findById(newDriverId);
        if (!newDriver) {
            throw new Error('New driver not found');
        }
        if (newDriver.role !== 'Driver') {
            throw new Error('Assigned user is not a driver');
        }

        const delivery = await Delivery.findById(deliveryId)
            .populate('assignedDriver');

        if (!delivery) {
            throw new Error('Delivery not found');
        }

        const oldDriver = delivery.assignedDriver;
        delivery.assignedDriver = newDriverId;
        delivery.statusHistory.push({
            status: delivery.status,
            timestamp: new Date(),
            note: `Delivery reassigned from ${oldDriver?.userName || 'previous driver'} to ${newDriver.userName}`
        });

        await delivery.save();

        // Notify old driver
        if (oldDriver) {
            await sendNotification({
                userId: oldDriver._id,
                type: 'delivery_update',
                title: 'Delivery Reassigned',
                message: `Delivery ${delivery.deliveryNumber} has been reassigned to another driver`,
                entityType: 'Delivery',
                entityId: delivery._id,
                channels: ['in_app', 'push']
            });
        }

        // Notify new driver
        await sendNotification({
            userId: newDriverId,
            type: 'delivery_assignment',
            title: 'New Delivery Assigned',
            message: `You have been assigned delivery ${delivery.deliveryNumber}`,
            entityType: 'Delivery',
            entityId: delivery._id,
            channels: ['in_app', 'push']
        });

        return delivery;
    } catch (error) {
        console.error('Error reassigning delivery:', error);
        throw error;
    }
}

/**
 * Helper function to send notifications
 */
async function sendNotification(notificationData) {
    try {
        const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'https://notification-service.vercel.app';

        const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(notificationData)
        });

        if (!response.ok) {
            console.error('Failed to send notification:', await response.text());
        }
    } catch (error) {
        console.error('Error sending notification:', error);
    }
}

module.exports = {
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
};