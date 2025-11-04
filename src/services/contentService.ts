import { FirestoreService } from './firestore';
import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export interface ContentResource {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'pdf' | 'article' | 'link' | 'image' | 'other';
  url: string;
  fileSize?: string;
  duration?: string;
  tags: string[];
  uploadedBy: string;
  uploadedAt: string;
  cohortId?: string;
  week?: number;
  isPublic: boolean;
  status: 'draft' | 'published' | 'archived';
  downloadCount?: number;
  viewCount?: number;
  createdAt: string;
  updatedAt: string;
  fileName?: string;
  storagePath?: string;
}

export interface ContentResourceData {
  title: string;
  description: string;
  type: 'video' | 'pdf' | 'article' | 'link' | 'image' | 'other';
  url: string;
  fileSize?: string;
  duration?: string;
  tags: string[];
  cohortId?: string;
  week?: number;
  isPublic: boolean;
  status: 'draft' | 'published' | 'archived';
  fileName?: string;
  storagePath?: string;
}

export interface ContentResourceFilter {
  type?: string;
  cohortId?: string;
  week?: number;
  status?: string;
  isPublic?: boolean;
  searchTerm?: string;
}

export interface ContentResourceStats {
  totalResources: number;
  publishedResources: number;
  draftResources: number;
  totalViews: number;
  totalDownloads: number;
  resourcesByType: { type: string; count: number }[];
}

export class ContentResourceService {
  private static collection = 'content_resources';

  // Upload file to Firebase Storage
  static async uploadFile(
    file: File,
    cohortId?: string
  ): Promise<{ success: boolean; url?: string; storagePath?: string; error?: string }> {
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name}`;
      const storagePath = cohortId 
        ? `content/${cohortId}/${fileName}`
        : `content/general/${fileName}`;
      
      const storageRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return {
        success: true,
        url: downloadURL,
        storagePath
      };
    } catch (error) {
      return { success: false, error: 'Failed to upload file' };
    }
  }

  // Delete file from Firebase Storage
  static async deleteFile(storagePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to delete file' };
    }
  }

  // Create a new content resource
  static async createResource(
    data: ContentResourceData,
    userId: string
  ): Promise<{ success: boolean; data?: ContentResource; error?: string }> {
    try {
      const now = new Date().toISOString();
      const resourceData = {
        ...data,
        uploadedBy: userId,
        uploadedAt: now,
        createdAt: now,
        updatedAt: now,
        viewCount: 0,
        downloadCount: 0
      };

      const result = await FirestoreService.create(this.collection, resourceData);
      
      if (result.success && result.id) {
        return {
          success: true,
          data: { id: result.id, ...resourceData } as ContentResource
        };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to create resource' };
    }
  }

  // Create resource with file upload
  static async createResourceWithFile(
    data: Omit<ContentResourceData, 'url' | 'fileName' | 'storagePath'>,
    file: File,
    userId: string
  ): Promise<{ success: boolean; data?: ContentResource; error?: string }> {
    try {
      // Upload file first
      const uploadResult = await this.uploadFile(file, data.cohortId);
      if (!uploadResult.success) {
        return { success: false, error: uploadResult.error };
      }

      // Create resource with file info
      const resourceData: ContentResourceData = {
        ...data,
        url: uploadResult.url!,
        fileName: file.name,
        storagePath: uploadResult.storagePath!,
        fileSize: file.size.toString()
      };

      return await this.createResource(resourceData, userId);
    } catch (error) {
      return { success: false, error: 'Failed to create resource with file' };
    }
  }

  // Get all content resources with optional filtering
  static async getResources(
    filters: ContentResourceFilter = {}
  ): Promise<{ success: boolean; data?: ContentResource[]; error?: string }> {
    try {
      const queries = [];
      
      if (filters.type && filters.type !== 'all') {
        queries.push({ field: 'type', operator: '==', value: filters.type });
      }
      
      if (filters.cohortId) {
        queries.push({ field: 'cohortId', operator: '==', value: filters.cohortId });
      }
      
      if (filters.week) {
        queries.push({ field: 'week', operator: '==', value: filters.week });
      }
      
      if (filters.status) {
        queries.push({ field: 'status', operator: '==', value: filters.status });
      }
      
      if (filters.isPublic !== undefined) {
        queries.push({ field: 'isPublic', operator: '==', value: filters.isPublic });
      }

      const result = await FirestoreService.getWithQuery(this.collection, queries);
      
      if (result.success && result.data) {
        let resources = result.data as ContentResource[];
        
        // Apply search filter if provided
        if (filters.searchTerm) {
          const searchTerm = filters.searchTerm.toLowerCase();
          resources = resources.filter(resource => 
            resource.title.toLowerCase().includes(searchTerm) ||
            resource.description.toLowerCase().includes(searchTerm) ||
            resource.tags.some(tag => tag.toLowerCase().includes(searchTerm))
          );
        }
        
        // Sort by most recent
        resources.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        return { success: true, data: resources };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to fetch resources' };
    }
  }

  // Get a single content resource by ID
  static async getResource(
    id: string
  ): Promise<{ success: boolean; data?: ContentResource; error?: string }> {
    try {
      const result = await FirestoreService.getById(this.collection, id);
      
      if (result.success && result.data) {
        return { success: true, data: result.data as ContentResource };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to fetch resource' };
    }
  }

  // Update a content resource
  static async updateResource(
    id: string,
    data: Partial<ContentResourceData>
  ): Promise<{ success: boolean; data?: ContentResource; error?: string }> {
    try {
      const updateData = {
        ...data,
        updatedAt: new Date().toISOString()
      };

      const result = await FirestoreService.update(this.collection, id, updateData);
      
      if (result.success) {
        // Fetch the updated resource
        const updatedResource = await this.getResource(id);
        return updatedResource;
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to update resource' };
    }
  }

  // Delete a content resource
  static async deleteResource(
    id: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get resource to check if it has a file to delete
      const resource = await this.getResource(id);
      
      // Delete from Firestore
      const result = await FirestoreService.delete(this.collection, id);
      
      if (result.success) {
        // Delete file from storage if it exists
        if (resource.success && resource.data?.storagePath) {
          await this.deleteFile(resource.data.storagePath);
        }
      }
      
      return result;
    } catch (error) {
      return { success: false, error: 'Failed to delete resource' };
    }
  }

  // Increment view count
  static async incrementViewCount(
    id: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const resource = await this.getResource(id);
      if (!resource.success || !resource.data) {
        return { success: false, error: 'Resource not found' };
      }

      const viewCount = (resource.data.viewCount || 0) + 1;
      const result = await FirestoreService.update(this.collection, id, {
        viewCount,
        updatedAt: new Date().toISOString()
      });

      return result;
    } catch (error) {
      return { success: false, error: 'Failed to increment view count' };
    }
  }

  // Increment download count
  static async incrementDownloadCount(
    id: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const resource = await this.getResource(id);
      if (!resource.success || !resource.data) {
        return { success: false, error: 'Resource not found' };
      }

      const downloadCount = (resource.data.downloadCount || 0) + 1;
      const result = await FirestoreService.update(this.collection, id, {
        downloadCount,
        updatedAt: new Date().toISOString()
      });

      return result;
    } catch (error) {
      return { success: false, error: 'Failed to increment download count' };
    }
  }

  // Get content resource statistics
  static async getResourceStats(): Promise<{ 
    success: boolean; 
    data?: ContentResourceStats; 
    error?: string 
  }> {
    try {
      const result = await FirestoreService.getAll(this.collection);
      
      if (result.success && result.data) {
        const resources = result.data as ContentResource[];
        
        const stats: ContentResourceStats = {
          totalResources: resources.length,
          publishedResources: resources.filter(r => r.status === 'published').length,
          draftResources: resources.filter(r => r.status === 'draft').length,
          totalViews: resources.reduce((sum, r) => sum + (r.viewCount || 0), 0),
          totalDownloads: resources.reduce((sum, r) => sum + (r.downloadCount || 0), 0),
          resourcesByType: []
        };

        // Calculate resources by type
        const typeCount = resources.reduce((acc, resource) => {
          acc[resource.type] = (acc[resource.type] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number });

        stats.resourcesByType = Object.entries(typeCount).map(([type, count]) => ({
          type,
          count
        }));

        return { success: true, data: stats };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to fetch resource statistics' };
    }
  }

  // Get resources by cohort
  static async getResourcesByCohort(
    cohortId: string
  ): Promise<{ success: boolean; data?: ContentResource[]; error?: string }> {
    return this.getResources({ cohortId });
  }

  // Get public resources
  static async getPublicResources(): Promise<{ 
    success: boolean; 
    data?: ContentResource[]; 
    error?: string 
  }> {
    return this.getResources({ isPublic: true, status: 'published' });
  }

  // Get resources by week
  static async getResourcesByWeek(
    week: number,
    cohortId?: string
  ): Promise<{ success: boolean; data?: ContentResource[]; error?: string }> {
    return this.getResources({ week, cohortId });
  }

  // Bulk update resources
  static async bulkUpdateResources(
    resourceIds: string[],
    updateData: Partial<ContentResourceData>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updatePromises = resourceIds.map(id => 
        this.updateResource(id, updateData)
      );

      const results = await Promise.all(updatePromises);
      const failedUpdates = results.filter(r => !r.success);

      if (failedUpdates.length > 0) {
        return { success: false, error: `Failed to update ${failedUpdates.length} resources` };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to bulk update resources' };
    }
  }

  // Bulk delete resources
  static async bulkDeleteResources(
    resourceIds: string[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const deletePromises = resourceIds.map(id => 
        this.deleteResource(id)
      );

      const results = await Promise.all(deletePromises);
      const failedDeletes = results.filter(r => !r.success);

      if (failedDeletes.length > 0) {
        return { success: false, error: `Failed to delete ${failedDeletes.length} resources` };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to bulk delete resources' };
    }
  }
} 