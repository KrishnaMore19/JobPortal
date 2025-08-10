import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { Avatar, AvatarImage } from '../ui/avatar';
import { LogOut, User2, Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { USER_API_END_POINT } from '@/utils/constant';
import { setUser } from '@/redux/authSlice';
import { toast } from 'sonner';

const Navbar = () => {
  const { user } = useSelector((store) => store.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const logoutHandler = async () => {
    try {
      const res = await axios.get(`${USER_API_END_POINT}/logout`, { withCredentials: true });
      if (res.data.success) {
        dispatch(setUser(null));
        navigate('/');
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Logout failed');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#A48FDB] text-white border-b border-[#8B71C1] shadow-md transition-colors">
      <div className="max-w-7xl mx-auto flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8">
        
        {/* Logo */}
        <Link to="/" className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-[#0EA5E9] via-[#9333EA] to-[#F43F5E] text-transparent bg-clip-text">
          JobForge
        </Link>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Button variant="ghost" onClick={() => setIsMenuOpen(!isMenuOpen)} size="icon">
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <ul className="flex items-center gap-6 text-sm font-medium">
            {user?.role === 'recruiter' ? (
              <>
                <li><Link to="/admin/companies" className="!text-white hover:!text-gray-200">Companies</Link></li>
                <li><Link to="/admin/jobs" className="!text-white hover:!text-gray-200">Jobs</Link></li>
              </>
            ) : (
              <>
                <li><Link to="/" className="!text-white hover:!text-gray-200">Home</Link></li>
                <li><Link to="/jobs" className="!text-white hover:!text-gray-200">Jobs</Link></li>
                <li><Link to="/browse" className="!text-white hover:!text-gray-200">Browse</Link></li>
              </>
            )}
          </ul>

          {!user ? (
            <div className="flex items-center gap-4">
              <Link to="/login"><Button variant="outline">Login</Button></Link>
              <Link to="/signup"><Button className="bg-primary text-primary-foreground hover:bg-primary/90">Signup</Button></Link>
            </div>
          ) : (
            <Popover>
              <PopoverTrigger asChild>
                <Avatar className="cursor-pointer ring-1 ring-muted-foreground hover:ring-primary transition">
                  <AvatarImage src={user?.profile?.profilePhoto} alt="User" />
                </Avatar>
              </PopoverTrigger>
              <PopoverContent 
                className="w-80 bg-[#A48FDB] text-white border border-[#8B71C1] rounded-md p-4 shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={user?.profile?.profilePhoto} />
                  </Avatar>
                  <div>
                    <h4 className="font-semibold text-white">{user?.fullname}</h4>
                    <p className="text-sm text-gray-200">{user?.profile?.bio}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {user?.role === 'student' && (
                    <Link to="/profile" className="flex items-center gap-2 text-sm text-white hover:text-gray-200">
                      <User2 className="w-4 h-4" />
                      View Profile
                    </Link>
                  )}
                  <button
                    onClick={logoutHandler}
                    className="flex items-center gap-2 text-sm text-red-200 hover:text-red-400"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </nav>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#A48FDB] border-t border-[#8B71C1] text-white">
          <div className="px-4 py-4 space-y-4">
            <ul className="space-y-4">
              {user?.role === 'recruiter' ? (
                <>
                  <li><Link to="/admin/companies" className="block text-white hover:text-gray-200">Companies</Link></li>
                  <li><Link to="/admin/jobs" className="block text-white hover:text-gray-200">Jobs</Link></li>
                </>
              ) : (
                <>
                  <li><Link to="/" className="block text-white hover:text-gray-200">Home</Link></li>
                  <li><Link to="/jobs" className="block text-white hover:text-gray-200">Jobs</Link></li>
                  <li><Link to="/browse" className="block text-white hover:text-gray-200">Browse</Link></li>
                </>
              )}
            </ul>

            {!user ? (
              <div className="flex flex-col gap-2">
                <Link to="/login"><Button variant="outline" className="w-full">Login</Button></Link>
                <Link to="/signup"><Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Signup</Button></Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {user.role === 'student' && (
                  <Link to="/profile"><Button variant="outline" className="w-full">View Profile</Button></Link>
                )}
                <Button 
                  onClick={logoutHandler} 
                  variant="outline" 
                  className="w-full text-red-200 hover:bg-red-500/20"
                >
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
