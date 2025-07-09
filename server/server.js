// server.js

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const pdfParse = require('pdf-parse');

const app = express();

// Middleware to parse JSON and handle CORS
app.use(express.json());
app.use(cors());

// Serve static files from the uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB using your Atlas connection string
mongoose
  .connect('mongodb+srv://Hackathon:Hackathon@cluster0.wstdh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.error('MongoDB connection error:', err));

// Set up multer storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/others/';
    if (file.fieldname === 'resume') {
      folder = 'uploads/resumes/';
    } else if (file.fieldname === 'profilePicture') {
      folder = 'uploads/profilePictures/';
    }
    // Ensure directory exists; if not, create it.
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

/*
  ========================
  Merged User Schema
  ========================

  This schema stores registration fields (name, email, password, skills) and nests all profile details 
  (personal info, education, skills, resume) under a "profile" field.
*/
const userSchema = new mongoose.Schema(
  {
    // Registration fields
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'College email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    skills: {
      type: String,
      default: '',
    },
    // Profile fields
    profile: {
      personalInfo: {
        firstName: { type: String },
        lastName: { type: String },
        email: { type: String },
        phone: { type: String },
        dateOfBirth: { type: String },
        gender: { type: String },
        location: { type: String },
        profilePicture: { type: String }, // Stored as file path or URL
        bio: { type: String },
        linkedinUrl: { type: String },
        githubUrl: { type: String },
        portfolioUrl: { type: String },
      },
      education: {
        currentLevel: { type: String },
        institution: { type: String },
        field: { type: String },
        graduationYear: { type: String },
        cgpa: { type: String },
        achievements: [{ type: String }],
      },
      skills: {
        technical: [
          {
            skill: { type: String },
            level: { type: String }
          }
        ],
        soft: [
          {
            skill: { type: String },
            level: { type: String }
          }
        ],
        languages: [
          {
            language: { type: String },
            proficiency: { type: String }
          }
        ]
      },
      // Original field for single resume upload
      resume: { type: String },
      // New field to store multiple resumes (as an array of objects)
      resumes: { type: Array, default: [] }
    }
  },
  { timestamps: true }
);

// Define the Job schema
const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String },
  description: { type: String },
  skills_required: { type: String },
  experience_required: { type: String },
  date_posted: { type: Date, default: Date.now },
  url: { type: String },
  keywords: { type: [String], default: [] },
  application_deadline: { type: Date },
  job_type: { type: String },
  salary_range: { type: String }
});

// Create the Job model
const Job = mongoose.model('Job', jobSchema);


// Pre-save hook to hash the password (only when modified or new)
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

const User = mongoose.model('User', userSchema);

/*
  ========================
  Routes
  ========================
*/

// async function autoProcessResumeFile(resumeFile) {
//   try {
//       if (!resumeFile) {
//           throw new Error("No file provided");
//       }

//       if (!resumeFile.originalname.toLowerCase().endsWith('.pdf')) {
//           throw new Error("Invalid file format. Please upload a PDF file.");
//       }

//       // Read file as buffer
//       const fileBuffer = fs.readFileSync(resumeFile.path);

//       // Extract text from PDF
//       const data = await pdfParse(fileBuffer);
//       const resumeText = data.text.trim();

//       if (!resumeText) {
//           throw new Error("Empty PDF. Could not extract text.");
//       }

//       // Print extracted text to the server console
//       console.log("Extracted Resume Text:");
//       console.log(resumeText);

//       return resumeText;
//   } catch (error) {
//       console.error("Error processing resume:", error.message);
//       throw error;
//   }
// }

// module.exports = { autoProcessResumeFile };

// Signup route - creates a new user with registration details


async function autoProcessResumeFile(filePath) {
  try {
    // Read the PDF file from disk
    const fileBuffer = fs.readFileSync(filePath);

    // Extract text from PDF
    const data = await pdfParse(fileBuffer);
    const resumeText = data.text.trim();

    if (!resumeText) {
      throw new Error("Empty PDF. Could not extract text.");
    }

    return resumeText;
  } catch (error) {
    console.error("Error extracting text from resume:", error.message);
    throw error;
  }
}

// module.exports = { autoProcessResumeFile };

app.post('/api/jobs/save', async (req, res) => {
  try {
    const jobsData = req.body.jobs; // Expect an array of job objects
    if (!Array.isArray(jobsData)) {
      return res.status(400).json({ error: "Jobs data should be an array." });
    }
    let savedJobs = [];
    for (const job of jobsData) {
      let existingJob = await Job.findOne({ title: job.title, company: job.company });
      if (!existingJob) {
        const newJob = new Job(job);
        await newJob.save();
        savedJobs.push(newJob);
      } else {
        savedJobs.push(existingJob);
      }
    }
    res.status(201).json({ message: "Jobs saved successfully", jobs: savedJobs });
  } catch (error) {
    console.error('Error saving jobs:', error);
    res.status(500).json({ error: "Error saving jobs" });
  }
});

// Get all jobs
app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await Job.find({});
    console.log("Fetched Jobs:", jobs); // Logs to your terminal
    res.status(200).json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: "Error fetching jobs" });
  }
});

app.post('/api/signup', async (req, res) => {
  const { name, email, password, skills } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }
    const newUser = new User({ name, email, password, skills });
    await newUser.save();
    res.status(201).json({ message: 'Signup successful.' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup.' });
  }
});

// Login route - returns the user registration and profile details
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }
    // Convert the _id to string to ensure a proper ObjectId string is returned
    res.status(200).json({
      message: 'Login successful.',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        skills: user.skills,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// GET endpoint to fetch profile details based on email.
app.get('/api/profile', async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.status(200).json({ profile: user.profile });
  } catch (error) {
    console.error('Fetch profile error:', error);
    res.status(500).json({ error: 'Server error while fetching profile.' });
  }
});

// Profile submission route - updates the user's profile.
// This endpoint handles multiple file uploads (profilePicture and resume)
app.post('/api/profile', upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'resume', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log("Received files:", req.files);
    // Parse JSON fields from FormData
    const { personalInfo, education, skills } = req.body;
    const parsedPersonalInfo = JSON.parse(personalInfo);
    const parsedEducation = JSON.parse(education);
    const parsedSkills = JSON.parse(skills);

    // If a profile picture file was uploaded, update parsedPersonalInfo
    if (req.files && req.files.profilePicture) {
      const profilePicFile = req.files.profilePicture[0];
      console.log("Profile picture file stored at:", profilePicFile.path);
      parsedPersonalInfo.profilePicture = profilePicFile.path;
    }
    let resumePath = '';
    if (req.files && req.files.resume) {
      const resumeFile = req.files.resume[0];
      resumePath = resumeFile.path;
    }

    // Use the email from personalInfo to find and update the existing user document.
    const updatedUser = await User.findOneAndUpdate(
      { email: parsedPersonalInfo.email },
      {
        $set: {
          'profile.personalInfo': parsedPersonalInfo,
          'profile.education': parsedEducation,
          'profile.skills': parsedSkills,
          'profile.resume': resumePath
        }
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found. Please sign up first.' });
    }
    res.status(200).json({ message: 'Profile updated successfully.' });
  } catch (error) {
    console.error('Profile submission error:', error);
    res.status(500).json({ error: 'Server error during profile submission.' });
  }
});

// Optional: Auto-fill resume endpoint (returns dummy data after processing resume file)
app.post('/api/auto-fill-resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No resume file uploaded.' });
    }
    const dummyData = {
      personal_information: {
        name: "John Doe",
        email: "john.doe@example.com",
        phone: "1234567890",
        location: "City, Country"
      },
      education: {
        current_level: "Bachelor's Degree",
        institution: "Example University",
        field: "Computer Science",
        graduation_year: "2023",
        cgpa: "3.8"
      },
      technical_skills: [
        { name: "JavaScript", level: "Advanced" },
        { name: "React", level: "Advanced" }
      ],
      soft_skills: [
        { name: "Communication", level: "Intermediate" }
      ],
      languages: [
        { name: "English", proficiency: "Native" }
      ]
    };
    res.status(200).json({ data: dummyData });
  } catch (error) {
    console.error('Auto-fill resume error:', error);
    res.status(500).json({ error: 'Server error during resume auto-fill.' });
  }
});

/*
  =======================================
  New Resume Upload Endpoint
  =======================================
  
  This endpoint handles the resume upload coming from the ProfileTab component.
  It expects the resume file, along with userId and resumeId in the request body.
  The resume is stored using multer and its file path is pushed into the user's profile.resumes array.
*/
// app.post('/api/resume', upload.single('resume'), async (req, res) => {
//   try {
//     const { userId, resumeId } = req.body;
//     if (!req.file) {
//       return res.status(400).json({ error: 'No resume file uploaded.' });
//     }

//     // Validate userId before attempting to update
//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({ error: 'Invalid user ID provided.' });
//     }
//     const resumePath = req.file.path;

//     // Prepare the resume object to be stored
//     const resumeData = {
//       id: resumeId,
//       filePath: resumePath,
//       fileName: req.file.originalname,
//       uploadDate: new Date().toISOString()
//     };

//     // Update the user's profile by pushing the resume into the resumes array
//     const updatedUser = await User.findByIdAndUpdate(
//       userId,
//       { $push: { 'profile.resumes': resumeData } },
//       { new: true }
//     );
//     if (!updatedUser) {
//       return res.status(404).json({ error: 'User not found.' });
//     }
//     extracted_text = autoProcessResumeFile()
//     console.log(extracted_text)
//     // Construct a URL to access the uploaded file
//     const fileUrl = `${req.protocol}://${req.get('host')}/${resumePath}`;
//     res.status(200).json({ message: 'Resume uploaded successfully.', fileUrl });
//   } catch (error) {
//     console.error('Error uploading resume:', error);
//     res.status(500).json({ error: 'Server error during resume upload.' });
//   }
// });

//const express = require('express');
//const multer = require('multer');
//const mongoose = require('mongoose');
//const { autoProcessResumeFile } = require('./autoProcessResume'); // Import function
//const User = require('./models/User'); // Adjust path as needed

// const app = express();
// const upload = multer({ dest: 'uploads/' });

app.post('/api/resume', upload.single('resume'), async (req, res) => {
  try {
    const { userId, resumeId } = req.body;

    // Validate uploaded file
    if (!req.file) {
      return res.status(400).json({ error: 'No resume file uploaded.' });
    }

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID provided.' });
    }

    const resumePath = req.file.path; // Path where file is stored

    // Extract text from the uploaded resume
    const extractedText = await autoProcessResumeFile(resumePath);

    // Log extracted text to server console
    console.log("Extracted Resume Text:");
    console.log(extractedText);

    // Prepare resume object to store
    const resumeData = {
      id: resumeId,
      filePath: resumePath,
      fileName: req.file.originalname,
      uploadDate: new Date().toISOString(),
      extractedText: extractedText // Store extracted text (optional)
    };

    // Update the user's profile with the new resume
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $push: { 'profile.resumes': resumeData } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Construct file URL
    const fileUrl = `${req.protocol}://${req.get('host')}/${resumePath}`;

    // Send response with extracted text included
    res.status(200).json({ 
      message: 'Resume uploaded and processed successfully.', 
      fileUrl, 
      extractedText 
    });

  } catch (error) {
    console.error('Error uploading and processing resume:', error);
    res.status(500).json({ error: 'Server error during resume upload.' });
  }
});

/*
  =======================================
  Analyze Resume Endpoint
  =======================================
  
  This endpoint triggers the ATS analysis for a given resume by its resumeId.
  It finds the resume file, spawns the Python atschecker script (passing a flag for JSON output),
  captures its output, and returns the JSON result.
*/
app.post('/api/analyze-resume/:resumeId', async (req, res) => {
  try {
    const resumeId = req.params.resumeId;
    // Find the user document that contains this resume in the nested resumes array
    const user = await User.findOne({ 'profile.resumes.id': resumeId });
    if (!user) {
      return res.status(404).json({ error: 'User not found for resume analysis.' });
    }
    const resume = user.profile.resumes.find(r => r.id === resumeId);
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found.' });
    }
    const resumePath = resume.filePath;
    if (!resumePath) {
      return res.status(400).json({ error: 'No resume file path available for analysis.' });
    }
    
    // Spawn the Python atschecker.py process with the resume file path and a flag for JSON output.
    // Ensure that atschecker.py is updated to check for '--json' and output JSON accordingly.
    const pythonProcess = spawn('python', ['atschecker.py', resumePath, '--json']);

    let scriptOutput = '';
    pythonProcess.stdout.on('data', (data) => {
      scriptOutput += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python stderr: ${data}`);
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        return res.status(500).json({ error: 'Error analyzing resume.' });
      }
      try {
        // Parse the output as JSON and send it back to the client.
        const result = JSON.parse(scriptOutput);
        res.status(200).json(result);
      } catch (err) {
        console.error('Error parsing Python output as JSON:', err);
        res.status(500).json({ error: 'Failed to parse resume analysis result.' });
      }
    });

  } catch (error) {
    console.error('Error in resume analysis endpoint:', error);
    res.status(500).json({ error: 'Server error during resume analysis.' });
  }
});

/*
  =======================================
  Delete Resume Endpoint
  =======================================
  
  This endpoint deletes a resume by its resumeId.
  It removes the resume file from disk and the resume entry from the user's profile.resumes array.
*/
app.delete('/api/delete-resume/:resumeId', async (req, res) => {
  try {
    const resumeId = req.params.resumeId;
    // Find the user document that contains the resume
    const user = await User.findOne({ 'profile.resumes.id': resumeId });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const resumeIndex = user.profile.resumes.findIndex(r => r.id === resumeId);
    if (resumeIndex === -1) {
      return res.status(404).json({ error: 'Resume not found.' });
    }
    const resume = user.profile.resumes[resumeIndex];
    // Remove the file from the file system if it exists
    if (fs.existsSync(resume.filePath)) {
      fs.unlinkSync(resume.filePath);
    }
    // Remove the resume from the array and save the user document
    user.profile.resumes.splice(resumeIndex, 1);
    await user.save();
    res.status(200).json({ message: 'Resume deleted successfully.' });
  } catch (error) {
    console.error('Error deleting resume:', error);
    res.status(500).json({ error: 'Server error during resume deletion.' });
  }
});

app.post('/api/jobs/save', async (req, res) => {
  try {
    const jobsData = req.body.jobs; // Expect an array of job objects
    if (!Array.isArray(jobsData)) {
      return res.status(400).json({ error: "Jobs data should be an array." });
    }
    let savedJobs = [];
    for (const job of jobsData) {
      // Check if a job with the same title and company already exists
      let existingJob = await Job.findOne({ title: job.title, company: job.company });
      if (!existingJob) {
        const newJob = new Job(job);
        await newJob.save();
        savedJobs.push(newJob);
      } else {
        savedJobs.push(existingJob);
      }
    }
    res.status(201).json({ message: "Jobs saved successfully", jobs: savedJobs });
  } catch (error) {
    console.error('Error saving jobs:', error);
    res.status(500).json({ error: "Error saving jobs" });
  }
});

app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await Job.find({});
    console.log("Fetched Jobs:", jobs); // This logs to your terminal
    res.status(200).json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: "Error fetching jobs" });
  }
});



// Start the Express server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});