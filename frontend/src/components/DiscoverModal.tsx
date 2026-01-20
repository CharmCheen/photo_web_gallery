import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DiscoverModalProps, Artist } from '../types';
import { X, UserPlus, Check } from 'lucide-react';

// Mock Artists with Chinese Localization
const CURATORS: Artist[] = [
  {
    id: '1',
    name: '光影旅人',
    handle: '@hikari_traveler',
    avatar: 'https://i.pravatar.cc/150?u=12',
    coverImage: 'https://picsum.photos/400/200?random=101',
    bio: '在城市的缝隙中寻找光的形状。',
    likes: '1.2M',
    followers: '450k',
  },
  {
    id: '2',
    name: '胶片日记',
    handle: '@film_daily',
    avatar: 'https://i.pravatar.cc/150?u=23',
    coverImage: 'https://picsum.photos/400/200?random=102',
    bio: '记录生活原本的样子，不修饰，不刻意。',
    likes: '890k',
    followers: '320k',
  },
  {
    id: '3',
    name: '视觉实验室',
    handle: '@visual_lab',
    avatar: 'https://i.pravatar.cc/150?u=34',
    coverImage: 'https://picsum.photos/400/200?random=103',
    bio: '探索AI与传统摄影的边界。',
    likes: '2.4M',
    followers: '900k',
  },
  {
    id: '4',
    name: '极简构图',
    handle: '@minimal_art',
    avatar: 'https://i.pravatar.cc/150?u=45',
    coverImage: 'https://picsum.photos/400/200?random=104',
    bio: '少即是多。留白是最高的艺术。',
    likes: '500k',
    followers: '120k',
  },
  {
    id: '5',
    name: '霓虹夜景',
    handle: '@cyber_night',
    avatar: 'https://i.pravatar.cc/150?u=56',
    coverImage: 'https://picsum.photos/400/200?random=105',
    bio: '当夜幕降临，城市的灵魂才刚刚苏醒。',
    likes: '750k',
    followers: '210k',
  },
  {
    id: '6',
    name: '自然之声',
    handle: '@nature_voice',
    avatar: 'https://i.pravatar.cc/150?u=67',
    coverImage: 'https://picsum.photos/400/200?random=106',
    bio: '远离喧嚣，回归山川湖海。',
    likes: '1.1M',
    followers: '600k',
  },
];

export const DiscoverModal: React.FC<DiscoverModalProps> = ({ isOpen, onClose }) => {
  const [followed, setFollowed] = useState<Record<string, boolean>>({});

  const toggleFollow = (id: string) => {
    setFollowed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl h-[80vh] bg-[#1c1c1e] rounded-[24px] shadow-2xl overflow-hidden flex flex-col border border-white/5"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#1c1c1e] z-10 sticky top-0">
              <div>
                <h2 className="text-2xl font-semibold text-white tracking-tight">探索创作者</h2>
                <p className="text-secondary text-sm mt-1">发现独具一格的视觉艺术家</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* List */}
            <div className="overflow-y-auto p-6 space-y-4 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CURATORS.map((artist, index) => (
                  <motion.div
                    key={artist.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-[#2c2c2e] rounded-2xl p-4 flex gap-4 hover:bg-[#3a3a3c] transition-colors group border border-white/0 hover:border-white/5"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={artist.avatar}
                        alt={artist.name}
                        className="w-16 h-16 rounded-full object-cover border border-white/10"
                      />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-black rounded-full flex items-center justify-center border border-[#2c2c2e]">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                    </div>

                    <div className="flex flex-col flex-grow min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-white font-medium truncate">{artist.name}</h3>
                          <p className="text-accent text-xs truncate">{artist.handle}</p>
                        </div>
                        <button
                          onClick={() => toggleFollow(artist.id)}
                          className={`
                                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                                ${followed[artist.id] ? 'bg-white/10 text-white/60 hover:bg-white/20' : 'bg-accent text-white hover:bg-accent/90'}
                            `}
                        >
                          {followed[artist.id] ? (
                            <>
                              <Check size={12} />
                              <span>已关注</span>
                            </>
                          ) : (
                            <>
                              <UserPlus size={12} />
                              <span>关注</span>
                            </>
                          )}
                        </button>
                      </div>

                      <p className="text-secondary/80 text-xs mt-2 line-clamp-2 leading-relaxed">
                        {artist.bio}
                      </p>

                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5 text-xs text-secondary">
                        <span>
                          <strong className="text-white font-medium">{artist.likes}</strong> 获赞
                        </span>
                        <span>
                          <strong className="text-white font-medium">{artist.followers}</strong> 粉丝
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-[#1c1c1e] text-center">
              <button className="text-accent text-sm font-medium hover:text-accent/80 transition-colors">
                查看更多推荐
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
