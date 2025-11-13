import React from 'react';

interface VideoCameraIconProps {
  className?: string;
}

export default function VideoCameraIcon({ className = "w-5 h-5" }: VideoCameraIconProps) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M4 6C4 4.89543 4.89543 4 6 4H14C15.1046 4 16 4.89543 16 6V18C16 19.1046 15.1046 20 14 20H6C4.89543 20 4 19.1046 4 18V6Z" />
      <path d="M17 8.5L21 6V18L17 15.5V8.5Z" />
    </svg>
  );
}
