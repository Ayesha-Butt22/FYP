import React, {useEffect, useState} from "react";
import DashboardSectionHeader from "./DashboardSectionHeader";
import "./ManageDeadlines.css";
import DeadLineService from "../Api/DeadlineService.jsx";



export default function ManageDeadlines() {
    const [Deadline , setDeadline] = useState(null);
    useEffect(() => {
        async function fetchDeadLine() {
        const deadline = await DeadLineService.getDeadLines("fyp-1");
            setDeadline(deadline);
        }
        fetchDeadLine()
    }, []);
    console.log(Deadline);


  return (
        <DashboardSectionHeader description={"Define semester/session templates and set the final submission weeks/dates for your department."}>
          Manage Deadlines
        </DashboardSectionHeader>
  );
}
