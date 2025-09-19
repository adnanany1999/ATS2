const express = require('express');
const router = express.Router();
const Candidate = require('../models/Candidate');
const Application = require('../models/Application');
const path = require('path');
const fs = require('fs');

router.get('/', async (req, res) => {
  try {
    const { status, search, jobId } = req.query;

    let candidates;

    if (jobId && jobId !== '') {
      // Filter candidates by job - find applications for this job and populate candidates
      const applications = await Application.find({ job: jobId })
        .populate({
          path: 'candidate',
          match: {
            ...(status && status !== 'all' ? { status } : {}),
            ...(search ? {
              $or: [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { skills: { $in: [new RegExp(search, 'i')] } }
              ]
            } : {})
          }
        })
        .populate('job');

      // Extract candidates from applications and filter out null candidates
      candidates = applications
        .filter(app => app.candidate)
        .map(app => ({
          ...app.candidate.toObject(),
          applicationStatus: app.status,
          appliedJob: app.job,
          applicationId: app._id
        }));
    } else {
      // Get all candidates (existing behavior)
      let query = {};

      if (status && status !== 'all') {
        query.status = status;
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { skills: { $in: [new RegExp(search, 'i')] } }
        ];
      }

      candidates = await Candidate.find(query).populate('applications');
    }

    res.json(candidates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, skills, experience, notes, jobId } = req.body;

    if (!req.files || !req.files.resume) {
      return res.status(400).json({ error: 'Resume file is required' });
    }

    if (!jobId) {
      return res.status(400).json({ error: 'Job selection is required' });
    }

    const resumeFile = req.files.resume;
    const fileName = `${Date.now()}_${resumeFile.name}`;
    const uploadPath = path.join(__dirname, '..', 'public', 'uploads', fileName);

    if (!fs.existsSync(path.dirname(uploadPath))) {
      fs.mkdirSync(path.dirname(uploadPath), { recursive: true });
    }

    await resumeFile.mv(uploadPath);

    const candidate = new Candidate({
      name,
      email,
      phone,
      skills: skills ? skills.split(',').map(s => s.trim()) : [],
      experience: experience || 0,
      notes: notes || '',
      resumeUrl: `/uploads/${fileName}`
    });

    await candidate.save();

    // Create application for the selected job
    const application = new Application({
      candidate: candidate._id,
      job: jobId,
      status: 'Applied',
      notes: notes || ''
    });

    await application.save();

    // Add application to candidate
    candidate.applications.push(application._id);
    await candidate.save();

    res.status(201).json({ candidate, application });
  } catch (error) {
    // Handle duplicate email error
    if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
      return res.status(400).json({
        error: 'A candidate with this email address already exists. Please use a different email.'
      });
    }

    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { status, notes } = req.body;
    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { status, notes },
      { new: true }
    );
    
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    res.json(candidate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    if (candidate.resumeUrl) {
      const filePath = path.join(__dirname, '..', 'public', candidate.resumeUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    await Application.deleteMany({ candidate: req.params.id });
    
    res.json({ message: 'Candidate deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;