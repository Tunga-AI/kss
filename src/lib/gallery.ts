'use client';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  Firestore,
  serverTimestamp,
} from 'firebase/firestore';
import { deleteObject, ref, Storage } from 'firebase/storage';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { GalleryImage } from './gallery-types';

export function addGalleryImage(db: Firestore, image: Omit<GalleryImage, 'id' | 'createdAt'>) {
  const imageWithTimestamp = { ...image, createdAt: serverTimestamp() };
  addDoc(collection(db, 'gallery'), imageWithTimestamp)
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: '/gallery',
        operation: 'create',
        requestResourceData: imageWithTimestamp,
      });
      errorEmitter.emit('permission-error', permissionError);
    });
}

export function deleteGalleryImage(db: Firestore, storage: Storage, image: GalleryImage) {
  const imageRef = doc(db, 'gallery', image.id);
  const storageRef = ref(storage, image.imageUrl);

  deleteDoc(imageRef)
    .then(() => {
      // Delete the file from storage after the document is deleted from firestore
      return deleteObject(storageRef);
    })
    .catch(async (serverError) => {
        // Handle firestore delete error
        if (serverError.code) { // It's a firestore error
             const permissionError = new FirestorePermissionError({
                path: imageRef.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        } else { // It's a storage error
            console.error("Error deleting from storage: ", serverError);
             // We could potentially re-add the firestore entry or handle it differently
        }
    });
}
