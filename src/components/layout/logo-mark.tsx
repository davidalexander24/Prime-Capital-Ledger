type LogoMarkProps = {
  size?: number;
  className?: string;
};

// Brand icon — three overlapping squares forming a plus.
// Re-traced as SVG so it renders crisp at any size without cropping the wordmark PNG.
export function LogoMark({ size = 40, className }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Cyan square (left) */}
      <rect x="2" y="14" width="14" height="14" fill="#02D8F6" />
      {/* Blue square (top-right) */}
      <rect x="14" y="6" width="18" height="18" fill="#0E61F6" />
      {/* Cyan square (bottom extension) */}
      <rect x="14" y="26" width="10" height="10" fill="#02D8F6" />
      {/* Overlap → navy (drawn last so it sits above) */}
      <rect x="14" y="14" width="10" height="10" fill="#03143A" />
    </svg>
  );
}
