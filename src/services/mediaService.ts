import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  increment,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { MediaItem, Album, Blog, Video, MediaCategory, MediaComment, MediaStats } from '../types/media';

class MediaService {
  private mediaCollection = collection(db, 'media');
  private categoriesCollection = collection(db, 'mediaCategories');
  private commentsCollection = collection(db, 'mediaComments');

  // Media CRUD Operations
  async createMedia(mediaData: Omit<MediaItem, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'likes'>): Promise<string> {
    try {
      const docRef = await addDoc(this.mediaCollection, {
        ...mediaData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        views: 0,
        likes: 0
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating media:', error);
      throw new Error('Failed to create media item');
    }
  }

  async updateMedia(id: string, updates: Partial<MediaItem>): Promise<void> {
    try {
      const docRef = doc(this.mediaCollection, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating media:', error);
      throw new Error('Failed to update media item');
    }
  }

  async deleteMedia(id: string): Promise<void> {
    try {
      const docRef = doc(this.mediaCollection, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting media:', error);
      throw new Error('Failed to delete media item');
    }
  }

  async getMediaById(id: string): Promise<MediaItem | null> {
    try {
      const docRef = doc(this.mediaCollection, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
          publishedAt: data.publishedAt?.toDate ? data.publishedAt.toDate() : data.publishedAt
        } as MediaItem;
      }
      return null;
    } catch (error) {
      console.error('Error getting media:', error);
      throw new Error('Failed to get media item');
    }
  }

  async getAllMedia(type?: 'album' | 'blog' | 'video', status?: 'draft' | 'published' | 'archived'): Promise<MediaItem[]> {
    try {
      let q;

      // Build query based on parameters
      if (type && status) {
        try {
          q = query(
            this.mediaCollection,
            where('type', '==', type),
            where('status', '==', status),
            orderBy('createdAt', 'desc')
          );
        } catch (indexError) {
          // Fallback: query without orderBy if index doesn't exist
          console.warn('Using fallback query due to missing index:', indexError);
          q = query(
            this.mediaCollection,
            where('type', '==', type),
            where('status', '==', status)
          );
        }
      } else if (type) {
        try {
          q = query(this.mediaCollection, where('type', '==', type), orderBy('createdAt', 'desc'));
        } catch (indexError) {
          console.warn('Using fallback query due to missing index:', indexError);
          q = query(this.mediaCollection, where('type', '==', type));
        }
      } else if (status) {
        try {
          q = query(this.mediaCollection, where('status', '==', status), orderBy('createdAt', 'desc'));
        } catch (indexError) {
          console.warn('Using fallback query due to missing index:', indexError);
          q = query(this.mediaCollection, where('status', '==', status));
        }
      } else {
        try {
          q = query(this.mediaCollection, orderBy('createdAt', 'desc'));
        } catch (indexError) {
          console.warn('Using fallback query without orderBy:', indexError);
          q = query(this.mediaCollection);
        }
      }

      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
          publishedAt: data.publishedAt?.toDate ? data.publishedAt.toDate() : data.publishedAt
        };
      }) as MediaItem[];

      // Sort manually if we couldn't use orderBy
      if (items.length > 0) {
        items.sort((a, b) => {
          const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
          const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
          return bTime - aTime;
        });
      }

      return items;
    } catch (error) {
      console.error('Error getting media list:', error);
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  }

  async getPublishedMedia(type?: 'album' | 'blog' | 'video', limitCount: number = 20): Promise<MediaItem[]> {
    try {
      let q = query(
        this.mediaCollection, 
        where('status', '==', 'published'), 
        orderBy('publishedAt', 'desc'),
        limit(limitCount)
      );
      
      if (type) {
        q = query(
          this.mediaCollection, 
          where('type', '==', type),
          where('status', '==', 'published'), 
          orderBy('publishedAt', 'desc'),
          limit(limitCount)
        );
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
          publishedAt: data.publishedAt?.toDate ? data.publishedAt.toDate() : data.publishedAt
        };
      }) as MediaItem[];
    } catch (error) {
      console.error('Error getting published media:', error);
      throw new Error('Failed to get published media');
    }
  }

  // File Upload Operations
  async uploadImage(file: File, path: string): Promise<string> {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      // Validate file size (10MB max for images)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('Image size must be less than 10MB');
      }

      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storageRef = ref(storage, `media/${path}/${timestamp}_${sanitizedFileName}`);

      console.log('Uploading image to Firebase Storage:', {
        path: `media/${path}/${timestamp}_${sanitizedFileName}`,
        fileSize: file.size,
        fileType: file.type
      });

      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      console.log('Image uploaded successfully:', downloadURL);
      return downloadURL;
    } catch (error: any) {
      console.error('Error uploading image:', error);

      // Provide more specific error messages
      if (error.code === 'storage/unauthorized') {
        throw new Error('You do not have permission to upload files. Please ensure you are logged in.');
      } else if (error.code === 'storage/quota-exceeded') {
        throw new Error('Storage quota exceeded. Please contact support.');
      } else if (error.code === 'storage/invalid-argument') {
        throw new Error('Invalid file. Please select a valid image file.');
      } else if (error.code === 'storage/canceled') {
        throw new Error('Upload was cancelled.');
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to upload image. Please try again.');
      }
    }
  }

  async uploadVideo(file: File, path: string): Promise<string> {
    try {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        throw new Error('File must be a video');
      }

      // Validate file size (50MB max for videos)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        throw new Error('Video size must be less than 50MB');
      }

      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storageRef = ref(storage, `media/videos/${path}/${timestamp}_${sanitizedFileName}`);

      console.log('Uploading video to Firebase Storage:', {
        path: `media/videos/${path}/${timestamp}_${sanitizedFileName}`,
        fileSize: file.size,
        fileType: file.type
      });

      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      console.log('Video uploaded successfully:', downloadURL);
      return downloadURL;
    } catch (error: any) {
      console.error('Error uploading video:', error);

      // Provide more specific error messages
      if (error.code === 'storage/unauthorized') {
        throw new Error('You do not have permission to upload files. Please ensure you are logged in.');
      } else if (error.code === 'storage/quota-exceeded') {
        throw new Error('Storage quota exceeded. Please contact support.');
      } else if (error.code === 'storage/invalid-argument') {
        throw new Error('Invalid file. Please select a valid video file.');
      } else if (error.code === 'storage/canceled') {
        throw new Error('Upload was cancelled.');
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to upload video. Please try again.');
      }
    }
  }

  async deleteFile(url: string): Promise<void> {
    try {
      const fileRef = ref(storage, url);
      await deleteObject(fileRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }

  // Blog-specific operations
  async getBlogBySlug(slug: string): Promise<Blog | null> {
    try {
      const q = query(
        this.mediaCollection, 
        where('type', '==', 'blog'),
        where('slug', '==', slug),
        where('status', '==', 'published')
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docSnapshot = querySnapshot.docs[0];
        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
          publishedAt: data.publishedAt?.toDate ? data.publishedAt.toDate() : data.publishedAt
        } as Blog;
      }
      return null;
    } catch (error) {
      console.error('Error getting blog by slug:', error);
      throw new Error('Failed to get blog');
    }
  }

  // Analytics operations
  async incrementViews(mediaId: string): Promise<void> {
    try {
      const docRef = doc(this.mediaCollection, mediaId);
      await updateDoc(docRef, {
        views: increment(1)
      });
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  }

  async incrementLikes(mediaId: string): Promise<void> {
    try {
      const docRef = doc(this.mediaCollection, mediaId);
      await updateDoc(docRef, {
        likes: increment(1)
      });
    } catch (error) {
      console.error('Error incrementing likes:', error);
      throw new Error('Failed to like media');
    }
  }

  async getMediaStats(): Promise<MediaStats> {
    try {
      const mediaSnapshot = await getDocs(this.mediaCollection);
      const mediaItems = mediaSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
          publishedAt: data.publishedAt?.toDate ? data.publishedAt.toDate() : data.publishedAt
        };
      }) as MediaItem[];

      const totalAlbums = mediaItems.filter(item => item.type === 'album').length;
      const totalBlogs = mediaItems.filter(item => item.type === 'blog').length;
      const totalVideos = mediaItems.filter(item => item.type === 'video').length;
      const totalViews = mediaItems.reduce((sum, item) => sum + (item.views || 0), 0);
      const totalLikes = mediaItems.reduce((sum, item) => sum + (item.likes || 0), 0);

      // Get recent activity (simplified) - ensure proper date handling
      const recentActivity = mediaItems
        .filter(item => item.updatedAt) // Filter out items without updatedAt
        .sort((a, b) => {
          const aTime = a.updatedAt instanceof Date ? a.updatedAt.getTime() : 0;
          const bTime = b.updatedAt instanceof Date ? b.updatedAt.getTime() : 0;
          return bTime - aTime;
        })
        .slice(0, 10)
        .map(item => ({
          type: 'view' as const,
          mediaId: item.id,
          mediaTitle: item.title,
          timestamp: item.updatedAt instanceof Date ? item.updatedAt : new Date()
        }));

      return {
        totalAlbums,
        totalBlogs,
        totalVideos,
        totalViews,
        totalLikes,
        recentActivity
      };
    } catch (error) {
      console.error('Error getting media stats:', error);
      throw new Error('Failed to get media statistics');
    }
  }

  // Categories
  async getCategories(type?: 'blog' | 'video' | 'general'): Promise<MediaCategory[]> {
    try {
      let q = query(this.categoriesCollection);
      
      if (type) {
        q = query(this.categoriesCollection, where('type', '==', type));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MediaCategory[];
    } catch (error) {
      console.error('Error getting categories:', error);
      throw new Error('Failed to get categories');
    }
  }

  async createCategory(categoryData: Omit<MediaCategory, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(this.categoriesCollection, categoryData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating category:', error);
      throw new Error('Failed to create category');
    }
  }

  // Comments
  async addComment(commentData: Omit<MediaComment, 'id' | 'createdAt' | 'approved'>): Promise<string> {
    try {
      const docRef = await addDoc(this.commentsCollection, {
        ...commentData,
        createdAt: Timestamp.now(),
        approved: false
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw new Error('Failed to add comment');
    }
  }

  async getComments(mediaId: string, approved: boolean = true): Promise<MediaComment[]> {
    try {
      const q = query(
        this.commentsCollection,
        where('mediaId', '==', mediaId),
        where('approved', '==', approved),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt
        };
      }) as MediaComment[];
    } catch (error) {
      console.error('Error getting comments:', error);
      throw new Error('Failed to get comments');
    }
  }

  async approveComment(commentId: string): Promise<void> {
    try {
      const docRef = doc(this.commentsCollection, commentId);
      await updateDoc(docRef, { approved: true });
    } catch (error) {
      console.error('Error approving comment:', error);
      throw new Error('Failed to approve comment');
    }
  }
}

export const mediaService = new MediaService();