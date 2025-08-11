// Optimized version with debouncing and better performance
import { setAllJobs } from '@/redux/jobSlice'
import { clearUser } from '@/redux/authSlice'
import { JOB_API_END_POINT } from '@/utils/constant'
import axios from 'axios'
import { useEffect, useCallback, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

const useGetAllJobs = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { searchedQuery } = useSelector(store => store.job);
    const { user } = useSelector(store => store.auth);
    const abortControllerRef = useRef(null);
    const isFirstRender = useRef(true);

    // ✅ Memoized fetch function to prevent unnecessary re-renders
    const fetchAllJobs = useCallback(async () => {
        // ✅ Cancel previous request if still pending
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // ✅ Create new abort controller for this request
        abortControllerRef.current = new AbortController();

        try {
            const config = {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 30000,
                signal: abortControllerRef.current.signal // ✅ Add cancellation
            };

            const apiUrl = `${JOB_API_END_POINT}/get?keyword=${searchedQuery}`;
            
            // ✅ Only log on first render or when searchedQuery changes
            if (isFirstRender.current || searchedQuery) {
                console.log(`🔍 Fetching jobs with query: "${searchedQuery}"`);
                isFirstRender.current = false;
            }

            const res = await axios.get(apiUrl, config);

            if (res.data.success) {
                dispatch(setAllJobs(res.data.jobs));
                
                // ✅ Only toast success on search, not on initial load
                if (searchedQuery) {
                    toast.success(`Found ${res.data.jobs.length} jobs`);
                }
            } else {
                console.error('API returned success: false', res.data);
                toast.error(res.data.message || 'Failed to fetch jobs');
            }

        } catch (error) {
            // ✅ Don't handle aborted requests
            if (error.name === 'CanceledError' || error.code === 'ABORTED') {
                console.log('Request was cancelled');
                return;
            }
            
            console.error('Error fetching jobs:', error.response?.data || error.message);
            
            if (error.response?.status === 401) {
                toast.error('Session expired. Please login again.');
                dispatch(clearUser());
                navigate('/login');
                return;
            }
            
            if (error.code === 'NETWORK_ERROR' || !error.response) {
                toast.error('Network error. Please check your connection.');
            } else if (error.response?.status >= 500) {
                toast.error('Server error. Please try again later.');
            } else {
                toast.error('Failed to fetch jobs. Please try again.');
            }

            dispatch(setAllJobs([]));
        }
    }, [searchedQuery, dispatch, navigate]);

    useEffect(() => {
        // ✅ Only fetch if user exists
        if (!user?._id) {
            dispatch(setAllJobs([]));
            return;
        }

        // ✅ Debounce search queries to avoid too many requests
        const timeoutId = setTimeout(() => {
            fetchAllJobs();
        }, searchedQuery ? 300 : 0); // 300ms debounce for search, immediate for initial load

        // ✅ Cleanup timeout and abort controller
        return () => {
            clearTimeout(timeoutId);
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };

    }, [user?._id, fetchAllJobs]);

    // ✅ Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);
};

export default useGetAllJobs;