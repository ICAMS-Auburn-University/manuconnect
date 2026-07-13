'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { createSupabaseBrowserClient } from '@/app/_internal/supabase/browser-client';

const IDLE_TIMEOUT_MS = 10 * 60 * 1000;

const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  'focus',
  'keydown',
  'mousedown',
  'mousemove',
  'scroll',
  'touchstart',
];

const IdleSignOut = () => {
  const router = useRouter();
  const timeoutRef = useRef<number | null>(null);
  const isSigningOutRef = useRef(false);
  const signOutRef = useRef<() => Promise<void>>(async () => {});
  const scheduleRef = useRef<() => void>(() => {});

  const clearIdleTimeout = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  scheduleRef.current = () => {
    clearIdleTimeout();
    timeoutRef.current = window.setTimeout(() => {
      void signOutRef.current();
    }, IDLE_TIMEOUT_MS);
  };

  signOutRef.current = async () => {
    if (isSigningOutRef.current) {
      return;
    }

    isSigningOutRef.current = true;
    clearIdleTimeout();

    const supabase = await createSupabaseBrowserClient();
    const { error } = await supabase.auth.signOut({ scope: 'local' });

    if (error) {
      console.error('Error signing out after inactivity:', error);
      isSigningOutRef.current = false;
      scheduleRef.current();
      return;
    }

    router.replace('/sign-in');
    router.refresh();
  };

  useEffect(() => {
    const handleActivity = () => {
      if (document.hidden || isSigningOutRef.current) {
        return;
      }

      scheduleRef.current();
    };

    const handleVisibilityChange = () => {
      if (document.hidden || isSigningOutRef.current) {
        return;
      }

      scheduleRef.current();
    };

    scheduleRef.current();

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, handleActivity);
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearIdleTimeout();

      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, handleActivity);
      }

      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null;
};

export default IdleSignOut;