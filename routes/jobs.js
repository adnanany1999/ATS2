const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Application = require('../models/Application');

router.get('/', async (req, res) => {
  try {
    const { status, department } = req.query;
    let query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (department && department !== 'all') {
      query.department = department;
    }
    
    const jobs = await Job.find(query).populate('applications');
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      title,
      department,
      description,
      requirements,
      location,
      salary,
      type,
      openings
    } = req.body;
    
    const job = new Job({
      title,
      department,
      description,
      requirements: requirements ? requirements.split(',').map(r => r.trim()) : [],
      location,
      salary,
      type,
      openings: openings || 1
    });
    
    await job.save();
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('applications');

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    await Application.deleteMany({ job: req.params.id });
    
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/apply', async (req, res) => {
  try {
    const { candidateId } = req.body;
    
    const existingApplication = await Application.findOne({
      candidate: candidateId,
      job: req.params.id
    });
    
    if (existingApplication) {
      return res.status(400).json({ error: 'Candidate already applied for this job' });
    }
    
    const application = new Application({
      candidate: candidateId,
      job: req.params.id
    });
    
    await application.save();
    
    await Job.findByIdAndUpdate(req.params.id, {
      $push: { applications: application._id }
    });
    
    res.status(201).json(application);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;