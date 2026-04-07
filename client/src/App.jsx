import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Route,
  Routes,
  Navigate,
  useLocation,
} from "react-router-dom";

import Home from "./Components/Home";
import Login from "./Components/Login";
import Signup from "./Components/Signup";
import Logout from "./Components/Logout";

import Navbar from "./Components/Navbar";
import NavbarPrivate from "./Components/NavbarPrivate";
import NavbarAdmin from "./Components/NavbarAdmin";       // ✅ NEW
import AdminLogin from "./Components/AdminLogin";         // ✅ NEW
import AdminHome from "./Components/AdminHome"; 
import Admin from "./Components/Admin";
import Volunteer from "./Components/Volunteer";
import VolunteerRegister from "./Components/VolunteerRegister";
import VolunteerOnboarding from "./Components/VolunteerOnboarding";
import VolunteerZoneSelect from "./Components/VolunteerZoneSelect";
import VolunteerRoleSetup from "./Components/VolunteerRoleSetup";
import VolunteerDashboard from "./Components/VolunteerDashboard";
import VolunteerDirectory from "./Components/VolunteerDirectory";
import VolunteerMapBoard from "./Components/VolunteerMapBoard";
import AidRequestForm from "./Components/AidRequestForm";
import Donate from "./Components/Donate";
import Transparency from "./Components/Transparency";
import Inventory from "./Components/Inventory";

function RequireAuth({ children }) {
  const loggedIn = localStorage.getItem("isLoggedIn") === "true";
  return loggedIn ? children : <Navigate to="/login" replace />;
}

function RequireAdmin({ children }) {
  const role = localStorage.getItem("role");
  return role === "admin" ? children : <Navigate to="/login" replace />;
}

function AuthWatcher({ setLogged, setRole }) {
  const { pathname } = useLocation();

  useEffect(() => {
    setLogged(localStorage.getItem("isLoggedIn") === "true");
    setRole(localStorage.getItem("role") || "user");
  }, [pathname, setLogged, setRole]);

  useEffect(() => {
    const handler = () => {
      setLogged(localStorage.getItem("isLoggedIn") === "true");
      setRole(localStorage.getItem("role") || "user");
    };

    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [setLogged, setRole]);

  return null;
}

function App() {
  const [logged, setLogged] = useState(
    localStorage.getItem("isLoggedIn") === "true",
  );
  const [role, setRole] = useState(localStorage.getItem("role") || "user");
  
  const renderNavbar = () => {
    if (!logged) return <Navbar />;
    if (role === "admin") return <NavbarAdmin />;
    return <NavbarPrivate />;
  };

  return (
    <BrowserRouter>
      {renderNavbar()}

      <AuthWatcher setLogged={setLogged} setRole={setRole} />

      <Routes>
        <Route path="/" element={<Signup />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin-login" element={<AdminLogin setLogged={setLogged} setRole={setRole} />} />
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

        <Route
          path="/volunteer-register"
          element={
            <RequireAuth>
              <VolunteerRegister />
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
            <RequireAuth>
              <Transparency />
            </RequireAuth>
          }
        />
        <Route path="/admin-home" element={<RequireAdmin><AdminHome /></RequireAdmin>} />
        <Route path="/inventory" element={<RequireAdmin><Inventory /></RequireAdmin>} /> 
      </Routes>
    </BrowserRouter>
  );
}

export default App;
