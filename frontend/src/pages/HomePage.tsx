import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Gallery } from '../components/Gallery';
import { Photo } from '../types';
import { api } from '../services/api';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Search, X } from 'lucide-react';

interface HomePageProps {
  onPhotoSelect: (photo: Photo) => void;
  refreshKey?: number;
  onError?: (message: string) => void;
  searchQuery?: string;
  selectedTag?: string;
}

export const HomePage: React.FC<HomePageProps> = ({ 
  onPhotoSelect, 
  refreshKey, 
  onError,
  searchQuery = '',
  selectedTag = ''
}) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const prevFiltersRef = useRef({ searchQuery: '', selectedTag: '' });

  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  // 加载照片
  const fetchPhotos = useCallback(async (pageNum: number, reset = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await api.photos.list({ 
        page: pageNum, 
        limit: 24,
        search: searchQuery || undefined,
        tag: selectedTag || undefined,
      });
      
      if (reset) {
        setPhotos(response.photos);
      } else {
        setPhotos(prev => [...prev, ...response.photos]);
      }
      
      setHasMore(response.pagination.hasMore);
      setPage(pageNum);
    } catch (err) {
      console.error("Failed to fetch photos", err);
      const message = err instanceof Error ? err.message : '加载失败，请稍后重试';
      onError?.(message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [onError, searchQuery, selectedTag]);

  // 初始加载和筛选条件变化时重新加载
  useEffect(() => {
    const filtersChanged = 
      prevFiltersRef.current.searchQuery !== searchQuery ||
      prevFiltersRef.current.selectedTag !== selectedTag;
    
    prevFiltersRef.current = { searchQuery, selectedTag };
    
    setPage(1);
    setHasMore(true);
    fetchPhotos(1, true);
  }, [refreshKey, searchQuery, selectedTag, fetchPhotos]);

  // 无限滚动 - Intersection Observer
  useEffect(() => {
    if (loading) return;

    const handleObserver = (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !loadingMore) {
        fetchPhotos(page + 1);
      }
    };

    observerRef.current = new IntersectionObserver(handleObserver, {
      rootMargin: '200px',
      threshold: 0,
    });

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, hasMore, loadingMore, page, fetchPhotos]);

  return (
    <div className="pb-20">
      <section className="relative h-[80vh] flex flex-col items-center justify-center text-center overflow-hidden">
        {/* Abstract Background Element - More subtle */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-white/5 rounded-full blur-[150px] opacity-30 mix-blend-screen animate-pulse" style={{ animationDuration: '6s' }}/>
        </div>

        <motion.div style={{ y, opacity }} className="relative z-10 px-6 max-w-4xl mx-auto space-y-8">
            <motion.h1 
              initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
              className="text-5xl md:text-7xl font-sans font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70"
            >
              捕捉光影的瞬间艺术<br className="md:hidden"/>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 1, ease: [0.25, 1, 0.5, 1] }}
              className="text-secondary text-lg md:text-xl font-normal tracking-wide max-w-xl mx-auto leading-relaxed"
            >
              为视觉创作者精选的影像集锦<br/>在这里发现你的镜头灵感
            </motion.p>
        </motion.div>
      </section>

      <div className="px-4 md:px-8 max-w-[1920px] mx-auto min-h-screen">
        {/* 搜索结果提示 */}
        {(searchQuery || selectedTag) && !loading && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-2 text-white/60"
          >
            <Search className="w-4 h-4" />
            <span className="text-sm">
              {searchQuery && selectedTag 
                ? `搜索 "${searchQuery}" 并筛选标签 "${selectedTag}"`
                : searchQuery 
                  ? `搜索 "${searchQuery}"`
                  : `筛选标签 "${selectedTag}"`
              }
              {photos.length > 0 ? ` - 找到 ${photos.length} 张照片` : ' - 暂无结果'}
            </span>
          </motion.div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <Gallery photos={photos} onSelect={onPhotoSelect} />
            
            {/* 加载更多触发器 */}
            <div ref={loadMoreRef} className="h-20 flex justify-center items-center">
              {loadingMore && (
                <div className="flex items-center gap-3 text-secondary">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span className="text-sm">加载更多...</span>
                </div>
              )}
              {!hasMore && photos.length > 0 && (
                <p className="text-secondary/50 text-sm">已加载全部 {photos.length} 张照片</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
