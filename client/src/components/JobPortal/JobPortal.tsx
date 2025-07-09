// JobPortal.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Added Label and Textarea
import { Label } from "@/components/ui/label";
import { Textarea } from "../ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Loader, ToggleLeft, Bell, Briefcase, Home, Bookmark, FileText, Search, Award, Calendar } from "lucide-react"; // Added Award and Calendar
import DashboardTab from "./DashboardTab";
import JobsTab from "./JobsTab";
import ApplicationsTab from "./ApplicationsTab";
import BookmarksTab from "./BookmarksTab";
import ProfileTab from "./ProfileTab";
import { Job, Profile, Notification, Application, UserStats, Education } from "./types";


const defaultProfile: Profile = {
  id: "",
  fullName: "",
  email: "",
  phone: "",
  skills: "",
  experience: "",
  education: "",
  interests: "",
  resumes: [], // holds multiple resumes (each with extracted text)
  notificationPreferences: {
    email: true,
    jobAlerts: true,
    applicationUpdates: true,
    newMatchingJobs: true,
  },
};

const sampleEducation: Education[] = [
  {
    degree: "Bachelor of Technology",
    field: "Computer Science",
    university: "University of Technology",
    year: "2021-2025",
  },
  {
    degree: "Higher Secondary",
    field: "Science",
    university: "National Public School",
    year: "2019-2021",
  },
];

const sampleStats: UserStats = {
  applicationsSubmitted: 8,
  bookmarkedJobs: 12,
  profileViews: 24,
  matchScore: 75,
};

const JobPortal = () => {
  // State Management
  const [activeTab, setActiveTab] = useState("dashboard");
  const [originalJobs, setOriginalJobs] = useState<Job[]>([
    {
      id: 1,
      title: "Frontend Developer",
      company: "TechCorp",
      location: "Pune, Maharashtra",
      description: "We are looking for a Frontend Developer with experience in React and modern JavaScript frameworks.",
      skills_required: "React, JavaScript, TypeScript, CSS",
      experience_required: "2+ years",
      date_posted: "2025-02-15",
      url: "https://example.com/apply",
      keywords: ["frontend", "react", "javascript", "web development"],
      application_deadline: "2025-03-30",
      job_type: "Full-time",
      salary_range: "₹8-12 LPA",
      isBookmarked: false,
      best_resume: undefined,
      improvement_suggestions: undefined
    },
    {
      id: 2,
      title: "Backend Engineer",
      company: "DataSystems",
      location: "Mumbai, Maharashtra",
      description: "Backend Engineer position available for experienced Node.js developers.",
      skills_required: "Node.js, Express, MongoDB, REST APIs",
      experience_required: "3+ years",
      date_posted: "2025-02-20",
      url: "https://example.com/apply",
      keywords: ["backend", "node.js", "mongodb", "api"],
      application_deadline: "2025-04-15",
      job_type: "Full-time",
      salary_range: "₹10-15 LPA",
      isBookmarked: true,
      best_resume: undefined,
      improvement_suggestions: undefined
    },
    {
      id: 3,
      title: "Machine Learning Intern",
      company: "AI Solutions",
      location: "Bangalore, Karnataka",
      description: "Join our team as a Machine Learning Intern to work on cutting-edge AI projects.",
      skills_required: "Python, TensorFlow, Data Analysis, Mathematics",
      experience_required: "0-1 year",
      date_posted: "2025-02-25",
      url: "https://example.com/apply",
      keywords: ["internship", "machine learning", "python", "ai"],
      application_deadline: "2025-03-25",
      job_type: "Internship",
      salary_range: "₹25-35K per month",
      isBookmarked: false,
      best_resume: undefined,
      improvement_suggestions: undefined
    },
    {
      id: 4,
      title: "Full Stack Developer",
      company: "WebTech Solutions",
      location: "Remote",
      description: "Looking for a passionate Full Stack Developer to join our remote team.",
      skills_required: "React, Node.js, MongoDB, AWS",
      experience_required: "2-4 years",
      date_posted: "2025-02-28",
      url: "https://example.com/apply",
      keywords: ["fullstack", "react", "node.js", "remote"],
      application_deadline: "2025-04-10",
      job_type: "Full-time",
      salary_range: "₹12-18 LPA",
      isBookmarked: false,
      best_resume: undefined,
      improvement_suggestions: undefined
    },
  ]);
  const [jobs, setJobs] = useState<Job[]>([...originalJobs]);
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isFetchingFromAPI, setIsFetchingFromAPI] = useState(false);
  const [searchMethod, setSearchMethod] = useState<"local" | "api">("local");
  const [bookmarkedJobs, setBookmarkedJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([
    {
      id: 1,
      jobId: 2,
      date: "2025-02-22",
      status: "screening",
      notes: "Initial application submitted",
    },
    {
      id: 2,
      jobId: 3,
      date: "2025-02-27",
      status: "applied",
      notes: "Waiting for response",
    },
  ]);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: "New matching job",
      message: "A new Frontend Developer position at TechCorp matches your profile",
      date: "2025-02-16",
      read: false,
      type: "job_match",
      relatedJobId: 1,
    },
    {
      id: 2,
      title: "Application Update",
      message: "Your application for Backend Engineer at DataSystems has moved to screening stage",
      date: "2025-02-23",
      read: true,
      type: "application_update",
      relatedJobId: 2,
    },
    {
      id: 3,
      title: "Application Deadline",
      message: "The Machine Learning Intern position application deadline is approaching",
      date: "2025-02-20",
      read: false,
      type: "deadline",
      relatedJobId: 3,
    },
  ]);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [profileData, setProfileData] = useState<Profile>(defaultProfile);
  const [userStats, setUserStats] = useState<UserStats>(sampleStats);
  const [educationList, setEducationList] = useState<Education[]>(sampleEducation);
  const [showNotifications, setShowNotifications] = useState(false);
  const [jobFilters, setJobFilters] = useState({
    jobType: "",
    experienceLevel: "",
    datePosted: "",
  });
  const [showJobForm, setShowJobForm] = useState(false);
  const [newJob, setNewJob] = useState({
    title: "",
    company: "",
    location: "",
    description: "",
    skills_required: "",
    experience_required: "",
    date_posted: new Date().toISOString().split("T")[0],
    url: "",
    job_type: "Full-time",
    application_deadline: "",
    salary_range: "",
  });

  // Effects
  useEffect(() => {
    const count = notifications.filter((notification) => !notification.read).length;
    setUnreadNotifications(count);
  }, [notifications]);

  useEffect(() => {
    const bookmarked = originalJobs.filter((job) => job.isBookmarked);
    setBookmarkedJobs(bookmarked);
  }, [originalJobs]);

  // Admin mode toggle
  const toggleAdminMode = () => {
    setIsAdmin(!isAdmin);
    setShowJobForm(false);
    setActiveTab("dashboard");
  };

  // Search method toggle
  const toggleSearchMethod = () => {
    setSearchMethod((prev) => (prev === "local" ? "api" : "local"));
  };

  // Mark notification as read
  const markNotificationAsRead = (id: number) => {
    const updatedNotifications = notifications.map((notification) =>
      notification.id === id ? { ...notification, read: true } : notification
    );
    setNotifications(updatedNotifications);
  };

  // Mark all notifications as read
  const markAllNotificationsAsRead = () => {
    const updatedNotifications = notifications.map((notification) => ({
      ...notification,
      read: true,
    }));
    setNotifications(updatedNotifications);
  };

  const fetchJobsFromBackend = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/jobs");
      console.log("Jobs JSON Data:", response.data);
      setJobs(response.data);
      setOriginalJobs(response.data);
      // Optionally update matching if resumes exist:
      const updated = await applyResumeMatching(response.data);
      setJobs(updated);
    } catch (error: any) {
      console.error("Error fetching jobs:", error);
    }
  };

  useEffect(() => {
    fetchJobsFromBackend();
  }, []);
  

  // Filter jobs (local search)
  const filterJobs = (jobsToFilter: Job[], query: string, loc: string) => {
    return jobsToFilter.filter((job) => {
      const matchesKeyword =
        !query ||
        job.title.toLowerCase().includes(query.toLowerCase()) ||
        job.description.toLowerCase().includes(query.toLowerCase()) ||
        job.skills_required.toLowerCase().includes(query.toLowerCase()) ||
        job.company.toLowerCase().includes(query.toLowerCase()) ||
        (job.keywords &&
          job.keywords.some((keyword) =>
            keyword.toLowerCase().includes(query.toLowerCase())
          ));
      const matchesLocation = !loc || job.location.toLowerCase().includes(loc.toLowerCase());
      return matchesKeyword && matchesLocation;
    });
  };
  // const applyResumeMatching = async (jobsData: Job[]) => {
  //   const resumes = profileData.resumes?.map((resume) => ({
  //     filename: resume.name,
  //     text: resume.text || "" // ensure that extracted text is stored here
  //   })) || [];
  //   if (resumes.length === 0) return jobsData;
  //   try {
  //     const response = await axios.post("http://localhost:5001/api/match-jobs", {
  //       jobs: jobsData,
  //       resumes: resumes,
  //     });
  //     if (response.data) {
  //       return response.data;
  //     }
  //   } catch (err) {
  //     console.error("Error in resume matching:", err);
  //     return jobsData;
  //   }
  //   return jobsData;
  // };
  const applyResumeMatching = async (jobsData: Job[]): Promise<Job[]> => {
    const resumes = profileData.resumes?.map((resume) => ({
      id: resume.id,
      name: resume.name,
      text: resume.text || ""
    })) || [];
    
    if (resumes.length === 0) return jobsData;
    try {
      const response = await axios.post("http://localhost:5001/api/match-jobs", {
        jobs: jobsData,
        resumes: resumes,
      });
      if (response.data) {
        return response.data;
      }
    } catch (err) {
      console.error("Error in resume matching:", err);
      return jobsData;
    }
    return jobsData;
  };
  
  const handleGetATSScore = async (resumeId: string) => {
    // Optionally, you can set a loading state here if desired.
    try {
      const response = await fetch(`/api/analyze-resume/${resumeId}`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to analyze resume');
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      // Open a new window/tab and write the HTML report into it.
      const newWindow = window.open("", "_blank");
      if (newWindow) {
        newWindow.document.write(data.html_report);
        newWindow.document.close();
      } else {
        setError("Popup blocked. Please allow popups for this site.");
      }
      // (Optional) You can also add notifications or update state here if needed.
    } catch (error) {
      console.error('Error analyzing resume:', error);
      setError("Failed to analyze resume. Please try again later.");
    }
  };
  

  // API-based job search
  const searchJobsViaAPI = async (keyword: string, loc: string) => {
    setIsFetchingFromAPI(true);
    setError(null);
  
    try {
      const response = await axios.post("http://localhost:5001/api/jobs/search", {
        keyword,
        location: loc,
        profile_id: profileData.id,
      });
  
      let apiJobs = response.data.map((job: any, index: number) => ({
        id: index + 1000,
        title: job.title || "Untitled Position",
        company: job.company || "Unknown Company",
        location: job.location || loc || "Remote",
        description: job.description || "No description available",
        skills_required: job.skills_required || "",
        experience_required: job.experience_required || "Not specified",
        date_posted: job.date_posted || new Date().toISOString().split("T")[0],
        url: job.url || "#",
        keywords: job.keywords || [],
        application_deadline: job.application_deadline || "",
        job_type: job.job_type || "Full-time",
        salary_range: job.salary_range || "Not disclosed",
        isBookmarked: false,
        match_percentage: job.match_percentage !== undefined ? job.match_percentage : 0, // Default value
        best_resume: job.best_resume || null,
        improvement_suggestions: job.improvement_suggestions || null,
      }));
  
      setJobs(apiJobs);
    } catch (err) {
      console.error("Error searching jobs via API:", err);
      setError("Failed to fetch jobs from the API. Please try again later.");
    } finally {
      setIsFetchingFromAPI(false);
    }
  };
  

  // Handle search
  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);
    let filteredJobs: Job[] = [];
    if (searchMethod === "api") {
      await searchJobsViaAPI(searchQuery, location);
    } else {
      filteredJobs = filterJobs(originalJobs, searchQuery, location);
      filteredJobs = await applyResumeMatching(filteredJobs);
      setJobs(filteredJobs);
      if (filteredJobs.length === 0) {
        setError("No matching jobs found. Try different search terms or location.");
      }
    }
    setIsLoading(false);
  };
  

  // Handle profile changes
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle notification preference changes
  const handleNotificationPrefChange = (setting: string, value: boolean) => {
    setProfileData((prev) => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [setting]: value,
      },
    }));
  };

  // Handle resume upload
  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    setProfileData((prev) => ({ ...prev, resume: file }));

    if (file) {
      const newNotification = {
        id: Date.now(),
        title: "Resume updated",
        message: `Your resume "${file.name}" has been successfully uploaded`,
        date: new Date().toISOString().split("T")[0],
        read: false,
        type: "system" as const,
      };
      setNotifications((prev) => [newNotification, ...prev]);
    }
  };

  // Handle profile submission
  const handleProfileSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Process profile submission (e.g., saving profile details) without altering job match percentages.
    setTimeout(() => {
      const newNotification = {
        id: Date.now(),
        title: "Profile updated",
        message: "Your profile has been successfully updated",
        date: new Date().toISOString().split("T")[0],
        read: false,
        type: "system" as const,
      };
      setNotifications((prev) => [newNotification, ...prev]);
      setIsLoading(false);
    }, 800);
  };

  // Toggle bookmark
  const toggleBookmark = (jobId: number) => {
    setOriginalJobs((prev) =>
      prev.map((job) =>
        job.id === jobId ? { ...job, isBookmarked: !job.isBookmarked } : job
      )
    );
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId ? { ...job, isBookmarked: !job.isBookmarked } : job
      )
    );
    const job = originalJobs.find((j) => j.id === jobId);
    if (job) {
      if (!job.isBookmarked) {
        setUserStats((prev) => ({ ...prev, bookmarkedJobs: prev.bookmarkedJobs + 1 }));
      } else {
        setUserStats((prev) => ({ ...prev, bookmarkedJobs: prev.bookmarkedJobs - 1 }));
      }
    }
  };

  

  // Admin: handle new job posting
  const handleAddJob = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newJobWithId: Job = {
      ...newJob, id: Date.now(),
      best_resume: undefined,
      improvement_suggestions: undefined
    };
    setOriginalJobs((prev) => {
      const updatedJobs = [newJobWithId, ...prev];
      // Update the displayed jobs as well
      setJobs(updatedJobs);
      return updatedJobs;
    });
    setNewJob({
      title: "",
      company: "",
      location: "",
      description: "",
      skills_required: "",
      experience_required: "",
      date_posted: new Date().toISOString().split("T")[0],
      url: "",
      job_type: "Full-time",
      application_deadline: "",
      salary_range: "",
    });
    setShowJobForm(false);
  };
  

  const handleNewJobChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewJob((prev) => ({ ...prev, [name]: value }));
  };

  const handleJobTypeChange = (value: string) => {
    setNewJob((prev) => ({ ...prev, job_type: value }));
  };

  // Render admin interface
  const renderAdminInterface = () => {
    if (!isAdmin) return null;
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="w-6 h-6" />
            Admin Dashboard
          </h2>
          <div className="flex gap-4">
            <Button onClick={() => setShowJobForm(!showJobForm)}>
              <ToggleLeft className="w-4 h-4 mr-2" />
              {showJobForm ? "Hide Job Form" : "Post New Job"}
            </Button>
            <Button variant="outline" onClick={toggleAdminMode}>
              Exit Admin Mode
            </Button>
          </div>
        </div>
        {showJobForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Job Posting</CardTitle>
              <CardDescription>Fill in the details below to post a new job opportunity</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddJob} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Job Title</Label>
                    <Input id="title" name="title" value={newJob.title} onChange={handleNewJobChange} required />
                  </div>
                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input id="company" name="company" value={newJob.company} onChange={handleNewJobChange} required />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" name="location" value={newJob.location} onChange={handleNewJobChange} required />
                  </div>
                  <div>
                    <Label htmlFor="job_type">Job Type</Label>
                    <select id="job_type" name="job_type" value={newJob.job_type} onChange={handleNewJobChange} className="border rounded p-2">
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="description">Job Description</Label>
                    <Textarea id="description" name="description" value={newJob.description} onChange={handleNewJobChange} rows={4} required />
                  </div>
                  <div>
                    <Label htmlFor="skills_required">Skills Required</Label>
                    <Input id="skills_required" name="skills_required" value={newJob.skills_required} onChange={handleNewJobChange} required />
                  </div>
                  <div>
                    <Label htmlFor="experience_required">Experience Required</Label>
                    <Input id="experience_required" name="experience_required" value={newJob.experience_required} onChange={handleNewJobChange} required />
                  </div>
                  <div>
                    <Label htmlFor="application_deadline">Application Deadline</Label>
                    <Input id="application_deadline" type="date" name="application_deadline" value={newJob.application_deadline} onChange={handleNewJobChange} />
                  </div>
                  <div>
                    <Label htmlFor="salary_range">Salary Range</Label>
                    <Input id="salary_range" name="salary_range" value={newJob.salary_range} onChange={handleNewJobChange} />
                  </div>
                  <div>
                    <Label htmlFor="url">Application URL</Label>
                    <Input id="url" name="url" value={newJob.url} onChange={handleNewJobChange} required />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit">Post Job</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Job Listings & Applications</CardTitle>
            <CardDescription>Manage jobs and view applicant details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {originalJobs.map((job) => {
              const jobApplications = applications.filter((app) => app.jobId === job.id);
              return (
                <Card key={job.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">{job.title}</h3>
                        <div className="flex items-center text-sm text-gray-500">
                          <Briefcase className="h-4 w-4 mr-1" />
                          {job.company} • {job.location}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Applications: {jobApplications.length}</Badge>
                          <Badge variant="outline">{job.job_type}</Badge>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setOriginalJobs((prev) => prev.filter((j) => j.id !== job.id))} className="text-red-600">
                          Delete
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">View Applications</Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>{job.title} Applications</DialogTitle>
                              <DialogDescription>{job.company} • {jobApplications.length} applicants</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center">
                                  <Briefcase className="h-4 w-4 mr-2" /> {job.job_type}
                                </div>
                                <div className="flex items-center">
                                  <Award className="h-4 w-4 mr-2" /> {job.experience_required}
                                </div>
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-2" /> Posted: {job.date_posted}
                                </div>
                              </div>
                              <div>
                                <h3 className="font-semibold mb-3">Applicants</h3>
                                {jobApplications.length > 0 ? (
                                  <div className="space-y-3">
                                    {jobApplications.map((app, index) => (
                                      <div key={app.id} className="border rounded-lg p-3">
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <p className="font-medium">Applicant #{index + 1}</p>
                                            <p className="text-sm text-gray-600">Status: <span className="capitalize">{app.status}</span></p>
                                            <p className="text-xs text-gray-500">Applied on: {app.date}</p>
                                          </div>
                                          <Button variant="outline" size="sm">View Profile</Button>
                                        </div>
                                        <div className="mt-2 text-sm">
                                          <p>Notes: {app.notes}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-4 text-gray-500">No applications received yet</div>
                                )}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6 border-b pb-4 bg-violet-200 p-4 rounded-lg">
        <h1 className="text-3xl font-bold flex items-center">
          <Briefcase className="w-8 h-8 mr-2 text-blue-600" /> Career Hub {isAdmin && "(Admin Mode)"}
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={`text-sm ${searchMethod === "api" ? "text-green-600 font-medium" : "text-gray-900"}`}>
              {searchMethod === "api" ? "API Search" : "Local Search"}
            </span>
            <Button variant="outline" size="sm" onClick={toggleSearchMethod} className={`text-xs px-2 py-1 h-8 ${searchMethod === "api" ? "bg-green-50" : ""}`}>
              <ToggleLeft className="w-4 h-4 mr-1" /> Toggle
            </Button>
          </div>
          <div className="flex items-center gap-4">
          <Button onClick={fetchJobsFromBackend} variant="outline" size="sm">
            Refresh Jobs
          </Button>
          {/* Additional header controls */}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm ${isAdmin ? "text-blue-600 font-medium" : "text-gray-900"}`}>
              {isAdmin ? "Admin Mode" : "Student Mode"}
            </span>
            <Button variant="outline" size="sm" onClick={toggleAdminMode} className={`text-xs px-2 py-1 h-8 ${isAdmin ? "bg-blue-50" : ""}`}>
              <ToggleLeft className="w-4 h-4 mr-1" /> Toggle
            </Button>
          </div>
          <Popover open={showNotifications} onOpenChange={setShowNotifications}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs">
                    {unreadNotifications}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-medium">Notifications</h3>
                {unreadNotifications > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllNotificationsAsRead} className="text-xs h-8">
                    Mark all as read
                  </Button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No notifications</div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-b hover:bg-gray-50 ${!notification.read ? "bg-blue-50" : ""}`}
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <div className="flex gap-3">
                        <span className="text-sm font-medium">{notification.title}</span>
                        <span className="text-xs text-gray-600">{notification.date}</span>
                      </div>
                      <p className="text-xs text-gray-600">{notification.message}</p>
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
          <Avatar className="h-8 w-8">
            <AvatarImage src={profileData.avatarUrl} />
            <AvatarFallback>
              {profileData.fullName.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
      {isAdmin ? (
        renderAdminInterface()
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-1">
              <Home className="h-4 w-4" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex items-center gap-1">
              <Briefcase className="h-4 w-4" /> Jobs
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center gap-1">
              <FileText className="h-4 w-4" /> Applications
            </TabsTrigger>
            <TabsTrigger value="bookmarks" className="flex items-center gap-1">
              <Bookmark className="h-4 w-4" /> Bookmarks
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-1">
              <Avatar className="h-4 w-4">
                <AvatarFallback>{profileData.fullName.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
              </Avatar>
              Profile
            </TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard">
            <DashboardTab
              profileData={profileData}
              userStats={userStats}
              applications={applications}
              originalJobs={originalJobs}
              setActiveTab={setActiveTab}
            />
          </TabsContent>
          <TabsContent value="jobs">
          <JobsTab
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            location={location}
            setLocation={setLocation}
            isLoading={isLoading}
            isFetchingFromAPI={isFetchingFromAPI}
            error={error}
            handleSearch={handleSearch}
            jobs={jobs}
            setActiveTab={setActiveTab}
          />
          </TabsContent>
          <TabsContent value="applications">
            <ApplicationsTab applications={applications} originalJobs={originalJobs} />
          </TabsContent>
          <TabsContent value="bookmarks">
            <BookmarksTab bookmarkedJobs={bookmarkedJobs} toggleBookmark={toggleBookmark} />
          </TabsContent>
          <TabsContent value="profile">
            <ProfileTab
              profileData={profileData}
              educationList={educationList}
              isLoading={isLoading}
              setNotifications={setNotifications}
              setError={setError}
              handleProfileChange={handleProfileChange}
              handleProfileSubmit={handleProfileSubmit}
              handleNotificationPrefChange={handleNotificationPrefChange}
              setProfileData={setProfileData}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default JobPortal;