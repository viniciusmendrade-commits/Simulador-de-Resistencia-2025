import React from 'react';

// FIX: Added `title` prop to disaster icons to display tooltips.
export const TsunamiIcon: React.FC<{ className?: string; title?: string }> = ({ className, title }) => (
  <span className={className} role="img" aria-label="Tsunami" title={title}>ꪆৎ</span>
);

// FIX: Added `title` prop to disaster icons to display tooltips.
export const HurricaneIcon: React.FC<{ className?: string; title?: string }> = ({ className, title }) => (
  <span className={className} role="img" aria-label="Furacão" title={title}>༄</span>
);

// FIX: Added `title` prop to disaster icons to display tooltips.
export const EarthquakeIcon: React.FC<{ className?: string; title?: string }> = ({ className, title }) => (
  <span className={className} role="img" aria-label="Terremoto" title={title}>ᨒ</span>
);

// FIX: Added `title` prop to disaster icons to display tooltips.
export const LightningIcon: React.FC<{ className?: string; title?: string }> = ({ className, title }) => (
  <span className={className} role="img" aria-label="Raio" title={title}>ᛋ</span>
);

export const SoundOnIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 9h4v6H4V9z M8 7h2v10H8V7z M10 5h2v14h-2V5z M15 10v4h-1v-1h-1v-2h1v-1h1zm2-2v8h-1v-1h-1v-6h1v-1h1zm2-2v12h-1v-1h-1v-10h1v-1h1z" />
  </svg>
);

export const SoundOffIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 9h4v6H4V9z M8 7h2v10H8V7z M10 5h2v14h-2V5z M14 9h2v2h-2zm4 0h2v2h-2zM16 11h2v2h-2zM14 13h2v2h-2zm4 0h2v2h-2z" />
  </svg>
);


export const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} style={{ imageRendering: 'pixelated' }}>
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z" />
  </svg>
);