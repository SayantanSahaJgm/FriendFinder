import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Router from 'next/router';
import HomeScreen from '@/figma-ui/components/HomeScreen';

export default function IndexPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') {
      Router.push('/dashboard');
    }
  }, [status]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return <HomeScreen />;
}
