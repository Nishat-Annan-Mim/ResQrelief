import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

// Layout & Components
import Navbar from "./Components/Navbar";
import NavbarPrivate from "./Components/NavbarPrivate";
import NavbarAdmin from "./Components/NavbarAdmin";
import UserLayout from "./Components/UserLayout";
import { SidebarProvider } from "./Components/SidebarContext";
import { AccountProvider } from "./Components/AccountContext";
import NotificationListener from "./Components/NotificationListener";
import ErrorBoundary from "./Components/ErrorBoundary";

// Public Pages
import Landing from "./Components/Landing";
import Login from "./Components/Login";
import Signup from "./Components/Signup";
import Logout from "./Components/Logout";
import AdminLogin from "./Components/AdminLogin";
import NGORegister from "./Components/NGORegister";
import PaymentSuccess from "./Components/PaymentSuccess";
import PaymentFail from "./Components/PaymentFail";
import PaymentCancel from "./Components/PaymentCancel";

// User/Volunteer Pages
import Home from "./Components/Home";
import Volunteer from "./Components/Volunteer";
import VolunteerRegister from "./Components/VolunteerRegister";
import VolunteerOnboarding from "./Components/VolunteerOnboarding";
import VolunteerZoneSelect from "./Components/VolunteerZoneSelect";
import VolunteerRoleSetup from "./Components/VolunteerRoleSetup";
import VolunteerPassword from "./Components/VolunteerPassword";
import VolunteerDashboard from "./Components/VolunteerDashboard";
import VolunteerDirectory from "./Components/VolunteerDirectory";
import VolunteerMapBoard from "./Components/VolunteerMapBoard";
import VolunteerOperations from "./Components/VolunteerOperations";
import VolunteerTasks from "./Components/VolunteerTasks";
import AidRequestForm from "./Components/AidRequestForm";
import Donate from "./Components/Donate";
import MyDonations from "./Components/MyDonations";
import CollaborationPortal from "./Components/CollaborationPortal";
import UserAlerts from "./Components/UserAlerts";
import VolunteerAssignment from "./Components/VolunteerAssignment";
import Admin from "./Components/Admin";

// Admin Pages
import AdminHome from "./Components/AdminHome";
import AdminRequests from "./Components/AdminRequests";
import AdminRequestDetail from "./Components/AdminRequestDetail";
import AdminAlerts from "./Components/AdminAlerts";
import AdminOperations from "./Components/AdminOperations";
import AdminTaskManagement from "./Components/AdminTaskManagement";
import Adminvolunteers from "./Components/Adminvolunteers";
import Inventory from "./Components/Inventory";
import Transparency from "./Components/Transparency";
import DonorImpact from "./Components/DonorImpact";
import StorageAnalytics from "./Components/StorageAnalytics";

/* ── Auth Helpers ── */
function RequireAuth({ children }) {
  const loggedIn = sessionStorage.getItem("isLoggedIn") === "true";
  return loggedIn ? children : <Navigate to="/login" replace />;
}

function RequireAdmin({ children }) {
  const role = sessionStorage.getItem("role");
  return role === "admin" ? children : <Navigate to="/login" replace />;
}

/*
 * Volunteer pages sit behind the separate volunteer password. Login sets
 * `needVolunteerPassword` to "true"; VolunteerPassword clears it and
 * VolunteerDashboard sets it to "false", so anything other than "true"
 * counts as unlocked.
 */
function RequireVolunteerAuth({ children }) {
  const locked = localStorage.getItem("needVolunteerPassword") === "true";
  return locked ? (
    <Navigate to="/volunteer-dashboard-password" replace />
  ) : (
    children
  );
}

/* ── Auth state watcher ── */
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
  const [logged, setLogged] = useState(sessionStorage.getItem("isLoggedIn") === "true");
  const [role, setRole] = useState(sessionStorage.getItem("role") || "user");

  const renderNavbar = () => {
    if (!logged) return <Navbar />;
    if (role === "admin") return <NavbarAdmin />;
    return <NavbarPrivate />;
  };

  return (
    <BrowserRouter>
      <SidebarProvider>
      <AccountProvider>
      {renderNavbar()}
      <AuthWatcher setLogged={setLogged} setRole={setRole} />
      {logged && <NotificationListener />}

      <Routes>
        {/* ── Public Routes ── */}
        <Route path="/" element={logged ? <Navigate to="/home" replace /> : <Landing />} />
        <Route path="/signup" element={logged ? <Navigate to="/home" replace /> : <Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin-login" element={<AdminLogin setLogged={setLogged} setRole={setRole} />} />
        <Route path="/logout" element={<Logout onLogout={() => setLogged(false)} />} />
        <Route path="/ngo-register" element={<NGORegister />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/fail" element={<PaymentFail />} />
        <Route path="/payment/cancel" element={<PaymentCancel />} />

        {/* ── User/Auth Protected Routes ── */}
        <Route path="/home" element={<RequireAuth><UserLayout><Home /></UserLayout></RequireAuth>} />
        <Route path="/admin" element={<RequireAuth><Admin /></RequireAuth>} />
        <Route path="/volunteer" element={<RequireAuth><UserLayout><Volunteer /></UserLayout></RequireAuth>} />
        <Route path="/volunteer-register" element={<RequireAuth><UserLayout><ErrorBoundary><VolunteerRegister /></ErrorBoundary></UserLayout></RequireAuth>} />
        <Route path="/volunteer-onboarding" element={<RequireAuth><RequireVolunteerAuth><UserLayout><VolunteerOnboarding /></UserLayout></RequireVolunteerAuth></RequireAuth>} />
        <Route path="/volunteer-zone-select" element={<RequireAuth><RequireVolunteerAuth><UserLayout><VolunteerZoneSelect /></UserLayout></RequireVolunteerAuth></RequireAuth>} />
        <Route path="/volunteer-role-setup" element={<RequireAuth><RequireVolunteerAuth><UserLayout><VolunteerRoleSetup /></UserLayout></RequireVolunteerAuth></RequireAuth>} />
        <Route path="/volunteer-dashboard-password" element={<RequireAuth><UserLayout><VolunteerPassword /></UserLayout></RequireAuth>} />
        <Route path="/volunteer-dashboard" element={<RequireAuth><RequireVolunteerAuth><UserLayout><VolunteerDashboard /></UserLayout></RequireVolunteerAuth></RequireAuth>} />
        <Route path="/volunteer-directory" element={<RequireAuth><RequireVolunteerAuth><UserLayout><VolunteerDirectory /></UserLayout></RequireVolunteerAuth></RequireAuth>} />
        <Route path="/volunteer-map-board" element={<RequireAuth><RequireVolunteerAuth><UserLayout><VolunteerMapBoard /></UserLayout></RequireVolunteerAuth></RequireAuth>} />
        <Route path="/volunteer-operations" element={<RequireAuth><RequireVolunteerAuth><UserLayout><VolunteerOperations /></UserLayout></RequireVolunteerAuth></RequireAuth>} />
        <Route path="/volunteer-tasks" element={<RequireAuth><RequireVolunteerAuth><UserLayout><VolunteerTasks /></UserLayout></RequireVolunteerAuth></RequireAuth>} />
        <Route path="/request-aid" element={<RequireAuth><UserLayout><AidRequestForm /></UserLayout></RequireAuth>} />
        <Route path="/donate" element={<RequireAuth><UserLayout><Donate /></UserLayout></RequireAuth>} />
        <Route path="/my-donations" element={<RequireAuth><UserLayout><MyDonations /></UserLayout></RequireAuth>} />
        <Route path="/collaboration-portal" element={<RequireAuth><CollaborationPortal /></RequireAuth>} />
        <Route path="/user-alerts" element={<RequireAuth><UserLayout><UserAlerts /></UserLayout></RequireAuth>} />
        <Route path="/volunteer-assignment/:id" element={<VolunteerAssignment />} />

        {/* ── Admin Protected Routes ── */}
        <Route path="/admin-home" element={<RequireAdmin><AdminHome /></RequireAdmin>} />
        <Route path="/admin-requests" element={<RequireAdmin><AdminRequests /></RequireAdmin>} />
        <Route path="/admin-requests/:id" element={<RequireAdmin><AdminRequestDetail /></RequireAdmin>} />
        <Route path="/admin-alerts" element={<RequireAdmin><AdminAlerts /></RequireAdmin>} />
        <Route path="/admin-operations" element={<RequireAdmin><AdminOperations /></RequireAdmin>} />
        <Route path="/admin-tasks" element={<RequireAdmin><AdminTaskManagement /></RequireAdmin>} />
        <Route path="/admin-volunteers" element={<RequireAdmin><Adminvolunteers /></RequireAdmin>} />
        <Route path="/inventory" element={<RequireAdmin><Inventory /></RequireAdmin>} />
        <Route path="/transparency" element={<RequireAdmin><Transparency /></RequireAdmin>} />
        <Route path="/donor-impact" element={<RequireAdmin><DonorImpact /></RequireAdmin>} />
        <Route path="/storage-analytics" element={<RequireAdmin><StorageAnalytics /></RequireAdmin>} />
      </Routes>
      </AccountProvider>
      </SidebarProvider>
    </BrowserRouter>
  );
}

export default App;