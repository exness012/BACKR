import React from 'react';
import { Founder } from '../types';
import { FounderAvatar } from './FounderAvatar';
import { Globe, Users } from 'lucide-react';
import { normalizeSocialLink } from '../lib/avatar';

interface FoundersSectionProps {
  founders?: Founder[];
  className?: string;
}

export const FoundersSection: React.FC<FoundersSectionProps> = ({ founders, className = '' }) => {
  if (!founders || founders.length === 0) {
    return null;
  }

  const heading = founders.length === 1 ? 'Meet the founder' : 'Meet the founders';

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-[#a78bfa]" />
        <h3 className="text-lg font-bold text-[#f4f3f8]">{heading}</h3>
      </div>

      {/* Responsive Grid: 1 col on mobile, 2 col on tablet and desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {founders.map((founder) => {
          const socials = founder.socials || {};

          // Normalize and validate social links safely
          const xLink = socials.x ? normalizeSocialLink('x', socials.x) : null;
          const linkedinLink = socials.linkedin ? normalizeSocialLink('linkedin', socials.linkedin) : null;
          const githubLink = socials.github ? normalizeSocialLink('github', socials.github) : null;
          const telegramLink = socials.telegram ? normalizeSocialLink('telegram', socials.telegram) : null;
          const discordLink = socials.discord ? normalizeSocialLink('discord', socials.discord) : null;
          const websiteLink = socials.website ? normalizeSocialLink('website', socials.website) : null;

          return (
            <div
              key={founder.id || founder.name}
              className="rounded-[14px] border border-[#24222f] hover:border-[#a78bfa] transition-colors bg-[#16151f] p-4 sm:p-5 flex flex-col justify-between space-y-3.5"
            >
              <div>
                <div className="flex items-start gap-3.5">
                  {/* Circular 64px profile picture with 2px border in card color */}
                  <FounderAvatar
                    founder={founder}
                    size={64}
                    borderWidth={2}
                    borderColor="#16151f"
                    className="shadow-md"
                  />

                  {/* Name and Role */}
                  <div className="min-w-0 flex-1 pt-0.5">
                    <h4 className="font-semibold text-base text-[#f4f3f8] truncate">
                      {founder.name}
                    </h4>
                    {founder.role && (
                      <p className="text-xs text-[#8d8a9c] mt-0.5 font-medium truncate">
                        {founder.role}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bio: muted, max 3 lines, truncated */}
                {founder.bio && (
                  <p className="text-xs text-[#8d8a9c] leading-relaxed line-clamp-3 mt-3 break-words">
                    {founder.bio}
                  </p>
                )}
              </div>

              {/* Row of small social icon buttons (16px), showing only provided socials */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#24222f]/60 flex-wrap">
                {xLink && (
                  <a
                    href={xLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${founder.name} on X`}
                    title={`${founder.name} on X`}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#8d8a9c] hover:text-[#a78bfa] transition-colors"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                )}

                {linkedinLink && (
                  <a
                    href={linkedinLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${founder.name} on LinkedIn`}
                    title={`${founder.name} on LinkedIn`}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#8d8a9c] hover:text-[#a78bfa] transition-colors"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                    </svg>
                  </a>
                )}

                {githubLink && (
                  <a
                    href={githubLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${founder.name} on GitHub`}
                    title={`${founder.name} on GitHub`}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#8d8a9c] hover:text-[#a78bfa] transition-colors"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
                    </svg>
                  </a>
                )}

                {telegramLink && (
                  <a
                    href={telegramLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${founder.name} on Telegram`}
                    title={`${founder.name} on Telegram`}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#8d8a9c] hover:text-[#a78bfa] transition-colors"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
                    </svg>
                  </a>
                )}

                {discordLink && (
                  <a
                    href={discordLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${founder.name} on Discord`}
                    title={`${founder.name} on Discord`}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#8d8a9c] hover:text-[#a78bfa] transition-colors"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                  </a>
                )}

                {websiteLink && (
                  <a
                    href={websiteLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${founder.name} Website`}
                    title={`${founder.name} Website`}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#8d8a9c] hover:text-[#a78bfa] transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Muted note below the section */}
      <p className="text-[11px] text-[#8d8a9c]/80 pt-1">
        Founder details are self-reported and not verified.
      </p>
    </div>
  );
};
