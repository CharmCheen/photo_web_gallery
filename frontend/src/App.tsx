import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { Lightbox } from './components/Lightbox';
import { UploadModal } from './components/UploadModal';
import { AuthModal } from './components/AuthModal';
import { DiscoverModal } from './components/DiscoverModal';
import { Toast } from './components/Toast';
import { Photo } from './types';
import { api } from './services/api';

const AppContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Global Modal & Interaction State
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDiscoverOpen, setIsDiscoverOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [authModal, setAuthModal] = useState<{ isOpen: boolean, mode: 'login' | 'register' }>({ 
    isOpen: false, 
    mode: 'login' 
  });
  const [toast, setToast] = useState<{ msg: string, id: number } | null>(null);
  
  // 搜索和筛选状态
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  const showToast = (msg: string) => {
    setToast({ msg, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleTagSelect = (tag: string) => {
    setSelectedTag(tag);
  };

  const handlePhotoOpen = (photo: Photo) => {
    setSelectedPhoto(photo);
    const params = new URLSearchParams(location.search);
    params.set('photo', photo.id);
    const search = params.toString();
    navigate({ pathname: '/', search: search ? `?${search}` : '' }, { replace: false });
  };

  const handleLightboxClose = () => {
    setSelectedPhoto(null);
    const params = new URLSearchParams(location.search);
    params.delete('photo');
    const search = params.toString();
    navigate({ pathname: '/', search: search ? `?${search}` : '' }, { replace: true });
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const photoId = params.get('photo');

    if (!photoId) return;
    if (selectedPhoto?.id === photoId) return;

    let cancelled = false;
    const fetchPhoto = async () => {
      try {
        const photo = await api.photos.get(photoId);
        if (!cancelled) {
          setSelectedPhoto(photo);
        }
      } catch (error) {
        if (!cancelled) {
          showToast('照片不存在或已删除');
          navigate('/', { replace: true });
        }
      }
    };

    fetchPhoto();
    return () => {
      cancelled = true;
    };
  }, [location.search, navigate, selectedPhoto?.id, showToast]);

  return (
    <Layout 
      onUploadClick={() => setIsUploadOpen(true)}
      onDiscoverClick={() => setIsDiscoverOpen(true)}
      onAuthClick={() => setAuthModal({ isOpen: true, mode: 'login' })}
      onSearch={handleSearch}
      onTagSelect={handleTagSelect}
    >
      <Routes>
        <Route
          path="/"
          element={
            <HomePage 
              onPhotoSelect={handlePhotoOpen} 
              refreshKey={refreshKey} 
              onError={showToast}
              searchQuery={searchQuery}
              selectedTag={selectedTag}
            />
          }
        />
      </Routes>

      {/* Global Modals */}
      <AnimatePresence mode="wait">
        {selectedPhoto && (
          <Lightbox 
            key={selectedPhoto.id}
            photo={selectedPhoto} 
            onClose={handleLightboxClose} 
            onDownload={(photo) => showToast('正在下载 4K 原图...')}
            onDelete={(photoId) => {
              showToast('照片已删除');
              setRefreshKey((prev) => prev + 1);
            }}
          />
        )}
      </AnimatePresence>

      <UploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onUpload={(photo) => {
            showToast('发布成功');
            setRefreshKey((prev) => prev + 1);
            setIsUploadOpen(false);
            // In a real app, trigger a refresh of the gallery here
        }} 
        onError={showToast}
      />

      <AuthModal 
        isOpen={authModal.isOpen} 
        mode={authModal.mode}
        onClose={() => setAuthModal(prev => ({ ...prev, isOpen: false }))}
        onSwitchMode={() => setAuthModal(prev => ({ ...prev, mode: prev.mode === 'login' ? 'register' : 'login' }))}
        onSuccess={() => {
            setAuthModal(prev => ({ ...prev, isOpen: false }));
          showToast(authModal.mode === 'login' ? '欢迎回来' : '欢迎加入 Lumina');
        }}
      />
      
      <DiscoverModal 
        isOpen={isDiscoverOpen} 
        onClose={() => setIsDiscoverOpen(false)} 
      />

      {toast && <Toast message={toast.msg} onClose={() => setToast(null)} />}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;
