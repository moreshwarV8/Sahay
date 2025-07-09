// DashboardTab.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MapPin, Briefcase,Percent, Building,Bookmark, Award, Calendar, FileText, Home, PlusCircle } from "lucide-react";
import { Profile, UserStats, Application, Job } from "./types";

interface DashboardTabProps {
  profileData: Profile;
  userStats: UserStats;
  applications: Application[];
  originalJobs: Job[];
  setActiveTab: (tab: string) => void;
}

const DashboardTab: React.FC<DashboardTabProps> = ({
  profileData,
  userStats,
  applications,
  originalJobs,
  setActiveTab,
}) => {
  const renderApplicationStatus = (status: string) => {
    switch (status) {
      case "applied":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Applied</Badge>;
      case "screening":
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Screening</Badge>;
      case "interviewing":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Interviewing</Badge>;
      case "rejected":
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Rejected</Badge>;
      case "offered":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Offered</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Welcome Card */}
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Welcome to Career Hub</CardTitle>
          <CardDescription>Your job search platform for students and recent graduates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-medium mb-2">Hello, {profileData.fullName || "Student"}</h3>
              <p className="text-gray-600">
                {profileData.jobTitle
                  ? `Looking for opportunities as ${profileData.jobTitle}`
                  : "Complete your profile to get personalized job recommendations"}
              </p>
              {profileData.resumes ? (
                <div className="mt-2 flex items-center text-sm text-green-600">
                  <Badge variant="secondary">Resume uploaded</Badge>
                </div>
              ) : (
                <div className="mt-2 flex items-center text-sm text-yellow-600">
                  <Badge variant="secondary">Upload your resume to improve job matching</Badge>
                </div>
              )}
            </div>
            <div className="w-full md:w-auto">
              <Button onClick={() => setActiveTab("jobs")} className="w-full md:w-auto">
                Find Jobs
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {/* Stats Cards */}
      <Card className="transition-all duration-300 hover:shadow-lg hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Applications
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold animate-in slide-in-from-bottom duration-700">
                    {userStats.applicationsSubmitted}
                  </div>
                  <p className="text-xs text-muted-foreground">Jobs applied</p>
                </CardContent>
              </Card>

              {/* Stats Cards */}
              <Card className="transition-all duration-300 hover:shadow-lg hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Bookmarks
                  </CardTitle>
                  <Bookmark className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold animate-in slide-in-from-bottom duration-700">
                    {userStats.bookmarkedJobs}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Saved for later
                  </p>
                </CardContent>
              </Card>

              <Card className="transition-all duration-300 hover:shadow-lg hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Profile Match
                  </CardTitle>
                  <Percent className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold animate-in slide-in-from-bottom duration-700">
                    {userStats.matchScore}%
                  </div>
                  <div className="mt-2">
                    <Progress
                      value={userStats.matchScore}
                      className="h-2 transition-all duration-700 hover:h-3"
                    />
                  </div>
                </CardContent>
              </Card>

      {/* Recent Activity */}
      <Card className="col-span-3 md:col-span-2 transition-all duration-300 hover:shadow-lg">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {applications.length > 0 ? (
                      applications.slice(0, 3).map((app, index) => {
                        const job = originalJobs.find(
                          (j) => j.id === app.jobId
                        );
                        return job ? (
                          <div
                            key={app.id}
                            className="flex items-start gap-4 pb-3 border-b transition-all duration-300 hover:bg-gray-50 hover:pl-2 rounded-md"
                            style={{ animationDelay: `${index * 150}ms` }}
                          >
                            <div className="bg-gray-100 p-2 rounded-full transition-all duration-300 group-hover:bg-primary/10">
                              <Building className="h-5 w-5 text-gray-600 transition-all duration-300 group-hover:text-primary" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">{job.title}</h4>
                              <p className="text-sm text-gray-600">
                                {job.company}
                              </p>
                              <div className="flex items-center mt-1 gap-2">
                                <span className="text-xs text-gray-500">
                                  Applied on {app.date}
                                </span>
                                {renderApplicationStatus(app.status)}
                              </div>
                            </div>
                          </div>
                        ) : null;
                      })
                    ) : (
                      <p className="text-gray-500 animate-in fade-in duration-500">
                        No recent applications
                      </p>
                    )}

                    {applications.length > 0 && (
                      <Button
                        variant="ghost"
                        className="w-full mt-2 transition-all duration-300 hover:bg-primary/10 hover:-translate-y-1"
                        onClick={() => setActiveTab("applications")}
                      >
                        View all applications
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recommended Jobs */}
              <Card className="col-span-3 md:col-span-1 transition-all duration-300 hover:shadow-lg">
                <CardHeader>
                  <CardTitle>Recommended Jobs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {originalJobs.slice(0, 3).map((job, index) => (
                      <div
                        key={job.id}
                        className="flex flex-col gap-2 pb-3 border-b transition-all duration-300 hover:bg-gray-50 hover:pl-2 rounded-md animate-in slide-in-from-right"
                        style={{ animationDelay: `${index * 150}ms` }}
                      >
                        <h4 className="font-medium">{job.title}</h4>
                        <p className="text-sm text-gray-600">{job.company}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <MapPin className="h-3 w-3 transition-all duration-300 group-hover:text-primary" />
                          {job.location}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveTab("jobs")}
                          className="w-full mt-1 transition-all duration-300 hover:bg-primary/10 hover:-translate-y-1"
                        >
                          View Details
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      className="w-full mt-2 transition-all duration-300 hover:bg-primary/10 hover:-translate-y-1"
                      onClick={() => setActiveTab("jobs")}
                    >
                      View more jobs
                    </Button>
                  </div>
                </CardContent>
      </Card>
    </div>
  );
};

export default DashboardTab;
