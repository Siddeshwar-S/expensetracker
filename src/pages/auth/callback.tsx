import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the hash from URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        if (type === 'signup' && accessToken && refreshToken) {
          // Set the session
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            toast({
              variant: 'destructive',
              title: 'Verification Failed',
              description: error.message,
            });
            navigate('/login');
            return;
          }

          toast({
            title: 'Email Verified',
            description: 'Your email has been verified successfully. You can now sign in.',
          });
          
          // Sign out and redirect to login
          await supabase.auth.signOut();
          navigate('/login');
        } else {
          toast({
            variant: 'destructive',
            title: 'Invalid Link',
            description: 'This verification link is invalid or has expired.',
          });
          navigate('/login');
        }
      } catch (error) {
        console.error('Callback error:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'An error occurred during verification.',
        });
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Verifying your email...</h2>
        <p className="text-muted-foreground">Please wait while we verify your email address.</p>
      </div>
    </div>
  );
}
