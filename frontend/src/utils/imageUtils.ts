const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pulsenew-l909.onrender.com';

// Function to normalize image URLs (handles localhost and production)
export const normalizeImageUrl = (url: string): string => {
  if (!url) return '';

  // If it's already a full URL (Cloudinary or external), return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // Replace localhost URLs with production URL
    if (url.includes('localhost:5000/uploads/')) {
      return url.replace('http://localhost:5000/uploads/', `${API_BASE_URL}/uploads/`);
    }
    return url;
  }

  // If it's a relative path, assume it's from uploads
  return `${API_BASE_URL}/uploads/${url}`;
};
