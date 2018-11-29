const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const path = require('path')
const cors = require('cors')
require('dotenv').config()

const app = express()

// MongoDB
mongoose.connect(process.env.DB_URL, { useNewUrlParser: true })

app.use(cors({
  origin: function (origin, callback) {
    if (['https://kramster.it', 'https://kramsterapp.firebaseapp.com'].includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}))

app.disable('x-powered-by')
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// Routes
app.use('/exams', require('./api/exams'))
app.use('/reports', require('./api/reports'))
app.use('/stats', require('./api/stats'))
app.use('/list', require('./api/list'))

// Start server
const port = process.env.PORT || 8000
app.listen(port, '127.0.0.1')
/* eslint-disable no-console */
console.log(`Server is running on port ${port}`)
