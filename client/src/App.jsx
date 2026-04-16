import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Route,
  Routes,
  Navigate,
  useLocation,
} from "react-router-dom";

import PaymentSuccess from "./Components/PaymentSuccess";
import PaymentFail from "./Components/PaymentFail";
import PaymentCancel from "./Components/PaymentCancel";
import Home from "./Components/Home";
import Login from "./Components/Login";
import Signup from "./Components/Signup";
import Logout from "./Components/Logout";

import Navbar from "./Components/Navbar";
import NavbarPrivate from "./Components/NavbarPrivate";
import NavbarAdmin from "./Components/NavbarAdmin"; // ✅ NEW
import AdminLogin from "./Components/AdminLogin"; // ✅ NEW
import AdminRequests from "./Components/AdminRequests";
import AdminRequestDetail from "./Components/AdminRequestDetail";
import AdminHome from "./Components/AdminHome";
import Admin from "./Components/Admin";
import Volunteer from "./Components/Volunteer";
import VolunteerRegister from "./Components/VolunteerRegister";
import VolunteerOnboarding from "./Components/VolunteerOnboarding";
import ErrorBoundary from "./Components/ErrorBoundary";
import VolunteerZoneSelect from "./Components/VolunteerZoneSelect";
import VolunteerRoleSetup from "./Components/VolunteerRoleSetup";
import VolunteerDashboard from "./Components/VolunteerDashboard";
import VolunteerDirectory from "./Components/VolunteerDirectory";
import VolunteerMapBoard from "./Components/VolunteerMapBoard";
import VolunteerPassword from "./Components/VolunteerPassword";
import AidRequestForm from "./Components/AidRequestForm";
import Donate from "./Components/Donate";
import Transparency from "./Components/Transparency";
import Inventory from "./Components/Inventory";
import Landing from "./Components/Landing";
import Adminvolunteers from "./Components/Adminvolunteers";
import AdminAlerts from "./Components/AdminAlerts";
import UserAlerts from "./Components/UserAlerts";
import VolunteerAssignment from "./Components/VolunteerAssignment";
import NotificationListener from "./Components/NotificationListener";
import AdminOperations from "./Components/AdminOperations";
import VolunteerOperations from "./Components/VolunteerOperations";
import AdminTaskManagement from "./Components/AdminTaskManagement";
import VolunteerTasks from "./Components/VolunteerTasks";
import CollaborationPortal from "./Components/CollaborationPortal";
import NGORegister from "./Components/NGORegister";

function RequireAuth({ children }) {
  const loggedIn = sessionStorage.getItem("isLoggedIn") === "true";
  return loggedIn ? children : <Navigate to="/login" replace />;
}

function RequireAdmin({ children }) {
  const role = sessionStorage.getItem("role");
  return role === "admin" ? children : <Navigate to="/login" replace />;
}

function AuthWatcher({ setLogged, setRole }) {
  const { pathname } = useLocation();

  useEffect(() => {
    setLogged(sessionStorage.getItem("isLoggedIn") === "true");
    setRole(sessionStorage.getItem("role") || "user");
  }, [pathname, setLogged, setRole]);

  useEffect(() => {
    const handler = () => {
      setLogged(sessionStorage.getItem("isLoggedIn") === "true");
      setRole(sessionStorage.getItem("role") || "user");
    };

    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [setLogged, setRole]);

  return null;
}

function App() {
  const [logged, setLogged] = useState(
    sessionStorage.getItem("isLoggedIn") === "true",
  );
  const [role, setRole] = useState(sessionStorage.getItem("role") || "user");

  const renderNavbar = () => {
    if (!logged) return <Navbar />;
    if (role === "admin") return <NavbarAdmin />;
    return <NavbarPrivate />;
  };

  return (
    <BrowserRouter>
      {renderNavbar()}

      <AuthWatcher setLogged={setLogged} setRole={setRole} />
      {logged && <NotificationListener />}

      <Routes>
        <Route
          path="/"
          element={logged ? <Navigate to="/home" replace /> : <Landing />}
        />
        <Route
          path="/signup"
          element={logged ? <Navigate to="/home" replace /> : <Signup />}
        />
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin-login"
          element={<AdminLogin setLogged={setLogged} setRole={setRole} />}
        />
        <Route
          path="/logout"
          element={<Logout onLogout={() => setLogged(false)} />}
        />
        <Route
          path="/home"
          element={
            <RequireAuth>
              <Home />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <Admin />
            </RequireAuth>
          }
        />
        <Route
          path="/volunteer"
          element={
            <RequireAuth>
              <Volunteer />
            </RequireAuth>
          }
        />
        // Inside App.jsx
        <Route
          path="/admin-volunteers"
          element={
            <RequireAdmin>
              <Adminvolunteers />
            </RequireAdmin>
          }
        />
        <Route
          path="/volunteer-register"
          element={
            <RequireAuth>
              <ErrorBoundary>
                <VolunteerRegister />
              </ErrorBoundary>
            </RequireAuth>
          }
        />
        <Route
          path="/volunteer-onboarding"
          element={
            <RequireAuth>
              <VolunteerOnboarding />
            </RequireAuth>
          }
        />
        <Route
          path="/volunteer-zone-select"
          element={
            <RequireAuth>
              <VolunteerZoneSelect />
            </RequireAuth>
          }
        />
        <Route
          path="/volunteer-role-setup"
          element={
            <RequireAuth>
              <VolunteerRoleSetup />
            </RequireAuth>
          }
        />
        <Route
          path="/volunteer-dashboard-password"
          element={
            <RequireAuth>
              <VolunteerPassword />
            </RequireAuth>
          }
        />
        <Route
          path="/volunteer-dashboard"
          element={
            <RequireAuth>
              <VolunteerDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/volunteer-directory"
          element={
            <RequireAuth>
              <VolunteerDirectory />
            </RequireAuth>
          }
        />
        <Route
          path="/volunteer-map-board"
          element={
            <RequireAuth>
              <VolunteerMapBoard />
            </RequireAuth>
          }
        />
        <Route
          path="/admin-operations"
          element={
            <RequireAdmin>
              <AdminOperations />
            </RequireAdmin>
          }
        />
        <Route
          path="/volunteer-operations"
          element={
            <RequireAuth>
              <VolunteerOperations />
            </RequireAuth>
          }
        />
        <Route
          path="/request-aid"
          element={
            <RequireAuth>
              <AidRequestForm />
            </RequireAuth>
          }
        />
        <Route
          path="/donate"
          element={
            <RequireAuth>
              <Donate />
            </RequireAuth>
          }
        />
        <Route
          path="/transparency"
          element={
            <RequireAdmin>
              <Transparency />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin-home"
          element={
            <RequireAdmin>
              <AdminHome />
            </RequireAdmin>
          }
        />
        <Route
          path="/inventory"
          element={
            <RequireAdmin>
              <Inventory />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin-home"
          element={
            <RequireAdmin>
              <AdminHome />
            </RequireAdmin>
          }
        />
        <Route
          path="/inventory"
          element={
            <RequireAdmin>
              <Inventory />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin-requests"
          element={
            <RequireAdmin>
              <AdminRequests />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin-requests/:id"
          element={
            <RequireAdmin>
              <AdminRequestDetail />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin-alerts"
          element={
            <RequireAdmin>
              <AdminAlerts />
            </RequireAdmin>
          }
        />

        <Route
          path="/admin-tasks"
          element={
            <RequireAdmin>
              <AdminTaskManagement />
            </RequireAdmin>
         }
       />
        <Route
          path="/volunteer-tasks"
          element={
            <RequireAuth>
              <VolunteerTasks />
            </RequireAuth>
          }
        />
        <Route
          path="/collaboration-portal"
          element={
            <RequireAuth>
              <CollaborationPortal />
            </RequireAuth>
          }
        />
        <Route path="/ngo-register" element={<NGORegister />} />

        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/fail" element={<PaymentFail />} />
        <Route path="/payment/cancel" element={<PaymentCancel />} />
        <Route path="/user-alerts" element={<RequireAuth><UserAlerts /></RequireAuth>} />
        <Route path="/volunteer-assignment/:id" element={<VolunteerAssignment />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
