const {
    createParcel,
    getAllParcels,
    getParcelById,
    getParcelByTrackingNumber,
    updateParcel,
    updateParcelStatus,
    deleteParcel,
    getParcelsByStatus,
    getParcelsByWarehouse
} = require('../../models/parcel/parcel.model');

async function httpCreateParcel(req, res) {
    try {
        const parcelData = req.body;
        const parcel = await createParcel(parcelData);
        
        return res.status(201).json({
            success: true,
            message: 'Parcel created successfully',
            data: parcel
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: 'Failed to create parcel',
            error: error.message
        });
    }
}

async function httpGetAllParcels(req, res) {
    try {
        const filters = {};
        
        // Optional filtering by query params
        if (req.query.status) filters.status = req.query.status;
        if (req.query.warehouseId) filters.warehouseId = req.query.warehouseId;
        if (req.query.createdBy) filters.createdBy = req.query.createdBy;
        
        const parcels = await getAllParcels(filters);
        
        return res.status(200).json({
            success: true,
            count: parcels.length,
            data: parcels
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch parcels',
            error: error.message
        });
    }
}

async function httpGetParcelById(req, res) {
    try {
        const { id } = req.params;
        const parcel = await getParcelById(id);
        
        if (!parcel) {
            return res.status(404).json({
                success: false,
                message: 'Parcel not found'
            });
        }
        
        return res.status(200).json({
            success: true,
            data: parcel
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch parcel',
            error: error.message
        });
    }
}

async function httpGetParcelByTrackingNumber(req, res) {
    try {
        const { trackingNumber } = req.params;
        const parcel = await getParcelByTrackingNumber(trackingNumber);
        
        if (!parcel) {
            return res.status(404).json({
                success: false,
                message: 'Parcel not found with this tracking number'
            });
        }
        
        return res.status(200).json({
            success: true,
            data: parcel
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch parcel',
            error: error.message
        });
    }
}

async function httpUpdateParcel(req, res) {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        const parcel = await updateParcel(id, updateData);
        
        if (!parcel) {
            return res.status(404).json({
                success: false,
                message: 'Parcel not found'
            });
        }
        
        return res.status(200).json({
            success: true,
            message: 'Parcel updated successfully',
            data: parcel
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: 'Failed to update parcel',
            error: error.message
        });
    }
}

async function httpUpdateParcelStatus(req, res) {
    try {
        const { id } = req.params;
        const statusData = req.body;
        
        if (!statusData.status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }
        
        const parcel = await updateParcelStatus(id, statusData);
        
        return res.status(200).json({
            success: true,
            message: 'Parcel status updated successfully',
            data: parcel
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: 'Failed to update parcel status',
            error: error.message
        });
    }
}

async function httpDeleteParcel(req, res) {
    try {
        const { id } = req.params;
        const parcel = await deleteParcel(id);
        
        if (!parcel) {
            return res.status(404).json({
                success: false,
                message: 'Parcel not found'
            });
        }
        
        return res.status(200).json({
            success: true,
            message: 'Parcel deleted successfully',
            data: parcel
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to delete parcel',
            error: error.message
        });
    }
}

async function httpGetParcelsByStatus(req, res) {
    try {
        const { status } = req.params;
        const parcels = await getParcelsByStatus(status);
        
        return res.status(200).json({
            success: true,
            count: parcels.length,
            data: parcels
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch parcels by status',
            error: error.message
        });
    }
}

async function httpGetParcelsByWarehouse(req, res) {
    try {
        const { warehouseId } = req.params;
        const parcels = await getParcelsByWarehouse(warehouseId);
        
        return res.status(200).json({
            success: true,
            count: parcels.length,
            data: parcels
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch parcels by warehouse',
            error: error.message
        });
    }
}

module.exports = {
    httpCreateParcel,
    httpGetAllParcels,
    httpGetParcelById,
    httpGetParcelByTrackingNumber,
    httpUpdateParcel,
    httpUpdateParcelStatus,
    httpDeleteParcel,
    httpGetParcelsByStatus,
    httpGetParcelsByWarehouse
};