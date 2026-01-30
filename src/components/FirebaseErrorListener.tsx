'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// This component is responsible for catching permission errors and surfacing them
// to the Next.js error overlay in development.
export function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // In development, throwing the error will trigger the Next.js error overlay.
      if (process.env.NODE_ENV === 'development') {
        throw error;
      } else {
        // In production, you might want to log to a service or show a generic message.
        // For now, we'll just log it to the console.
        console.error("Firestore Permission Error:", error.message);
      }
    };

    const unsubscribe = errorEmitter.on('permission-error', handleError);

    return () => {
      // In a real app, you'd want a way to remove the listener.
      // For simplicity here, we'll assume a simple `off` method exists.
      if ((errorEmitter as any).off) {
        (errorEmitter as any).off('permission-error', handleError);
      }
    };
  }, []);

  return null;
}
