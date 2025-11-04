import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Eye, Heart, Image, FileText, Video, Search, Filter } from 'lucide-react';
import { mediaService } from '../../services/mediaService';
import { MediaItem } from '../../types/media';
import LoadingSpinner from '../../components/LoadingSpinner';

const MediaPage: React.FC = () => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'albums' | 'blogs' | 'videos'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMedia();
  }, [activeTab]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      let media: MediaItem[] = [];
      
      switch (activeTab) {
        case 'albums':
          media = await mediaService.getPublishedMedia('album');
          break;
        case 'blogs':
          media = await mediaService.getPublishedMedia('blog');
          break;
        case 'videos':
          media = await mediaService.getPublishedMedia('video');
          break;
        default:
          media = await mediaService.getPublishedMedia();
      }
      
      setMediaItems(media);
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = mediaItems.filter(item => {
    const title = item.title || '';
    const description = item.description || '';
    const tags = item.tags || [];

    return title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           description.toLowerCase().includes(searchTerm.toLowerCase()) ||
           tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const formatDate = (date: Date | undefined) => {
    if (!date || !(date instanceof Date)) {
      return 'No date';
    }
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'album':
        return <Image className="h-5 w-5" />;
      case 'blog':
        return <FileText className="h-5 w-5" />;
      case 'video':
        return <Video className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getMediaPath = (item: MediaItem) => {
    switch (item.type) {
      case 'album':
        return `/media/albums/${item.id}`;
      case 'blog':
        return `/media/blogs/${item.id}`;
      case 'video':
        return `/media/videos/${item.id}`;
      default:
        return `/media/${item.id}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section Skeleton */}
        <div className="bg-gradient-to-br from-primary-600 to-secondary-600 text-white py-16">
          <div className="px-4 sm:px-6 lg:px-8 xl:px-12">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Media Center</h1>
              <p className="text-xl mb-8 max-w-2xl mx-auto">
                Explore our collection of photo albums, insightful blogs, and educational videos
              </p>
              
              {/* Search Bar Skeleton */}
              <div className="max-w-lg mx-auto relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <div className="w-full pl-10 pr-4 py-3 rounded-lg bg-white bg-opacity-20 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Skeleton */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-4 sm:px-6 lg:px-8 xl:px-12">
            <div className="flex space-x-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="py-4 px-2">
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Loading */}
        <div className="px-4 sm:px-6 lg:px-8 xl:px-12 py-12 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 to-secondary-600 text-white py-16">
        <div className="px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Media Center</h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Explore our collection of photo albums, insightful blogs, and educational videos
            </p>
            
            {/* Search Bar */}
            <div className="max-w-lg mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search media..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-accent-400 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex space-x-8">
            {[
              { key: 'all', label: 'All Media', icon: Filter },
              { key: 'albums', label: 'Albums', icon: Image },
              { key: 'blogs', label: 'Blogs', icon: FileText },
              { key: 'videos', label: 'Videos', icon: Video }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.key
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Media Grid */}
      <div className="px-4 sm:px-6 lg:px-8 xl:px-12 py-12">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              {getMediaIcon(activeTab === 'all' ? 'blog' : activeTab.slice(0, -1))}
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No media found</h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search terms' : 'Check back later for new content'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item) => (
              <Link
                key={item.id}
                to={getMediaPath(item)}
                className="relative group block overflow-hidden rounded-md shadow-lg hover:shadow-2xl transition-all duration-500 bg-white h-80"
              >
                {/* Full Background Image */}
                <div className="absolute inset-0">
                  <img
                    src={item.featuredImage || '/programs.jpeg'}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>
                </div>

                {/* Content Overlay */}
                <div className="relative h-full flex flex-col justify-between p-6 text-white">
                  {/* Top Section - Type Badge */}
                  <div className="flex items-start justify-between">
                    <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm border border-white/20 ${
                      item.type === 'album' ? 'bg-green-500/80 text-white' :
                      item.type === 'blog' ? 'bg-blue-500/80 text-white' :
                      'bg-purple-500/80 text-white'
                    }`}>
                      <div className="p-1 rounded-full bg-white/20">
                        {getMediaIcon(item.type)}
                      </div>
                      <span className="capitalize">{item.type}</span>
                    </div>

                    {/* Stats in top right */}
                    <div className="flex items-center space-x-3 text-white/80">
                      <div className="flex items-center space-x-1 bg-black/30 px-2 py-1 rounded-full backdrop-blur-sm">
                        <Eye className="h-3 w-3" />
                        <span className="text-xs font-medium">{item.views || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1 bg-black/30 px-2 py-1 rounded-full backdrop-blur-sm">
                        <Heart className="h-3 w-3" />
                        <span className="text-xs font-medium">{item.likes || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Section - Content */}
                  <div className="space-y-3">
                    {/* Date */}
                    <div className="flex items-center space-x-2 text-white/70">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm font-medium">{formatDate(item.publishedAt || item.createdAt)}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-white leading-tight line-clamp-2 group-hover:text-accent-300 transition-colors duration-300">
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p className="text-white/90 text-sm leading-relaxed line-clamp-2">
                      {item.description}
                    </p>

                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {item.tags.slice(0, 2).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-xs rounded-md font-medium border border-white/10"
                          >
                            {tag}
                          </span>
                        ))}
                        {item.tags.length > 2 && (
                          <span className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-xs rounded-md font-medium border border-white/10">
                            +{item.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Read More Indicator */}
                    <div className="flex items-center space-x-2 text-accent-300 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span>View {item.type}</span>
                      <div className="w-6 h-6 rounded-full bg-accent-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaPage;