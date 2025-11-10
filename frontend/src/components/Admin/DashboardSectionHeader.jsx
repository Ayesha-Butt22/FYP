import { Typography, Box } from "@mui/material";

export default function DashboardSectionHeader({ children, description, ...props }) {
    return (
        <>
            <Box sx={{ mb: description ? 6 : 4 }}>
         
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        mb: 2,
                        position: "relative",
                        "&::after": {
                            content: '""',
                            position: "absolute",
                            bottom: -12,
                            left: 0,
                            width: "60px",
                            height: "2px",
                            background: "linear-gradient(90deg, #01337a 0%, rgba(1, 51, 122, 0.3) 100%)",
                            borderRadius: "1px",
                        }
                    }}
                >
                    
                    <Box
                        sx={{
                            width: "4px",
                            height: "2.2em",
                            background: "linear-gradient(180deg, #01337a 0%, #0147a3 100%)",
                            borderRadius: "2px",
                            boxShadow: "0 2px 8px rgba(1, 51, 122, 0.15)",
                            position: "relative",
                            "&::before": {
                                content: '""',
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                width: "2px",
                                height: "60%",
                                background: "rgba(255, 255, 255, 0.3)",
                                borderRadius: "1px",
                            }
                        }}
                    />

                  
                    <Typography
                        variant="h3"
                        fontWeight={900}
                        sx={{
                            color: "#01337a",
                            fontFamily: "'Inter', 'Roboto', Arial, sans-serif",
                            fontSize: { xs: 22, md: 35 },
                            lineHeight: 1.2,
                            letterSpacing: "-1.2px",
                            textShadow: "0 1px 2px rgba(1, 51, 122, 0.08)",
                            position: "relative",
                            background: "linear-gradient(135deg, #01337a 0%, #0147a3 100%)",
                            backgroundClip: "text",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            filter: "drop-shadow(0 1px 1px rgba(1, 51, 122, 0.1))",
                        }}
                        {...props}
                    >
                        {children}
                    </Typography>
                </Box>

                {description && (
                    <Typography className="section-desc">
                        {description}
                    </Typography>
                )}
            </Box>

      
            <style>{`
                .section-desc {
                    color: #01337a;
                    font-size: 22px;;
                    font-weight: 600;
                    background: #f6faff;
                    border-radius: 8px;
                    padding: 12px 22px;
                    margin: 18px 0 24px;
                    letter-spacing: 0.1px;
                }
            `}</style>
        </>
    );
}
