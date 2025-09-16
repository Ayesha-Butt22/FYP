// components/SupervisorNotices.jsx
import React, { useState } from "react";
import {
  IconButton,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  Typography,
  Button,
  Chip,
  Tooltip,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import DescriptionIcon from "@mui/icons-material/Description";
import "./SupervisorNotices.css";

const dummyNotices = [
  {
    noticeId: "n101",
    title: "Final Report Deadline",
    description: "Submit your final report by October 1, 2025.",
    postedAt: "2025-09-10",
    type: "Deadline",
    attachmentUrl: "",
    read: false,
  },
  {
    noticeId: "n102",
    title: "System Maintenance",
    description: "Portal will be under maintenance Sunday 2-4pm.",
    postedAt: "2025-09-09",
    type: "General",
    attachmentUrl: "",
    read: true,
  },
];

export default function SupervisorNotices({ notices = dummyNotices }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(notices);

  const unreadCount = items.filter((n) => !n.read).length;

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const markAsRead = (id) => {
    setItems(items.map((n) => (n.noticeId === id ? { ...n, read: true } : n)));
  };

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton color="primary" onClick={handleOpen} className="notice-btn">
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle className="dialog-title">
          <NotificationsIcon className="dialog-icon" />
          Notices
        </DialogTitle>
        <DialogContent dividers>
          <List>
            {items.length === 0 && (
              <Typography
                color="text.secondary"
                sx={{ textAlign: "center", mt: 2 }}
              >
                No notices yet.
              </Typography>
            )}
            {items.map((notice) => (
              <ListItem
                key={notice.noticeId}
                alignItems="flex-start"
                className={`notice-item ${!notice.read ? "unread" : ""}`}
                secondaryAction={
                  <>
                    {!notice.read && (
                      <Button
                        size="small"
                        color="primary"
                        onClick={() => markAsRead(notice.noticeId)}
                        className="mark-btn"
                      >
                        Mark as Read
                      </Button>
                    )}
                    {notice.attachmentUrl && (
                      <Tooltip title="View Attachment">
                        <IconButton
                          href={notice.attachmentUrl}
                          target="_blank"
                          className="attach-btn"
                        >
                          <DescriptionIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </>
                }
              >
                <ListItemText
                  primary={
                    <>
                      <b>{notice.title}</b>
                      <Chip
                        label={notice.type}
                        color={notice.type === "Deadline" ? "error" : "primary"}
                        size="small"
                        className="notice-chip"
                      />
                    </>
                  }
                  secondary={
                    <>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                        sx={{ display: "block" }}
                      >
                        {notice.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Posted: {new Date(notice.postedAt).toLocaleDateString()}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </>
  );
}
