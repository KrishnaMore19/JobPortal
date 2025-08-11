// Fixed useGetAllJobs.jsx
import { setAllJobs } from '@/redux/jobSlice'
import { JOB_API_END_POINT } from '@/utils/constant'
import axios from 'axios'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

const useGetAllJobs = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { searchedQuery } = useSelector(store => store.job);
    const { user } = useSelector(store => store.auth); // ✅ Get user from auth state

    useEffect(() => {
        const fetchAllJobs = async () => {
            try {
                // ✅ Enhanced request configuration
                const config = {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    timeout: 30000 // 30 second timeout
                };

                // ✅ Add Authorization header if token exists in localStorage
                const token = localStorage.getItem('token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }

                console.log('Fetching jobs with config:', config);
                console.log('API URL:', `${JOB_API_END_POINT}/get?keyword=${searchedQuery}`);

                const res = await axios.get(
                    `${JOB_API_END_POINT}/get?keyword=${searchedQuery}`,
                    config
                );

                console.log('Jobs API Response:', res);

                if (res.data.success) {
                    dispatch(setAllJobs(res.data.jobs));
                } else {
                    console.error('API returned success: false', res.data);
                    toast.error(res.data.message || 'Failed to fetch jobs');
                }

            } catch (error) {
                console.error('Jobs fetch error:', error);
                
                // ✅ Handle different error types
                if (error.response?.status === 401) {
                    toast.error('Session expired. Please login again.');
                    localStorage.removeItem('token'); // Clear invalid token
                    navigate('/login');
                } else if (error.response?.status === 403) {
                    toast.error('Access denied. Please check your permissions.');
                } else if (error.code === 'ECONNABORTED') {
                    toast.error('Request timeout. Please try again.');
                } else if (!error.response) {
                    toast.error('Network error. Please check your connection.');
                } else {
                    toast.error('Failed to fetch jobs. Please try again.');
                }

                // ✅ Dispatch empty jobs array on error to prevent infinite loading
                dispatch(setAllJobs([]));
            }
        }

        // ✅ Only fetch if user is authenticated
        if (user) {
            fetchAllJobs();
        }
    }, [searchedQuery, user, dispatch, navigate]); // ✅ Added dependencies
}

export default useGetAllJobs