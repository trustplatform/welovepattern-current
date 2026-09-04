import React from 'react';

export const DEFAULT_PATTERN_FALLBACK = 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=1000&q=80';

export const handleImageError = (
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackSrc: string = DEFAULT_PATTERN_FALLBACK
) => {
  const target = e.currentTarget;
  if (target.src !== fallbackSrc) {
    target.src = fallbackSrc;
  }
};
