import React from 'react';
import { GalleryProps } from '../types';
import { ImageCard } from './ImageCard';

export const Gallery: React.FC<GalleryProps> = ({ photos, onSelect }) => {
  return (
    // Tailwind Columns for CSS-only Masonry
    // columns-1 (mobile) -> columns-2 (sm) -> columns-3 (md) -> columns-4 (lg)
    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
      {photos.map((photo) => (
        <div key={photo.id} className="break-inside-avoid">
          <ImageCard photo={photo} onClick={() => onSelect(photo)} />
        </div>
      ))}
    </div>
  );
};