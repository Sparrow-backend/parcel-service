const Parcel = require('./parcel.mongo');
const mongoose = require('mongoose');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// Get Pricing model
const Pricing = mongoose.model('Pricing');

async function createParcel(parcelData) {
    try {
        // Validate pricingId exists
        if (parcelData.pricingId) {
            const pricing = await Pricing.findById(parcelData.pricingId);
            if (!pricing) {
                throw new Error(`Invalid pricing ID: ${parcelData.pricingId}. Pricing not found.`);
            }
            if (!pricing.isActive) {
                throw new Error(`Pricing ID ${parcelData.pricingId} is not active.`);
            }
        }
        
        const parcel = new Parcel(parcelData);
        
        // Initialize status history with created status
        parcel.statusHistory.push({
            status: parcel.status,
            service: 'parcel-service',
            location: 'System',
            timestamp: new Date(),
            note: 'Parcel created'
        });
        
        await parcel.save();
        
        // Send notification to creator
        if (parcelData.createdBy) {
            await sendNotification({
                userId: parcelData.createdBy,
                type: 'parcel_update',
                title: 'Parcel Created',
                message: `Parcel ${parcel.trackingNumber} has been created successfully`,
                entityType: 'Parcel',
                entityId: parcel._id,
                channels: ['in_app']
            });
        }
        
        return parcel;
    } catch (error) {
        throw error;
    }
}

async function getAllParcels(filters = {}) {
    try {
        const parcels = await Parcel.find(filters)
            .populate('pricingId')
            .populate('warehouseId')
            .populate('consolidationId')
            .populate('createdBy')
            .populate('assignedDriver', 'userName entityId')
            .sort({ createdTimeStamp: -1 });
        return parcels;
    } catch (error) {
        throw error;
    }
}

async function getParcelById(parcelId) {
    try {
        const parcel = await Parcel.findById(parcelId)
            .populate('pricingId')
            .populate('warehouseId')
            .populate('consolidationId')
            .populate('createdBy')
            .populate('assignedDriver', 'userName entityId');
        return parcel;
    } catch (error) {
        throw error;
    }
}

async function getParcelByTrackingNumber(trackingNumber) {
    try {
        const parcel = await Parcel.findOne({ trackingNumber })
            .populate('pricingId')
            .populate('warehouseId')
            .populate('consolidationId')
            .populate('createdBy')
            .populate('assignedDriver', 'userName entityId');
        return parcel;
    } catch (error) {
        throw error;
    }
}

async function updateParcel(parcelId, updateData) {
    try {
        // Validate pricingId if it's being updated
        if (updateData.pricingId) {
            const pricing = await Pricing.findById(updateData.pricingId);
            if (!pricing) {
                throw new Error(`Invalid pricing ID: ${updateData.pricingId}. Pricing not found.`);
            }
            if (!pricing.isActive) {
                throw new Error(`Pricing ID ${updateData.pricingId} is not active.`);
            }
        }
        
        const parcel = await Parcel.findByIdAndUpdate(
            parcelId,
            updateData,
            { new: true, runValidators: true }
        )
            .populate('pricingId')
            .populate('warehouseId')
            .populate('consolidationId')
            .populate('createdBy')
            .populate('assignedDriver', 'userName entityId');
        
        return parcel;
    } catch (error) {
        throw error;
    }
}

async function updateParcelStatus(parcelId, statusData) {
    try {
        const parcel = await Parcel.findById(parcelId)
            .populate('createdBy')
            .populate('pricingId');
        
        if (!parcel) {
            throw new Error('Parcel not found');
        }
        
        const oldStatus = parcel.status;
        
        // Update status
        parcel.status = statusData.status;
        
        // Add to status history
        parcel.statusHistory.push({
            status: statusData.status,
            service: statusData.service || 'parcel-service',
            location: statusData.location || '',
            timestamp: new Date(),
            note: statusData.note || ''
        });
        
        await parcel.save();
        
        // Send notification for status change
        if (parcel.createdBy && oldStatus !== statusData.status) {
            await sendNotification({
                userId: parcel.createdBy._id,
                type: 'parcel_update',
                title: 'Parcel Status Updated',
                message: `Parcel ${parcel.trackingNumber} status changed to ${statusData.status}`,
                entityType: 'Parcel',
                entityId: parcel._id,
                channels: ['in_app', 'email']
            });
        }
        
        return parcel;
    } catch (error) {
        throw error;
    }
}

async function assignDriverToParcel(parcelId, driverId) {
    try {
        const parcel = await Parcel.findById(parcelId)
            .populate('createdBy')
            .populate('pricingId');
        
        if (!parcel) {
            throw new Error('Parcel not found');
        }
        
        parcel.assignedDriver = driverId;
        parcel.status = 'assigned_to_driver';
        parcel.statusHistory.push({
            status: 'assigned_to_driver',
            service: 'parcel-service',
            location: '',
            timestamp: new Date(),
            note: 'Driver assigned to parcel'
        });
        
        await parcel.save();
        
        // Notify driver
        await sendNotification({
            userId: driverId,
            type: 'parcel_update',
            title: 'New Parcel Assigned',
            message: `You have been assigned parcel ${parcel.trackingNumber}`,
            entityType: 'Parcel',
            entityId: parcel._id,
            channels: ['in_app', 'push']
        });
        
        // Notify parcel creator
        if (parcel.createdBy) {
            await sendNotification({
                userId: parcel.createdBy._id,
                type: 'parcel_update',
                title: 'Driver Assigned',
                message: `A driver has been assigned to parcel ${parcel.trackingNumber}`,
                entityType: 'Parcel',
                entityId: parcel._id,
                channels: ['in_app']
            });
        }
        
        return parcel;
    } catch (error) {
        throw error;
    }
}

async function deleteParcel(parcelId) {
    try {
        const parcel = await Parcel.findByIdAndDelete(parcelId);
        return parcel;
    } catch (error) {
        throw error;
    }
}

async function getParcelsByStatus(status) {
    try {
        const parcels = await Parcel.find({ status })
            .populate('pricingId')
            .populate('warehouseId')
            .populate('consolidationId')
            .populate('assignedDriver', 'userName entityId')
            .sort({ createdTimeStamp: -1 });
        return parcels;
    } catch (error) {
        throw error;
    }
}

async function getParcelsByWarehouse(warehouseId) {
    try {
        const parcels = await Parcel.find({ warehouseId })
            .populate('pricingId')
            .populate('consolidationId')
            .populate('createdBy')
            .populate('assignedDriver', 'userName entityId')
            .sort({ createdTimeStamp: -1 });
        return parcels;
    } catch (error) {
        throw error;
    }
}

async function getParcelsByDriver(driverId) {
    try {
        const parcels = await Parcel.find({ assignedDriver: driverId })
            .populate('pricingId')
            .populate('warehouseId')
            .populate('consolidationId')
            .populate('createdBy')
            .sort({ createdTimeStamp: -1 });
        return parcels;
    } catch (error) {
        throw error;
    }
}

async function getParcelsByPricing(pricingId) {
    try {
        const parcels = await Parcel.find({ pricingId })
            .populate('pricingId')
            .populate('warehouseId')
            .populate('consolidationId')
            .populate('createdBy')
            .populate('assignedDriver', 'userName entityId')
            .sort({ createdTimeStamp: -1 });
        return parcels;
    } catch (error) {
        throw error;
    }
}

// Helper function to send notifications
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
    createParcel,
    getAllParcels,
    getParcelById,
    getParcelByTrackingNumber,
    updateParcel,
    updateParcelStatus,
    assignDriverToParcel,
    deleteParcel,
    getParcelsByStatus,
    getParcelsByWarehouse,
    getParcelsByDriver,
    getParcelsByPricing
};