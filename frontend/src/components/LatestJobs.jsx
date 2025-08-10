import React from 'react';
import { useSelector } from 'react-redux';
import LatestJobCards from './LatestJobCards';

const LatestJobs = () => {
  const { allJobs } = useSelector((store) => store.job);

  return (
    <section className="bg-[hsl(var(--section-hero))] text-foreground py-20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6">
        {/* Heading */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-primary">
            <span className="text-[#6A38C2]">Featured</span> Job Opportunities
          </h2>
          <p className="mt-3 text-muted-foreground text-base sm:text-lg">
            Discover high-quality job listings from top-tier companies selected just for you.
          </p>
        </div>

        {/* Job Cards */}
        {allJobs.length <= 0 ? (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-xl shadow-md">
            <p className="text-muted-foreground font-medium">No jobs available at the moment</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {allJobs.slice(0, 6).map((job) => (
              <LatestJobCards key={job._id} job={job} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default LatestJobs;
