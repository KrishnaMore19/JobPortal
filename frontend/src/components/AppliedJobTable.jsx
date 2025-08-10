import React from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Badge } from './ui/badge';
import { useSelector } from 'react-redux';

const AppliedJobTable = () => {
  const { allAppliedJobs } = useSelector((store) => store.job);

  if (!allAppliedJobs || allAppliedJobs.length === 0) {
    return (
      <div className="bg-gradient-to-b from-[#F4F0FF] via-[#F9F9FF] to-white py-16 rounded-xl text-center px-4">
        <h3 className="text-xl font-semibold text-[#3A2175] mb-2">
          No applications yet
        </h3>
        <p className="text-gray-600">You haven't applied to any jobs yet.</p>
      </div>
    );
  }

  return (
    <section className="bg-gradient-to-b from-[#F4F0FF] via-[#F9F9FF] to-white py-10 rounded-xl shadow-sm px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#3A2175]">
            Your <span className="text-[#6A38C2]">Applied</span> Jobs
          </h2>
          <p className="text-gray-600 mt-1">Track your job application status</p>
        </div>

        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <Table>
            <TableCaption className="text-sm text-gray-500">
              A list of jobs you’ve applied to
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Job Role</TableHead>
                <TableHead>Company</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allAppliedJobs.map((appliedJob) => (
                <TableRow key={appliedJob._id}>
                  <TableCell>{appliedJob?.createdAt?.split('T')[0]}</TableCell>
                  <TableCell className="font-medium text-gray-800">
                    {appliedJob.job?.title}
                  </TableCell>
                  <TableCell>{appliedJob.job?.company?.name}</TableCell>
                  <TableCell className="text-right">
                    <Badge
                      className={`text-white px-3 py-1 rounded-full ${
                        appliedJob?.status === 'rejected'
                          ? 'bg-red-500'
                          : appliedJob?.status === 'pending'
                          ? 'bg-gray-500'
                          : 'bg-green-500'
                      }`}
                    >
                      {appliedJob.status?.toUpperCase() || 'PENDING'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
};

export default AppliedJobTable;
