const http = require('http')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const app = require('./src/app')

const server = http.createServer(app)

dotenv.config()

const PORT = process.env.PORT || 8002
const MONGODB_URI = process.env.MONGODB_URI 

mongoose.connection.once('open', () => {
    console.log("MongoDB is ready!")
})

mongoose.connection.on('error', () => {
    console.error("Error in connecting with MongoDB!")
})


async function createServer() {
    try {
        mongoose.connect(MONGODB_URI)
        console.log("Connected to MongoDB")

        server.listen(PORT, () => {
            console.log(`Parcel Service: Listening on port ${PORT}`)
        })

    } catch(err) {
        console.error("Parcel Service: Internal Server error: ", err)
        process.exit(1)
    }
}

createServer()