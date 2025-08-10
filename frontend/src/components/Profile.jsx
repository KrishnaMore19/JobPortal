import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Navbar from "./shared/Navbar";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { Contact, Mail, Pen, Bookmark, Download, Briefcase } from "lucide-react";
import { Badge } from "./ui/badge";
import AppliedJobTable from "./AppliedJobTable";
import UpdateProfileDialog from "./UpdateProfileDialog";
import axios from "axios";
import { USER_API_END_POINT } from "@/utils/constant";
import { setUser } from "@/redux/authSlice";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useNavigate } from "react-router-dom";
import { unsaveJob, setSavedJobs } from "@/redux/jobSlice";
import useGetAppliedJobs from "@/hooks/useGetAppliedJobs";
import useGetSavedJobs from "@/hooks/useGetSavedJobs";

function Profile() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useSelector((store) => store.auth);
  const { savedJobs } = useSelector((store) => store.job);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useGetAppliedJobs();
  useGetSavedJobs();

  const skills = user?.profile?.skills || [];
  const hasResume = !!user?.profile?.resume;

  useEffect(() => {
    const refreshUserData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${USER_API_END_POINT}/profile`, {
          withCredentials: true,
        });

        if (response.data.success && response.data.user) {
          dispatch(setUser(response.data.user));
        }
      } catch (error) {
        console.error("Failed to refresh user data:", error);
      } finally {
        setLoading(false);
      }
    };

    refreshUserData();
  }, [dispatch]);

  useEffect(() => {
    const fetchSavedJobs = async () => {
      try {
        const response = await axios.get(`${USER_API_END_POINT}/saved-jobs`, {
          withCredentials: true,
        });
        if (response.data.success) {
          dispatch(setSavedJobs(response.data.jobs));
        }
      } catch (error) {
        console.error("Failed to fetch saved jobs:", error);
      }
    };

    fetchSavedJobs();
  }, [dispatch]);

  const handleProfilePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      toast.info("Uploading profile photo...");

      const response = await axios.post(
        `${USER_API_END_POINT}/profile/photo`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        dispatch(setUser(response.data.user));
        toast.success("Profile photo updated successfully");
      }
    } catch (error) {
      console.error("Error uploading profile photo:", error);
      toast.error(error.response?.data?.message || "Failed to upload profile photo");
    } finally {
      setLoading(false);
    }
  };

  const handleUnsaveJob = async (jobId) => {
    try {
      const response = await axios.delete(`${USER_API_END_POINT}/save-job/${jobId}`, {
        withCredentials: true,
      });

      if (response.data.success) {
        dispatch(unsaveJob(jobId));
        toast.success("Job removed from saved jobs");
      }
    } catch (error) {
      console.error("Error unsaving job:", error);
      toast.error(error.response?.data?.message || "Failed to remove job from saved jobs");
    }
  };

  const handleViewJob = (jobId) => {
    navigate(`/job/description/${jobId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--section-hero))]">
        <Navbar />
        <div className="max-w-4xl mx-auto p-4">
          <div className="animate-pulse space-y-6">
            <div className="h-40 bg-[#8B71C1]/20 rounded-xl"></div>
            <div className="h-64 bg-[#8B71C1]/20 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--section-hero))]">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        {/* Profile Card */}
        <div className="bg-[hsl(var(--section-hero))] border border-[#8B71C1] rounded-2xl p-8 shadow-lg relative">
          <Button
            className="absolute top-6 right-6 p-2 hover:bg-[#5b3086] rounded-full bg-[#6A38C2] text-white"
            variant="ghost"
            title="Edit Profile"
            onClick={() => setOpen(true)}
          >
            <Pen className="w-5 h-5" strokeWidth={2.5} />
          </Button>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="relative group">
              <Avatar className="h-28 w-28 ring-4 ring-[#8B71C1]/40 shadow-md">
                <AvatarImage src={user?.profile?.profilePhoto} />
                <AvatarFallback className="bg-[#6A38C2] text-white text-2xl font-semibold">
                  {user?.fullname?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="profile-photo"
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer"
              >
                <Pen className="w-6 h-6 text-white" />
              </label>
              <input
                type="file"
                id="profile-photo"
                className="hidden"
                accept="image/*"
                onChange={handleProfilePhotoChange}
              />
            </div>

            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900">{user?.fullname}</h1>
              <p className="text-gray-700 mt-2">{user?.profile?.bio || "No bio provided"}</p>

              <div className="mt-6 space-y-3 text-gray-800">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-[#6A38C2]" />
                  {user?.email || "No email provided"}
                </div>
                <div className="flex items-center gap-3">
                  <Contact className="w-5 h-5 text-[#6A38C2]" />
                  {user?.phoneNumber || "No phone number provided"}
                </div>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {skills.length > 0 ? (
                skills.map((skill, index) => (
                  <Badge
                    key={index}
                    className="bg-[#6A38C2] text-white px-4 py-1 rounded-full shadow-sm"
                  >
                    {skill}
                  </Badge>
                ))
              ) : (
                <span className="text-gray-500 italic">No skills added</span>
              )}
            </div>
          </div>

          {/* Resume */}
          {/* Resume */}
<div className="mt-8">
  <h2 className="text-xl font-semibold text-gray-900 mb-4">Resume</h2>
  {hasResume ? (
    <div className="flex items-center gap-4 flex-wrap">
      <a
        href={`${USER_API_END_POINT}/resume/${user?._id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-[#6A38C2] text-white px-4 py-2 rounded-full shadow hover:bg-[#5b30a6] transition"
        download
      >
        <Download className="w-5 h-5" />
        Download Resume
      </a>
      <span className="text-sm text-gray-600 italic">
        {user?.profile?.resumeOriginalName || "resume.pdf"}
      </span>
    </div>
  ) : (
    <span className="text-gray-500 italic">Not Available</span>
  )}
</div>

        </div>

        {/* Jobs Section */}
        <div className="bg-[hsl(var(--section-hero))] rounded-2xl p-6 shadow-lg border border-[#8B71C1]">
          <Tabs defaultValue="applied" className="w-full">
            <TabsList className="w-full justify-start mb-6">
              <TabsTrigger value="applied" className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Applied Jobs
              </TabsTrigger>
              <TabsTrigger value="saved" className="flex items-center gap-2">
                <Bookmark className="w-4 h-4" /> Saved Jobs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="applied">
              <AppliedJobTable />
            </TabsContent>

            <TabsContent value="saved">
              {!savedJobs || savedJobs.length === 0 ? (
                <div className="text-center py-12 bg-[hsl(var(--section-hero))] rounded-lg border border-[#8B71C1] shadow-inner">
                  <Bookmark className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No saved jobs yet</h3>
                  <p className="text-gray-500 mb-6">Save jobs to apply later</p>
                  <Button
                    onClick={() => navigate("/jobs")}
                    className="bg-[#6A38C2] hover:bg-[#5b30a6] transition"
                  >
                    Browse Jobs
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {savedJobs.map((job) => (
                    <div
                      key={job._id}
                      className="flex items-center justify-between p-4 border border-[#8B71C1] rounded-lg hover:border-[#6A38C2] bg-white/40 backdrop-blur-sm shadow-sm transition"
                    >
                      <div>
                        <h3 className="font-medium text-gray-900">{job.title}</h3>
                        <p className="text-gray-500">{job.company?.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleViewJob(job._id)}
                          className="hover:bg-gray-100"
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleUnsaveJob(job._id)}
                          className="text-red-500 hover:bg-red-50"
                        >
                          Unsave
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <UpdateProfileDialog open={open} setOpen={setOpen} />
    </div>
  );
}

export default Profile;
