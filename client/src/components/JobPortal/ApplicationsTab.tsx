// ApplicationsTab.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Building, MapPin, Briefcase, Award, Calendar, Tag, FileText } from "lucide-react";
import { Application, Job } from "./types";

interface ApplicationsTabProps {
  applications: Application[];
  originalJobs: Job[];
}

const ApplicationsTab: React.FC<ApplicationsTabProps> = ({ applications, originalJobs }) => {
  const renderApplicationStatus = (status: string) => {
    switch (status) {
      case "applied":
        return <span className="capitalize text-blue-600">{status}</span>;
      case "screening":
        return <span className="capitalize text-purple-600">{status}</span>;
      case "interviewing":
        return <span className="capitalize text-yellow-600">{status}</span>;
      case "rejected":
        return <span className="capitalize text-red-600">{status}</span>;
      case "offered":
        return <span className="capitalize text-green-600">{status}</span>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Applications</CardTitle>
        <CardDescription>Track the status of your job applications</CardDescription>
      </CardHeader>
      <CardContent>
        {applications.length > 0 ? (
          <div className="space-y-6">
            {applications.map((app) => {
              const job = originalJobs.find((j) => j.id === app.jobId);
              return job ? (
                <div key={app.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium">{job.title}</h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Building className="h-4 w-4 mr-1" /> {job.company}
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <MapPin className="h-4 w-4 mr-1" /> {job.location}
                      </div>
                      <div className="mt-2">{renderApplicationStatus(app.status)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Applied on</div>
                      <div className="font-medium">{app.date}</div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="mt-2">
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Application Details</DialogTitle>
                            <DialogDescription>
                              Status: {app.status} | Applied on {app.date}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid grid-cols-2 gap-4 py-4">
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <Building className="h-4 w-4 mr-2" /> <span>{job.company}</span>
                              </div>
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-2" /> <span>{job.location}</span>
                              </div>
                              <div className="flex items-center">
                                <Briefcase className="h-4 w-4 mr-2" /> <span>{job.job_type}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <Award className="h-4 w-4 mr-2" /> <span>{job.experience_required}</span>
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2" /> <span>Deadline: {job.application_deadline}</span>
                              </div>
                              <div className="flex items-center">
                                <Tag className="h-4 w-4 mr-2" /> <span>Match: {job.match_percentage}%</span>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-medium">Application Notes</h4>
                            <p className="text-sm text-gray-600">{app.notes}</p>
                          </div>
                          <div className="flex justify-end gap-2 mt-4">
                            <Button variant="outline">Withdraw Application</Button>
                            <Button asChild>
                              <a href={job.url} target="_blank" rel="noopener noreferrer">
                                View Job Posting
                              </a>
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              ) : null;
            })}
          </div>
        ) : (
          <div className="text-center py-10">
            <FileText className="h-10 w-10 mx-auto text-gray-400" />
            <h3 className="mt-4 text-lg font-medium">No applications yet</h3>
            <p className="mt-1 text-gray-500">Apply to jobs to track their progress here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ApplicationsTab;
