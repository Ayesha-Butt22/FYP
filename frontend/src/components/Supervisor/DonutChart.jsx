import React from "react";
import styled from "styled-components";

const DonutWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 36px;
  justify-content: center;
  padding: 24px 0 20px 0;
  @media (max-width: 700px) {
    flex-direction: column;
    align-items: center;
    gap: 22px;
  }
`;

const DonutLegend = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 0 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const DonutLegendItem = styled.li`
  display: flex;
  align-items: center;
  gap: 13px;
  font-size: 1.13rem;
  color: #232323;
  font-weight: 600;
`;

const DonutColorBox = styled.span`
  width: 22px;
  height: 22px;
  background: ${({ color }) => color};
  border-radius: 5px;
  display: inline-block;
  border: 2.3px solid #e3e8ee;
`;

// --- Donut Chart Math ---
function getPieSegments(data) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let cumulative = 0;
  return data.map((d) => {
    const percent = total === 0 ? 0 : (d.value / total) * 100;
    const start = cumulative;
    const end = cumulative + percent;
    cumulative = end;
    return {
      ...d,
      percent,
      startAngle: (start / 100) * 360,
      endAngle: (end / 100) * 360,
    };
  });
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const angleRad = (angleDeg - 90) * Math.PI / 180.0;
  return {
    x: cx + (r * Math.cos(angleRad)),
    y: cy + (r * Math.sin(angleRad))
  };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M", start.x, start.y,
    "A", r, r, 0, largeArc, 0, end.x, end.y,
    "L", cx, cy,
    "Z"
  ].join(" ");
}

export default function DonutChart({
  data,
  size = 290,
  donutWidth = 80,
  centerTitle = "Milestone",
  centerValue = "Analytics"
}) {
  const segments = getPieSegments(data);
  const cx = size / 2, cy = size / 2, r = size / 2 - 7;
  const donutInnerR = r - donutWidth;

  return (
    <DonutWrapper>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Outer Donut Segments */}
        {segments.map((seg, i) => (
          <path
            key={seg.label}
            d={describeArc(cx, cy, r, seg.startAngle, seg.endAngle)}
            fill={seg.color}
            stroke="#fff"
            strokeWidth="3"
          />
        ))}
        {/* White Donut Cutout */}
        <circle
          cx={cx}
          cy={cy}
          r={donutInnerR}
          fill="#fff"
        />
     
        <text
          x={cx}
          y={cy - 12}
          textAnchor="middle"
          fontSize="1.5rem"
          fontWeight="900"
          fill="#232323"
          dominantBaseline="middle"
        >
          {centerTitle}
        </text>
        <text
          x={cx}
          y={cy + 32}
          textAnchor="middle"
          fontSize="1.45rem"
          fontWeight="500"
          fill="#3b82f6"
          dominantBaseline="middle"
        >
          {centerValue}
        </text>
      </svg>
      <DonutLegend>
        {segments.map(seg => (
          <DonutLegendItem key={seg.label}>
            <DonutColorBox color={seg.color} />
            {seg.label}
          </DonutLegendItem>
        ))}
      </DonutLegend>
    </DonutWrapper>
  );
}