import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  Firestore,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  arrayRemove,
  Timestamp
} from 'firebase/firestore';
import { deleteObject, ref, FirebaseStorage } from 'firebase/storage';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { MediaAlbum, MediaImage } from './media-types';

// --- Media Albums ---

export async function createMediaAlbum(db: Firestore, album: Partial<MediaAlbum>) {
  try {
    const docRef = await addDoc(collection(db, 'media'), {
      ...album,
      type: 'album',
      images: [],
      likes: 0,
      views: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error: any) {
    console.error("Error creating media album:", error);
    const permissionError = new FirestorePermissionError({
      path: '/media',
      operation: 'create',
      requestResourceData: album,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw error;
  }
}

export async function updateMediaAlbum(db: Firestore, id: string, data: Partial<MediaAlbum>) {
  try {
    await updateDoc(doc(db, 'media', id), {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error: any) {
    console.error("Error updating media album:", error);
    throw error;
  }
}

export async function deleteMediaAlbum(db: Firestore, storage: FirebaseStorage, albumId: string, featuredImage?: string, images?: MediaImage[]) {
  try {
    await deleteDoc(doc(db, 'media', albumId));

    // Attempt to delete featured image
    if (featuredImage) {
      try {
        const storageRef = ref(storage, featuredImage);
        await deleteObject(storageRef);
      } catch (e) {
        console.warn("Failed to delete featured image:", e);
      }
    }

    // Attempt to delete all images
    if (images && images.length > 0) {
      for (const img of images) {
        if (img.url) {
          try {
            const storageRef = ref(storage, img.url);
            await deleteObject(storageRef);
          } catch (e) {
            console.warn("Failed to delete image asset:", e);
          }
        }
      }
    }
  } catch (error: any) {
    console.error("Error deleting media album:", error);
    throw error;
  }
}

// --- Media Images (Assets) ---

export async function addMediaImage(db: Firestore, albumId: string, image: MediaImage) {
  try {
    const albumRef = doc(db, 'media', albumId);
    await updateDoc(albumRef, {
      images: arrayUnion(image),
      updatedAt: serverTimestamp()
    });
  } catch (error: any) {
    console.error("Error adding media image:", error);
    throw error;
  }
}

export async function deleteMediaImage(db: Firestore, storage: FirebaseStorage, albumId: string, image: MediaImage) {
  try {
    const albumRef = doc(db, 'media', albumId);
    await updateDoc(albumRef, {
      images: arrayRemove(image),
      updatedAt: serverTimestamp()
    });

    if (image.url) {
      try {
        const storageRef = ref(storage, image.url);
        await deleteObject(storageRef);
      } catch (e) {
        console.warn("Failed to delete storage obj", e);
      }
    }
  } catch (error: any) {
    console.error("Error deleting media image:", error);
    throw error;
  }
}

