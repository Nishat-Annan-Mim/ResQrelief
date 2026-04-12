import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Login.css"; 

const AdminLogin = ({ setLogged, setRole }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:3001/login", formData);

      if (res.data.user.role !== "admin") {
        alert("You are not an admin!");
        return;
      }

      sessionStorage.setItem("isLoggedIn", "true");
      sessionStorage.setItem("user", JSON.stringify(res.data.user));
      sessionStorage.setItem("email", res.data.user.email);
      sessionStorage.setItem("role", "admin"); 
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("role", "admin"); 

      setLogged(true);
      setRole("admin");
      navigate("/admin-home");
    } catch (error) {
      if (error.response) {
        alert(error.response.data.message);
      } else {
        alert("Login failed");
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="admin-login-title">🔐 Admin Login</h2>

        <form onSubmit={handleSubmit}>
          <label>Admin Email</label>
          <input
            type="email"
            name="email"
            placeholder="Enter admin email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="Enter password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <button type="submit" className="admin-btn-solid">
            Login as Admin
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;