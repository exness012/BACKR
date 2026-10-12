import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DOC_SECTIONS, DOC_PAGES } from '../../data/docs';
import { Search, ChevronDown, ChevronRight, BookOpen } from 'lucide-react';

export interface DocsSidebarProps {
  onOpenSearch: () => void;
  onNavigate?: () => void;
  filterText?: string;
  onFilterChange?: (val: string) => void;
}

export const DocsSidebar: React.FC<DocsSidebarProps> = ({
  onOpenSearch,
  onNavigate,
  filterText = '',
  onFilterChange,
}) => {
  const { slug: currentSlug = 'introduction' } = useParams<{ slug?: string }>();
  // Expand all sections by default
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (id: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const isFiltering = Boolean(filterText.trim());

  return (
    <div className="w-[260px] shrink-0 flex flex-col space-y-4">
      {/* Search Bar / Command Palette Trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-purple-400/40 text-xs text-[#9b98ad] transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-purple-400 group-hover:text-purple-300" />
            <span className="truncate">Search docs…</span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/10 text-white/60 border border-white/10">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Sections Accordion */}
      <nav className="space-y-4 pb-12 select-none text-xs">
        {DOC_SECTIONS.map((sec) => {
          const isCollapsed = collapsedSections[sec.id] && !isFiltering;
          const pages = sec.slugs
            .map((slug) => DOC_PAGES[slug])
            .filter((p) => {
              if (!p) return false;
              if (!isFiltering) return true;
              const q = filterText.toLowerCase();
              return p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
            });

          if (isFiltering && pages.length === 0) return null;

          return (
            <div key={sec.id} className="space-y-1">
              {/* Section Header */}
              <button
                type="button"
                onClick={() => toggleSection(sec.id)}
                className="w-full flex items-center justify-between py-1 px-2 text-[11px] font-mono uppercase tracking-wider text-white/50 hover:text-white transition-colors cursor-pointer"
              >
                <span>{sec.title}</span>
                {isCollapsed ? (
                  <ChevronRight className="w-3 h-3 text-white/40" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-white/40" />
                )}
              </button>

              {/* Pages inside section */}
              {!isCollapsed && (
                <ul className="space-y-0.5 pl-1">
                  {pages.map((p) => {
                    const isActive = currentSlug === p.slug;
                    return (
                      <li key={p.slug}>
                        <Link
                          to={`/docs/${p.slug}`}
                          onClick={onNavigate}
                          className={`relative flex items-center px-3 py-1.5 rounded-lg text-xs transition-all ${
                            isActive
                              ? 'bg-purple-500/15 text-purple-200 font-semibold shadow-sm'
                              : 'text-[#9b98ad] hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {/* Left Accent Bar for active item */}
                          {isActive && (
                            <span className="absolute left-0 top-1 bottom-1 w-1 bg-gradient-to-b from-purple-400 to-indigo-400 rounded-r" />
                          )}
                          <span className="truncate">{p.title}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
};
