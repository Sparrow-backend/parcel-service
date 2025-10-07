const {
    createOrUpdateTracking,
    getTrackingByNumber,
    addTrackingEvent,
    updateTrackingLocation,
    getActiveTrackings,
    getTrackingsByDriver
} = require('../../models/tracking/tracking.model');

const Tracking = require('../../models/tracking/tracking.mongo');

async function httpGetTrackingByNumber(req, res) {
    try {
        const { trackingNumber } = req.params;
        
        const tracking = await getTrackingByNumber(trackingNumber);
        
        if (!tracking) {
            return res.status(404).json({
                success: false,
                message: 'Tracking information not found'
            });
        }
        
        return res.status(200).json({
            success: true,
            data: tracking
        });
    } catch (error) {
        console.error('Error fetching tracking:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch tracking information',
            error: error.message
        });
    }
}

async function httpAddTrackingEvent(req, res) {
    try {
        const { trackingNumber } = req.params;
        const eventData = req.body;
        
        if (!eventData.status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }
        
        const tracking = await addTrackingEvent(trackingNumber, eventData);
        
        return res.status(200).json({
            success: true,
            message: 'Tracking event added successfully',
            data: tracking
        });
    } catch (error) {
        console.error('Error adding tracking event:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to add tracking event',
            error: error.message
        });
    }
}

async function httpUpdateTrackingLocation(req, res) {
    try {
        const { trackingNumber } = req.params;
        const { latitude, longitude, address } = req.body;
        
        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required'
            });
        }
        
        const tracking = await updateTrackingLocation(trackingNumber, {
            latitude,
            longitude,
            address
        });
        
        return res.status(200).json({
            success: true,
            message: 'Location updated successfully',
            data: tracking
        });
    } catch (error) {
        console.error('Error updating tracking location:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update location',
            error: error.message
        });
    }
}

async function httpGetActiveTrackings(req, res) {
    try {
        const trackings = await getActiveTrackings();
        
        return res.status(200).json({
            success: true,
            count: trackings.length,
            data: trackings
        });
    } catch (error) {
        console.error('Error fetching active trackings:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch active trackings',
            error: error.message
        });
    }
}

async function httpGetTrackingsByDriver(req, res) {
    try {
        const { driverId } = req.params;
        
        const trackings = await getTrackingsByDriver(driverId);
        
        return res.status(200).json({
            success: true,
            count: trackings.length,
            data: trackings
        });
    } catch (error) {
        console.error('Error fetching driver trackings:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch driver trackings',
            error: error.message
        });
    }
}

async function httpGetActiveTrackingsWithLocation(req, res) {
    try {
        const trackings = await Tracking.find({
            currentStatus: { $in: ['in_transit', 'out_for_delivery'] }
        })
            .populate('parcelId')
            .populate('consolidationId')
            .populate('assignedDriver', 'userName entityId')
            .sort({ updatedTimestamp: -1 });
        
        // Format with current location data
        const formattedTrackings = trackings.map(tracking => ({
            _id: tracking._id,
            trackingNumber: tracking.trackingNumber,
            parcelId: tracking.parcelId,
            consolidationId: tracking.consolidationId,
            status: tracking.currentStatus,
            currentLocation: tracking.currentLocation,
            lastUpdate: tracking.currentLocation?.timestamp,
            estimatedDelivery: tracking.estimatedDelivery,
            driver: tracking.assignedDriver,
            sender: tracking.sender,
            receiver: tracking.receiver,
            events: tracking.events,
            createdTimestamp: tracking.createdTimestamp,
            updatedTimestamp: tracking.updatedTimestamp
        }));
        
        return res.status(200).json({
            success: true,
            count: formattedTrackings.length,
            data: formattedTrackings
        });
    } catch (error) {
        console.error('Error fetching active trackings with location:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch active trackings',
            error: error.message
        });
    }
}

module.exports = {
    httpGetTrackingByNumber,
    httpAddTrackingEvent,
    httpUpdateTrackingLocation,
    httpGetActiveTrackings,
    httpGetTrackingsByDriver,
    httpGetActiveTrackingsWithLocation
};