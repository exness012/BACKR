import React, { useState, useEffect } from 'react';
import { DocHeading } from '../../data/docs';

export interface DocsTocProps {
  headings: DocHeading[];
}

export const DocsToc: React.FC<DocsTocProps> = ({ headings }) => {
  const [activeId, setActiveId] = useState<string>(headings[0]?.id || '');

  useEffect(() => {
    if (!headings.length) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 140; // Navbar offset

      for (let i = headings.length - 1; i >= 0; i--) {
        const heading = headings[i];
        const el = document.getElementById(heading.id);
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY;
          if (scrollPosition >= top) {
            setActiveId(heading.id);
            return;
          }
        }
      }
      setActiveId(headings[0]?.id || '');
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings]);

  if (!headings.length) return null;

  return (
    <aside className="hidden xl:block w-[220px] shrink-0 sticky top-28 self-start max-h-[calc(100vh-140px)] overflow-y-auto pl-4 border-l border-white/10 text-xs">
      <span className="font-semibold text-xs tracking-wider uppercase text-white/50 block mb-3 font-mono">
        On this page
      </span>
      <ul className="space-y-2">
        {headings.map((h) => {
          const isActive = activeId === h.id;
          return (
            <li
              key={h.id}
              className={`${h.level === 3 ? 'pl-3' : 'pl-0'}`}
            >
              <a
                href={`#${h.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  const target = document.getElementById(h.id);
                  if (target) {
                    const y = target.getBoundingClientRect().top + window.scrollY - 100;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                    setActiveId(h.id);
                  }
                }}
                className={`block transition-colors line-clamp-1 py-0.5 ${
                  isActive
                    ? 'text-purple-300 font-medium'
                    : 'text-[#9b98ad] hover:text-white'
                }`}
              >
                {h.title}
              </a>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};
