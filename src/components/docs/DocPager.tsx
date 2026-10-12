import React from 'react';
import { Link } from 'react-router-dom';
import { DocPage } from '../../data/docs';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface DocPagerProps {
  prev?: DocPage;
  next?: DocPage;
}

export const DocPager: React.FC<DocPagerProps> = ({ prev, next }) => {
  if (!prev && !next) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12 pt-6 border-t border-white/10">
      {prev ? (
        <Link
          to={`/docs/${prev.slug}`}
          className="flex flex-col p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-purple-400/50 transition-all text-left group"
        >
          <div className="flex items-center gap-1.5 text-xs text-[#9b98ad] group-hover:text-purple-300">
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Previous</span>
          </div>
          <span className="text-sm font-semibold text-white mt-1 group-hover:text-purple-200">
            {prev.title}
          </span>
          <span className="text-[11px] text-[#9b98ad] mt-0.5 line-clamp-1">
            {prev.sectionTitle}
          </span>
        </Link>
      ) : (
        <div />
      )}

      {next ? (
        <Link
          to={`/docs/${next.slug}`}
          className="flex flex-col p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-purple-400/50 transition-all text-right group"
        >
          <div className="flex items-center justify-end gap-1.5 text-xs text-[#9b98ad] group-hover:text-purple-300">
            <span>Next</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
          <span className="text-sm font-semibold text-white mt-1 group-hover:text-purple-200">
            {next.title}
          </span>
          <span className="text-[11px] text-[#9b98ad] mt-0.5 line-clamp-1">
            {next.sectionTitle}
          </span>
        </Link>
      ) : (
        <div />
      )}
    </div>
  );
};
