import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { DOC_PAGES, DocPage } from '../../data/docs';
import { Search, X, FileText, ArrowRight, CornerDownLeft } from 'lucide-react';

interface SearchResult {
  page: DocPage;
  matchSnippet: string;
}

interface DocsSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocsSearch: React.FC<DocsSearchProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  // Search through doc pages
  const results: SearchResult[] = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Default initial suggestions
      return Object.values(DOC_PAGES).slice(0, 6).map((page) => ({
        page,
        matchSnippet: page.description,
      }));
    }

    const matched: SearchResult[] = [];
    for (const page of Object.values(DOC_PAGES)) {
      const titleMatch = page.title.toLowerCase().includes(q);
      const descMatch = page.description.toLowerCase().includes(q);

      // Check blocks for text matches
      let textSnippet = '';
      for (const block of page.blocks) {
        if (block.type === 'paragraph' && block.text.toLowerCase().includes(q)) {
          const idx = block.text.toLowerCase().indexOf(q);
          const start = Math.max(0, idx - 30);
          const end = Math.min(block.text.length, idx + q.length + 50);
          textSnippet = (start > 0 ? '…' : '') + block.text.slice(start, end) + (end < block.text.length ? '…' : '');
          break;
        }
        if (block.type === 'callout' && block.text.toLowerCase().includes(q)) {
          textSnippet = block.text.slice(0, 80) + '…';
          break;
        }
      }

      if (titleMatch || descMatch || textSnippet) {
        matched.push({
          page,
          matchSnippet: textSnippet || page.description,
        });
      }
    }
    return matched;
  }, [query]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Keyboard navigation: ArrowUp, ArrowDown, Enter, Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          navigate(`/docs/${results[selectedIndex].page.slug}`);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, navigate, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 px-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl bg-[#0f0e17] border border-white/10 shadow-[0_20px_50px_rgba(139,92,246,0.3)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/10 bg-white/[0.02]">
          <Search className="w-4 h-4 text-purple-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documentation, guides, and concepts..."
            className="w-full bg-transparent text-sm text-white focus:outline-none placeholder:text-white/40"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-white/40 hover:text-white mr-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/10 text-white/50 border border-white/10">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {results.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#9b98ad] space-y-1">
              <p className="text-white font-medium">No results found.</p>
              <p>Try searching for topics like &ldquo;quickstart&rdquo;, &ldquo;ledger&rdquo;, or &ldquo;milestones&rdquo;.</p>
            </div>
          ) : (
            results.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.page.slug}
                  type="button"
                  onClick={() => {
                    navigate(`/docs/${item.page.slug}`);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-950/40 border border-purple-500/40 text-white'
                      : 'hover:bg-white/5 border border-transparent text-white/80'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    isSelected ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-white/40'
                  }`}>
                    <FileText className="w-3.5 h-3.5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white truncate">
                        {item.page.title}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-white/60">
                        {item.page.sectionTitle}
                      </span>
                    </div>
                    <p className="text-xs text-[#9b98ad] truncate mt-0.5">
                      {item.matchSnippet}
                    </p>
                  </div>

                  {isSelected && (
                    <CornerDownLeft className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-1" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-4 py-2 border-t border-white/5 bg-white/[0.02] flex items-center justify-between text-[11px] text-white/40">
          <div className="flex items-center gap-2">
            <span>Use <kbd className="px-1 py-0.2 rounded bg-white/10 font-mono text-[10px]">↑</kbd> <kbd className="px-1 py-0.2 rounded bg-white/10 font-mono text-[10px]">↓</kbd> to navigate</span>
            <span>•</span>
            <span><kbd className="px-1 py-0.2 rounded bg-white/10 font-mono text-[10px]">↵</kbd> to select</span>
          </div>
          <span className="text-purple-300/80 font-mono">BACKR Docs</span>
        </div>
      </div>
    </div>,
    document.body
  );
};
