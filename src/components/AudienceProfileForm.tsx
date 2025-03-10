
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import ProfileForm from './ProfileForm';

const AudienceProfileForm = () => {
  const { toast } = useToast();
  
  return (
    <div className="space-y-6">
      <ProfileForm />
      
      <Card>
        <CardHeader>
          <CardTitle>Your Preferences</CardTitle>
          <CardDescription>
            Tell us about your music preferences to get personalized recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="py-4">
          <p className="text-center text-muted-foreground italic">Coming soon! You'll be able to set your music preferences to get personalized event recommendations.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AudienceProfileForm;
