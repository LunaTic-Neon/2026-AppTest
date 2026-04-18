// 폐허 도시 배경 — CSS + SVG로 구현된 분위기 배경
export default function RuinedCityBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ zIndex: -1 }}>
      {/* ── 하늘 그라디언트 ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, #04040f 0%, #090920 30%, #0e1230 60%, #14172a 100%)',
        }}
      />

      {/* ── 별빛 ── */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity: 0.7 }}
      >
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white" opacity={s.o} />
        ))}
      </svg>

      {/* ── 달 ── */}
      <div
        className="absolute rounded-full"
        style={{
          width: 72,
          height: 72,
          top: '7%',
          right: '18%',
          background: 'radial-gradient(circle at 40% 40%, #ffe8b0 0%, #e8c060 60%, transparent 100%)',
          boxShadow:
            '0 0 40px 20px rgba(240,180,60,0.12), 0 0 80px 40px rgba(200,140,0,0.06)',
          opacity: 0.55,
        }}
      />

      {/* ── 원거리 건물 (더 밝고 낮음) ── */}
      <svg
        className="absolute bottom-0 left-0 right-0 w-full"
        viewBox="0 0 1920 400"
        preserveAspectRatio="xMidYMax meet"
        style={{ opacity: 0.55 }}
      >
        {FAR_BUILDINGS.map((b, i) => (
          <rect key={i} x={b.x} y={400 - b.h} width={b.w} height={b.h} fill="#1a1a2e" />
        ))}
        {/* 원거리 건물 깨진 창문 빛 */}
        {FAR_WINDOWS.map((w, i) => (
          <rect key={i} x={w.x} y={w.y} width={w.w} height={w.h} fill={w.c} opacity={w.o} />
        ))}
      </svg>

      {/* ── 근거리 건물 (어둡고 높음 — 실루엣) ── */}
      <svg
        className="absolute bottom-0 left-0 right-0 w-full"
        viewBox="0 0 1920 500"
        preserveAspectRatio="xMidYMax meet"
      >
        {NEAR_BUILDINGS.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={500 - b.h} width={b.w} height={b.h} fill="#080810" />
            {/* 건물 파손된 꼭대기 */}
            {b.crack && (
              <polygon
                points={`${b.x + b.crack.dx},${500 - b.h} ${b.x + b.crack.dx + b.crack.w},${500 - b.h + b.crack.depth} ${b.x + b.crack.dx + b.crack.w * 2},${500 - b.h}`}
                fill="#04040c"
              />
            )}
          </g>
        ))}
        {/* 근거리 건물 희미한 불빛 창문 */}
        {NEAR_WINDOWS.map((w, i) => (
          <rect key={i} x={w.x} y={w.y} width={w.w} height={w.h} fill={w.c} opacity={w.o} />
        ))}
      </svg>

      {/* ── 지면 ── */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{ height: 32, background: '#04040a' }}
      />

      {/* ── 안개/먼지 오버레이 ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, rgba(8,6,20,0.85) 0%, rgba(8,6,20,0.2) 35%, transparent 60%)',
        }}
      />

      {/* ── 측면 비네트 ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 50%, rgba(2,2,10,0.7) 100%)',
        }}
      />
    </div>
  )
}

// ── 데이터: 별 ─────────────────────────────────────────────
const STARS = [
  { x: 120, y: 60, r: 0.8, o: 0.9 }, { x: 340, y: 30, r: 1.2, o: 0.7 },
  { x: 580, y: 80, r: 0.6, o: 0.8 }, { x: 820, y: 45, r: 1.0, o: 0.6 },
  { x: 1050, y: 25, r: 0.8, o: 0.9 }, { x: 1280, y: 70, r: 1.2, o: 0.7 },
  { x: 1500, y: 35, r: 0.6, o: 0.8 }, { x: 1750, y: 55, r: 1.0, o: 0.6 },
  { x: 200, y: 140, r: 0.9, o: 0.5 }, { x: 450, y: 120, r: 0.7, o: 0.7 },
  { x: 700, y: 160, r: 1.1, o: 0.6 }, { x: 950, y: 100, r: 0.8, o: 0.8 },
  { x: 1150, y: 145, r: 0.6, o: 0.5 }, { x: 1380, y: 115, r: 1.0, o: 0.7 },
  { x: 1620, y: 150, r: 0.9, o: 0.6 }, { x: 1870, y: 90, r: 0.7, o: 0.8 },
  { x: 60, y: 200, r: 0.5, o: 0.4 }, { x: 290, y: 220, r: 0.8, o: 0.6 },
  { x: 650, y: 240, r: 0.6, o: 0.5 }, { x: 1100, y: 200, r: 0.9, o: 0.4 },
  { x: 1450, y: 230, r: 0.7, o: 0.6 }, { x: 1800, y: 210, r: 0.5, o: 0.5 },
  { x: 900, y: 310, r: 0.6, o: 0.35 }, { x: 1650, y: 280, r: 0.8, o: 0.4 },
  { x: 410, y: 290, r: 0.5, o: 0.35 }, { x: 1200, y: 320, r: 0.7, o: 0.3 },
]

// ── 데이터: 원거리 건물 (viewBox 높이 400) ─────────────────
const FAR_BUILDINGS = [
  { x: 0,    w: 110, h: 200 }, { x: 100,  w: 70,  h: 260 },
  { x: 160,  w: 130, h: 210 }, { x: 280,  w: 85,  h: 280 },
  { x: 355,  w: 160, h: 240 }, { x: 505,  w: 65,  h: 190 },
  { x: 560,  w: 100, h: 260 }, { x: 650,  w: 90,  h: 210 },
  { x: 730,  w: 145, h: 300 }, { x: 865,  w: 75,  h: 250 },
  { x: 930,  w: 115, h: 220 }, { x: 1035, w: 70,  h: 280 },
  { x: 1095, w: 165, h: 310 }, { x: 1250, w: 85,  h: 230 },
  { x: 1325, w: 120, h: 260 }, { x: 1435, w: 75,  h: 200 },
  { x: 1500, w: 145, h: 270 }, { x: 1635, w: 65,  h: 190 },
  { x: 1690, w: 130, h: 240 }, { x: 1810, w: 95,  h: 215 },
  { x: 1895, w: 100, h: 200 },
]

// ── 데이터: 원거리 창문 (viewBox 높이 400 기준) ────────────
const FAR_WINDOWS = [
  { x: 115, y: 155, w: 6, h: 8, c: '#4060a0', o: 0.5 },
  { x: 310, y: 135, w: 5, h: 7, c: '#3a5090', o: 0.4 },
  { x: 400, y: 170, w: 7, h: 6, c: '#507080', o: 0.5 },
  { x: 580, y: 140, w: 5, h: 8, c: '#4060a0', o: 0.45 },
  { x: 760, y: 115, w: 6, h: 7, c: '#506080', o: 0.5 },
  { x: 960, y: 145, w: 5, h: 6, c: '#4070b0', o: 0.4 },
  { x: 1120, y: 110, w: 7, h: 8, c: '#3a5090', o: 0.45 },
  { x: 1350, y: 150, w: 5, h: 7, c: '#507080', o: 0.4 },
  { x: 1540, y: 135, w: 6, h: 6, c: '#4060a0', o: 0.5 },
  { x: 1720, y: 155, w: 5, h: 8, c: '#3a5090', o: 0.45 },
]

// ── 데이터: 근거리 건물 (viewBox 높이 500) ─────────────────
const NEAR_BUILDINGS: Array<{
  x: number; w: number; h: number
  crack?: { dx: number; w: number; depth: number }
}> = [
  { x: 0,    w: 155, h: 360, crack: { dx: 80, w: 25, depth: 30 } },
  { x: 140,  w: 95,  h: 420 },
  { x: 225,  w: 85,  h: 370, crack: { dx: 40, w: 20, depth: 25 } },
  { x: 300,  w: 200, h: 440 },
  { x: 490,  w: 85,  h: 380 },
  { x: 565,  w: 150, h: 410, crack: { dx: 70, w: 30, depth: 35 } },
  { x: 705,  w: 100, h: 360 },
  { x: 795,  w: 180, h: 460, crack: { dx: 90, w: 20, depth: 40 } },
  { x: 965,  w: 70,  h: 380 },
  { x: 1025, w: 135, h: 430 },
  { x: 1150, w: 95,  h: 370, crack: { dx: 45, w: 25, depth: 30 } },
  { x: 1235, w: 165, h: 450 },
  { x: 1390, w: 80,  h: 390 },
  { x: 1460, w: 195, h: 420, crack: { dx: 100, w: 30, depth: 35 } },
  { x: 1645, w: 115, h: 360 },
  { x: 1750, w: 90,  h: 400 },
  { x: 1830, w: 100, h: 380, crack: { dx: 50, w: 20, depth: 28 } },
]

// ── 데이터: 근거리 창문 (viewBox 높이 500 기준) ────────────
const NEAR_WINDOWS = [
  // 희미한 황색 불빛 — 생존자가 있는 듯한 느낌
  { x: 165,  y: 110, w: 7, h: 10, c: '#806020', o: 0.6 },
  { x: 185,  y: 140, w: 5, h: 8,  c: '#704010', o: 0.4 },
  { x: 340,  y: 90,  w: 8, h: 11, c: '#906030', o: 0.55 },
  { x: 380,  y: 130, w: 5, h: 8,  c: '#705020', o: 0.35 },
  { x: 610,  y: 100, w: 7, h: 10, c: '#806030', o: 0.5 },
  { x: 640,  y: 145, w: 5, h: 7,  c: '#604010', o: 0.4 },
  { x: 840,  y: 75,  w: 8, h: 10, c: '#906040', o: 0.55 },
  { x: 875,  y: 120, w: 5, h: 8,  c: '#705020', o: 0.35 },
  { x: 1065, y: 95,  w: 7, h: 10, c: '#806030', o: 0.5 },
  { x: 1090, y: 140, w: 5, h: 8,  c: '#604020', o: 0.4 },
  { x: 1270, y: 80,  w: 8, h: 11, c: '#906040', o: 0.55 },
  { x: 1310, y: 125, w: 5, h: 8,  c: '#705030', o: 0.35 },
  { x: 1495, y: 100, w: 7, h: 10, c: '#806030', o: 0.5 },
  { x: 1520, y: 145, w: 5, h: 7,  c: '#604010', o: 0.4 },
  { x: 1680, y: 110, w: 7, h: 10, c: '#705020', o: 0.5 },
  { x: 1790, y: 95,  w: 6, h: 9,  c: '#806030', o: 0.45 },
]
