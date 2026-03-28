"use client"

import { motion } from "framer-motion"

interface NepalFlagProps {
  size?: number
  animate?: boolean
  className?: string
}

export function NepalFlag({ size = 40, animate = true, className = "" }: NepalFlagProps) {
  const height = size * 1.219 // Nepal flag aspect ratio
  
  return (
    <motion.svg
      viewBox="0 0 100 122"
      width={size}
      height={height}
      className={className}
      initial={animate ? { opacity: 0, scale: 0.8 } : false}
      animate={animate ? { opacity: 1, scale: 1 } : false}
      transition={{ duration: 0.5 }}
    >
      {/* Blue border */}
      <path
        d="M 0 0 L 94 47 L 0 94 L 0 122 L 100 61 L 100 47 L 6 0 Z"
        fill="#003893"
      />
      
      {/* Upper triangle */}
      <motion.path
        d="M 0 6 L 88 47 L 0 88 L 0 50 L 88 47 L 0 6"
        fill="#DC143C"
        animate={animate ? { 
          d: [
            "M 0 6 L 88 47 L 0 88 L 0 50 L 88 47 L 0 6",
            "M 0 7 L 87 47 L 0 87 L 0 50 L 87 47 L 0 7",
            "M 0 6 L 88 47 L 0 88 L 0 50 L 88 47 L 0 6"
          ]
        } : false}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Red upper pennant */}
      <path
        d="M 6 6 L 82 44 L 6 82 Z"
        fill="#DC143C"
      />
      
      {/* Red lower pennant */}
      <path
        d="M 6 44 L 82 82 L 6 115 Z"
        fill="#DC143C"
      />
      
      {/* Moon */}
      <g transform="translate(25, 28)">
        {/* Moon arc */}
        <path
          d="M -10 8 A 12 12 0 0 1 10 8 L 8 8 A 10 10 0 0 0 -8 8 Z"
          fill="white"
        />
        {/* Moon body */}
        <circle cx="0" cy="0" r="8" fill="white" />
        {/* Inner moon crescent */}
        <circle cx="3" cy="0" r="6" fill="#DC143C" />
      </g>
      
      {/* Sun */}
      <g transform="translate(28, 72)">
        {/* Sun rays */}
        {[...Array(12)].map((_, i) => (
          <motion.line
            key={i}
            x1="0"
            y1="-12"
            x2="0"
            y2="-18"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(${i * 30})`}
            animate={animate ? { 
              strokeWidth: [2, 2.5, 2],
              y2: [-18, -19, -18]
            } : false}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
          />
        ))}
        {/* Sun body */}
        <circle cx="0" cy="0" r="10" fill="white" />
      </g>
    </motion.svg>
  )
}
