import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SetupCheckProps {
  children: React.ReactNode;
}

export function SetupCheck({ children }: SetupCheckProps) {
  const [hasUsers, setHasUsers] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    checkForUsers();
  }, []);

  const checkForUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);

      if (error) throw error;

      setHasUsers((data && data.length > 0) || false);
    } catch (error) {
      console.error('Error checking for users:', error);
      setHasUsers(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If no users exist and we're not already on setup page, redirect to setup
  if (!hasUsers && window.location.pathname !== '/setup') {
    return <Navigate to="/setup" replace />;
  }

  // If users exist and we're on setup page, redirect to login
  if (hasUsers && window.location.pathname === '/setup') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}