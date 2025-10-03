const {
    createTrackerEvent,
    getAllTrackerEvents,
    getTrackerEventById,
    getTrackerEventsByParcel,
    getTrackerEventsByStatus,
    updateTrackerEvent,
    deleteTrackerEvent,
    getLatestTrackerEventByParcel
} = require('../../models/tracker/tracker.model');

async function httpCreateTrackerEvent(req, res) {
    try {
        const trackerData = req.body;
        
        if (!trackerData.parcelId || !trackerData.status) {
            return res.status(400).json({
                success: false,
                message: 'parcelId and status are required'
            });
        }
        
        const event = await createTrackerEvent(trackerData);
        
        return res.status(201).json({
            success: true,
            message: 'Tracker event created successfully',
            data: event
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: 'Failed to create tracker event',
            error: error.message
        });
    }
}

async function httpGetAllTrackerEvents(req, res) {
    try {
        const filters = {};
        
        // Optional filtering by query params
        if (req.query.parcelId) filters.parcelId = req.query.parcelId;
        if (req.query.status) filters.status = req.query.status;
        if (req.query.location) filters.location = req.query.location;
        
        const events = await getAllTrackerEvents(filters);
        
        return res.status(200).json({
            success: true,
            count: events.length,
            data: events
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch tracker events',
            error: error.message
        });
    }
}

async function httpGetTrackerEventById(req, res) {
    try {
        const { id } = req.params;
        const event = await getTrackerEventById(id);
        
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Tracker event not found'
            });
        }
        
        return res.status(200).json({
            success: true,
            data: event
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch tracker event',
            error: error.message
        });
    }
}

async function httpGetTrackerEventsByParcel(req, res) {
    try {
        const { parcelId } = req.params;
        const events = await getTrackerEventsByParcel(parcelId);
        
        return res.status(200).json({
            success: true,
            count: events.length,
            data: events
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch tracker events for parcel',
            error: error.message
        });
    }
}

async function httpGetTrackerEventsByStatus(req, res) {
    try {
        const { status } = req.params;
        const events = await getTrackerEventsByStatus(status);
        
        return res.status(200).json({
            success: true,
            count: events.length,
            data: events
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch tracker events by status',
            error: error.message
        });
    }
}

async function httpGetLatestTrackerEventByParcel(req, res) {
    try {
        const { parcelId } = req.params;
        const event = await getLatestTrackerEventByParcel(parcelId);
        
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'No tracker events found for this parcel'
            });
        }
        
        return res.status(200).json({
            success: true,
            data: event
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch latest tracker event',
            error: error.message
        });
    }
}

async function httpUpdateTrackerEvent(req, res) {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        const event = await updateTrackerEvent(id, updateData);
        
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Tracker event not found'
            });
        }
        
        return res.status(200).json({
            success: true,
            message: 'Tracker event updated successfully',
            data: event
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: 'Failed to update tracker event',
            error: error.message
        });
    }
}

async function httpDeleteTrackerEvent(req, res) {
    try {
        const { id } = req.params;
        const event = await deleteTrackerEvent(id);
        
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Tracker event not found'
            });
        }
        
        return res.status(200).json({
            success: true,
            message: 'Tracker event deleted successfully',
            data: event
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to delete tracker event',
            error: error.message
        });
    }
}

module.exports = {
    httpCreateTrackerEvent,
    httpGetAllTrackerEvents,
    httpGetTrackerEventById,
    httpGetTrackerEventsByParcel,
    httpGetTrackerEventsByStatus,
    httpGetLatestTrackerEventByParcel,
    httpUpdateTrackerEvent,
    httpDeleteTrackerEvent
};