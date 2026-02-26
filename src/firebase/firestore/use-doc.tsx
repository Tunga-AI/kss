'use client';

import { useState, useEffect, useRef } from 'react';
import { onSnapshot, DocumentReference, DocumentData, refEqual } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function useDoc<T extends DocumentData>(ref: DocumentReference<T> | null) {
  const [data, setData] = useState<(T & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refRef = useRef(ref);

  if (ref !== refRef.current) {
    if (!ref || !refRef.current || !refEqual(ref, refRef.current)) {
      refRef.current = ref;
    }
  }

  const stableRef = refRef.current;

  useEffect(() => {
    if (!stableRef) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);

    const unsubscribe = onSnapshot(
      stableRef,
      (doc) => {
        if (doc.exists()) {
          setData({ id: doc.id, ...doc.data() } as T & { id: string });
        } else {
          setData(null);
        }
        setLoading(false);
        setError(null);
      },
      async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: stableRef.path,
          operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [stableRef]);

  return { data, loading, error };
}
