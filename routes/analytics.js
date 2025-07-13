const express = require('express');
const router = express.Router();
const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const Application = require('../models/Application');

router.get('/dashboard', async (req, res) => {
  try {
    const totalCandidates = await Candidate.countDocuments();
    const totalJobs = await Job.countDocuments();
    const activeJobs = await Job.countDocuments({ status: 'Active' });
    const totalApplications = await Application.countDocuments();
    
    const candidatesByStatus = await Candidate.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const jobsByDepartment = await Job.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const applicationsByMonth = await Application.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$appliedDate' },
            month: { $month: '$appliedDate' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);
    
    const recentApplications = await Application.find()
      .populate('candidate', 'name email')
      .populate('job', 'title department')
      .sort({ appliedDate: -1 })
      .limit(10);
    
    res.json({
      metrics: {
        totalCandidates,
        totalJobs,
        activeJobs,
        totalApplications
      },
      charts: {
        candidatesByStatus,
        jobsByDepartment,
        applicationsByMonth
      },
      recentApplications
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/candidates-by-status', async (req, res) => {
  try {
    const data = await Candidate.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/jobs-by-department', async (req, res) => {
  try {
    const data = await Job.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      }
    ]);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/hiring-funnel', async (req, res) => {
  try {
    const statuses = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'];
    const funnel = [];
    
    for (const status of statuses) {
      const count = await Candidate.countDocuments({ status });
      funnel.push({ status, count });
    }
    
    res.json(funnel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;