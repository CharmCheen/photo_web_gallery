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
    <div className="min-h-screen text-white selection:bg-white/90 selection:text-black relative overflow-hidden">
      {/* Ambient Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-40 h-[520px] w-[520px] rounded-full bg-[#2997ff]/15 blur-[120px]" />
        <div className="absolute top-[20%] -left-32 h-[420px] w-[420px] rounded-full bg-white/10 blur-[140px]" />
        <div className="absolute bottom-0 left-1/2 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-white/5 blur-[160px]" />
      </div>
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
      <main className="relative pt-28 md:pt-32 px-4 md:px-8 max-w-[1920px] mx-auto">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative py-14 text-center text-neutral-500 text-sm">
        <div className="divider mb-8" />
        <p>© 2026 Lumina Gallery. Designed for Visual Listeners.</p>
      </footer>
    </div>
  );
};
