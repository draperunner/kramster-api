import mongoose from 'mongoose'

export interface IReport {
  exam: {
    school: string,
    course: string,
    name: string,
  },
  createdAt: string,
  history: Array<{
    questionId: string,
    givenAnswer: string,
    wasCorrect: boolean,
  }>,
  score: number,
  numQuestions: number,
  percentage: number,
  grade: string,
}

// Schema
const reportSchema = new mongoose.Schema({
  exam: {
    school: String,
    course: String,
    name: String,
  },
  createdAt: String,
  history: [{
    _id: false, // Prevent mongoose from automatically creating ids for subdocuments
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    givenAnswer: String,
    wasCorrect: Boolean,
  }],
  score: Number,
  numQuestions: Number,
  percentage: Number,
  grade: String,
})

export default mongoose.model('Report', reportSchema)
