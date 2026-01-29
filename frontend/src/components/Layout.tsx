import React from 'react';
import { Navbar } from './Navbar';
import { CustomCursor } from './CustomCursor';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  onUploadClick: () => void;
  onDiscoverClick: () => void;
  onAuthClick: () => void;
  onSearch?: (query: string) => void;
  onTagSelect?: (tag: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  onUploadClick, 
  onDiscoverClick,
  onAuthClick,
  onSearch,
  onTagSelect
}) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-orange-500 selection:text-white">
      <CustomCursor />
      
      {/* Navigation */}
      <Navbar 
        user={user} 
        onUploadClick={onUploadClick}
        onLoginClick={onAuthClick}
        onRegisterClick={onAuthClick}
        onLogoutClick={logout}
        onDiscoverClick={onDiscoverClick}
        onSearch={onSearch}
        onTagSelect={onTagSelect}
      />

      {/* Main Content */}
      <main className="pt-24 px-4 md:px-8 max-w-[1920px] mx-auto">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-12 text-center text-neutral-600 text-sm">
        <p>© 2026 Lumina Gallery. Designed for Visual Listeners.</p>
      </footer>
    </div>
  );
};
