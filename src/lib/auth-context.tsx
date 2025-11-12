import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { AuthService, UserProfile } from './auth-service';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  
  signUp: (email: string, password: string, fullName?: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  updatePassword: (newPassword: string) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  const isAuthenticated = !!user && !!session;

  // Load user profile
  const loadProfile = async (userId: string) => {
    const result = await AuthService.getUserProfile(userId);
    if (result.success && result.data) {
      setProfile(result.data);
      setIsAdmin(result.data.is_admin);
      return true;
    }
    return false;
  };

  // Initialize user defaults (categories and payment methods)
  const initializeDefaults = async (userId: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      const { data: { session } } = await AuthService.getCurrentSession();
      
      if (!session) return;

      const response = await fetch(`${API_URL}/users/initialize-defaults`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log('✅ User defaults initialized');
      }
    } catch (error) {
      console.error('Failed to initialize defaults:', error);
      // Don't fail auth if this fails
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const sessionResult = await AuthService.getCurrentSession();
        if (sessionResult.success && sessionResult.data) {
          // Verify user still exists in database
          const profileLoaded = await loadProfile(sessionResult.data.user.id);
          
          if (profileLoaded) {
            setSession(sessionResult.data);
            setUser(sessionResult.data.user);
          } else {
            // User deleted from database, sign out
            console.warn('User profile not found, signing out...');
            await AuthService.signOut();
            setSession(null);
            setUser(null);
            setProfile(null);
            setIsAdmin(false);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = AuthService.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (session?.user) {
        // Verify user still exists in database
        const profileLoaded = await loadProfile(session.user.id);
        
        if (profileLoaded) {
          setSession(session);
          setUser(session.user);
          
          // Initialize defaults for new users (after email verification)
          if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            await initializeDefaults(session.user.id);
          }
        } else {
          // User deleted from database, sign out
          console.warn('User profile not found, signing out...');
          await AuthService.signOut();
          setSession(null);
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
        }
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
      }

      setIsLoading(false);
    });

    // Periodic validation check (every 5 minutes)
    const validateUserInterval = setInterval(async () => {
      if (user) {
        const profileLoaded = await loadProfile(user.id);
        if (!profileLoaded) {
          console.warn('User profile no longer exists, signing out...');
          await AuthService.signOut();
          setSession(null);
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
          
          toast({
            variant: 'destructive',
            title: 'Session Expired',
            description: 'Your account is no longer active. Please contact support if this is an error.',
          });
        }
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      subscription.unsubscribe();
      clearInterval(validateUserInterval);
    };
  }, [user]);

  const signUp = async (email: string, password: string, fullName?: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const result = await AuthService.signUp(email, password, fullName);

      if (result.success) {
        toast({
          title: 'Account Created',
          description: 'Please check your email to verify your account.',
        });
        return true;
      } else {
        toast({
          variant: 'destructive',
          title: 'Sign Up Failed',
          description: result.error || 'Failed to create account',
        });
        return false;
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const result = await AuthService.signIn(email, password);

      if (result.success && result.data) {
        // Manually update state immediately
        setSession(result.data);
        setUser(result.data.user);
        
        // Load profile
        if (result.data.user) {
          await loadProfile(result.data.user.id);
        }
        
        toast({
          title: 'Welcome Back',
          description: 'You have successfully signed in.',
        });
        return true;
      } else {
        toast({
          variant: 'destructive',
          title: 'Sign In Failed',
          description: result.error || 'Invalid credentials',
        });
        return false;
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const result = await AuthService.signOut();

      if (result.success) {
        setUser(null);
        setSession(null);
        setProfile(null);
        setIsAdmin(false);
        
        toast({
          title: 'Signed Out',
          description: 'You have been successfully signed out.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Sign Out Failed',
          description: result.error || 'Failed to sign out',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    try {
      const result = await AuthService.updateUserProfile(updates);

      if (result.success && result.data) {
        setProfile(result.data);
        toast({
          title: 'Profile Updated',
          description: 'Your profile has been successfully updated.',
        });
        return true;
      } else {
        toast({
          variant: 'destructive',
          title: 'Update Failed',
          description: result.error || 'Failed to update profile',
        });
        return false;
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
      return false;
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      const result = await AuthService.resetPassword(email);

      if (result.success) {
        toast({
          title: 'Password Reset Email Sent',
          description: 'Please check your email for password reset instructions.',
        });
        return true;
      } else {
        toast({
          variant: 'destructive',
          title: 'Reset Failed',
          description: result.error || 'Failed to send reset email',
        });
        return false;
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
      return false;
    }
  };

  const updatePassword = async (newPassword: string): Promise<boolean> => {
    try {
      const result = await AuthService.updatePassword(newPassword);

      if (result.success) {
        toast({
          title: 'Password Updated',
          description: 'Your password has been successfully updated.',
        });
        return true;
      } else {
        toast({
          variant: 'destructive',
          title: 'Update Failed',
          description: result.error || 'Failed to update password',
        });
        return false;
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
      return false;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    isLoading,
    isAuthenticated,
    isAdmin,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
    updatePassword,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};