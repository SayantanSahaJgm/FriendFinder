"use client";

import React, { useState } from 'react';
import KeyIcon from './KeyIcon';

interface KeyImageProps {
  className?: string;
  alt?: string;
}

export default function KeyImage({ className = 'h-5 w-5', alt = 'key' }: KeyImageProps) {
  const [errored, setErrored] = useState(false);

  // Prefer SVG asset; falls back to KeyIcon on error
  if (errored) return <KeyIcon className={className} />;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icons/key.svg"
      alt={alt}
      className={className}
      onError={() => setErrored(true)}
    />
  );
}
