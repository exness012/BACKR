import React from 'react';
import { Info, CheckCircle2, AlertTriangle, Radio } from 'lucide-react';

export interface CalloutProps {
  variant?: 'note' | 'tip' | 'warning' | 'devnet';
  title?: string;
  text: string;
}

export const Callout: React.FC<CalloutProps> = ({ variant = 'note', title, text }) => {
  const configs = {
    note: {
      border: 'border-purple-500/30',
      bg: 'bg-purple-950/20',
      titleColor: 'text-purple-300',
      textColor: 'text-purple-200/90',
      icon: <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />,
      defaultTitle: 'Note',
    },
    tip: {
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-950/20',
      titleColor: 'text-emerald-300',
      textColor: 'text-emerald-200/90',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />,
      defaultTitle: 'Tip',
    },
    warning: {
      border: 'border-amber-500/30',
      bg: 'bg-amber-950/20',
      titleColor: 'text-amber-300',
      textColor: 'text-amber-200/90',
      icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />,
      defaultTitle: 'Warning',
    },
    devnet: {
      border: 'border-violet-500/35',
      bg: 'bg-violet-950/25',
      titleColor: 'text-violet-300',
      textColor: 'text-violet-200/90',
      icon: <Radio className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />,
      defaultTitle: 'Devnet Notice',
    },
  };

  const c = configs[variant];

  return (
    <div className={`p-4 rounded-xl border ${c.border} ${c.bg} flex items-start gap-3 my-4`}>
      {c.icon}
      <div className="space-y-1 text-xs leading-relaxed">
        <strong className={`block font-semibold ${c.titleColor}`}>
          {title || c.defaultTitle}
        </strong>
        <p className={c.textColor}>{text}</p>
      </div>
    </div>
  );
};
