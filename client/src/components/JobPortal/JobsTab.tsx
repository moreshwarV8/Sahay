import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MapPin,
  Briefcase,
  Award,
  Calendar,
  Percent,
  Loader,
  Search,
  Building,
} from "lucide-react";
import { Job } from "./types";

interface JobsTabProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  isLoading: boolean;
  isFetchingFromAPI: boolean;
  error: string | null;
  handleSearch: () => Promise<void>;
  jobs: Job[];
  setActiveTab: (tab: string) => void;
}

const JobsTab: React.FC<JobsTabProps> = ({
  searchQuery,
  setSearchQuery,
  location,
  setLocation,
  isLoading,
  isFetchingFromAPI,
  error,
  handleSearch,
  jobs,
  setActiveTab,
}) => {
  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle>Search Jobs</CardTitle>
          <CardDescription>Find the perfect job opportunity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Job title, keywords, or company"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="relative flex-1">
                <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={isLoading || isFetchingFromAPI}
                className="min-w-[120px]"
              >
                {isLoading || isFetchingFromAPI ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin mr-2" /> Searching
                  </>
                ) : (
                  "Search"
                )}
              </Button>
            </div>
            {error && (
              <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Job Listings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {jobs.length > 0 ? (
          jobs.map((job) => (
            <Card key={job.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{job.title}</h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Building className="h-4 w-4 mr-1" /> {job.company}
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <MapPin className="h-4 w-4 mr-1" /> {job.location}
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {job.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {job.skills_required &&
                        job.skills_required
                          .split(",")
                          .map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {skill.trim()}
                            </Badge>
                          ))}
                    </div>
                    {job.match_percentage !== undefined ? job.match_percentage : 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        Best Matching Resume:{" "}
                        {job.best_resume ? job.best_resume.name : "N/A"} (Match:{" "}
                        {job.match_percentage}%)
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {job.match_percentage !== undefined && (
                      <Badge className="flex items-center gap-1 bg-green-100 text-green-800">
                        <Percent className="h-4 w-4" /> {job.match_percentage || 0}% Match
                      </Badge>
                    )}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{job.title} Details</DialogTitle>
                          <DialogDescription>
                            {job.company} • Posted: {job.date_posted} • Match:{" "}
                            {job.match_percentage}%
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6">
                          {job.best_resume && (
                            <div className="border p-4 rounded-lg bg-gray-50">
                              <p className="text-sm">
                                Best Matching Resume:{" "}
                                <strong>{job.best_resume.name}</strong>
                              </p>
                            </div>
                          )}
                          {job.improvement_suggestions && (
                            <div className="border p-4 rounded-lg bg-yellow-50">
                              <p className="text-sm">
                                Improvement Suggestions:{" "}
                                <strong>{job.improvement_suggestions}</strong>
                              </p>
                            </div>
                          )}
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-2" /> {job.location}
                              </div>
                              <div className="flex items-center">
                                <Briefcase className="h-4 w-4 mr-2" />{" "}
                                {job.job_type || "Full-time"}
                              </div>
                              <div className="flex items-center">
                                <Award className="h-4 w-4 mr-2" />{" "}
                                {job.experience_required}
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />{" "}
                                {job.date_posted}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Description</h4>
                              <p className="text-sm whitespace-pre-line">
                                {job.description}
                              </p>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Requirements</h4>
                              <div className="flex flex-wrap gap-2">
                                {job.skills_required &&
                                  job.skills_required
                                    .split(",")
                                    .map((skill, index) => (
                                      <Badge key={index} variant="secondary">
                                        {skill.trim()}
                                      </Badge>
                                    ))}
                              </div>
                            </div>
                            <Button asChild>
                              <a
                                href={job.url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Apply Now
                              </a>
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-10 border rounded-lg bg-gray-50 col-span-full">
            <Search className="h-10 w-10 mx-auto text-gray-400" />
            <h3 className="mt-4 text-lg font-medium">No jobs found</h3>
            <p className="mt-1 text-gray-500">
              Try adjusting your search criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobsTab;
