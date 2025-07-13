const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'],
    default: 'Applied'
  },
  resumeUrl: {
    type: String,
    required: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  experience: {
    type: Number,
    default: 0
  },
  applications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application'
  }],
  notes: {
    type: String,
    default: ''
  },
  appliedDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Candidate', candidateSchema);