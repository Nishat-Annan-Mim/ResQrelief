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

// import Admin from "./Components/Admin";
// import Volunteer from "./Components/Volunteer";
// import RequestAid from "./Components/RequestAid";
// import Donate from "./Components/Donate";
// import Transparency from "./Components/Transparency";

// wrapper that redirects to login when not authenticated
function RequireAuth({ children }) {
  const loggedIn = localStorage.getItem("isLoggedIn") === "true";
  return loggedIn ? children : <Navigate to="/login" replace />;
}

// watches navigation and storage events so App state reflects login flag
function AuthWatcher({ setLogged }) {
  const { pathname } = useLocation();
  useEffect(() => {
    setLogged(localStorage.getItem("isLoggedIn") === "true");
  }, [pathname, setLogged]);

  useEffect(() => {
    const handler = () => {
      setLogged(localStorage.getItem("isLoggedIn") === "true");
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [setLogged]);

  return null;
}

function App() {
  const [logged, setLogged] = useState(
    localStorage.getItem("isLoggedIn") === "true",
  );

  return (
    <BrowserRouter>
      {logged ? <NavbarPrivate /> : <Navbar />}

      <AuthWatcher setLogged={setLogged} />

      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Signup />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/logout"
          element={<Logout onLogout={() => setLogged(false)} />}
        />

        {/* Private routes */}
        <Route
          path="/home"
          element={
            <RequireAuth>
              <Home />
            </RequireAuth>
          }
        />
        {/* <Route path="/admin" element={<Admin />} />
        <Route path="/volunteer" element={<Volunteer />} />
        <Route path="/request-aid" element={<RequestAid />} />
        <Route path="/donate" element={<Donate />} />
        <Route path="/transparency" element={<Transparency />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
