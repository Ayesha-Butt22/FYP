//components/Auth/Auth.jsx
import getUserInfoFromStorage from "./UserInfo.jsx";
import {Navigate} from "react-router-dom";
const ProtectedAuthRoute = ({ children }) => {
    const user = getUserInfoFromStorage();
    if (user.email && user.role) {
        const dashboardRoutes = {
            admin: "/dashboard/admin",
            coordinator: "/dashboard/coordinator",
            supervisor: "/dashboard/supervisor",
            student: "/dashboard/student",
        };
        return <Navigate to={dashboardRoutes[user.role] || "/auth"} replace />;
    }
    return children;
};


export default ProtectedAuthRoute;
