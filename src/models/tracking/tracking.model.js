const Tracking = require('./tracking.mongo');
const Parcel = require('../parcel/parcel.mongo');

async function createOrUpdateTracking(trackingData) {
    try {
        let tracking = await Tracking.findOne({ trackingNumber: trackingData.trackingNumber });
        
        if (tracking) {
            // Update existing tracking
            tracking.currentStatus = trackingData.currentStatus || tracking.currentStatus;
            tracking.currentLocation = trackingData.currentLocation || tracking.currentLocation;
            tracking.assignedDriver = trackingData.assignedDriver || tracking.assignedDriver;
            tracking.consolidationId = trackingData.consolidationId || tracking.consolidationId;
            tracking.updatedTimestamp = new Date();
            
            if (trackingData.event) {
                tracking.events.push(trackingData.event);
            }
            
            await tracking.save();
        } else {
            // Create new tracking
            tracking = new Tracking({
                trackingNumber: trackingData.trackingNumber,
                parcelId: trackingData.parcelId,
                consolidationId: trackingData.consolidationId,
                currentStatus: trackingData.currentStatus || 'created',
                currentLocation: trackingData.currentLocation,
                assignedDriver: trackingData.assignedDriver,
                sender: trackingData.sender,
                receiver: trackingData.receiver,
                events: trackingData.event ? [trackingData.event] : []
            });
            
            await tracking.save();
        }
        
        return tracking;
    } catch (error) {
        throw error;
    }
}

async function getTrackingByNumber(trackingNumber) {
    try {
        const tracking = await Tracking.findOne({ trackingNumber })
            .populate('parcelId')
            .populate('consolidationId')
            .populate('assignedDriver', 'userName entityId');
        
        if (!tracking) {
            // Try to get from parcel directly
            const parcel = await Parcel.findOne({ trackingNumber })
                .populate('warehouseId')
                .populate('consolidationId')
                .populate('assignedDriver', 'userName entityId');
            
            if (parcel) {
                // Create tracking from parcel data
                const trackingData = {
                    trackingNumber: parcel.trackingNumber,
                    parcelId: parcel._id,
                    consolidationId: parcel.consolidationId,
                    currentStatus: parcel.status,
                    assignedDriver: parcel.assignedDriver,
                    sender: parcel.sender,
                    receiver: parcel.receiver,
                    events: parcel.statusHistory.map(sh => ({
                        status: sh.status,
                        timestamp: sh.timestamp,
                        description: sh.note,
                        service: sh.service,
                        location: {
                            address: sh.location
                        }
                    }))
                };
                
                return await createOrUpdateTracking(trackingData);
            }
        }
        
        return tracking;
    } catch (error) {
        throw error;
    }
}

async function addTrackingEvent(trackingNumber, eventData) {
    try {
        const tracking = await Tracking.findOne({ trackingNumber });
        
        if (!tracking) {
            throw new Error('Tracking not found');
        }
        
        tracking.events.push({
            status: eventData.status,
            location: eventData.location,
            timestamp: new Date(),
            description: eventData.description,
            service: eventData.service || 'tracking-service'
        });
        
        tracking.currentStatus = eventData.status;
        if (eventData.location) {
            tracking.currentLocation = {
                ...eventData.location,
                timestamp: new Date()
            };
        }
        tracking.updatedTimestamp = new Date();
        
        await tracking.save();
        
        return tracking;
    } catch (error) {
        throw error;
    }
}

async function updateTrackingLocation(trackingNumber, locationData) {
    try {
        const tracking = await Tracking.findOne({ trackingNumber });
        
        if (!tracking) {
            throw new Error('Tracking not found');
        }
        
        tracking.currentLocation = {
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            address: locationData.address || '',
            timestamp: new Date()
        };
        tracking.updatedTimestamp = new Date();
        
        await tracking.save();
        
        return tracking;
    } catch (error) {
        throw error;
    }
}

async function getActiveTrackings() {
    try {
        return await Tracking.find({
            currentStatus: { $in: ['in_transit', 'out_for_delivery'] }
        })
            .populate('parcelId')
            .populate('consolidationId')
            .populate('assignedDriver', 'userName entityId')
            .sort({ updatedTimestamp: -1 });
    } catch (error) {
        throw error;
    }
}

async function getTrackingsByDriver(driverId) {
    try {
        return await Tracking.find({ assignedDriver: driverId })
            .populate('parcelId')
            .populate('consolidationId')
            .sort({ updatedTimestamp: -1 });
    } catch (error) {
        throw error;
    }
}

module.exports = {
    createOrUpdateTracking,
    getTrackingByNumber,
    addTrackingEvent,
    updateTrackingLocation,
    getActiveTrackings,
    getTrackingsByDriver
};