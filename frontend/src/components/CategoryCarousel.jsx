import React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from './ui/carousel';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setSearchedQuery } from '@/redux/jobSlice';
import { BadgeCheck } from 'lucide-react';

const categories = [
  'Frontend Developer',
  'Backend Developer',
  'Data Science',
  'Graphic Designer',
  'FullStack Developer',
];

const CategoryCarousel = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const searchJobHandler = (query) => {
    dispatch(setSearchedQuery(query));
    navigate('/browse');
  };

  return (
    <section className="bg-[hsl(var(--section-hero))] dark:bg-[hsl(var(--section-hero))] py-16 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Explore by <span className="text-primary">Category</span>
          </h2>
          <p className="text-muted-foreground mt-2 text-base sm:text-lg">
            Find job roles tailored to your skills and passions
          </p>
        </div>

        {/* Carousel */}
        <Carousel className="w-full">
          <CarouselContent>
            {categories.map((category, index) => (
              <CarouselItem
                key={index}
                className="basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 px-2"
              >
                <div
                  onClick={() => searchJobHandler(category)}
                  className="cursor-pointer bg-card dark:bg-card hover:bg-muted border border-border hover:border-primary shadow-sm hover:shadow-md transition-all p-6 rounded-xl text-center h-full flex flex-col items-center justify-center"
                >
                  <BadgeCheck className="text-primary mb-3" size={28} />
                  <span className="text-foreground font-semibold text-lg">
                    {category}
                  </span>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          <CarouselPrevious className="left-0" />
          <CarouselNext className="right-0" />
        </Carousel>
      </div>
    </section>
  );
};

export default CategoryCarousel;
