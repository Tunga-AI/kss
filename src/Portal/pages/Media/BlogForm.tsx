import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload, X, Plus, Save, Eye, Type, Clock } from 'lucide-react';
import { mediaService } from '../../../services/mediaService';
import { Blog, MediaCategory } from '../../../types/media';
import { useAuthContext } from '../../../contexts/AuthContext';
import LoadingSpinner from '../../../components/LoadingSpinner';

const BlogForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuthContext();
  const isEdit = id && id !== 'new';

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [categories, setCategories] = useState<MediaCategory[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    excerpt: '',
    category: '',
    slug: '',
    tags: [] as string[],
    status: 'draft' as 'draft' | 'published' | 'archived',
    featuredImage: '',
    readTime: 5
  });
  
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    fetchCategories();
    if (isEdit) {
      fetchBlog();
    }
  }, [id, isEdit]);

  const fetchCategories = async () => {
    try {
      const categoriesData = await mediaService.getCategories('blog');
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchBlog = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const blog = await mediaService.getMediaById(id) as Blog;
      if (blog && blog.type === 'blog') {
        setFormData({
          title: blog.title,
          description: blog.description,
          content: blog.content,
          excerpt: blog.excerpt,
          category: blog.category,
          slug: blog.slug,
          tags: blog.tags,
          status: blog.status,
          featuredImage: blog.featuredImage || '',
          readTime: blog.readTime
        });
      }
    } catch (error) {
      console.error('Error fetching blog:', error);
      alert('Failed to load blog');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-generate slug from title
    if (name === 'title') {
      const slug = value.toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({ ...prev, slug }));
    }
    
    // Auto-calculate read time from content
    if (name === 'content') {
      const wordsPerMinute = 200;
      const wordCount = value.split(/\s+/).length;
      const readTime = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
      setFormData(prev => ({ ...prev, readTime }));
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);
      const url = await mediaService.uploadImage(file, 'blogs');
      setFormData(prev => ({ ...prev, featuredImage: url }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagIndex: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== tagIndex)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userProfile) {
      alert('User profile not found');
      return;
    }

    if (!formData.title || !formData.content || !formData.excerpt || !formData.category) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      
      const blogData = {
        title: formData.title,
        description: formData.description,
        type: 'blog' as const,
        status: formData.status,
        authorId: userProfile.id,
        authorName: userProfile.name,
        tags: formData.tags,
        featuredImage: formData.featuredImage || undefined,
        content: formData.content,
        excerpt: formData.excerpt,
        category: formData.category,
        slug: formData.slug,
        readTime: formData.readTime
      };

      if (isEdit && id) {
        await mediaService.updateMedia(id, blogData);
        alert('Blog updated successfully!');
      } else {
        await mediaService.createMedia(blogData);
        alert('Blog created successfully!');
      }
      
      navigate('/portal/media');
    } catch (error) {
      console.error('Error saving blog:', error);
      alert('Failed to save blog');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-6 w-32 bg-white bg-opacity-20 rounded animate-pulse"></div>
              <div>
                <div className="h-10 w-48 bg-white bg-opacity-30 rounded mb-2 animate-pulse"></div>
                <div className="h-5 w-64 bg-white bg-opacity-20 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="h-10 w-24 bg-white bg-opacity-20 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Form Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/portal/media"
              className="flex items-center space-x-2 text-primary-100 hover:text-white transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Media</span>
            </Link>
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {isEdit ? 'Edit Blog' : 'Create Blog'}
              </h1>
              <p className="text-lg text-primary-100">
                {isEdit ? 'Update your blog post' : 'Create a new blog post for your audience'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => navigate(`/media/blogs/${id}`)}
              disabled={!isEdit}
              className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white hover:bg-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Eye className="h-4 w-4" />
              <span>Preview</span>
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter blog title"
                />
              </div>
              
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                  URL Slug *
                </label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  required
                  value={formData.slug}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="url-friendly-slug"
                />
              </div>
            </div>

            <div className="mt-6">
              <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
                Excerpt *
              </label>
              <textarea
                id="excerpt"
                name="excerpt"
                required
                rows={3}
                value={formData.excerpt}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Brief description of the blog post"
              />
            </div>

            <div className="mt-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Meta Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={2}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="SEO meta description (optional)"
              />
            </div>
          </div>

        {/* Featured Image */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Featured Image</h2>
            
            {formData.featuredImage ? (
              <div className="relative">
                <img
                  src={formData.featuredImage}
                  alt="Featured"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, featuredImage: '' }))}
                  className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                  className="hidden"
                  id="featured-image"
                  disabled={uploadingImage}
                />
                <label
                  htmlFor="featured-image"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <Upload className="h-8 w-8 text-gray-400" />
                  <span className="text-gray-600">
                    {uploadingImage ? 'Uploading...' : 'Click to upload featured image'}
                  </span>
                  <span className="text-sm text-gray-400">PNG, JPG, GIF up to 10MB</span>
                </label>
              </div>
            )}
          </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Content *</h2>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Type className="h-4 w-4" />
                  <span>{formData.content.split(/\s+/).length} words</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{formData.readTime} min read</span>
                </div>
              </div>
            </div>
            
            <textarea
              id="content"
              name="content"
              required
              rows={20}
              value={formData.content}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
              placeholder="Write your blog content here... (HTML supported)"
            />
            
            <div className="mt-4 text-sm text-gray-600">
              <p>You can use HTML tags for formatting. Common tags: &lt;p&gt;, &lt;h2&gt;, &lt;h3&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;ol&gt;, &lt;li&gt;, &lt;a&gt;, &lt;img&gt;</p>
            </div>
          </div>

        {/* Tags */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tags</h2>
            
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Add a tag"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="flex items-center space-x-1 px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="hover:text-primary-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <Link
              to="/portal/media"
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </Link>
            
            <button
              type="submit"
              disabled={saving || uploadingImage}
              className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : isEdit ? 'Update Blog' : 'Create Blog'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BlogForm;