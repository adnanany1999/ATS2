let candidates = [];
let jobs = [];
let candidatesChart = null;
let jobsChart = null;

document.addEventListener('DOMContentLoaded', function() {
    setupDragAndDrop();
    setupMobileMenu();
    setupLucideIcons();
    showPage('candidates');
    loadCandidates();
    loadJobs();
});

function setupDragAndDrop() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('resumeFile');
    const fileInfo = document.getElementById('fileInfo');

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            showFileInfo(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            showFileInfo(e.target.files[0]);
        }
    });
}

function showFileInfo(file) {
    const fileInfo = document.getElementById('fileInfo');
    const fileSize = (file.size / 1024 / 1024).toFixed(2);
    fileInfo.innerHTML = `
        <div class="file-info">
            <i class="fas fa-file-pdf"></i>
            <strong>${file.name}</strong> (${fileSize} MB)
        </div>
    `;
    fileInfo.style.display = 'block';
}

function setupMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
            const newState = !isExpanded;
            
            mobileMenuBtn.setAttribute('aria-expanded', newState.toString());
            
            if (newState) {
                mobileMenu.classList.add('show');
            } else {
                mobileMenu.classList.remove('show');
            }
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!mobileMenuBtn.contains(event.target) && !mobileMenu.contains(event.target)) {
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
                mobileMenu.classList.remove('show');
            }
        });
    }
}

function setupLucideIcons() {
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function showPage(pageName) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.style.display = 'none');
    
    const targetPage = document.getElementById(pageName + '-page');
    if (targetPage) {
        targetPage.style.display = 'block';
    }
    
    // Update active navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageName) {
            link.classList.add('active');
        }
    });
    
    // Close mobile menu if open
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenu && mobileMenuBtn) {
        mobileMenu.classList.remove('show');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
    }
    
    if (pageName === 'analytics') {
        loadAnalytics();
    }
}

async function loadCandidates() {
    try {
        const response = await fetch('/api/candidates');
        candidates = await response.json();
        displayCandidates(candidates);
    } catch (error) {
        console.error('Error loading candidates:', error);
        showError('Failed to load candidates');
    }
}

function displayCandidates(candidateList) {
    const tbody = document.getElementById('candidatesTableBody');
    
    if (candidateList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
                    <div class="empty-state">
                        <i class="fas fa-user-friends"></i>
                        <p>No candidates found</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = candidateList.map(candidate => `
        <tr>
            <td>${candidate.name}</td>
            <td>${candidate.email}</td>
            <td>${candidate.phone}</td>
            <td><span class="badge status-badge status-${candidate.status.toLowerCase()}">${candidate.status}</span></td>
            <td>
                ${candidate.skills.map(skill => `<span class="skills-tag">${skill}</span>`).join('')}
            </td>
            <td>${candidate.experience} years</td>
            <td>${new Date(candidate.appliedDate).toLocaleDateString()}</td>
            <td>
                <div class="action-buttons">
                    <a href="${candidate.resumeUrl}" target="_blank" class="btn btn-outline-primary btn-sm">
                        <i class="fas fa-eye"></i> View Resume
                    </a>
                    <button class="btn btn-outline-success btn-sm" onclick="updateCandidateStatus('${candidate._id}', 'Hired')">
                        <i class="fas fa-check"></i> Hire
                    </button>
                    <button class="btn btn-outline-danger btn-sm" onclick="updateCandidateStatus('${candidate._id}', 'Rejected')">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function addCandidate() {
    const form = document.getElementById('candidateForm');
    const formData = new FormData();
    
    formData.append('name', document.getElementById('candidateName').value);
    formData.append('email', document.getElementById('candidateEmail').value);
    formData.append('phone', document.getElementById('candidatePhone').value);
    formData.append('skills', document.getElementById('candidateSkills').value);
    formData.append('experience', document.getElementById('candidateExperience').value);
    formData.append('notes', document.getElementById('candidateNotes').value);
    
    const resumeFile = document.getElementById('resumeFile').files[0];
    if (!resumeFile) {
        showError('Please select a resume file');
        return;
    }
    
    formData.append('resume', resumeFile);
    
    try {
        const response = await fetch('/api/candidates', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            showSuccess('Candidate added successfully');
            form.reset();
            document.getElementById('fileInfo').style.display = 'none';
            bootstrap.Modal.getInstance(document.getElementById('addCandidateModal')).hide();
            loadCandidates();
        } else {
            const error = await response.json();
            showError(error.error || 'Failed to add candidate');
        }
    } catch (error) {
        console.error('Error adding candidate:', error);
        showError('Failed to add candidate');
    }
}

async function updateCandidateStatus(candidateId, newStatus) {
    try {
        const response = await fetch(`/api/candidates/${candidateId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (response.ok) {
            showSuccess(`Candidate status updated to ${newStatus}`);
            loadCandidates();
        } else {
            const error = await response.json();
            showError(error.error || 'Failed to update candidate status');
        }
    } catch (error) {
        console.error('Error updating candidate status:', error);
        showError('Failed to update candidate status');
    }
}

function filterCandidates() {
    const statusFilter = document.getElementById('statusFilter').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    let filteredCandidates = candidates;
    
    if (statusFilter !== 'all') {
        filteredCandidates = filteredCandidates.filter(candidate => 
            candidate.status === statusFilter
        );
    }
    
    if (searchTerm) {
        filteredCandidates = filteredCandidates.filter(candidate =>
            candidate.name.toLowerCase().includes(searchTerm) ||
            candidate.email.toLowerCase().includes(searchTerm) ||
            candidate.skills.some(skill => skill.toLowerCase().includes(searchTerm))
        );
    }
    
    displayCandidates(filteredCandidates);
}

async function loadJobs() {
    try {
        const response = await fetch('/api/jobs');
        jobs = await response.json();
        displayJobs(jobs);
    } catch (error) {
        console.error('Error loading jobs:', error);
        showError('Failed to load jobs');
    }
}

function displayJobs(jobList) {
    const tbody = document.getElementById('jobsTableBody');
    
    if (jobList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
                    <div class="empty-state">
                        <i class="fas fa-briefcase"></i>
                        <p>No jobs found</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = jobList.map(job => `
        <tr>
            <td>${job.title}</td>
            <td>${job.department}</td>
            <td>${job.location}</td>
            <td>${job.type}</td>
            <td>$${job.salary.min.toLocaleString()} - $${job.salary.max.toLocaleString()}</td>
            <td><span class="badge status-badge status-${job.status.toLowerCase()}">${job.status}</span></td>
            <td>${job.applications.length}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-outline-primary btn-sm" onclick="viewJob('${job._id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-outline-success btn-sm" onclick="updateJobStatus('${job._id}', 'Active')">
                        <i class="fas fa-play"></i> Activate
                    </button>
                    <button class="btn btn-outline-warning btn-sm" onclick="updateJobStatus('${job._id}', 'Paused')">
                        <i class="fas fa-pause"></i> Pause
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function addJob() {
    const jobData = {
        title: document.getElementById('jobTitle').value,
        department: document.getElementById('jobDepartment').value,
        location: document.getElementById('jobLocation').value,
        type: document.getElementById('jobType').value,
        description: document.getElementById('jobDescription').value,
        requirements: document.getElementById('jobRequirements').value,
        openings: document.getElementById('jobOpenings').value,
        salary: {
            min: parseInt(document.getElementById('jobSalaryMin').value),
            max: parseInt(document.getElementById('jobSalaryMax').value)
        }
    };
    
    try {
        const response = await fetch('/api/jobs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(jobData)
        });
        
        if (response.ok) {
            showSuccess('Job added successfully');
            document.getElementById('jobForm').reset();
            bootstrap.Modal.getInstance(document.getElementById('addJobModal')).hide();
            loadJobs();
        } else {
            const error = await response.json();
            showError(error.error || 'Failed to add job');
        }
    } catch (error) {
        console.error('Error adding job:', error);
        showError('Failed to add job');
    }
}

async function updateJobStatus(jobId, newStatus) {
    try {
        const response = await fetch(`/api/jobs/${jobId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (response.ok) {
            showSuccess(`Job status updated to ${newStatus}`);
            loadJobs();
        } else {
            const error = await response.json();
            showError(error.error || 'Failed to update job status');
        }
    } catch (error) {
        console.error('Error updating job status:', error);
        showError('Failed to update job status');
    }
}

function filterJobs() {
    const statusFilter = document.getElementById('jobStatusFilter').value;
    const departmentFilter = document.getElementById('departmentFilter').value;
    
    let filteredJobs = jobs;
    
    if (statusFilter !== 'all') {
        filteredJobs = filteredJobs.filter(job => job.status === statusFilter);
    }
    
    if (departmentFilter !== 'all') {
        filteredJobs = filteredJobs.filter(job => job.department === departmentFilter);
    }
    
    displayJobs(filteredJobs);
}

async function loadAnalytics() {
    try {
        const response = await fetch('/api/analytics/dashboard');
        const data = await response.json();
        
        document.getElementById('totalCandidates').textContent = data.metrics.totalCandidates;
        document.getElementById('totalJobs').textContent = data.metrics.totalJobs;
        document.getElementById('activeJobs').textContent = data.metrics.activeJobs;
        document.getElementById('totalApplications').textContent = data.metrics.totalApplications;
        
        renderCandidatesChart(data.charts.candidatesByStatus);
        renderJobsChart(data.charts.jobsByDepartment);
    } catch (error) {
        console.error('Error loading analytics:', error);
        showError('Failed to load analytics');
    }
}

function renderCandidatesChart(data) {
    const ctx = document.getElementById('candidatesChart').getContext('2d');
    
    if (candidatesChart) {
        candidatesChart.destroy();
    }
    
    candidatesChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(item => item._id),
            datasets: [{
                data: data.map(item => item.count),
                backgroundColor: [
                    '#007bff',
                    '#ffc107',
                    '#6f42c1',
                    '#28a745',
                    '#20c997',
                    '#dc3545'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function renderJobsChart(data) {
    const ctx = document.getElementById('jobsChart').getContext('2d');
    
    if (jobsChart) {
        jobsChart.destroy();
    }
    
    jobsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(item => item._id),
            datasets: [{
                label: 'Number of Jobs',
                data: data.map(item => item.count),
                backgroundColor: '#007bff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function showSuccess(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'success-message';
    alertDiv.textContent = message;
    
    document.body.insertBefore(alertDiv, document.body.firstChild);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

function showError(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'error-message';
    alertDiv.textContent = message;
    
    document.body.insertBefore(alertDiv, document.body.firstChild);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

function viewJob(jobId) {
    const job = jobs.find(j => j._id === jobId);
    if (job) {
        alert(`Job: ${job.title}\nDepartment: ${job.department}\nLocation: ${job.location}\nDescription: ${job.description}`);
    }
}