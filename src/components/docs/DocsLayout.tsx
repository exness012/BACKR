import React, { useState, useEffect } from 'react';
import { DocPage, getPrevNextDocs } from '../../data/docs';
import { DocsSidebar } from './DocsSidebar';
import { DocsToc } from './DocsToc';
import { DocsSearch } from './DocsSearch';
import { DocPager } from './DocPager';
import { Callout } from './Callout';
import { CodeBlock } from './CodeBlock';
import { 
  Menu, 
  X, 
  ChevronRight, 
  Hash, 
  Check, 
  BookOpen, 
  Clock, 
  Sparkles 
} from 'lucide-react';

export interface DocsLayoutProps {
  page: DocPage;
}

export const DocsLayout: React.FC<DocsLayoutProps> = ({ page }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [copiedAnchor, setCopiedAnchor] = useState<string | null>(null);

  // Sync document title: "<Page title> | BACKR Docs"
  useEffect(() => {
    document.title = `${page.title} | BACKR Docs`;
  }, [page.title]);

  // Global Ctrl/Cmd + K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Copy heading anchor link
  const handleCopyAnchor = async (id: string) => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedAnchor(id);
      setTimeout(() => setCopiedAnchor(null), 1800);
    } catch {
      // Fallback
    }
  };

  const { prev, next } = getPrevNextDocs(page.slug);

  return (
    <div className="relative min-h-screen text-white">
      {/* Search Command Palette Modal */}
      <DocsSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Docs Header Banner (subtle lavender glow & eyebrow) */}
      <div className="border-b border-white/10 bg-[#07060d]/80 backdrop-blur-md relative z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-white/10 bg-white/5 text-white/80 hover:text-white cursor-pointer"
              aria-label="Open documentation menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-purple-300 font-semibold">
                DOCUMENTATION
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-xs text-[#9b98ad] hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span className="text-xs">Search</span>
              <kbd className="px-1 py-0.2 rounded text-[10px] font-mono bg-white/10 text-white/50">⌘K</kbd>
            </button>
          </div>
        </div>
      </div>

      {/* Main 3-Column Content Layout */}
      <div className="max-w-7xl mx-auto px-4 py-8 flex gap-8 relative z-10">
        {/* Left Desktop Sidebar (260px, sticky) */}
        <aside className="hidden lg:block w-[260px] shrink-0 sticky top-24 self-start max-h-[calc(100vh-120px)] overflow-y-auto no-scrollbar pr-2">
          <DocsSidebar onOpenSearch={() => setSearchOpen(true)} />
        </aside>

        {/* Center Main Article Column (max 720px) */}
        <main className="flex-1 min-w-0 max-w-[720px] mx-auto space-y-6">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#9b98ad]">
            <span>Docs</span>
            <ChevronRight className="w-3.5 h-3.5 text-white/30" />
            <span>{page.sectionTitle}</span>
            <ChevronRight className="w-3.5 h-3.5 text-white/30" />
            <span className="text-purple-300 font-medium truncate">{page.title}</span>
          </nav>

          {/* Page Title & Description */}
          <header className="space-y-2 pb-4 border-b border-white/10">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {page.title}
            </h1>
            <p className="text-sm sm:text-base text-[#9b98ad] leading-relaxed">
              {page.description}
            </p>
          </header>

          {/* Rendered Document Blocks */}
          <article className="space-y-6 text-sm text-[#9b98ad] leading-relaxed">
            {page.blocks.map((block, idx) => {
              switch (block.type) {
                case 'paragraph':
                  return (
                    <p key={idx} className="leading-relaxed">
                      {block.text}
                    </p>
                  );

                case 'heading':
                  return (
                    <div
                      key={idx}
                      id={block.id}
                      className="group flex items-center gap-2 pt-6 scroll-mt-28"
                    >
                      {block.level === 2 ? (
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                          {block.text}
                        </h2>
                      ) : (
                        <h3 className="text-lg font-bold text-white tracking-tight">
                          {block.text}
                        </h3>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCopyAnchor(block.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-white/40 hover:text-purple-300 transition-opacity cursor-pointer"
                        title="Copy link to heading"
                        aria-label={`Copy link to ${block.text}`}
                      >
                        {copiedAnchor === block.id ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Hash className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  );

                case 'callout':
                  return (
                    <Callout
                      key={idx}
                      variant={block.variant}
                      title={block.title}
                      text={block.text}
                    />
                  );

                case 'code':
                  return (
                    <CodeBlock
                      key={idx}
                      language={block.language}
                      code={block.code}
                      label={block.label}
                    />
                  );

                case 'steps':
                  return (
                    <div key={idx} className="space-y-4 my-6">
                      {block.items.map((step) => (
                        <div key={step.step} className="flex items-start gap-3.5 p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-md">
                            {step.step}
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-semibold text-white">
                              {step.title}
                            </h4>
                            <p className="text-xs text-[#9b98ad] leading-relaxed">
                              {step.description}
                            </p>
                            {step.detail && (
                              <p className="text-[11px] text-purple-300/80 pt-0.5">
                                {step.detail}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );

                case 'table':
                  return (
                    <div key={idx} className="my-6 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.02]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/[0.03]">
                            {block.headers.map((h, i) => (
                              <th key={i} className="py-3 px-4 font-semibold text-white">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {block.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-white/[0.02] transition-colors">
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="py-2.5 px-4 text-[#9b98ad]">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );

                case 'list':
                  return (
                    <ul key={idx} className="list-disc list-inside space-y-1.5 pl-2 my-4 text-xs sm:text-sm">
                      {block.items.map((item, i) => (
                        <li key={i} className="text-[#9b98ad]">
                          <span className="text-white/90">{item}</span>
                        </li>
                      ))}
                    </ul>
                  );

                default:
                  return null;
              }
            })}
          </article>

          {/* Previous / Next Pager */}
          <DocPager prev={prev} next={next} />

          {/* Last Updated line */}
          <div className="flex items-center justify-between pt-6 border-t border-white/5 text-xs text-white/40">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Last updated: {page.lastUpdated}</span>
            </div>
            <span>BACKR Documentation</span>
          </div>
        </main>

        {/* Right Desktop Table of Contents (220px, sticky, xl:block) */}
        <DocsToc headings={page.headings} />
      </div>

      {/* Mobile Sidebar Slide-in Drawer */}
      {mobileDrawerOpen && (
        <div
          onClick={() => setMobileDrawerOpen(false)}
          className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-72 max-w-[85vw] h-full bg-[#0d0b1a] border-r border-white/10 p-5 flex flex-col space-y-4 overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-sm text-white">Documentation</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1 rounded-lg text-white/50 hover:text-white"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <DocsSidebar
              onOpenSearch={() => {
                setMobileDrawerOpen(false);
                setSearchOpen(true);
              }}
              onNavigate={() => setMobileDrawerOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
