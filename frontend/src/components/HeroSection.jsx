import React, { useState } from 'react';
import { Button } from './ui/button';
import { Search } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { setSearchedQuery } from '@/redux/jobSlice';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const [query, setQuery] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const searchJobHandler = () => {
    if (query.trim()) {
      dispatch(setSearchedQuery(query));
      navigate('/browse');
    }
  };

  return (
    <section className="bg-[hsl(var(--section-hero))] py-20 text-foreground transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center px-6 gap-10">
        
        {/* Left Side: Text */}
        <div className="flex-1">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-snug">
            Your <span className="text-[#6A38C2]">Dream Job</span> is Just One Click Away
          </h2>

          <p className="mt-4 text-muted-foreground text-base sm:text-lg">
            Discover thousands of job listings from top employers. Take the next step in your career journey.
          </p>

          {/* Search Box */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
  <input
    type="text"
    placeholder="Search by role, company, or keyword"
    value={query}
    onChange={(e) => setQuery(e.target.value)}
    className="w-full sm:w-96 px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6A38C2] bg-white text-foreground placeholder:text-muted-foreground"
  />
  <Button
    onClick={searchJobHandler}
    className="bg-[#6A38C2] hover:bg-[#5b30a6] text-white px-6 py-3 rounded-md"
  >
    <Search className="mr-2 h-5 w-5" />
    Search
  </Button>
</div>


          {/* Popular Searches */}
          <div className="mt-5 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Popular searches:</span>
            <div className="flex flex-wrap gap-3 mt-2">
              {['Software Engineer', 'Product Manager', 'Data Scientist'].map((title) => (
                <button
                  key={title}
                  onClick={() => {
                    setQuery(title);
                    searchJobHandler();
                  }}
                  className="text-[#6A38C2] hover:underline transition"
                >
                  {title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Illustration */}
        <div className="hidden lg:flex flex-1 justify-center items-center overflow-hidden">
  <img
    src="https://res.cloudinary.com/duhssymws/image/upload/v1752563522/Adobe_Express_-_file_r019fs.png"
    alt="Job Search"
    className="w-96 h-96 object-cover" // Fixed dimensions with object-cover
  />
</div>

      </div>
    </section>
  );
};

export default HeroSection;
