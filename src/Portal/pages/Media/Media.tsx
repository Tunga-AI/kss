import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Heart, 
  Calendar, 
  Image, 
  FileText, 
  Video,
  Edit,
  Trash2,
  MoreVertical,
  TrendingUp
} from 'lucide-react';
import { mediaService } from '../../../services/mediaService';
import { MediaItem, MediaStats } from '../../../types/media';
import LoadingSpinner from '../../../components/LoadingSpinner';

const Media: React.FC = () => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [stats, setStats] = useState<MediaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'albums' | 'blogs' | 'videos'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mediaData, statsData] = await Promise.all([
        fetchMedia(),
        mediaService.getMediaStats()
      ]);
      setMediaItems(mediaData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMedia = async () => {
    const type = activeTab === 'all' ? undefined : (activeTab.slice(0, -1) as 'album' | 'blog' | 'video');
    const status = statusFilter === 'all' ? undefined : statusFilter;
    
    if (type && status) {
      // Both filters applied - need to fetch all and filter manually
      const allMedia = await mediaService.getAllMedia();
      return allMedia.filter(item =>
        item.type === type &&
        item.status === status &&
        (searchTerm === '' ||
         (item.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
         (item.description || '').toLowerCase().includes(searchTerm.toLowerCase()))
      );
    } else if (type) {
      return await mediaService.getAllMedia(type);
    } else if (status) {
      return await mediaService.getAllMedia(undefined, status);
    } else {
      return await mediaService.getAllMedia();
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this media item?')) {
      try {
        await mediaService.deleteMedia(id);
        setMediaItems(prev => prev.filter(item => item.id !== id));
      } catch (error) {
        console.error('Error deleting media:', error);
        alert('Failed to delete media item');
      }
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'draft' | 'published' | 'archived') => {
    try {
      await mediaService.updateMedia(id, { 
        status: newStatus,
        publishedAt: newStatus === 'published' ? new Date() : undefined
      });
      setMediaItems(prev => 
        prev.map(item => 
          item.id === id 
            ? { ...item, status: newStatus, publishedAt: newStatus === 'published' ? new Date() : item.publishedAt }
            : item
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
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
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'album':
        return <Image className="h-4 w-4" />;
      case 'blog':
        return <FileText className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getCreatePath = (type: string) => {
    switch (type) {
      case 'albums':
        return '/portal/media/albums/new';
      case 'blogs':
        return '/portal/media/blogs/new';
      case 'videos':
        return '/portal/media/videos/new';
      case 'all':
        // Show media type selector when "all" is selected
        return '/portal/media/new';
      default:
        return '/portal/media/new';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Hero Section Skeleton */}
        <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Media Management</h1>
              <p className="text-lg text-primary-100">
                Create and manage your albums, blogs, and videos efficiently.
              </p>
            </div>
            <div className="bg-white bg-opacity-20 p-4 rounded-xl">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mt-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-4 w-20 bg-white bg-opacity-20 rounded mb-2 animate-pulse"></div>
                    <div className="h-8 w-12 bg-white bg-opacity-30 rounded mb-1 animate-pulse"></div>
                    <div className="h-3 w-16 bg-white bg-opacity-20 rounded animate-pulse"></div>
                  </div>
                  <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                    <div className="h-6 w-6 bg-white bg-opacity-30 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loading Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Media Management</h1>
            <p className="text-lg text-primary-100">
              Create and manage your albums, blogs, and videos efficiently.
            </p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <TrendingUp className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mt-8">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Total Albums</p>
                  <p className="text-2xl font-bold text-white">{stats.totalAlbums}</p>
                  <p className="text-sm font-medium text-primary-200">Photo galleries</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <Image className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Total Blogs</p>
                  <p className="text-2xl font-bold text-white">{stats.totalBlogs}</p>
                  <p className="text-sm font-medium text-primary-200">Article posts</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Total Videos</p>
                  <p className="text-2xl font-bold text-white">{stats.totalVideos}</p>
                  <p className="text-sm font-medium text-primary-200">Video content</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <Video className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Total Views</p>
                  <p className="text-2xl font-bold text-white">{stats.totalViews.toLocaleString()}</p>
                  <p className="text-sm font-medium text-primary-200">All content</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <Eye className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Total Likes</p>
                  <p className="text-2xl font-bold text-white">{stats.totalLikes}</p>
                  <p className="text-sm font-medium text-primary-200">Engagement</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <Heart className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
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
                  className={`group inline-flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                    activeTab === tab.key
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`h-4 w-4 transition-colors ${
                    activeTab === tab.key ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Controls */}
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search media..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>

              <Link
                to={getCreatePath(activeTab)}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200"
              >
                <Plus className="h-5 w-5" />
                <span>Create {activeTab === 'all' ? 'Media' : activeTab.slice(0, -1)}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Media List */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            {getTypeIcon(activeTab === 'all' ? 'blog' : activeTab.slice(0, -1))}
          </div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No media found</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {searchTerm ? 'Try adjusting your search terms or create new content' : 'Get started by creating your first media item'}
          </p>
          <Link
            to={getCreatePath(activeTab)}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200"
          >
            <Plus className="h-5 w-5" />
            <span>Create {activeTab === 'all' ? 'Media' : activeTab.slice(0, -1)}</span>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Media
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {item.featuredImage && (
                          <div className="h-12 w-12 bg-gray-200 rounded-lg overflow-hidden mr-4 flex-shrink-0">
                            <img
                              src={item.featuredImage}
                              alt={item.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">{item.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {item.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className={`p-1 rounded-md ${
                          item.type === 'album' ? 'bg-green-100 text-green-600' :
                          item.type === 'blog' ? 'bg-blue-100 text-blue-600' :
                          'bg-purple-100 text-purple-600'
                        }`}>
                          {getTypeIcon(item.type)}
                        </div>
                        <span className="text-sm text-gray-900 capitalize">{item.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value as any)}
                        className={`text-xs font-medium px-3 py-1 rounded-full border-0 focus:ring-2 focus:ring-primary-500 ${getStatusBadge(item.status)}`}
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Eye className="h-4 w-4 text-gray-400" />
                          <span>{item.views}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Heart className="h-4 w-4 text-gray-400" />
                          <span>{item.likes}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(item.updatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/portal/media/${item.type}s/${item.id}/edit`}
                          className="p-2 text-primary-600 hover:text-primary-900 hover:bg-primary-50 rounded-lg transition-colors duration-200"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Media;