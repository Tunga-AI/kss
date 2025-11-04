export interface MediaItem {
  id: string;
  title: string;
  description: string;
  type: 'album' | 'blog' | 'video';
  status: 'draft' | 'published' | 'archived';
  authorId: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  tags: string[];
  featuredImage?: string;
  views: number;
  likes: number;
}

export interface Album extends MediaItem {
  type: 'album';
  images: AlbumImage[];
  location?: string;
  eventDate?: Date;
}

export interface AlbumImage {
  id: string;
  url: string;
  caption?: string;
  order: number;
  thumbnailUrl?: string;
}

export interface Blog extends MediaItem {
  type: 'blog';
  content: string;
  excerpt: string;
  readTime: number;
  category: string;
  slug: string;
}

export interface Video extends MediaItem {
  type: 'video';
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  category: string;
  embedUrl?: string;
  transcript?: string;
}

export interface MediaCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  type: 'blog' | 'video' | 'general';
}

export interface MediaComment {
  id: string;
  mediaId: string;
  authorName: string;
  authorEmail: string;
  content: string;
  createdAt: Date;
  approved: boolean;
  replies?: MediaComment[];
}

export interface MediaStats {
  totalAlbums: number;
  totalBlogs: number;
  totalVideos: number;
  totalViews: number;
  totalLikes: number;
  recentActivity: {
    type: 'view' | 'like' | 'comment';
    mediaId: string;
    mediaTitle: string;
    timestamp: Date;
  }[];
}