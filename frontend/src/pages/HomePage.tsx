import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Gallery } from '../components/Gallery';
import { Photo } from '../types';
import { api } from '../services/api';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { Search } from 'lucide-react';

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
  const prefersReducedMotion = useReducedMotion();
  const featuredPhotos = photos.slice(0, 4);

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
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 left-1/2 h-[520px] w-[880px] -translate-x-1/2 rounded-full bg-white/5 blur-[140px]" />
          <div className="absolute top-24 right-0 h-[360px] w-[360px] rounded-full bg-[#2997ff]/20 blur-[120px]" />
        </div>

        <div className="relative mx-auto grid min-h-[70vh] max-w-[1200px] grid-cols-1 items-center gap-10 px-6 py-14 md:grid-cols-[1.2fr_0.8fr]">
          <motion.div style={{ y: prefersReducedMotion ? 0 : y, opacity: prefersReducedMotion ? 1 : opacity }} className="space-y-7">
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.8, ease: [0.25, 1, 0.5, 1] }}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-white/70"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#2997ff]"></span>
              影像灵感 · 精选推荐
            </motion.div>
            <motion.h1
              initial={prefersReducedMotion ? false : { opacity: 0, y: 40, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: prefersReducedMotion ? 0 : 1.1, ease: [0.25, 1, 0.5, 1] }}
              className="text-5xl md:text-7xl font-sans font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70"
            >
              以高级视角
              <br />
              呈现每一帧情绪
            </motion.h1>
            <motion.p
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: prefersReducedMotion ? 0 : 0.3, duration: prefersReducedMotion ? 0 : 1, ease: [0.25, 1, 0.5, 1] }}
              className="text-secondary text-lg md:text-xl font-normal tracking-wide max-w-xl leading-relaxed"
            >
              像在小红书、Instagram 里发现灵感一样轻松，
              同时保持 Apple 式的克制与精致。
            </motion.p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#gallery"
                className="inline-flex items-center gap-2 rounded-full bg-white text-black px-6 py-3 text-sm font-semibold shadow-[0_12px_40px_rgba(255,255,255,0.2)] hover:bg-white/90 transition"
              >
                浏览精选
              </a>
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                支持 4K 原图下载 · 标签筛选
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.4, duration: prefersReducedMotion ? 0 : 0.9, ease: [0.25, 1, 0.5, 1] }}
            className="soft-card rounded-[28px] p-6 md:p-8"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/40">Daily Picks</p>
                  <h3 className="mt-2 text-xl font-semibold text-white/90">今日灵感集</h3>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">Curated</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {loading && featuredPhotos.length === 0 ? (
                  [1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-28 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
                  ))
                ) : (
                  featuredPhotos.map((photo) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => onPhotoSelect(photo)}
                      className="group relative h-28 overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-left"
                    >
                      <img
                        src={photo.thumbnailUrl || photo.url}
                        alt={photo.description || photo.author}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-2 left-2 right-2 text-xs text-white/90 opacity-0 group-hover:opacity-100 transition-opacity">
                        {photo.author || '匿名作者'}
                      </div>
                    </button>
                  ))
                )}
              </div>
              {!loading && featuredPhotos.length === 0 && (
                <p className="text-xs text-white/40">暂无精选内容，请稍后再试。</p>
              )}
              <p className="text-xs text-white/50">每一次刷新都是新的灵感卡片。</p>
            </div>
          </motion.div>
        </div>
      </section>

      <div id="gallery" className="px-4 md:px-8 max-w-[1920px] mx-auto min-h-screen">
        {/* 搜索结果提示 */}
        {(searchQuery || selectedTag) && !loading && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-2 text-white/70 soft-card rounded-full px-4 py-2 w-fit"
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
