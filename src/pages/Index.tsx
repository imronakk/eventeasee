
import { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import MainLayout from '@/layouts/MainLayout';

// Lazy load components
const Hero = lazy(() => import('@/components/Hero'));
const FeaturedArtists = lazy(() => import('@/components/FeaturedArtists'));
const FeaturedVenues = lazy(() => import('@/components/FeaturedVenues'));
const UpcomingEvents = lazy(() => import('@/components/UpcomingEvents'));
const HowItWorks = lazy(() => import('@/components/HowItWorks'));
const TestimonialSection = lazy(() => import('@/components/TestimonialSection'));
const CTASection = lazy(() => import('@/components/CTASection'));

// Loading placeholder
const LoadingPlaceholder = () => (
  <div className="w-full h-64 flex items-center justify-center">
    <div className="animate-pulse flex space-x-2">
      <div className="w-3 h-3 bg-primary rounded-full"></div>
      <div className="w-3 h-3 bg-primary rounded-full"></div>
      <div className="w-3 h-3 bg-primary rounded-full"></div>
    </div>
  </div>
);

const Index = () => {
  return (
    <MainLayout>
      <Suspense fallback={<LoadingPlaceholder />}>
        <Hero />
      </Suspense>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Suspense fallback={<LoadingPlaceholder />}>
          <HowItWorks />
        </Suspense>
        
        <Suspense fallback={<LoadingPlaceholder />}>
          <FeaturedArtists />
        </Suspense>
        
        <Suspense fallback={<LoadingPlaceholder />}>
          <FeaturedVenues />
        </Suspense>
        
        <Suspense fallback={<LoadingPlaceholder />}>
          <UpcomingEvents />
        </Suspense>
        
        <Suspense fallback={<LoadingPlaceholder />}>
          <TestimonialSection />
        </Suspense>
        
        <Suspense fallback={<LoadingPlaceholder />}>
          <CTASection />
        </Suspense>
      </motion.div>
    </MainLayout>
  );
};

export default Index;
