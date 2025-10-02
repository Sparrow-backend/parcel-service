const http = require('http')
const app = require('./src/app')
const mongoose = require('mongoose')
const dotenv = require('dotenv')

dotenv.config()

const PORT = process.env.PORT || 8002

mongoose.connection.once('open', () => {
    console.log("MongoDB is ready!")
})

mongoose.connection.on('error', () => {
    console.error('Error in connecting with MongoDB')
})

const server = http.createServer(app)

async function createServer() {
    try {
        
        server.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}..`)
        })

        
    } catch(err) {
        console.error('Internal server error: ', err)
        process.exit(1)
    }
}

createServer()


