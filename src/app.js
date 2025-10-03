const express = require('express');
const cors = require('cors');

const parcelRouter = require('./routes/parcel/parcel.router');
const trackerRouter = require('./routes/tracker/tracker.router');

const app = express();

app.use(cors({
    origin: [
        'https://sparrow.nivakaran.dev',
        'http://localhost:3000',
        'http://nivakaran.dev'
    ]
}));

app.use(express.json());

app.get('/', (req, res) => {
    res.json({message: "Sparrow: Parcel Service"});
});

app.get('/health', (req, res) => {
    res.json({message: "Parcel Service is running.."});
});

// Mount routers
app.use('/api/parcels', parcelRouter);
app.use('/api/tracker', trackerRouter);

module.exports = app;