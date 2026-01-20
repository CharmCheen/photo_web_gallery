import React from 'react';
import { Navbar } from './Navbar';
import { CustomCursor } from './CustomCursor';
import { useAuth } from '../context/AuthContext';
import { Toaster } from 'react-hot-toast'; // Using react-hot-toast or custom?
// The original code had a custom Toast component. I'll stick to that for now to avoid extra deps if possible, 
// OR I'll just use the custom Toast component provided in App.tsx originally.
// Better to move Toast logic to a Context too, or just keep it simple in Layout if it's global.

interface LayoutProps {
  children: React.ReactNode;
  onUploadClick: () => void;
  onDiscoverClick: () => void;
  onAuthClick: () => void; // Opens login modal
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  onUploadClick, 
  onDiscoverClick,
  onAuthClick
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
        onRegisterClick={onAuthClick} // We can toggle mode inside modal
        onLogoutClick={logout}
        onDiscoverClick={onDiscoverClick}
      />

      {/* Main Content */}
      <main className="pt-24 px-4 md:px-8 max-w-[1920px] mx-auto">
        {children}
      </main>

      {/* Footer could go here */}
      <footer className="py-12 text-center text-neutral-600 text-sm">
        <p>© 2026 Lumina Gallery. Designed for Visual Listeners.</p>
      </footer>
    </div>
  );
};
