import mongoose from 'mongoose'

export type IStats = {
  key: {
    school: string,
    course: string,
    name: string,
    numQuestions: number,
  },
  lastUpdated: Date,
  totalScore: number,
  numReports: number,
  grades: {
    A: number,
    B: number,
    C: number,
    D: number,
    E: number,
    F: number,
  },
}

// Schema
const statsSchema = new mongoose.Schema({
  key: {
    school: String,
    course: String,
    name: String,
    numQuestions: Number,
  },
  lastUpdated: Date,
  totalScore: Number,
  numReports: Number,
  grades: {
    A: { type: Number },
    B: { type: Number },
    C: { type: Number },
    D: { type: Number },
    E: { type: Number },
    F: { type: Number },
  },
})

export default mongoose.model('Statistics', statsSchema)
