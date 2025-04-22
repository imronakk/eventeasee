
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Music, MapPin, ArrowRight } from 'lucide-react';

const CTASection = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-primary/5 to-primary/10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-sm font-medium text-primary mb-4">Start Your Journey</div>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
              Ready to Create Unforgettable Experiences?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of artists and venues already using EventEase to create meaningful connections and exceptional events.
            </p>

            <div className="space-y-6">
              <div className="flex">
                <div className="mr-4 flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Music className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-1">For Artists</h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    Showcase your talent and connect with venues that match your style and ambitions.
                  </p>
                  <Link to="/auth?role=artist&tab=signup" className="text-primary font-medium flex items-center group">
                    Join as Artist 
                    <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              <div className="flex">
                <div className="mr-4 flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-1">For Venues</h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    Find the perfect artists for your space and create memorable events for your audience.
                  </p>
                  <Link to="/auth?role=venue_owner&tab=signup" className="text-primary font-medium flex items-center group">
                    List Your Venue 
                    <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-background rounded-2xl border border-border/40 shadow-lg p-8 relative"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="absolute -top-6 -right-6 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Music className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-bold mb-6">Create Your Account</h3>
            <p className="text-muted-foreground mb-8">
              Join EventEase today and start connecting with artists and venues.
            </p>
            
            <div className="space-y-4">
              <Link to="/auth?role=artist&tab=signup">
                <Button className="w-full justify-start" size="lg">
                  <Music className="mr-2 h-5 w-5" />
                  Sign up as an Artist
                </Button>
              </Link>
              <Link to="/auth?role=venue_owner&tab=signup">
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <MapPin className="mr-2 h-5 w-5" />
                  Sign up as a Venue Owner
                </Button>
              </Link>
              <div className="text-center text-muted-foreground text-sm mt-6">
                Already have an account? <Link to="/auth?tab=login" className="text-primary font-medium">Log in</Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
