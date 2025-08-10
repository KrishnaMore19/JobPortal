import React, { useEffect, useState } from 'react';
import Navbar from './shared/Navbar';      // ✅ navbar
import Footer from './shared/Footer';      // ✅ footer
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { APPLICATION_API_END_POINT, JOB_API_END_POINT } from '@/utils/constant';
import { setSingleJob } from '@/redux/jobSlice';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import CoverLetterGenerator from './genai/CoverLetterGenerator'; // ✅ Import GenAI component
import ResumeTipsGenerator from './genai/ResumeTipsGenerator'; // ✅ Resume Tips component
import JobMatchGenerator from './genai/JobMatchGenerator'; // ✅ NEW: Job Match component

const JobDescription = () => {
  const { singleJob } = useSelector((store) => store.job);
  const { user } = useSelector((store) => store.auth);
  const isIntiallyApplied =
    singleJob?.applications?.some((application) => application.applicant === user?._id) || false;
  const [isApplied, setIsApplied] = useState(isIntiallyApplied);

  const params = useParams();
  const jobId = params.id;
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const applyJobHandler = async () => {
    try {
      const res = await axios.get(`${APPLICATION_API_END_POINT}/apply/${jobId}`, {
        withCredentials: true,
      });

      if (res.data.success) {
        setIsApplied(true);
        const updatedSingleJob = {
          ...singleJob,
          applications: [...singleJob.applications, { applicant: user?._id }],
        };
        dispatch(setSingleJob(updatedSingleJob));
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    }
  };

  useEffect(() => {
    const fetchSingleJob = async () => {
      try {
        const res = await axios.get(`${JOB_API_END_POINT}/get/${jobId}`, {
          withCredentials: true,
        });
        if (res.data.success) {
          dispatch(setSingleJob(res.data.job));
          setIsApplied(
            res.data.job.applications.some(
              (application) => application.applicant === user?._id
            )
          );
        }
      } catch (error) {
        console.log(error);
      }
    };
    fetchSingleJob();
  }, [jobId, dispatch, user?._id]);

  return (
    <>
      <Navbar /> {/* ✅ Navbar added */}

      <div className="bg-[hsl(var(--section-hero))] text-foreground transition-colors duration-300 min-h-screen py-10 px-4 sm:px-6 lg:px-8">

        <div className="max-w-5xl mx-auto bg-[#8B71C1] p-6 rounded-xl shadow-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{singleJob?.title}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <Badge className="bg-white text-blue-700 font-semibold" variant="ghost">
                  {singleJob?.postion} Positions
                </Badge>
                <Badge className="bg-white text-[#F83002] font-semibold" variant="ghost">
                  {singleJob?.jobType}
                </Badge>
                <Badge className="bg-white text-[#7209b7] font-semibold" variant="ghost">
                  {singleJob?.salary} LPA
                </Badge>
              </div>
              <div className="mt-2 text-lg">
                <span
                  className="text-white hover:underline font-semibold cursor-pointer"
                  onClick={() => navigate(`/company/${singleJob?.company?._id}`)}
                >
                  {singleJob?.company?.name}
                </span>
              </div>
            </div>

            {/* ✅ Updated Buttons Section with GenAI */}
            <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
              
              
              {/* Apply Now Button */}
              <Button
                onClick={isApplied ? null : applyJobHandler}
                disabled={isApplied}
                className={`rounded-lg ${
                  isApplied
                    ? 'bg-gray-900 cursor-not-allowed'
                    : 'bg-[#fff] text-[#7209b7] hover:bg-[#ddd]'
                }`}
              >
                {isApplied ? 'Already Applied' : 'Apply Now'}
              </Button>
            </div>
          </div>

          <h2 className="border-b border-white/30 font-semibold text-xl mt-6 pb-2">
            Job Details
          </h2>

          <div className="mt-4 space-y-3 text-base">
            <p>
              <span className="font-bold">Role:</span>{' '}
              <span className="text-white/90">{singleJob?.title}</span>
            </p>
            <p>
              <span className="font-bold">Location:</span>{' '}
              <span className="text-white/90">{singleJob?.location}</span>
            </p>
            <p>
              <span className="font-bold">Description:</span>{' '}
              <span className="text-white/90">{singleJob?.description}</span>
            </p>
            <p>
              <span className="font-bold">Experience:</span>{' '}
              <span className="text-white/90">{singleJob?.experience} yrs</span>
            </p>
            <p>
              <span className="font-bold">Salary:</span>{' '}
              <span className="text-white/90">{singleJob?.salary} LPA</span>
            </p>
            <p>
              <span className="font-bold">Total Applicants:</span>{' '}
              <span className="text-white/90">{singleJob?.applications?.length}</span>
            </p>
            <p>
              <span className="font-bold">Posted Date:</span>{' '}
              <span className="text-white/90">
                {singleJob?.createdAt?.split('T')[0]}
              </span>
            </p>
          </div>

          {/* ✅ Updated GenAI Features Section */}
          {user && (
            <div className="mt-8 pt-6 border-t border-white/30">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                ✨ AI-Powered Job Tools
                <Badge className="bg-white/20 text-white text-xs">
                  NEW
                </Badge>
              </h3>
              <div className="flex flex-wrap gap-3">
                {/* Cover Letter Generator (if not already applied) */}
                {!isApplied && (
                  <CoverLetterGenerator jobId={jobId} />
                )}
                
                {/* Resume Tips Generator - Always available */}
                <ResumeTipsGenerator />
                
                {/* ✅ NEW: Job Match Generator - Now Available! */}
                <JobMatchGenerator jobId={jobId} />
                
                
              </div>
              
              {/* ✅ NEW: Info Section about AI Tools */}
              <div className="mt-4 p-4 bg-white/10 rounded-lg border border-white/20">
                <h4 className="text-white font-medium mb-2">How our AI tools help you:</h4>
                <div className="grid md:grid-cols-3 gap-4 text-sm text-white/80">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-300">📝</span>
                    <span><strong>Cover Letter:</strong> Personalized letters tailored to this specific job</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-300">💡</span>
                    <span><strong>Resume Tips:</strong> AI analysis of your profile with improvement suggestions</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-purple-300">🎯</span>
                    <span><strong>Job Match:</strong> See how well you match this role and what skills to develop</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer /> {/* ✅ Footer added */}
    </>
  );
};

export default JobDescription;