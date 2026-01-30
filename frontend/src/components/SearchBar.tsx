import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Tag as TagIcon } from 'lucide-react';
import { Tag } from '../types';
import { api } from '../services/api';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onTagSelect: (tag: string) => void;
  selectedTag?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  onTagSelect, 
  selectedTag,
  className = '' 
}) => {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 加载热门标签
  useEffect(() => {
    const loadTags = async () => {
      setLoadingTags(true);
      try {
        const response = await api.tags.popular();
        setTags(response.tags);
      } catch (error) {
        console.error('Failed to load tags:', error);
      } finally {
        setLoadingTags(false);
      }
    };
    loadTags();
  }, []);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowTags(false);
        if (!query) setIsExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query.trim());
    setShowTags(false);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
    inputRef.current?.focus();
  };

  const handleTagClick = (tagName: string) => {
    if (selectedTag === tagName) {
      onTagSelect('');
    } else {
      onTagSelect(tagName);
    }
    setShowTags(false);
  };

  const handleExpand = () => {
    setIsExpanded(true);
    setShowTags(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <motion.button
            key="collapsed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={handleExpand}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-colors shadow-[0_8px_30px_rgba(0,0,0,0.25)]"
          >
            <Search className="w-4 h-4 text-white/60" />
            <span className="text-sm text-white/60 hidden md:inline">搜索...</span>
          </motion.button>
        ) : (
          <motion.form
            key="expanded"
            initial={{ opacity: 0, width: 120 }}
            animate={{ opacity: 1, width: 300 }}
            exit={{ opacity: 0, width: 120 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
            className="relative"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/20 rounded-full focus-within:border-white/40 transition-colors shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
              <Search className="w-4 h-4 text-white/60 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowTags(true)}
                placeholder="搜索作品、标签或作者..."
                className="flex-1 bg-transparent text-sm text-white placeholder-white/40 outline-none"
              />
              {query && (
                <button type="button" onClick={handleClear} className="flex-shrink-0">
                  <X className="w-4 h-4 text-white/40 hover:text-white/60" />
                </button>
              )}
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* 标签下拉框 */}
      <AnimatePresence>
        {showTags && isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 p-4 bg-[#0f0f12]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50"
          >
            <div className="flex items-center gap-2 mb-3 text-white/50">
              <TagIcon className="w-4 h-4" />
              <span className="text-xs font-medium">热门标签</span>
            </div>
            
            {loadingTags ? (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            ) : tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.name}
                    type="button"
                    onClick={() => handleTagClick(tag.name)}
                    className={`px-3 py-1.5 text-xs rounded-full transition-all ${
                      selectedTag === tag.name
                        ? 'bg-white text-black font-medium'
                        : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    {tag.name}
                    <span className="ml-1 opacity-50">{tag.count}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-center text-white/40 text-sm py-2">暂无标签</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 当前选中的标签筛选 */}
      <AnimatePresence>
        {selectedTag && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="absolute top-full left-0 mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-accent/20 text-accent border border-accent/30 rounded-full text-xs shadow-[0_8px_24px_rgba(41,151,255,0.25)]"
          >
            <TagIcon className="w-3 h-3" />
            <span>{selectedTag}</span>
            <button
              onClick={() => onTagSelect('')}
              className="ml-1 hover:text-white transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
