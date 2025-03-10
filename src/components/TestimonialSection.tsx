
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Jazz Vocalist',
    content: 'EventEase completely transformed my career. I found incredible venues that match my style and built a loyal following. The platform\'s interface is so intuitive and the venue partnerships are top-notch.',
    avatar: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
  },
  {
    id: 2,
    name: 'Michael Torres',
    role: 'Venue Owner, The Blue Room',
    content: 'As a venue owner, finding quality artists was always a challenge. EventEase brought talented performers right to my door. Our bookings are up 60% and audience satisfaction has never been higher.',
    avatar: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
  },
  {
    id: 3,
    name: 'Emily Chen',
    role: 'Concert Enthusiast',
    content: 'I\'ve discovered so many incredible artists through EventEase that I would have never found otherwise. The ticket booking process is seamless, and the venue selections are always perfect.',
    avatar: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
  },
];

const TestimonialSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="py-20 bg-gradient-to-b from-muted/50 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            What People Are Saying
          </motion.h2>
          <motion.p
            className="text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Hear from artists, venues, and audiences who've experienced EventEase
          </motion.p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="absolute -top-12 left-0 text-primary/10">
            <Quote size={120} strokeWidth={1} />
          </div>

          <div className="relative z-10">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                className="flex flex-col items-center text-center"
                initial={{ opacity: 0, x: 100 }}
                animate={{ 
                  opacity: index === currentIndex ? 1 : 0,
                  x: index === currentIndex ? 0 : 100,
                  position: index === currentIndex ? 'relative' : 'absolute'
                }}
                transition={{ duration: 0.5 }}
                style={{ display: index === currentIndex ? 'flex' : 'none' }}
              >
                <div className="mb-6">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-20 h-20 rounded-full object-cover mx-auto border-4 border-primary/20"
                  />
                </div>
                <p className="text-lg md:text-xl text-foreground/90 mb-6 italic">
                  "{testimonial.content}"
                </p>
                <h4 className="text-xl font-semibold">{testimonial.name}</h4>
                <p className="text-muted-foreground">{testimonial.role}</p>
              </motion.div>
            ))}
          </div>

          <div className="flex justify-center mt-10 space-x-4">
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full" 
              onClick={prevTestimonial}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === currentIndex 
                      ? 'w-8 bg-primary' 
                      : 'w-2 bg-muted-foreground/30'
                  }`}
                  onClick={() => setCurrentIndex(index)}
                ></button>
              ))}
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full" 
              onClick={nextTestimonial}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;
