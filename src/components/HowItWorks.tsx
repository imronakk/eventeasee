
import { motion } from 'framer-motion';
import { UserCheck, Building2, Calendar, TicketCheck } from 'lucide-react';

const steps = [
  {
    icon: UserCheck,
    title: 'Create Your Profile',
    description: 'Sign up and create a detailed profile as an artist or venue owner that showcases your unique qualities.',
    color: 'bg-blue-500/10 text-blue-500',
  },
  {
    icon: Building2,
    title: 'Connect & Collaborate',
    description: 'Artists and venues can discover each other, send performance requests, and build relationships.',
    color: 'bg-purple-500/10 text-purple-500',
  },
  {
    icon: Calendar,
    title: 'Plan Your Event',
    description: 'Work together to schedule and organize the perfect event with all necessary details.',
    color: 'bg-green-500/10 text-green-500',
  },
  {
    icon: TicketCheck,
    title: 'Sell Tickets & Perform',
    description: 'Publish your event, sell tickets to your audience, and deliver an unforgettable experience.',
    color: 'bg-amber-500/10 text-amber-500',
  },
];

const HowItWorks = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            How EventEase Works
          </motion.h2>
          <motion.p
            className="text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            A simple process to connect artists with venues and create amazing events
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-[calc(100%-1.5rem)] w-full border-t-2 border-dashed border-muted z-0"></div>
              )}
              
              <div className="bg-background p-6 rounded-xl border border-border/40 hover:shadow-md transition-shadow z-10 relative h-full">
                {/* Step number */}
                <div className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                  {index + 1}
                </div>
                
                {/* Icon */}
                <div className={`w-14 h-14 rounded-full ${step.color} flex items-center justify-center mb-6`}>
                  <step.icon className="h-7 w-7" />
                </div>
                
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
