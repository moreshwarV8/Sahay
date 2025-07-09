import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader, Upload, PlusCircle, FileText, Trash, Eye } from "lucide-react";
import { Profile, Education, Resume, Notification } from "./types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface ProfileTabProps {
  profileData: Profile;
  educationList: Education[];
  isLoading: boolean;
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  setError: (message: string) => void;
  handleProfileChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleProfileSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  handleNotificationPrefChange: (setting: string, value: boolean) => void;
  setProfileData: React.Dispatch<React.SetStateAction<Profile>>;
}

const ProfileTab: React.FC<ProfileTabProps> = ({
  profileData,
  educationList,
  isLoading,
  setNotifications,
  setError,
  handleProfileChange,
  handleProfileSubmit,
  handleNotificationPrefChange,
  setProfileData,
}) => {
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [resumePreviewOpen, setResumePreviewOpen] = useState(false);
  const [selectedResumeScore, setSelectedResumeScore] = useState<Resume | null>(null);
  const [recommendationsOpen, setRecommendationsOpen] = useState(false);
  const [scoreDetailsOpen, setScoreDetailsOpen] = useState(false);

  // Triggered when the user selects a resume file to upload.
  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) return;
    const resumeId = Date.now().toString();
    const url = URL.createObjectURL(file);
    const newResume: Resume = {
      id: resumeId,
      name: file.name,
      file: file,
      url: url,
      uploadDate: new Date().toISOString(),
      scoreLoading: false,
      text: "" // This field should later be updated with the extracted resume text
    };
    setProfileData(prev => ({
      ...prev,
      resumes: [...(prev.resumes || []), newResume],
    }));
    // Upload resume to server (and trigger text extraction on the backend, if available)
    uploadResumeToServer(newResume);
  };

  // Uploads the resume file to the server.
  const uploadResumeToServer = async (resume: Resume) => {
    try {
      const formData = new FormData();
      formData.append('resume', resume.file);
      let userId: string = profileData.id;
      if (!userId) {
        try {
          const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
          userId = storedUser.id;
        } catch (err) {
          userId = '';
        }
      }
      if (!userId || userId.length !== 24) {
        throw new Error("Invalid user ID. Please log in again.");
      }
      formData.append('userId', userId);
      formData.append('resumeId', resume.id);
      const response = await fetch('http://localhost:5000/api/resume', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload resume');
      }
      const data = await response.json();
      console.log('Resume uploaded successfully:', data);
      // Update resume with URL and extracted text
      setProfileData(prev => ({
        ...prev,
        resumes: prev.resumes.map(r =>
          r.id === resume.id ? { ...r, url: data.fileUrl, text: data.extractedText || "" } : r
        )
      }));
    } catch (error) {
      console.error('Error uploading resume:', error);
      setError("Failed to upload resume. Please try again later.");
    }
  };

  const handleViewResume = (resume: Resume) => {
    if (resume.url) {
      window.open(resume.url, '_blank');
    } else {
      setError("No resume file available for preview.");
    }
  };

  const handleDeleteResume = async (resumeId: string) => {
    try {
      const response = await fetch(`/api/delete-resume/${resumeId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete resume');
      }
      // Revoke the object URL to free up memory.
      const resumeToDelete = profileData.resumes.find(r => r.id === resumeId);
      setProfileData(prev => ({
        ...prev,
        resumes: prev.resumes.filter(r => r.id !== resumeId)
      }));
      if (resumeToDelete && resumeToDelete.url.startsWith('blob:')) {
        URL.revokeObjectURL(resumeToDelete.url);
      }
    } catch (error) {
      console.error('Error deleting resume:', error);
      setError("Failed to delete resume. Please try again later.");
    }
  };

  const handleGetATSScore = async (resumeId: string) => {
    // Set loading state for the resume.
    setProfileData(prev => ({
      ...prev,
      resumes: prev.resumes.map(r =>
        r.id === resumeId ? { ...r, scoreLoading: true } : r
      )
    }));
    try {
      const response = await fetch(`http://localhost:5000/api/analyze-resume/${resumeId}`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to analyze resume');
      }
      const scoreData = await response.json();
      setProfileData(prev => ({
        ...prev,
        resumes: prev.resumes.map(r =>
          r.id === resumeId ? {
            ...r,
            score: scoreData.overall_score,
            categoryScores: scoreData.category_scores,
            feedback: scoreData.feedback,
            recommendations: scoreData.recommendations,
            scoreLoading: false
          } : r
        )
      }));

      const resumeName = profileData.resumes.find(r => r.id === resumeId)?.name || "Your resume";
      const newNotification = {
        id: Date.now(),
        title: "Resume Analysis Complete",
        message: `${resumeName} has been analyzed.`,
        date: new Date().toISOString().split("T")[0],
        read: false,
        type: "system" as const,
      };
      setNotifications(prev => [newNotification, ...prev]);
    } catch (error) {
      console.error('Error analyzing resume:', error);
      setProfileData(prev => ({
        ...prev,
        resumes: prev.resumes.map(r =>
          r.id === resumeId ? { ...r, scoreLoading: false } : r
        )
      }));
      setError("Failed to analyze resume. Please try again later.");
    }
  };

  const handleViewAtsScore = (resumeId: string) => {
    const resume = profileData.resumes.find(r => r.id === resumeId);
    if (resume && resume.score !== undefined) {
      setSelectedResumeScore(resume);
      setScoreDetailsOpen(true);
    } else {
      setError("No ATS score available. Please analyze this resume first.");
    }
  };

  const handleViewRecommendations = (resumeId: string) => {
    const resume = profileData.resumes.find(r => r.id === resumeId);
    if (resume && resume.score !== undefined) {
      setSelectedResumeScore(resume);
      setRecommendationsOpen(true);
    } else {
      setError("No recommendations available. Please analyze this resume first.");
    }
  };

  const handleDownloadRecommendations = (resume: Resume) => {
    const htmlReport = generateHTMLReport(resume);
    const blob = new Blob([htmlReport], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Resume_Analysis_${resume.name.split('.')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateHTMLReport = (resume: Resume) => {
    const getScoreColor = (score: number) => {
      if (score >= 80) return "green";
      if (score >= 60) return "orange";
      return "red";
    };
    const formatCategoryName = (category: string) => {
      return category
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Resume Evaluation Results</title>
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
          <style>
              body { background-color: #f8f9fa; padding: 2rem; }
              .results-container { max-width: 800px; margin: 0 auto; background-color: #fff; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1); padding: 2rem; }
              .header { text-align: center; margin-bottom: 2rem; }
              .score-circle { width: 120px; height: 120px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: bold; color: white; margin: 0 auto 1.5rem; }
              .feedback-card { margin-bottom: 1rem; border-left: 5px solid #007bff; }
              .recommendation-item { background-color: #f8f9fa; border-left: 4px solid #28a745; padding: 1rem; margin-bottom: 0.5rem; border-radius: 0 4px 4px 0; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="results-container">
                  <div class="header">
                      <h1>Resume Evaluation Results</h1>
                      <p class="text-muted">File: ${resume.name}</p>
                      <p class="text-muted">Evaluated on: ${new Date().toLocaleString()}</p>
                  </div>
                  <div class="text-center mb-4">
                      <div class="score-circle" style="background-color: ${getScoreColor(resume.score || 0)};">
                          ${resume.score}/100
                      </div>
                      <h3>Overall Score</h3>
                  </div>
                  <div class="card mb-4">
                      <div class="card-header bg-primary text-white">
                          <h4 class="mb-0">Category Scores</h4>
                      </div>
                      <div class="card-body">
                          ${resume.categoryScores ? Object.entries(resume.categoryScores).map(([category, score]) => `
                          <div class="mb-3">
                              <div class="d-flex justify-content-between">
                                  <label>${formatCategoryName(category)}</label>
                                  <span>${score}/100</span>
                              </div>
                              <div class="progress">
                                  <div class="progress-bar bg-${Number(score) >= 80 ? 'success' : Number(score) >= 60 ? 'warning' : 'danger'}" 
                                       role="progressbar" style="width: ${score}%;" 
                                       aria-valuenow="${score}" aria-valuemin="0" aria-valuemax="100">${score}%</div>
                              </div>
                          </div>
                          `).join('') : ''}
                      </div>
                  </div>
                  <div class="card mb-4">
                      <div class="card-header bg-info text-white">
                          <h4 class="mb-0">Detailed Feedback</h4>
                      </div>
                      <div class="card-body">
                          ${resume.feedback ? Object.entries(resume.feedback).map(([category, feedback]) => `
                          <div class="card feedback-card mb-3">
                              <div class="card-body">
                                  <h5 class="card-title">${formatCategoryName(category)}</h5>
                                  <p class="card-text">${feedback}</p>
                              </div>
                          </div>
                          `).join('') : ''}
                      </div>
                  </div>
                  <div class="card">
                      <div class="card-header bg-success text-white">
                          <h4 class="mb-0">Recommendations for Improvement</h4>
                      </div>
                      <div class="card-body">
                          ${resume.recommendations ? resume.recommendations.map(recommendation => `
                          <div class="recommendation-item">
                              ${recommendation}
                          </div>
                          `).join('') : ''}
                      </div>
                  </div>
              </div>
          </div>
      </body>
      </html>
    `;
  };

  // Function to get styling for score badges
  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Profile</CardTitle>
        <CardDescription>Manage your personal information and preferences</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                value={profileData.fullName}
                onChange={handleProfileChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                name="email"
                value={profileData.email}
                onChange={handleProfileChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={profileData.phone}
                onChange={handleProfileChange}
              />
            </div>
            <div>
              <Label htmlFor="skills">Skills</Label>
              <Input
                id="skills"
                name="skills"
                value={profileData.skills}
                onChange={handleProfileChange}
                placeholder="Separate skills with commas"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="experience">Experience</Label>
              <Textarea
                id="experience"
                name="experience"
                value={profileData.experience}
                onChange={handleProfileChange}
                rows={3}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="education">Education</Label>
              <div className="space-y-4">
                {educationList.map((edu, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="font-medium">
                      {edu.degree} in {edu.field}
                    </div>
                    <div className="text-sm text-gray-600">{edu.university}</div>
                    <div className="text-sm text-gray-500">{edu.year}</div>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  <PlusCircle className="h-4 w-4 mr-2" /> Add Education
                </Button>
              </div>
            </div>
            <div className="md:col-span-2">
              <Label>Resumes</Label>
              <div className="space-y-4">
                {profileData.resumes && profileData.resumes.length > 0 ? (
                  <div className="space-y-3">
                    {profileData.resumes.map((resume, index) => (
                      <div key={index} className="flex items-center justify-between border rounded-lg p-4">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 mr-2 text-blue-500" />
                          <div>
                            <div className="font-medium">{resume.name}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(resume.uploadDate).toLocaleDateString()}{" "}
                              {resume.score && (
                                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getScoreBadgeColor(resume.score)}`}>
                                  ATS Score: {resume.score}/100
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewResume(resume)}>
                            View Resume
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGetATSScore(resume.id)}
                            disabled={resume.scoreLoading}
                          >
                            {resume.scoreLoading ? (
                              <>
                                <Loader className="h-3 w-3 animate-spin mr-1" /> Analyzing
                              </>
                            ) : resume.score ? "Re-Analyze" : "Get ATS Score"}
                          </Button>
                          {resume.score && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => handleViewAtsScore(resume.id)}>
                                <Eye className="h-3 w-3 mr-1" /> View Score
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleViewRecommendations(resume.id)}>
                                Recommendations
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleDownloadRecommendations(resume)}>
                                Download Report
                              </Button>
                            </>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500"
                            onClick={() => handleDeleteResume(resume.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <Label
                      htmlFor="resume"
                      className="flex flex-1 items-center gap-2 rounded-md border p-4 hover:bg-gray-50 cursor-pointer"
                    >
                      <Upload className="h-5 w-5" />
                      <span>Upload your resume</span>
                    </Label>
                    <Input
                      id="resume"
                      type="file"
                      className="hidden"
                      onChange={handleResumeUpload}
                      accept=".pdf,.doc,.docx"
                    />
                  </div>
                )}
                {profileData.resumes && profileData.resumes.length > 0 && (
                  <div className="flex items-center gap-4">
                    <Label
                      htmlFor="resume-upload"
                      className="flex flex-1 items-center gap-2 rounded-md border p-4 hover:bg-gray-50 cursor-pointer"
                    >
                      <Upload className="h-5 w-5" />
                      <span>Upload another resume</span>
                    </Label>
                    <Input
                      id="resume-upload"
                      type="file"
                      className="hidden"
                      onChange={handleResumeUpload}
                      accept=".pdf,.doc,.docx"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="md:col-span-2">
              <Label>Notification Preferences</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Email Notifications</div>
                    <div className="text-sm text-gray-500">Receive important updates via email</div>
                  </div>
                  <Switch
                    checked={profileData.notificationPreferences?.email || false}
                    onCheckedChange={(checked) => handleNotificationPrefChange("email", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Job Alerts</div>
                    <div className="text-sm text-gray-500">Get notified about new job matches</div>
                  </div>
                  <Switch
                    checked={profileData.notificationPreferences?.jobAlerts || false}
                    onCheckedChange={(checked) => handleNotificationPrefChange("jobAlerts", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Application Updates</div>
                    <div className="text-sm text-gray-500">Stay informed about your applications</div>
                  </div>
                  <Switch
                    checked={profileData.notificationPreferences?.applicationUpdates || false}
                    onCheckedChange={(checked) =>
                      handleNotificationPrefChange("applicationUpdates", checked)
                    }
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin mr-2" /> Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </CardContent>

      {/* ATS Score Details Dialog */}
      <Dialog open={scoreDetailsOpen} onOpenChange={setScoreDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Resume ATS Score: {selectedResumeScore?.score}/100
            </DialogTitle>
          </DialogHeader>
          {selectedResumeScore && (
            <div className="space-y-4">
              <div className="grid gap-4">
                <h3 className="text-lg font-semibold">Category Scores</h3>
                {selectedResumeScore.categoryScores && 
                  Object.entries(selectedResumeScore.categoryScores).map(([category, score]) => {
                    const categoryName = category
                      .split('_')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ');
                    
                    let badgeColor = "bg-red-100 text-red-800";
                    if (Number(score) >= 80) {
                      badgeColor = "bg-green-100 text-green-800";
                    } else if (Number(score) >= 60) {
                      badgeColor = "bg-yellow-100 text-yellow-800";
                    }
                    
                    return (
                      <div key={category} className="flex justify-between items-center">
                        <span>{categoryName}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${badgeColor}`}>
                          {score}/100
                        </span>
                      </div>
                    );
                  })
                }
              </div>
              
              <div className="grid gap-4">
                <h3 className="text-lg font-semibold">Detailed Feedback</h3>
                {selectedResumeScore.feedback && 
                  Object.entries(selectedResumeScore.feedback).map(([category, feedback]) => {
                    const categoryName = category
                      .split('_')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ');
                    
                    return (
                      <div key={category} className="border-l-4 border-blue-500 pl-4 py-2">
                        <h4 className="font-medium">{categoryName}</h4>
                        <p className="text-gray-700">{feedback}</p>
                      </div>
                    );
                  })
                }
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setScoreDetailsOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              if (selectedResumeScore) {
                handleDownloadRecommendations(selectedResumeScore);
              }
            }}>
              Download Full Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recommendations Dialog */}
      <Dialog open={recommendationsOpen} onOpenChange={setRecommendationsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Resume Improvement Recommendations</DialogTitle>
          </DialogHeader>
          {selectedResumeScore && (
            <div className="space-y-4">
              {selectedResumeScore.recommendations && 
                selectedResumeScore.recommendations.map((recommendation, index) => (
                  <div key={index} className="border-l-4 border-green-500 pl-4 py-2 bg-gray-50">
                    <p>{recommendation}</p>
                  </div>
                ))
              }
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecommendationsOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              if (selectedResumeScore) {
                handleDownloadRecommendations(selectedResumeScore);
              }
            }}>
              Download Full Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ProfileTab;