// BookmarksTab.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark, Building, MapPin } from "lucide-react";
import { Job } from "./types";

interface BookmarksTabProps {
  bookmarkedJobs: Job[];
  toggleBookmark: (jobId: number) => void;
}

const BookmarksTab: React.FC<BookmarksTabProps> = ({ bookmarkedJobs, toggleBookmark }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bookmarked Jobs</CardTitle>
        <CardDescription>Your saved job opportunities</CardDescription>
      </CardHeader>
      <CardContent>
        {bookmarkedJobs.length > 0 ? (
          <div className="space-y-4">
            {bookmarkedJobs.map((job) => (
              <Card key={job.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{job.title}</h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Building className="h-4 w-4 mr-1" /> {job.company}
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <MapPin className="h-4 w-4 mr-1" /> {job.location}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => toggleBookmark(job.id || 0)} className="text-blue-600">
                        <Bookmark className="h-5 w-5 fill-current" />
                      </Button>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <Bookmark className="h-10 w-10 mx-auto text-gray-400" />
            <h3 className="mt-4 text-lg font-medium">No bookmarked jobs</h3>
            <p className="mt-1 text-gray-500">Save jobs by clicking the bookmark icon</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BookmarksTab;
