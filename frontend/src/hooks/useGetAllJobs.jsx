// Debug version of useGetAllJobs.jsx
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
    const { user } = useSelector(store => store.auth);

    useEffect(() => {
        const fetchAllJobs = async () => {
            try {
                // 🔍 DETAILED DEBUGGING
                console.log('🔍 === DEBUGGING AUTHENTICATION ===');
                console.log('User from Redux:', user);
                console.log('Cookies:', document.cookie);
                
                const localToken = localStorage.getItem('token');
                const sessionToken = sessionStorage.getItem('token');
                
                console.log('LocalStorage token:', localToken);
                console.log('SessionStorage token:', sessionToken);

                // ✅ Build config step by step
                const config = {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    timeout: 30000
                };

                // ✅ Try multiple token sources
                let token = localToken || sessionToken;
                
                // If no token in storage, try to get from cookie
                if (!token) {
                    const cookies = document.cookie.split(';');
                    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
                    if (tokenCookie) {
                        token = tokenCookie.split('=')[1];
                        console.log('Found token in cookie:', token?.substring(0, 20) + '...');
                    }
                }

                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                    console.log('Added Authorization header:', `Bearer ${token.substring(0, 20)}...`);
                } else {
                    console.log('❌ NO TOKEN FOUND ANYWHERE!');
                    toast.error('No authentication token found. Please login again.');
                    navigate('/login');
                    return;
                }

                const apiUrl = `${JOB_API_END_POINT}/get?keyword=${searchedQuery}`;
                console.log('API URL:', apiUrl);
                console.log('Request config:', config);

                // ✅ Make the request
                console.log('Making request...');
                const res = await axios.get(apiUrl, config);

                console.log('✅ SUCCESS! Response:', res);

                if (res.data.success) {
                    dispatch(setAllJobs(res.data.jobs));
                    toast.success(`Loaded ${res.data.jobs.length} jobs`);
                } else {
                    console.error('API returned success: false', res.data);
                    toast.error(res.data.message || 'Failed to fetch jobs');
                }

            } catch (error) {
                console.error('🚨 === ERROR DETAILS ===');
                console.error('Error object:', error);
                console.error('Error message:', error.message);
                console.error('Error response:', error.response);
                
                if (error.response) {
                    console.error('Response status:', error.response.status);
                    console.error('Response data:', error.response.data);
                    console.error('Response headers:', error.response.headers);
                    
                    // ✅ Detailed 401 handling
                    if (error.response.status === 401) {
                        console.log('🔍 401 Error Analysis:');
                        console.log('Request headers sent:', error.config?.headers);
                        console.log('Cookies at time of request:', document.cookie);
                        
                        toast.error('Authentication failed. Please login again.');
                        
                        // Clear all auth data
                        localStorage.removeItem('token');
                        sessionStorage.removeItem('token');
                        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                        
                        navigate('/login');
                        return;
                    }
                } else if (error.request) {
                    console.error('No response received:', error.request);
                    toast.error('Network error. Please check your connection.');
                } else {
                    console.error('Request setup error:', error.message);
                    toast.error('Request failed. Please try again.');
                }

                dispatch(setAllJobs([]));
            }
        };

        // Only fetch if we have a user
        if (user) {
            console.log('User exists, fetching jobs...');
            fetchAllJobs();
        } else {
            console.log('No user in Redux, skipping job fetch');
        }

    }, [searchedQuery, user, dispatch, navigate]);
};

export default useGetAllJobs;