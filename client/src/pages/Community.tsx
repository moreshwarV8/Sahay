import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CommunityHub = () => {
  return (
    <div className="max-w-4xl mx-auto p-4 flex justify-center items-center h-screen">
      <Card className="w-full text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Community Hub</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg text-gray-500">Coming Soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommunityHub;
