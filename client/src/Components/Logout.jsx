import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Logout = ({ onLogout }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // clear the login flag
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");
    if (typeof onLogout === "function") onLogout();
    // then redirect to login page
    navigate("/login");
  }, [navigate, onLogout]);

  return null;
};

export default Logout;
