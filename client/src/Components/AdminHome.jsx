import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Inventory.css"; 

const AdminHome = () => {
  const [topItems, setTopItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("http://localhost:3001/api/inventory").then((res) => {
      setTopItems(res.data.slice(0, 5)); 
    });
  }, []);

  const getStatusClass = (status) => {
    if (status === "OK") return "status-ok";
    if (status === "Low") return "status-low";
    return "status-error";
  };

  return (
    <div className="admin-dashboard-container">
      
      {/* LEFT SIDEBAR (Based on your image) */}
      <aside className="admin-sidebar">
        <ul className="sidebar-nav">
          <li className="sidebar-item active">Dashboard</li>
          <li className="sidebar-item">LiveMap</li>
          <li className="sidebar-item">Alerts</li>
          <li className="sidebar-item" onClick={() => navigate("/inventory")}>Inventory</li>
        </ul>
      </aside>

      {/* RIGHT MAIN CONTENT */}
      <main className="admin-main-content">
        
        {/* TOP HALF: Top 5 Inventory */}
        <div className="admin-top-half">
          <div className="inv-card" style={{ height: "100%" }}>
            <div className="admin-header">
              <h2>📦 Inventory Overview (Top 5)</h2>
              <button onClick={() => navigate("/inventory")} className="btn-admin">
                Show All →
              </button>
            </div>

            <table className="inv-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Qty</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {topItems.map((item) => (
                  <tr key={item._id}>
                    <td>{item.itemName}</td>
                    <td>{item.category}</td>
                    <td>{item.quantity}</td>
                    <td>
                      <span className={`status-pill ${getStatusClass(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* BOTTOM HALF: Blank for later use */}
        <div className="admin-bottom-half">
           <p style={{ color: "#aaa", fontWeight: "600" }}>
              [Reserved for future modules...]
           </p>
        </div>

      </main>
    </div>
  );
};

export default AdminHome;