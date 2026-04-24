import React, { useState } from "react";
import "./Login.css";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "https://resqrelief-fj7z.onrender.com/login",
        formData,
      );
      sessionStorage.setItem("isLoggedIn", "true");
      sessionStorage.setItem("user", JSON.stringify(res.data.user));
      sessionStorage.setItem("role", res.data.user.role);
      sessionStorage.setItem("email", res.data.user.email);
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("role", res.data.user.role);
      localStorage.setItem("needVolunteerPassword", "true");
      navigate("/home");
    } catch (error) {
      const data = error.response?.data;
      if (data?.adminOnly) {
        alert("⚠️ Admin accounts must log in through the Admin Login portal.");
        navigate("/admin-login");
      } else if (data?.banned) {
        alert(
          "🚫 Your account has been suspended due to a fraudulent request. You cannot log in.",
        );
      } else {
        alert(data?.message || "Login failed");
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Login</h2>

        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <button type="submit" className="login-btn-loginpage">
            Login
          </button>
        </form>
        <p className="redirect">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>

        {/* ✅ Admin Login button */}
        {/* Replace your old admin button section with this */}
        <div className="admin-redirect">
          Are you an admin? <a href="/admin-login">Login here</a>
        </div>
      </div>
    </div>
  );
};

export default Login;
