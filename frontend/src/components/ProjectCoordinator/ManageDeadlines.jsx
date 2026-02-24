// ManageDeadlines.jsx
import React, { useEffect, useState } from "react";
import DashboardSectionHeader from "./DashboardSectionHeader";
import DeadLineService from "../Api/DeadlineService.jsx";
import SemesterStartService from "../Api/SemesterStartService.jsx";

import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  Scatter,
  Line,
  CartesianGrid,
} from "recharts";

import { addWeeks, format } from "date-fns";
import "./ManageDeadlines.css";
import PresentationModal from "./modal/PresentationModal.jsx";

export default function ManageDeadlines() {
  const [deadlines, setDeadlines] = useState([]);
  const [selectedPart, setSelectedPart] = useState("fyp-1");

  // 🔹 SEMESTER START DATE FROM DB
  const [semesterStart, setSemesterStart] = useState(null);

  const [showPresentationModal, setShowPresentationModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(null);

  /* ================= FETCH SEMESTER START DATE ================= */
  useEffect(() => {
    const fetchSemesterStartDate = async () => {
      try {
        const data = await SemesterStartService.getDate();
        if (data && data.date) {
          setSemesterStart(new Date(data.date));
        }
      } catch (err) {
        console.error("Semester start date error:", err);
      }
    };

    fetchSemesterStartDate();
  }, []);

  /* ================= FETCH DEADLINES ================= */
  useEffect(() => {
    if (!semesterStart) return; // 

    const fetchDeadlines = async () => {
      const data = await DeadLineService.getDeadLines(selectedPart);

      if (data && data.deadlines) {
        const parsed = data.deadlines.map((d) => {
          const weekMatch = d.week.match(/\d+/);
          const weekNumber = weekMatch ? parseInt(weekMatch[0]) : 0;

          const startDate = addWeeks(semesterStart, weekNumber - 1);
          const endDate = addWeeks(semesterStart, weekNumber);
          endDate.setDate(endDate.getDate() - 1);

          const dateLabel = `${format(startDate, "dd MMM")} - ${format(
            endDate,
            "dd MMM"
          )}`;

          return {
            ...d,
            timestamp: startDate.getTime(),
            dateLabel,
            weekNumber,
            yValue: 1,
          };
        });

        setDeadlines(parsed);
      } else {
        setDeadlines([]);
      }
    };

    fetchDeadlines();
  }, [selectedPart, semesterStart]);

  /* ================= MODAL ================= */
  const handleOpenPresentationModal = (week, year) => {
    setSelectedWeek(week);
    setSelectedYear(year);
    setShowPresentationModal(true);
  };

  /* ================= TOOLTIP ================= */
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="timeline-tooltip">
          <p className="tooltip-week">{d.week}</p>
          <p className="tooltip-milestone">{d.milestone}</p>
          <p className="tooltip-line">
            <strong>Submit To:</strong> {d.submitTo}
          </p>
          {d.deliverables && (
            <p className="tooltip-line">
              <strong>Deliverables:</strong> {d.deliverables}
            </p>
          )}
          {d.templates && (
  <p className="tooltip-line">
    <strong>Templates:</strong> {d.templates}
  </p>
)}
          <p className="tooltip-line">
            <strong>Evaluation:</strong> {d.evaluations}
          </p>
          <p className="tooltip-date">📅 {d.dateLabel}</p>
        </div>
      );
    }
    return null;
  };

  /* ================= CUSTOM DOT ================= */
  const CustomDot = ({ cx, cy, payload }) => (
    <g>
      <circle cx={cx} cy={cy} r={9} fill="#01337a" stroke="#fff" strokeWidth={3} />

      <text
        x={cx}
        y={cy - 20}
        textAnchor="middle"
        fill="#01337a"
        fontSize="22px"
        fontWeight="600"
      >
        {payload.week}
      </text>

      <text
        x={cx}
        y={cy + 30}
        textAnchor="middle"
        fill="#333"
        fontSize="15px"
        fontWeight="500"
      >
        {payload.milestone.length > 18
          ? payload.milestone.substring(0, 18) + "..."
          : payload.milestone}
      </text>

      {payload.week.toLowerCase().includes("week 13") &&
        selectedPart === "fyp-1" && (
          <foreignObject x={cx - 50} y={cy + 45} width={120} height={50}>
            <button
              className="btn main-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenPresentationModal(payload, "fyp-1");
              }}
            >
              Manage
            </button>
          </foreignObject>
        )}

{payload.week.toLowerCase().includes("week 4") &&
        selectedPart === "fyp-1" && (
          <foreignObject x={cx - 50} y={cy + 45} width={120} height={50}>
            <button
              className="btn main-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenPresentationModal(payload, "fyp-1");
              }}
            >
              Manage
            </button>
          </foreignObject>
        )}
      

      {payload.week.toLowerCase().includes("week after finals") && (
        <foreignObject x={cx - 50} y={cy + 45} width={120} height={50}>
          <button
            className="btn main-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenPresentationModal(payload, "fyp-2");
            }}
          >
            Manage
          </button>
        </foreignObject>
      )}
    </g>
  );

  return (
    <>
      <div className="manage-deadlines">
        <DashboardSectionHeader description="Timeline of FYP deadlines with week mapping.">
          Manage Deadlines
        </DashboardSectionHeader>

        {/* 🔹 SEMESTER DATE PICKER (NO UI DAMAGE) */}
        {semesterStart && (
          <div style={{ margin: "10px 0" }}>
            <label style={{ fontWeight: "600" }}>
              Semester Start Date:
            </label>
            <input
              type="date"
              value={format(semesterStart, "yyyy-MM-dd")}
              onChange={async (e) => {
                const newDate = new Date(e.target.value);
                setSemesterStart(newDate);
                await SemesterStartService.updateDate(newDate);
              }}
              style={{ marginLeft: "10px", padding: "4px" }}
            />
          </div>
        )}

        <div className="fyp-toggle-container">
          <button
            onClick={() => setSelectedPart("fyp-1")}
            className={`fyp-toggle-btn ${
              selectedPart === "fyp-1" ? "active" : ""
            }`}
          >
            FYP-I
          </button>
          <button
            onClick={() => setSelectedPart("fyp-2")}
            className={`fyp-toggle-btn ${
              selectedPart === "fyp-2" ? "active" : ""
            }`}
          >
            FYP-II
          </button>
        </div>

        <div className="timeline-chart-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={deadlines}
              margin={{ top: 40, right: 80, bottom: 80, left: 70 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e0e0e0"
                vertical={false}
              />
              <XAxis
                dataKey="dateLabel"
                tick={{ fill: "#555", fontSize: 12 }}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={70}
                axisLine={{ stroke: "#01337a", strokeWidth: 2 }}
                tickLine={false}
              />
              <YAxis dataKey="yValue" domain={[0, 2]} hide />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="linear"
                dataKey="yValue"
                stroke="#01337a"
                strokeWidth={3}
                dot={false}
              />
              <Scatter
                dataKey="yValue"
                fill="#01337a"
                shape={<CustomDot />}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {showPresentationModal && (
        <PresentationModal
          week={selectedWeek}
          year={selectedYear}
          onClose={() => setShowPresentationModal(false)}
        />
      )}
    </>
  );
}
