import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export interface CodeBlockProps {
  language: string;
  code: string;
  label?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, code, label }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="relative my-4 rounded-xl border border-white/10 bg-[#0a0815] overflow-hidden group shadow-lg">
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-white/10 bg-white/[0.02] text-[11px] text-[#9b98ad]">
        <span className="font-mono">{label || language.toUpperCase()}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
          aria-label="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <pre className="p-4 text-xs font-mono text-purple-100 overflow-x-auto leading-relaxed selection:bg-purple-600 selection:text-white">
        <code>{code}</code>
      </pre>
    </div>
  );
};
