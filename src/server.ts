import express from 'express'
import mongoose from 'mongoose'
import bodyParser from 'body-parser'
import cors from 'cors'
import dotenv from 'dotenv'

import exams from './api/exams'
import reports from './api/reports'
import stats from './api/stats'
import list from './api/list'

dotenv.config()

const app = express()

// MongoDB
mongoose.connect(process.env.DB_URL, { useNewUrlParser: true })

app.use(cors({
  origin: function (origin, callback) {
    if (origin && [
      'https://kramster.it',
      'https://kramsterapp.firebaseapp.com',
      'https://staging.kramster.it',
      'https://kramster-staging.firebaseapp.com',
    ].includes(origin)) {
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
app.use('/exams', exams)
app.use('/reports', reports)
app.use('/stats', stats)
app.use('/list', list)

// Start server
const port = process.env.PORT || 8000
app.listen(port)

//@ts-ignore
console.log(`Server is running on port ${port}`)
