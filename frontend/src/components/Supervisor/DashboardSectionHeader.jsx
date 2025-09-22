import { Typography } from "@mui/material";

// DashboardSectionHeader Component
// A reusable heading component for dashboard sections
// - Uses MUI Typography
// - Pre-styled with custom font, color

export default function DashboardSectionHeader({ children, ...props }) {
  return (
    <Typography
      variant="h3" // semantic heading style
      fontWeight={900} // bold text for emphasis
      sx={{
        color: "#01337a", // dark blue color
        fontFamily: "'Inter', 'Roboto', Arial, sans-serif", // clean font stack
        fontSize: { xs: 28, md: 36 }, // responsive size: small on mobile, larger on desktop
        mt: 0, // remove top margin
        mb: 3, // add bottom margin for spacing
        letterSpacing: "-1.5px", // tighter text spacing for style
        textAlign: "left", // left align text
        lineHeight: 1.15, // balanced line height for readability
        marginTop:3,
        marginBottom:3,
      
      }}
      {...props} // pass down other Typography props (e.g., onClick, id)
    >
      {children}
    </Typography>
  );
}