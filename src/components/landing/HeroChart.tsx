// Sample data for the hero card. Drawn as plain SVG: Recharts added about
// 100 KB of JS to the landing for these 12 points.
const mockData = [
  { month: "Jan", value: 100000 },
  { month: "Feb", value: 112000 },
  { month: "Mar", value: 108000 },
  { month: "Apr", value: 125000 },
  { month: "May", value: 138000 },
  { month: "Jun", value: 132000 },
  { month: "Jul", value: 151000 },
  { month: "Aug", value: 168000 },
  { month: "Sep", value: 162000 },
  { month: "Oct", value: 179000 },
  { month: "Nov", value: 191000 },
  { month: "Dec", value: 208000 },
]

const W = 300
const H = 150
const TOP = 8
const Y_MAX = 240000

// Points sit at the centre of each month's column, so the labels in the
// 12-column grid below line up with them.
const points = mockData.map((d, i) => ({
  x: ((i + 0.5) / mockData.length) * W,
  y: TOP + (1 - d.value / Y_MAX) * (H - TOP),
}))

// Monotone cubic curve (the same shape as Recharts' "monotone"): smooth,
// with no overshoot above or below the data.
function monotonePath(pts: { x: number; y: number }[]): string {
  const n = pts.length
  const secants = pts.slice(0, -1).map((p, i) => (pts[i + 1].y - p.y) / (pts[i + 1].x - p.x))
  const tangents = pts.map((_, i) => {
    if (i === 0) return secants[0]
    if (i === n - 1) return secants[n - 2]
    const s0 = secants[i - 1]
    const s1 = secants[i]
    if (s0 * s1 <= 0) return 0
    const h0 = pts[i].x - pts[i - 1].x
    const h1 = pts[i + 1].x - pts[i].x
    const p = (s0 * h1 + s1 * h0) / (h0 + h1)
    return (Math.sign(s0) + Math.sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p))
  })
  let d = `M${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`
  for (let i = 0; i < n - 1; i++) {
    const dx = (pts[i + 1].x - pts[i].x) / 3
    const c1x = pts[i].x + dx
    const c1y = pts[i].y + dx * tangents[i]
    const c2x = pts[i + 1].x - dx
    const c2y = pts[i + 1].y - dx * tangents[i + 1]
    d += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${pts[i + 1].x.toFixed(2)},${pts[i + 1].y.toFixed(2)}`
  }
  return d
}

const linePath = monotonePath(points)
const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(2)},${H} L${points[0].x.toFixed(2)},${H} Z`

export function HeroChart() {
  return (
    <div className="flex h-[180px] flex-col">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full flex-1"
        role="img"
        aria-label="Sample portfolio value rising from $100k in January to $208k in December"
      >
        <defs>
          <linearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" style={{ stopColor: "var(--brand)", stopOpacity: 0.35 }} />
            <stop offset="95%" style={{ stopColor: "var(--brand)", stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#heroGradient)" />
        <path d={linePath} fill="none" className="stroke-brand" strokeWidth={2} vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-2 grid grid-cols-12 text-center text-[11px] text-muted-foreground" aria-hidden="true">
        {mockData.map((d) => (
          <span key={d.month}>{d.month}</span>
        ))}
      </div>
    </div>
  )
}
