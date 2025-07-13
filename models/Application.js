const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  status: {
    type: String,
    enum: ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'],
    default: 'Applied'
  },
  appliedDate: {
    type: Date,
    default: Date.now
  },
  interviewDate: {
    type: Date
  },
  notes: {
    type: String,
    default: ''
  },
  stage: {
    type: String,
    enum: ['Application Review', 'Phone Screen', 'Technical Interview', 'Final Interview', 'Reference Check'],
    default: 'Application Review'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Application', applicationSchema);