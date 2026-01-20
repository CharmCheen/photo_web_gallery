export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  bio?: string; // Added bio
}

export interface Photo {
  id: string;
  url: string;
  width: number;
  height: number;
  author: string;
  likes: number;
  description: string;
  tags: string[]; // Changed to required as we mocked it always present
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
}
