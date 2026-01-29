import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

const AppContent: React.FC = () => {
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
              onPhotoSelect={setSelectedPhoto} 
              refreshKey={refreshKey} 
              onError={showToast}
              searchQuery={searchQuery}
              selectedTag={selectedTag}
            />
          }
        />
      </Routes>

      {/* Global Modals */}
      <AnimatePresence>
        {selectedPhoto && (
          <Lightbox 
            photo={selectedPhoto} 
            onClose={() => setSelectedPhoto(null)} 
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
