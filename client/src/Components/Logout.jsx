import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Logout = ({ onLogout }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // clear the login flag
    sessionStorage.removeItem("isLoggedIn");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("role");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    if (typeof onLogout === "function") onLogout();
    // then redirect to login page
    navigate("/login");
  }, [navigate, onLogout]);

  return null;
};

export default Logout;
