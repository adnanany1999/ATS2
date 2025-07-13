const express = require('express');
const router = express.Router();
const Candidate = require('../models/Candidate');
const Application = require('../models/Application');
const path = require('path');
const fs = require('fs');

router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
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
    
    const candidates = await Candidate.find(query).populate('applications');
    res.json(candidates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, skills, experience, notes } = req.body;
    
    if (!req.files || !req.files.resume) {
      return res.status(400).json({ error: 'Resume file is required' });
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
    res.status(201).json(candidate);
  } catch (error) {
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