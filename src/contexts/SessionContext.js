"use client";

import React, { createContext, useState, useContext, useEffect } from 'react';

const SessionContext = createContext(null);

export const SessionProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This is a placeholder for session fetching logic.
    // You would typically fetch session data from an API here.
    const fetchSession = async () => {
      try {
        // Simulate an API call
        await new Promise(resolve => setTimeout(resolve, 500));
        // Set a mock session for now
        setSession({ user: { id: '123', name: 'Guest' } });
      } catch (error) {
        console.error('Failed to fetch session:', error);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, []);

  return (
    <SessionContext.Provider value={{ session, loading }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
