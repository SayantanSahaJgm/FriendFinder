import React from 'react'

interface KeyIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string
}

export function KeyIcon({ title = 'Key', className, ...props }: KeyIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : 'presentation'}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <path d="M21 2l-2 2" />
      <path d="M7 13a5 5 0 1 1 7.07 7.07L21 13l-3-3-4 4-1-1-4 4z" />
      <circle cx="7" cy="13" r="1.5" />
    </svg>
  )
}

export default KeyIcon
