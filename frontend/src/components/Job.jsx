import React from 'react';
import { Button } from './ui/button';
import { Bookmark } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { saveJob } from '@/redux/jobSlice';
import { toast } from 'sonner';
import axios from 'axios';
import { USER_API_END_POINT } from '@/utils/constant';

const Job = ({ job }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { savedJobs = [] } = useSelector(store => store.job);
  const isSaved = savedJobs.some(savedJob => savedJob._id === job._id);

  const daysAgoFunction = (mongodbTime) => {
    const createdAt = new Date(mongodbTime);
    const currentTime = new Date();
    const timeDifference = currentTime - createdAt;
    return Math.floor(timeDifference / (1000 * 24 * 60 * 60));
  }

  const handleSaveJob = async () => {
    try {
      const response = await axios.post(
        `${USER_API_END_POINT}/save-job/${job._id}`,
        {},
        { withCredentials: true }
      );

      if (response.data.success) {
        dispatch(saveJob(job));
        toast.success("Job saved successfully");
      }
    } catch (error) {
      console.error("Error saving job:", error);
      toast.error(error.response?.data?.message || "Failed to save job");
    }
  };

  return (
    <div className="p-6 rounded-xl border bg-gradient-to-br from-[#F4F0FF] via-[#F9F9FF] to-white shadow-md hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {daysAgoFunction(job?.createdAt) === 0 ? "Today" : `${daysAgoFunction(job?.createdAt)} days ago`}
        </p>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full hover:scale-110 transition-transform"
        >
          <Bookmark className="text-purple-600" />
        </Button>
      </div>

      <div className="flex items-center gap-3 my-4">
        <Avatar className="bg-white shadow">
          <AvatarImage
            src={
              job?.company?.logo &&
              job?.company?.logo !== "https://res.cloudinary.com/dqgvjqjqj/image/upload/v1710000000/default-company-logo.png"
                ? job?.company?.logo
                : undefined
            }
          />
          <AvatarFallback className="bg-[#6A38C2] text-white text-lg font-semibold">
            {job?.company?.name?.charAt(0)}
          </AvatarFallback>
        </Avatar>

        <div>
          <h2
            className="font-semibold text-lg text-[#3A2175] hover:underline cursor-pointer"
            onClick={() => navigate(`/company/${job?.company?._id}`)}
          >
            {job?.company?.name}
          </h2>
          <p className="text-sm text-gray-500">India</p>
        </div>
      </div>

      <div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">{job?.title}</h1>
        <p className="text-sm text-gray-600 line-clamp-3">{job?.description}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-4">
        <Badge className="text-indigo-700 font-semibold bg-indigo-100" variant="ghost">
          {job?.position} Positions
        </Badge>
        <Badge className="text-pink-700 font-semibold bg-pink-100" variant="ghost">
          {job?.jobType}
        </Badge>
        <Badge className="text-emerald-700 font-semibold bg-emerald-100" variant="ghost">
          {job?.salary} LPA
        </Badge>
      </div>

      <div className="flex items-center gap-4 mt-5">
        <Button
          onClick={() => navigate(`/description/${job?._id}`)}
          variant="outline"
          className="border-purple-300 text-purple-700 hover:bg-purple-50"
        >
          Details
        </Button>
        <Button
          onClick={handleSaveJob}
          className={`${
            isSaved
              ? 'bg-gray-500 hover:bg-gray-600'
              : 'bg-[#4B2993] hover:bg-[#3A2175]'
          } text-white`}
          disabled={isSaved}
        >
          {isSaved ? 'Saved' : 'Save For Later'}
        </Button>
      </div>
    </div>
  );
};

export default Job;
