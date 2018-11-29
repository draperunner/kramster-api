import mongoose from 'mongoose'

const examSchema = new mongoose.Schema({
  school: String,
  course: String,
  name: String,
  mode: String,
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
})

export default mongoose.model('Exam', examSchema)
