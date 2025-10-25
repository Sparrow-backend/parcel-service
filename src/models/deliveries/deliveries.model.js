const Delivery = require('./deliveries.mongo');
const Parcel = require('../parcel/parcel.mongo');
const Consolidation = require('../consolidation/consolidation.mongo');
const User = require('../user/user.mongo');
const Warehouse = require('../warehouse/warehouse.mongo');
const Earnings = require('../earnings/earnings.mongo');
const CommissionSettings = require('../commissionSettings/commissionSettings.mongo');
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
 * Calculate distance between two coordinates in km
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg) {
    return deg * (Math.PI / 180);
}

/**
 * Calculate delivery base amount for earnings
 */
function calculateDeliveryBaseAmount(delivery, items, commissionSettings) {
    let baseAmount = 0;
    
    // Start with base amount from commission settings if available
    if (commissionSettings && commissionSettings.baseAmount) {
        baseAmount = commissionSettings.baseAmount;
    } else {
        // Default base amounts by delivery type
        if (delivery.deliveryType === 'warehouse_to_warehouse') {
            baseAmount = 50;
        } else if (delivery.deliveryType === 'warehouse_to_address') {
            baseAmount = 100;
        } else if (delivery.deliveryType === 'address_to_warehouse') {
            baseAmount = 75;
        }
    }
    
    // Add weight-based calculation
    let totalWeight = 0;
    items.forEach(item => {
        const weight = item.weight?.value || 0;
        totalWeight += weight;
    });
    baseAmount += totalWeight * 10; // Rs. 10 per kg
    
    // Calculate distance if location history exists
    let distance = 0;
    if (delivery.statusHistory && delivery.statusHistory.length > 1) {
        for (let i = 1; i < delivery.statusHistory.length; i++) {
            const loc1 = delivery.statusHistory[i - 1].location;
            const loc2 = delivery.statusHistory[i].location;
            if (loc1?.latitude && loc1?.longitude && loc2?.latitude && loc2?.longitude) {
                distance += calculateDistance(
                    loc1.latitude,
                    loc1.longitude,
                    loc2.latitude,
                    loc2.longitude
                );
            }
        }
    }
    
    // Estimate distance if not available
    if (distance === 0) {
        if (delivery.deliveryType === 'warehouse_to_warehouse') {
            distance = 10; // Estimate 10km for warehouse transfers
        } else if (delivery.deliveryType === 'warehouse_to_address') {
            distance = 15; // Estimate 15km for last-mile delivery
        } else if (delivery.deliveryType === 'address_to_warehouse') {
            distance = 12; // Estimate 12km for pickup
        }
    }
    
    // Add distance-based amount
    baseAmount += distance * 5; // Rs. 5 per km
    
    // Priority multipliers
    if (delivery.priority === 'urgent') {
        baseAmount *= 1.5;
    } else if (delivery.priority === 'high') {
        baseAmount *= 1.2;
    }
    
    return Math.round(baseAmount * 100) / 100;
}

/**
 * Create earnings record when delivery is completed
 */
async function createEarningsForDelivery(delivery) {
    try {
        console.log('🎯 Starting earnings creation for delivery:', delivery.deliveryNumber);
        
        // Ensure delivery is fully populated
        if (!delivery.assignedDriver) {
            console.error('❌ No driver assigned to delivery');
            return null;
        }

        // Get driver ID (handle both ObjectId and populated object)
        const driverId = delivery.assignedDriver._id || delivery.assignedDriver;
        
        // Check if earnings already exist
        const existingEarnings = await Earnings.findOne({ delivery: delivery._id });
        if (existingEarnings) {
            console.log('✅ Earnings already exist for delivery:', delivery.deliveryNumber);
            return existingEarnings;
        }
        
        // Get items based on delivery type
        let items = [];
        if (delivery.deliveryItemType === "consolidation") {
            if (delivery.consolidation?.parcels) {
                items = delivery.consolidation.parcels;
            } else if (delivery.consolidation) {
                // If consolidation is not populated, fetch it
                const consolidation = await Consolidation.findById(delivery.consolidation).populate('parcels');
                if (consolidation) {
                    items = consolidation.parcels;
                }
            }
        } else {
            items = delivery.parcels || [];
        }
        
        if (items.length === 0) {
            console.log('⚠️ No items found for earnings calculation');
            return null;
        }
        
        // Get commission settings for this delivery type
        let commissionSettings = await CommissionSettings.findOne({ 
            deliveryType: delivery.deliveryType,
            isActive: true 
        });
        
        // Fallback to default if not found
        if (!commissionSettings) {
            console.log('⚠️ No specific commission settings found, using default');
            commissionSettings = await CommissionSettings.findOne({ 
                deliveryType: 'default',
                isActive: true 
            });
        }
        
        // Use default commission rate if still not found
        const commissionRate = commissionSettings?.commissionRate || 10;
        console.log('📊 Commission rate:', commissionRate + '%');
        
        // Calculate base amount
        const baseAmount = calculateDeliveryBaseAmount(delivery, items, commissionSettings);
        console.log('💰 Calculated base amount:', baseAmount);
        
        // Calculate bonus for urgent deliveries
        let bonusAmount = 0;
        if (delivery.priority === 'urgent' && commissionSettings?.urgentDeliveryBonus) {
            bonusAmount = commissionSettings.urgentDeliveryBonus;
        }
        
        // Create earnings record
        const earningsData = {
            driver: driverId,
            delivery: delivery._id,
            baseAmount: baseAmount,
            commissionRate: commissionRate,
            bonusAmount: bonusAmount,
            deductions: 0,
            status: 'approved', // Auto-approve
            deliveryCompletedAt: delivery.actualDeliveryTime || new Date()
        };
        
        const earnings = new Earnings(earningsData);
        await earnings.save();
        
        console.log(`✅ Earnings created successfully!`);
        console.log(`   Delivery: ${delivery.deliveryNumber}`);
        console.log(`   Base: Rs. ${baseAmount}`);
        console.log(`   Commission: ${commissionRate}%`);
        console.log(`   Bonus: Rs. ${bonusAmount}`);
        console.log(`   Total: Rs. ${earnings.totalEarnings}`);
        
        // Send notification to driver about earnings
        try {
            await sendNotification({
                userId: driverId,
                type: 'earnings_created',
                title: 'Earnings Added',
                message: `You earned Rs. ${earnings.totalEarnings.toFixed(2)} from delivery ${delivery.deliveryNumber}`,
                entityType: 'Earnings',
                entityId: earnings._id,
                channels: ['in_app', 'push']
            });
            console.log('✅ Notification sent to driver');
        } catch (notifError) {
            console.error('⚠️ Failed to send notification (non-critical):', notifError.message);
        }
        
        return earnings;
    } catch (error) {
        console.error('❌ Error creating earnings for delivery:', error);
        console.error('Stack trace:', error.stack);
        // Don't throw - log and continue
        return null;
    }
}

/**
 * Create a new delivery
 */
async function createDelivery(deliveryData) {
    try {
        // Validate deliveryItemType
        if (!deliveryData.deliveryItemType) {
            throw new Error('deliveryItemType is required (must be "parcel" or "consolidation")');
        }

        if (!['parcel', 'consolidation'].includes(deliveryData.deliveryItemType)) {
            throw new Error('deliveryItemType must be either "parcel" or "consolidation"');
        }

        // Validate based on delivery item type
        if (deliveryData.deliveryItemType === 'parcel') {
            if (!deliveryData.parcels || deliveryData.parcels.length === 0) {
                throw new Error('At least one parcel is required for parcel delivery');
            }
            
            // Validate parcels exist
            const parcels = await Parcel.find({ _id: { $in: deliveryData.parcels } });
            if (parcels.length !== deliveryData.parcels.length) {
                throw new Error('One or more parcels not found');
            }
        } else if (deliveryData.deliveryItemType === 'consolidation') {
            if (!deliveryData.consolidation) {
                throw new Error('Consolidation ID is required for consolidation delivery');
            }
            
            // Validate consolidation exists
            const consolidation = await Consolidation.findById(deliveryData.consolidation)
                .populate('parcels');
            if (!consolidation) {
                throw new Error('Consolidation not found');
            }
            
            // Store reference to consolidation's parcels for notifications
            deliveryData._consolidationParcels = consolidation.parcels;
        }

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

        // Generate delivery number if not provided
        if (!deliveryData.deliveryNumber) {
            deliveryData.deliveryNumber = generateDeliveryNumber();
        }

        const delivery = new Delivery(deliveryData);

        // Initialize status history
        const itemDescription = deliveryData.deliveryItemType === 'parcel' 
            ? `${deliveryData.parcels.length} parcel(s)` 
            : 'consolidation';
        
        delivery.statusHistory.push({
            status: delivery.status,
            timestamp: new Date(),
            note: `Delivery created: ${deliveryData.deliveryType.replace(/_/g, ' ')} - ${itemDescription}`
        });

        await delivery.save();

        // Update items based on delivery type
        if (deliveryData.deliveryItemType === 'parcel') {
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
        } else if (deliveryData.deliveryItemType === 'consolidation') {
            // Update consolidation status
            await Consolidation.findByIdAndUpdate(
                deliveryData.consolidation,
                {
                    $set: { status: 'in_transit' },
                    $push: {
                        statusHistory: {
                            status: 'in_transit',
                            timestamp: new Date(),
                            note: `Assigned to delivery ${delivery.deliveryNumber}`
                        }
                    }
                }
            );

            // Update all parcels in the consolidation
            if (deliveryData._consolidationParcels) {
                const parcelIds = deliveryData._consolidationParcels.map(p => p._id);
                const updateData = {
                    $set: { 
                        status: 'in_transit',
                        assignedDriver: deliveryData.assignedDriver
                    },
                    $push: {
                        statusHistory: {
                            status: 'in_transit',
                            service: 'delivery-service',
                            timestamp: new Date(),
                            note: `Consolidation assigned to delivery ${delivery.deliveryNumber}`
                        }
                    }
                };

                if (toWarehouse) {
                    updateData.$set.warehouseId = toWarehouse._id;
                }

                await Parcel.updateMany(
                    { _id: { $in: parcelIds } },
                    updateData
                );
            }
        }

        // Send notification to driver
        const deliveryTypeReadable = deliveryData.deliveryType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const itemCount = deliveryData.deliveryItemType === 'parcel' 
            ? `${deliveryData.parcels.length} parcel(s)` 
            : '1 consolidation';
        
        await sendNotification({
            userId: deliveryData.assignedDriver,
            type: 'delivery_assignment',
            title: 'New Delivery Assigned',
            message: `You have been assigned ${deliveryTypeReadable} delivery ${delivery.deliveryNumber} with ${itemCount}`,
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
            .populate({
                path: 'consolidation',
                populate: { path: 'parcels' }
            })
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
            .populate({
                path: 'consolidation',
                populate: { path: 'parcels' }
            })
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
            .populate({
                path: 'consolidation',
                populate: { path: 'parcels' }
            })
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
            .populate({
                path: 'consolidation',
                populate: { path: 'parcels' }
            })
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
            .populate({
                path: 'consolidation',
                populate: { path: 'parcels' }
            })
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
            .populate({
                path: 'consolidation',
                populate: { path: 'parcels' }
            })
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
 * Get deliveries by item type (parcel or consolidation)
 */
async function getDeliveriesByItemType(itemType) {
    try {
        const deliveries = await Delivery.find({ deliveryItemType: itemType })
            .populate('parcels')
            .populate({
                path: 'consolidation',
                populate: { path: 'parcels' }
            })
            .populate('assignedDriver', 'userName entityId role')
            .populate('assignedBy', 'userName entityId role')
            .populate('fromLocation.warehouseId', 'name code address')
            .populate('toLocation.warehouseId', 'name code address')
            .sort({ createdTimestamp: -1 });
        return deliveries;
    } catch (error) {
        console.error('Error fetching deliveries by item type:', error);
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
            .populate({
                path: 'consolidation',
                populate: { path: 'parcels' }
            })
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
 * Get deliveries by consolidation
 */
async function getDeliveriesByConsolidation(consolidationId) {
    try {
        const deliveries = await Delivery.find({ consolidation: consolidationId })
            .populate('parcels')
            .populate({
                path: 'consolidation',
                populate: { path: 'parcels' }
            })
            .populate('assignedDriver', 'userName entityId role')
            .populate('assignedBy', 'userName entityId role')
            .populate('fromLocation.warehouseId', 'name code address')
            .populate('toLocation.warehouseId', 'name code address')
            .sort({ createdTimestamp: -1 });
        return deliveries;
    } catch (error) {
        console.error('Error fetching deliveries by consolidation:', error);
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
            .populate({
                path: 'consolidation',
                populate: { path: 'parcels' }
            })
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
            .populate({
                path: 'consolidation',
                populate: { path: 'parcels' }
            })
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

        // Update items based on delivery status and type
        let parcelStatus = null;
        let consolidationStatus = null;

        switch (statusData.status) {
            case 'picked_up':
                parcelStatus = 'in_transit';
                consolidationStatus = 'in_transit';
                break;
            case 'in_transit':
                parcelStatus = 'in_transit';
                consolidationStatus = 'in_transit';
                break;
            case 'delivered':
                if (delivery.toLocation.type === 'warehouse') {
                    parcelStatus = 'at_warehouse';
                    consolidationStatus = 'delivered';
                } else {
                    parcelStatus = 'delivered';
                    consolidationStatus = 'delivered';
                }
                
                // ✅ CREATE EARNINGS WHEN DELIVERED
                console.log('🎯 Delivery completed, creating earnings...');
                try {
                    const earnings = await createEarningsForDelivery(delivery);
                    if (earnings) {
                        console.log('✅ Earnings created successfully');
                    } else {
                        console.warn('⚠️ Earnings not created (may already exist or error occurred)');
                    }
                } catch (earningsError) {
                    console.error('❌ Failed to create earnings (non-critical):', earningsError);
                    // Don't fail the status update if earnings creation fails
                }
                
                break;
        }

        // Update based on delivery item type
        if (delivery.deliveryItemType === 'parcel' && parcelStatus && delivery.parcels.length > 0) {
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
        } else if (delivery.deliveryItemType === 'consolidation' && delivery.consolidation) {
            // Update consolidation
            if (consolidationStatus) {
                await Consolidation.findByIdAndUpdate(
                    delivery.consolidation._id,
                    {
                        $set: { status: consolidationStatus },
                        $push: {
                            statusHistory: {
                                status: consolidationStatus,
                                timestamp: new Date(),
                                note: `Delivery ${delivery.deliveryNumber} status: ${statusData.status}`
                            }
                        }
                    }
                );
            }

            // Update all parcels in consolidation
            if (parcelStatus && delivery.consolidation.parcels && delivery.consolidation.parcels.length > 0) {
                await Parcel.updateMany(
                    { _id: { $in: delivery.consolidation.parcels.map(p => p._id) } },
                    {
                        $set: { status: parcelStatus },
                        $push: {
                            statusHistory: {
                                status: parcelStatus,
                                service: 'delivery-service',
                                timestamp: new Date(),
                                note: `Consolidation delivery ${delivery.deliveryNumber} status: ${statusData.status}`
                            }
                        }
                    }
                );
            }
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
    getDeliveriesByItemType,
    getDeliveriesByWarehouse,
    getDeliveriesByConsolidation,
    updateDelivery,
    updateDeliveryStatus,
    deleteDelivery,
    reassignDelivery,
    createEarningsForDelivery // Export for manual creation if needed
};