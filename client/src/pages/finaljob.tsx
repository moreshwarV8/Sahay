import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin, Clock, Briefcase, Building, Award, UserCircle, Upload, Percent, PlusCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const JobSearch = () => {
  const [jobs, setJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Admin job posting state
  const [newJob, setNewJob] = useState({
    title: '',
    company: '',
    location: '',
    description: '',
    skills_required: '',
    experience_required: '',
    date_posted: new Date().toISOString().split('T')[0],
    url: ''
  });

  // Profile state
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    skills: '',
    experience: '',
    education: '',
    interests: '',
    resume: null,
  });

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = () => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      // Admin email for testing
      const adminEmails = ['admin@viit.ac.in', 'tpo@viit.ac.in'];
      setIsAdmin(adminEmails.includes(user.email));
    };
    
    checkAdminStatus();
  }, []);

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5004/api/jobs/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: searchQuery,
          location: location
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }

      const data = await response.json();
      setJobs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    setProfileData(prev => ({
      ...prev,
      resume: file
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      
      // Add all profile fields to formData
      Object.keys(profileData).forEach(key => {
        if (key === 'resume') {
          if (profileData.resume) {
            formData.append('resume', profileData.resume);
          }
        } else {
          formData.append(key, profileData[key]);
        }
      });
      
      formData.append('keyword', searchQuery);
      formData.append('location', location);

      const response = await fetch('http://localhost:5004/api/jobs/match', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to match jobs');
      }

      const data = await response.json();
      setJobs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Admin functions
  const handleNewJobChange = (e) => {
    const { name, value } = e.target;
    setNewJob(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddJob = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5004/api/jobs/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newJob),
      });

      if (!response.ok) {
        throw new Error('Failed to add job');
      }

      // Add the job to the current list (optimistic update)
      setJobs(prev => [...prev, {...newJob, id: Date.now()}]);
      
      // Reset the form
      setNewJob({
        title: '',
        company: '',
        location: '',
        description: '',
        skills_required: '',
        experience_required: '',
        date_posted: new Date().toISOString().split('T')[0],
        url: ''
      });
      
      // Close the dialog (you'll need to handle this with a state)
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Job Search</h1>
        
        <div className="flex gap-3">
          {/* Admin Post Job Button - Only visible to admins */}
          {isAdmin && (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <PlusCircle className="w-5 h-5" />
                  Post New Job
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Post a New Job Opportunity</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddJob} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Job Title</Label>
                      <Input
                        id="title"
                        name="title"
                        value={newJob.title}
                        onChange={handleNewJobChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        name="company"
                        value={newJob.company}
                        onChange={handleNewJobChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        name="location"
                        value={newJob.location}
                        onChange={handleNewJobChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="experience_required">Experience Required</Label>
                      <Input
                        id="experience_required"
                        name="experience_required"
                        value={newJob.experience_required}
                        onChange={handleNewJobChange}
                        required
                        placeholder="e.g. 2-3 years"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="skills_required">Required Skills (comma-separated)</Label>
                    <Textarea
                      id="skills_required"
                      name="skills_required"
                      value={newJob.skills_required}
                      onChange={handleNewJobChange}
                      required
                      placeholder="React, JavaScript, Node.js"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Job Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={newJob.description}
                      onChange={handleNewJobChange}
                      required
                      className="min-h-32"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="url">Application URL</Label>
                    <Input
                      id="url"
                      name="url"
                      value={newJob.url}
                      onChange={handleNewJobChange}
                      required
                      placeholder="https://company.com/careers/job-123"
                    />
                  </div>

                  <Button type="submit" className="w-full">Post Job</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
          
          {/* Profile Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <UserCircle className="w-5 h-5" />
                Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Your Profile</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={profileData.fullName}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Input
                      id="experience"
                      name="experience"
                      value={profileData.experience}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skills">Skills (comma-separated)</Label>
                  <Textarea
                    id="skills"
                    name="skills"
                    value={profileData.skills}
                    onChange={handleProfileChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="education">Education</Label>
                  <Textarea
                    id="education"
                    name="education"
                    value={profileData.education}
                    onChange={handleProfileChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interests">Interests</Label>
                  <Textarea
                    id="interests"
                    name="interests"
                    value={profileData.interests}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resume">Resume</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="resume"
                      name="resume"
                      type="file"
                      onChange={handleResumeUpload}
                      accept=".pdf,.doc,.docx"
                      className="flex-1"
                    />
                    {profileData.resume && (
                      <Badge variant="secondary" className="flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        {profileData.resume.name}
                      </Badge>
                    )}
                  </div>
                </div>

                <Button type="submit" className="w-full">Save Profile</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex gap-4">
          <Input
            placeholder="Job title or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="Location..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={isLoading}>
            {isLoading ? 'Searching...' : 'Search Jobs'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-red-500 p-4 mb-4 bg-red-50 rounded">
          {error}
        </div>
      )}

      {/* Admin Management Section - Only visible to admins */}
      {isAdmin && (
        <div className="mb-8">
          <Card className="bg-blue-50">
            <CardHeader>
              <CardTitle className="text-xl">Admin Panel</CardTitle>
              <CardDescription>
                You have admin access. You can post new job opportunities and manage existing ones.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Jobs you post will be immediately visible to all students. Make sure all information is accurate.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full">Post New Job Opportunity</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  {/* Form content same as above admin post job dialog */}
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {jobs.map((job, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    {job.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    {job.company}
                  </CardDescription>
                </div>
                {job.match_percentage && (
                  <Badge 
                  variant={
                    job.match_percentage > 75 ? "default" : // using "default" for high match
                    job.match_percentage > 50 ? "destructive" : // using "destructive" for medium match
                    "secondary"
                  }
                  className="flex items-center gap-1"
                >
                  <Percent className="w-4 h-4" />
                  {job.match_percentage}% Match
                </Badge>
                
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {job.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {job.date_posted}
                  </div>
                  <div className="flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    {job.experience_required}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {job.skills_required?.split(',').map((skill, i) => (
                    <Badge key={i} variant="secondary">
                      {skill.trim()}
                    </Badge>
                  ))}
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full">View Details</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{job.title} at {job.company}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="whitespace-pre-wrap">{job.description}</p>
                      <div>
                        <h4 className="font-semibold mb-2">Required Skills:</h4>
                        <p>{job.skills_required}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Experience Required:</h4>
                        <p>{job.experience_required}</p>
                      </div>
                      <a 
                        href={job.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <Button className="w-full">
                          Apply{isAdmin ? ' or Edit' : ''}
                        </Button>
                      </a>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!isLoading && jobs.length === 0 && (
        <div className="text-center text-gray-500 p-8">
          No jobs found. Try different search terms or location.
        </div>
      )}
    </div>
  );
};

export default JobSearch;