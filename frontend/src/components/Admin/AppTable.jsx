import React from "react";
import "./AppTable.css";

export default function AppTable({ headers = [], rows = [], renderActions }) {
  return (
    <div className="app-table-outer">
      <table className="app-table">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
            {renderActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={headers.length + (renderActions ? 1 : 0)}
                style={{ textAlign: "center", color: "#888" }}
              >
                No records found.
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i}>
                {Array.isArray(row)
                  ? row.map((cell, j) => <td key={j}>{cell}</td>)
                  : headers.map((h, j) => <td key={j}>{row[h]}</td>)}
                {renderActions && <td>{renderActions(row, i)}</td>}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
