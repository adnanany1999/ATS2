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

// Function to calculate matching percentage between candidate skills and job requirements
function calculateMatchPercentage(candidateSkills, jobRequirements) {
  if (!candidateSkills || candidateSkills.length === 0) return 0;
  if (!jobRequirements || jobRequirements.length === 0) return 0;

  const normalizedCandidateSkills = candidateSkills.map(skill => skill.toLowerCase().trim());
  const normalizedJobRequirements = jobRequirements.map(req => req.toLowerCase().trim());

  let matches = 0;

  for (const requirement of normalizedJobRequirements) {
    // Check for exact matches or partial matches
    const hasMatch = normalizedCandidateSkills.some(skill =>
      skill.includes(requirement) || requirement.includes(skill)
    );
    if (hasMatch) matches++;
  }

  return Math.round((matches / normalizedJobRequirements.length) * 100);
}

router.get('/candidate-job-matching/:jobId?', async (req, res) => {
  try {
    const { jobId } = req.params;
    let jobs;

    if (jobId) {
      jobs = await Job.findById(jobId);
      if (!jobs) {
        return res.status(404).json({ error: 'Job not found' });
      }
      jobs = [jobs];
    } else {
      jobs = await Job.find({ status: 'Active' }).limit(5);
    }

    const candidates = await Candidate.find({
      status: { $in: ['Applied', 'Screening', 'Interview'] }
    }).select('name email skills experience status');

    const matchingResults = [];

    for (const job of jobs) {
      const jobMatches = candidates.map(candidate => {
        const matchPercentage = calculateMatchPercentage(candidate.skills, job.requirements);

        return {
          candidateId: candidate._id,
          candidateName: candidate.name,
          candidateEmail: candidate.email,
          candidateSkills: candidate.skills,
          candidateExperience: candidate.experience,
          candidateStatus: candidate.status,
          matchPercentage,
          jobId: job._id,
          jobTitle: job.title,
          jobDepartment: job.department,
          jobRequirements: job.requirements
        };
      });

      // Sort by match percentage (highest first)
      jobMatches.sort((a, b) => b.matchPercentage - a.matchPercentage);

      matchingResults.push({
        job: {
          id: job._id,
          title: job.title,
          department: job.department,
          requirements: job.requirements
        },
        candidateMatches: jobMatches,
        topMatches: jobMatches.slice(0, 10), // Top 10 matches
        averageMatch: Math.round(
          jobMatches.reduce((sum, match) => sum + match.matchPercentage, 0) / jobMatches.length
        )
      });
    }

    res.json({
      totalJobs: jobs.length,
      totalCandidates: candidates.length,
      matchingResults
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/top-candidates/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Find applications for this specific job and populate candidates
    const applications = await Application.find({ job: jobId })
      .populate({
        path: 'candidate',
        match: {
          status: { $in: ['Applied', 'Screening', 'Interview'] }
        }
      });

    // Extract candidates from applications and filter out null candidates
    const applicants = applications
      .filter(app => app.candidate)
      .map(app => app.candidate);

    const rankedCandidates = applicants.map(candidate => {
      const matchPercentage = calculateMatchPercentage(candidate.skills, job.requirements);

      return {
        ...candidate.toObject(),
        matchPercentage
      };
    });

    // Sort by match percentage (highest first)
    rankedCandidates.sort((a, b) => b.matchPercentage - a.matchPercentage);

    res.json({
      job: {
        title: job.title,
        department: job.department,
        requirements: job.requirements
      },
      rankedCandidates: rankedCandidates.slice(0, 20) // Top 20 candidates
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;