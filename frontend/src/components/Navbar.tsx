import React, { useState, useEffect } from 'react';
import { motion, useScroll } from 'framer-motion';
import { NavbarProps } from '../types';
import { SearchBar } from './SearchBar';

export const Navbar: React.FC<NavbarProps> = ({ 
  user, 
  onUploadClick, 
  onLoginClick, 
  onLogoutClick,
  onDiscoverClick,
  onSearch,
  onTagSelect
}) => {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedTag, setSelectedTag] = useState('');

  useEffect(() => {
    return scrollY.onChange((latest) => {
      setIsScrolled(latest > 20);
    });
  }, [scrollY]);

  const handleTagSelect = (tag: string) => {
    setSelectedTag(tag);
    onTagSelect?.(tag);
  };

  return (
    <motion.nav 
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        isScrolled 
          ? 'bg-glass backdrop-blur-xl border-b border-white/5 py-3' 
          : 'bg-transparent border-b border-transparent py-6'
      }`}
    >
      <div className="max-w-[1920px] mx-auto px-6 md:px-12 flex items-center justify-between">
        
        <div className="flex items-center space-x-10">
           <span className="font-sans font-semibold text-lg tracking-tight text-white/90">Lumina</span>
           
           <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={onDiscoverClick}
                className="text-sm font-medium text-secondary hover:text-white transition-colors tracking-wide"
              >
                探索
              </button>
           </div>
        </div>

        <div className="flex items-center space-x-4 md:space-x-6">
           {/* 搜索框 */}
           {onSearch && onTagSelect && (
             <SearchBar 
               onSearch={onSearch} 
               onTagSelect={handleTagSelect}
               selectedTag={selectedTag}
             />
           )}

           {user ? (
             <>
                <button 
                  onClick={onUploadClick}
                  className="hidden md:block text-sm font-medium text-white hover:text-accent transition-colors tracking-wide"
                >
                  上传作品
                </button>
                <div className="h-4 w-[1px] bg-white/10 hidden md:block"></div>
                <div className="flex items-center space-x-3 cursor-pointer group relative">
                   <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border border-white/10" />
                   <div className="absolute right-0 top-10 w-32 py-2 bg-[#1c1c1e]/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right scale-95 group-hover:scale-100">
                      <button onClick={onLogoutClick} className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-white/5 transition-colors">退出登录</button>
                   </div>
                </div>
             </>
           ) : (
             <button 
               onClick={onLoginClick}
               className="bg-white text-black px-5 py-2 rounded-full text-sm font-medium hover:bg-white/90 transition-colors tracking-wide"
             >
               登录
             </button>
           )}
        </div>
      </div>
    </motion.nav>
  );
};
