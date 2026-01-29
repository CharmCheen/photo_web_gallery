export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
}

export interface Photo {
  id: string;
  url: string;
  thumbnailUrl?: string;
  width: number;
  height: number;
  author: string;
  authorId?: string;
  likes: number;
  description: string;
  tags: string[];
}

export interface PhotosResponse {
  photos: Photo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    totalPages: number;
  };
}

export interface Artist {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  likes: string;
  followers: string;
  coverImage: string;
}

export interface GalleryProps {
  photos: Photo[];
  onSelect: (photo: Photo) => void;
}

export interface ImageCardProps {
  photo: Photo;
  onClick: () => void;
}

export interface LightboxProps {
  photo: Photo;
  onClose: () => void;
  onDownload: (photo: Photo) => void;
}

export interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (photo: Photo) => void;
  onError?: (message: string) => void;
}

export interface DiscoverModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface AuthModalProps {
  isOpen: boolean;
  mode: 'login' | 'register';
  onClose: () => void;
  onSwitchMode: () => void;
  onSuccess?: () => void;
}

export interface NavbarProps {
  user: User | null;
  onUploadClick: () => void;
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onLogoutClick: () => void;
  onDiscoverClick: () => void;
  onSearch?: (query: string) => void;
  onTagSelect?: (tag: string) => void;
}

export interface Tag {
  name: string;
  count: number;
}

export interface TagsResponse {
  tags: Tag[];
}

export interface LikesResponse {
  likes: Record<string, boolean>;
}

export interface LikeResult {
  likes: number;
  liked: boolean;
}
