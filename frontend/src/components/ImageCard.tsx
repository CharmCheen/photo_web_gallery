import React from 'react';
import { motion } from 'framer-motion';
import { ImageCardProps } from '../types';

export const ImageCard: React.FC<ImageCardProps> = ({ photo, onClick }) => {
  return (
    <motion.div
      layoutId={`card-container-${photo.id}`}
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
      whileHover={{ scale: 1.02, transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] } }}
      onClick={onClick}
      className="relative group cursor-pointer mb-8 break-inside-avoid px-1"
    >
      <div className="overflow-hidden rounded-2xl bg-[#1c1c1e] shadow-lg hover:shadow-2xl transition-all duration-500 will-change-transform">
        <motion.img
          layoutId={`image-${photo.id}`}
          src={photo.url}
          alt={photo.description}
          loading="lazy"
          className="w-full h-auto object-cover transform will-change-transform" 
          transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
        />
        
        {/* Subtle Gradient Overlay on Hover - Apple style subtle touch */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {/* Info Overlay - Minimalist */}
        <div className="absolute bottom-0 left-0 right-0 p-5 opacity-0 group-hover:opacity-100 transition-opacity duration-400 transform translate-y-1 group-hover:translate-y-0 ease-out">
           <div className="flex items-center space-x-2">
             <div className="w-5 h-5 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-[10px] text-white">
               {photo.author[0]}
             </div>
             <p className="text-white/90 text-[13px] font-medium tracking-wide drop-shadow-md backdrop-blur-sm px-2 py-1 rounded-full bg-black/10">{photo.author}</p>
           </div>
        </div>
      </div>
    </motion.div>
  );
};
