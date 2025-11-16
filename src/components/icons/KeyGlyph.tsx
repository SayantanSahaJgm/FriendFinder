import React from 'react'

interface KeyGlyphProps extends React.SVGProps<SVGSVGElement> {
  title?: string
}

export default function KeyGlyph({ title = 'Key', className, ...props }: KeyGlyphProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 32"
      fill="currentColor"
      className={className}
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <circle cx="8" cy="16" r="8" />
      <rect x="15" y="12" width="34" height="8" />
      <polygon points="49,12 53,12 53,16 57,16 57,20 53,20 53,24 49,24 49,20 45,20 45,16" />
    </svg>
  )
}
