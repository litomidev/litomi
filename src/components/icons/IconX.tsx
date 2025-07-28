import { ComponentProps } from 'react'

export default function IconX(props: Readonly<ComponentProps<'svg'>>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <line x1="18" x2="6" y1="6" y2="18"></line>
      <line x1="6" x2="18" y1="6" y2="18"></line>
    </svg>
  )
}
