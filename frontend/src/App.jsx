import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import Employees from "./pages/Employees";
import Departments from "./pages/Departments";
import Designations from "./pages/Designations";
import Attendance from "./pages/Attendance";
import AddAttendance from "./pages/AddAttendance";
import EditAttendance from "./pages/EditAttendance";
import AddEmployee from "./pages/AddEmployee";
import EditEmployee from "./pages/EditEmployee";
import EmployeeDetails from "./pages/EmployeeDetails";
import Users from "./pages/Users";
import CreateUser from "./pages/CreateUser";
import EditUser from "./pages/EditUser";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboardRoute from "./components/AdminDashboardRoute";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import MyLeave from "./pages/MyLeave";
import LeaveManagement from "./pages/LeaveManagement";

const admin = (Page) => (
    <ProtectedRoute allowedRole="Admin">{Page}</ProtectedRoute>
);

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<AdminDashboardRoute><Dashboard /></AdminDashboardRoute>} />
                <Route path="/my-dashboard" element={<ProtectedRoute allowedRole="Employee"><EmployeeDashboard /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/employees" element={admin(<Employees />)} />
                <Route path="/employee/:id" element={admin(<EmployeeDetails />)} />
                <Route path="/add-employee" element={admin(<AddEmployee />)} />
                <Route path="/edit-employee/:id" element={admin(<EditEmployee />)} />
                <Route path="/departments" element={admin(<Departments />)} />
                <Route path="/designations" element={admin(<Designations />)} />
                <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
                <Route path="/add-attendance" element={admin(<AddAttendance />)} />
                <Route path="/edit-attendance/:id" element={admin(<EditAttendance />)} />
                <Route path="/users" element={admin(<Users />)} />
                <Route path="/create-user" element={admin(<CreateUser />)} />
                <Route path="/edit-user/:id" element={admin(<EditUser />)} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="*" element={<NotFound />} />
                <Route path="/my-leave" element={
        <ProtectedRoute>
            <MyLeave />
        </ProtectedRoute>
    }
/>
                <Route path="/leave-management" element={
        <ProtectedRoute>
            <LeaveManagement />
        </ProtectedRoute>
    }
/>
            </Routes>
        </BrowserRouter>
    );
}

export default App;