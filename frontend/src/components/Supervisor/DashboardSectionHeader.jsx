// DashboardSectionHeader.jsx
import { Typography } from "@mui/material";

export default function DashboardSectionHeader({ children, ...props }) {
  return (
    <Typography
      variant="h3"
      fontWeight={900}
      sx={{
        color: "#01337a",
        fontSize: { xs: 28, md: 38 },
        mt: 0,
        mb: 2.5,
        letterSpacing: "-1.5px",
        textAlign: "left", // ✅ pure left aligned
        lineHeight: 1.18,
      }}
      {...props}
    >
      {children}
    </Typography>
  );
}
