import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: { main: "#3D52A0", light: "#7091E6", dark: "#8697C4", contrastText: "#EDE8F5" },
    secondary: { main: "#8697C4", light: "#ADBBDA", dark: "#3D52A0", contrastText: "#EDE8F5" },
    background: { default: "#EDE8F5", paper: "#ADBBDA" },
    text: { primary: "#3D52A0", secondary: "#7091E6" },
  },
  typography: {
    fontWeightBold: 700,
    fontWeightRegular: 400,
    fontFamily: "'Roboto','Helvetica','Arial',sans-serif",
  },
});

export default theme;