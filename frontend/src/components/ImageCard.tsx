import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ImageCardProps } from '../types';

export const ImageCard: React.FC<ImageCardProps> = ({ photo, onClick }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [canHover, setCanHover] = useState(true);
  const prefersReducedMotion = useReducedMotion();
  // 使用缩略图，如果没有则使用原图
  const displayUrl = photo.thumbnailUrl || photo.url;
  const safeAuthor = photo.author || '匿名作者';
  const authorInitial = safeAuthor.slice(0, 1) || '·';

  useEffect(() => {
    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const updateHover = () => setCanHover(mediaQuery.matches);
    updateHover();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateHover);
    } else {
      mediaQuery.addListener(updateHover);
    }

    return () => {
      if (mediaQuery.addEventListener) {
        mediaQuery.removeEventListener('change', updateHover);
      } else {
        mediaQuery.removeListener(updateHover);
      }
    };
  }, []);

  return (
    <motion.div
      layoutId={`card-container-${photo.id}`}
      initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.5, ease: [0.33, 1, 0.68, 1] }}
      whileHover={canHover && !prefersReducedMotion ? { scale: 1.015, transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] } } : undefined}
      onClick={onClick}
      className="relative group cursor-pointer mb-8 break-inside-avoid px-1"
    >
      <div className="overflow-hidden rounded-[26px] bg-[#121214] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.45)] hover:shadow-[0_30px_90px_rgba(0,0,0,0.55)] transition-all duration-500 will-change-transform">
        {/* 骨架屏加载占位 */}
        {!imageLoaded && (
          <div 
            className="w-full bg-gradient-to-br from-[#1d1d20] to-[#0f0f12] animate-pulse"
            style={{ 
              aspectRatio: `${photo.width} / ${photo.height}`,
              minHeight: '150px'
            }}
          />
        )}
        <motion.img
          layoutId={`image-${photo.id}`}
          src={displayUrl}
          alt={photo.description}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-auto object-cover transform will-change-transform transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0 absolute'}`}
          transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
        />
        
        {/* Subtle Gradient Overlay on Hover - Apple style subtle touch */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {/* Info Overlay - Minimalist */}
        <div className="absolute bottom-0 left-0 right-0 p-5 opacity-0 group-hover:opacity-100 transition-all duration-400 transform translate-y-2 group-hover:translate-y-0 ease-out">
           <div className="flex items-center justify-between">
             <div className="flex items-center space-x-2">
               <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-[10px] text-white">
                 {authorInitial}
               </div>
               <p className="text-white/90 text-[13px] font-medium tracking-wide drop-shadow-md backdrop-blur-sm px-2 py-1 rounded-full bg-black/20">
                 {safeAuthor}
               </p>
             </div>
             <span className="text-[11px] text-white/60 bg-black/30 px-2 py-1 rounded-full">查看</span>
           </div>
        </div>
      </div>
    </motion.div>
  );
};
