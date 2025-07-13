# ATS - Applicant Tracking System

A full-stack web application for managing job candidates, job postings, and recruitment analytics.

## Features

### 🎯 Candidates Management
- **Drag-and-drop resume upload** - Upload PDF/DOC files easily
- **Status filtering** - Filter by Applied, Screening, Interview, Offer, Hired, Rejected
- **Search functionality** - Search by name, email, or skills
- **Candidate actions** - Hire, reject, view resumes
- **Skills tracking** - Tag and search candidates by skills

### 💼 Jobs Management
- **Job posting creation** - Add new job positions
- **Department filtering** - Filter jobs by department
- **Status management** - Active, Paused, Closed job statuses
- **Salary range tracking** - Min/max salary configuration
- **Application tracking** - See applications per job

### 📊 Analytics Dashboard
- **Key metrics** - Total candidates, jobs, applications
- **Visual charts** - Candidates by status, jobs by department
- **Hiring funnel** - Track candidate progression
- **Interactive charts** - Built with Chart.js

## Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database with Mongoose ODM
- **Multer** - File upload handling
- **CORS** - Cross-origin resource sharing

### Frontend
- **HTML5/CSS3** - Modern web standards
- **Bootstrap 5** - Responsive UI framework
- **JavaScript ES6+** - Modern JavaScript features
- **Chart.js** - Interactive charts and graphs
- **Font Awesome** - Icons and visual elements

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd ats2
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up MongoDB:**
   - Install MongoDB locally or use MongoDB Atlas
   - Update `.env` file with your MongoDB connection string

4. **Configure environment variables:**
   ```bash
   # .env file
   MONGODB_URI=mongodb://localhost:27017/ats
   PORT=3000
   ```

5. **Start the application:**
   ```bash
   npm start
   ```

6. **Access the application:**
   Open your browser and navigate to `http://localhost:3000`

## API Endpoints

### Candidates
- `GET /api/candidates` - Get all candidates with optional filtering
- `POST /api/candidates` - Create new candidate (with resume upload)
- `PUT /api/candidates/:id` - Update candidate status
- `DELETE /api/candidates/:id` - Delete candidate

### Jobs
- `GET /api/jobs` - Get all jobs with optional filtering
- `POST /api/jobs` - Create new job posting
- `PUT /api/jobs/:id` - Update job details
- `DELETE /api/jobs/:id` - Delete job
- `POST /api/jobs/:id/apply` - Apply candidate to job

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard metrics and charts
- `GET /api/analytics/candidates-by-status` - Get candidate status distribution
- `GET /api/analytics/jobs-by-department` - Get jobs by department
- `GET /api/analytics/hiring-funnel` - Get hiring funnel data

## File Structure

```
ats2/
├── models/
│   ├── Candidate.js      # Candidate schema
│   ├── Job.js           # Job schema
│   └── Application.js   # Application schema
├── routes/
│   ├── candidates.js    # Candidate API routes
│   ├── jobs.js         # Job API routes
│   └── analytics.js    # Analytics API routes
├── public/
│   ├── index.html      # Main application page
│   ├── styles.css      # Custom styles
│   ├── script.js       # Frontend JavaScript
│   └── uploads/        # Resume file storage
├── server.js           # Express server setup
├── package.json        # Dependencies and scripts
└── .env               # Environment variables
```

## Usage Guide

### Adding Candidates
1. Navigate to the **Candidates** page
2. Click **Add Candidate** button
3. Fill in candidate details (name, email, phone, skills, experience)
4. **Drag and drop** resume file or click to browse
5. Add optional notes
6. Click **Add Candidate** to save

### Managing Jobs
1. Go to the **Jobs** page
2. Click **Add Job** to create new positions
3. Fill in job details (title, department, location, salary, etc.)
4. Use filters to find specific jobs
5. Update job status (Active/Paused/Closed)

### Viewing Analytics
1. Visit the **Analytics** page
2. View key metrics cards
3. Analyze candidate distribution charts
4. Review jobs by department
5. Track hiring funnel progress

## Development

### Running in Development Mode
```bash
npm run dev
```

### Database Models

**Candidate Schema:**
- Personal info (name, email, phone)
- Application status and tracking
- Skills and experience
- Resume file reference
- Application history

**Job Schema:**
- Job details (title, department, location)
- Salary range and requirements
- Status and openings count
- Application references

**Application Schema:**
- Candidate and job references
- Application status and stage
- Interview dates and notes

## Security Features

- File upload validation (PDF/DOC only)
- Input validation and sanitization
- CORS protection
- Error handling and logging

## Browser Support

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Create Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions, please create an issue in the GitHub repository.