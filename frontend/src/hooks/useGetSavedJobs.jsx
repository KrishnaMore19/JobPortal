import { setSavedJobs } from "@/redux/jobSlice";
import { USER_API_END_POINT } from "@/utils/constant";
import axios from "axios";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

const useGetSavedJobs = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        const fetchSavedJobs = async () => {
            try {
                const response = await axios.get(`${USER_API_END_POINT}/saved-jobs`, {
                    withCredentials: true
                });
                if (response.data.success) {
                    dispatch(setSavedJobs(response.data.jobs));
                }
            } catch (error) {
                console.error("Error fetching saved jobs:", error);
                dispatch(setSavedJobs([]));
            }
        };

        fetchSavedJobs();
    }, [dispatch]);
};

export default useGetSavedJobs; 