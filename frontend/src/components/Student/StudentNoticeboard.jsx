import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Avatar,
  Typography,
  Stack,
  CircularProgress,
} from "@mui/material";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import noticeboardApi from "../Api/NoticeboardApi.jsx";
import DashboardSectionHeader from "./DashboardSectionHeader.jsx";
import "./StudentNoticeboard.css";

export default function StudentNoticeboard() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNotices = async () => {
      try {
        const data = await noticeboardApi.getAll();
        setNotices(data || []);
      } catch (err) {
        console.error("Failed to fetch notices:", err);
      } finally {
        setLoading(false);
      }
    };
    loadNotices();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={5}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="student-noticeboard-root" aria-live="polite">
      <DashboardSectionHeader description="Read notifications from your faculty. Check this regularly for updates and action items.">
        Noticeboard
      </DashboardSectionHeader>

      <Stack spacing={2} sx={{ mt: 2 }}>
        {notices.length === 0 && (
          <Typography color="textSecondary" textAlign="center">
            No new notifications available.
          </Typography>
        )}

        {notices.map((notice, idx) => (
          <Card className="nb-card" key={idx} elevation={2}>
            <CardHeader
              avatar={
                <Avatar className="nb-avatar">
                  <NotificationsActiveIcon />
                </Avatar>
              }
              title={<label>{notice.title}</label>}
              subheader={
                <Typography
                  variant="caption"
                  className="nb-date"
                  sx={{ fontSize: "15px" }}
                >
                  {new Date(notice.createdAt).toLocaleString()}
                </Typography>
              }
            />

            <CardContent>
              <Typography
                variant="body2"
                className="nb-description"
                sx={{ color: "#01337a" }}
              >
                {notice.description}
              </Typography>

              <Box mt={1}>
                <Typography variant="body2">
                  <strong>Department:</strong> {notice.department}
                </Typography>
                {notice.postedBy && (
                  <Typography variant="body2">
                    <strong>Posted By:</strong>{" "}
                    {typeof notice.postedBy === "object"
                      ? notice.postedBy.name || "Unknown"
                      : notice.postedBy}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
