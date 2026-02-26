'use client';

import { useState, useEffect, useRef } from 'react';
import { onSnapshot, Query, DocumentData, queryEqual } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function useCollection<T extends DocumentData>(q: Query<T> | null) {
  const [data, setData] = useState<(T & { id: string })[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Use a ref to store the query to prevent infinite loops when the query object
  // is recreated on every render but is semantically the same.
  const queryRef = useRef(q);

  if (q !== queryRef.current) {
    // If one is null and other isn't, they are different.
    // If both are non-null, check if they are equal queries.
    if (!q || !queryRef.current || !queryEqual(q, queryRef.current)) {
      queryRef.current = q;
    }
  }

  const stableQuery = queryRef.current;

  useEffect(() => {
    if (!stableQuery) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);

    const unsubscribe = onSnapshot(
      stableQuery,
      (querySnapshot) => {
        const documents = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as (T & { id: string })[];
        setData(documents);
        setLoading(false);
        setError(null);
      },
      (serverError) => {
        console.error('Firestore error on collection:', (stableQuery as any)._query?.path?.toString(), serverError);
        const permissionError = new FirestorePermissionError({
          path: (stableQuery as any)._query?.path?.toString() || 'unknown path',
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [stableQuery]);

  return { data, loading, error };
}
