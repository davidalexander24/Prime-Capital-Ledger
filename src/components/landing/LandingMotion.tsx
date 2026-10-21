"use client"

import { MotionConfig } from "framer-motion"

// Framer Motion skips movement (slides, floats, scale) for visitors who ask
// their OS for reduced motion; fades still run.
export function LandingMotion({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
