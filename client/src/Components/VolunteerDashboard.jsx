// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import "./VolunteerDashboard.css";

// const VolunteerDashboard = () => {
//   const navigate = useNavigate();
//   const [volunteer, setVolunteer] = useState(null);
//   const [editingField, setEditingField] = useState("");
//   const [editValue, setEditValue] = useState("");

//   const user = JSON.parse(localStorage.getItem("user"));

//   useEffect(() => {
//     const fetchVolunteer = async () => {
//       try {
//         const response = await axios.get(
//           `http://localhost:3001/volunteer/profile/${user.email}`,
//         );
//         setVolunteer(response.data);
//       } catch (error) {
//         console.log(error);
//       }
//     };

//     if (user?.email) {
//       fetchVolunteer();
//     }
//   }, [user?.email]);

//   const startEdit = (field, currentValue) => {
//     setEditingField(field);
//     setEditValue(currentValue || "");
//   };

//   const cancelEdit = () => {
//     setEditingField("");
//     setEditValue("");
//   };

//   const saveEdit = async () => {
//     try {
//       await axios.put(`http://localhost:3001/volunteer/update/${user.email}`, {
//         [editingField]: editValue,
//       });

//       setVolunteer((prev) => ({
//         ...prev,
//         [editingField]: editValue,
//       }));

//       setEditingField("");
//       setEditValue("");
//       alert("Volunteer information updated successfully");
//     } catch (error) {
//       console.log(error);
//       alert("Could not update volunteer information");
//     }
//   };

//   if (!volunteer) {
//     return <div className="volunteer-dashboard-page">Loading...</div>;
//   }

//   return (
//     <div className="volunteer-dashboard-page">
//       <div className="volunteer-dashboard-card">
//         <h1>Volunteer Dashboard</h1>
//         <p>
//           Welcome back, {volunteer.fullName}. Your volunteer profile is active
//           and ready.
//         </p>
//       </div>

//       <div className="volunteer-info-card">
//         <h2>Volunteer Information</h2>

//         <div className="info-row">
//           <span className="info-label">Name:</span>
//           <span className="info-value">{volunteer.fullName}</span>
//         </div>

//         <div className="info-row">
//           <span className="info-label">Email:</span>
//           <span className="info-value">{volunteer.email}</span>
//         </div>

//         <div className="info-row">
//           <span className="info-label">Phone:</span>

//           {editingField === "phone" ? (
//             <div className="edit-inline-box">
//               <input
//                 type="text"
//                 value={editValue}
//                 onChange={(e) => setEditValue(e.target.value)}
//               />
//               <button className="save-btn" onClick={saveEdit}>
//                 Save
//               </button>
//               <button className="cancel-btn" onClick={cancelEdit}>
//                 Cancel
//               </button>
//             </div>
//           ) : (
//             <>
//               <span className="info-value">{volunteer.phone}</span>
//               <button
//                 className="mini-edit-btn"
//                 onClick={() => startEdit("phone", volunteer.phone)}
//               >
//                 Edit
//               </button>
//             </>
//           )}
//         </div>

//         <div className="info-row">
//           <span className="info-label">Address:</span>

//           {editingField === "address" ? (
//             <div className="edit-inline-box">
//               <input
//                 type="text"
//                 value={editValue}
//                 onChange={(e) => setEditValue(e.target.value)}
//               />
//               <button className="save-btn" onClick={saveEdit}>
//                 Save
//               </button>
//               <button className="cancel-btn" onClick={cancelEdit}>
//                 Cancel
//               </button>
//             </div>
//           ) : (
//             <>
//               <span className="info-value">{volunteer.address}</span>
//               <button
//                 className="mini-edit-btn"
//                 onClick={() => startEdit("address", volunteer.address)}
//               >
//                 Edit
//               </button>
//             </>
//           )}
//         </div>

//         <div className="info-row">
//           <span className="info-label">Emergency Contact:</span>

//           {editingField === "emergencyContact" ? (
//             <div className="edit-inline-box">
//               <input
//                 type="text"
//                 value={editValue}
//                 onChange={(e) => setEditValue(e.target.value)}
//               />
//               <button className="save-btn" onClick={saveEdit}>
//                 Save
//               </button>
//               <button className="cancel-btn" onClick={cancelEdit}>
//                 Cancel
//               </button>
//             </div>
//           ) : (
//             <>
//               <span className="info-value">{volunteer.emergencyContact}</span>
//               <button
//                 className="mini-edit-btn"
//                 onClick={() =>
//                   startEdit("emergencyContact", volunteer.emergencyContact)
//                 }
//               >
//                 Edit
//               </button>
//             </>
//           )}
//         </div>

//         <div className="info-row">
//           <span className="info-label">Preferred Zone:</span>
//           <span className="info-value">
//             {volunteer.preferredZone || "Not selected yet"}
//           </span>
//         </div>

//         <div className="info-row">
//           <span className="info-label">Role:</span>
//           <span className="info-value">
//             {volunteer.volunteerRole || "Not selected yet"}
//           </span>
//         </div>

//         <div className="info-row">
//           <span className="info-label">Preferred Time:</span>
//           <span className="info-value">
//             {volunteer.preferredTime || "Not selected yet"}
//           </span>
//         </div>

//         <div className="info-row">
//           <span className="info-label">Status:</span>
//           <span className="info-value">
//             {volunteer.isVerified ? "Verified Volunteer" : "Pending"}
//           </span>
//         </div>
//       </div>

//       <div className="volunteer-skills-card">
//         <h2>Skills & Experience</h2>
//         <p>{volunteer.skillsExperience || "No skills/experience added yet."}</p>
//       </div>

//       <div className="dashboard-stats">
//         <div className="stat-card">
//           <h3>{volunteer.preferredZone || "N/A"}</h3>
//           <p>Your Zone</p>
//         </div>

//         <div className="stat-card">
//           <h3>{volunteer.volunteerRole || "N/A"}</h3>
//           <p>Your Role</p>
//         </div>

//         <div className="stat-card">
//           <h3>{volunteer.preferredTime || "Flexible"}</h3>
//           <p>Availability</p>
//         </div>
//       </div>

//       <div className="dashboard-buttons">
//         <button
//           onClick={() =>
//             navigate("/volunteer-zone-select", { state: { editMode: true } })
//           }
//         >
//           Edit Zone ▶
//         </button>

//         <button
//           onClick={() =>
//             navigate("/volunteer-role-setup", { state: { editMode: true } })
//           }
//         >
//           Edit Role & Availability ▶
//         </button>

//         <button onClick={() => navigate("/volunteer-directory")}>
//           View All Volunteers ▶
//         </button>

//         <button onClick={() => navigate("/volunteer-map-board")}>
//           Open Live Map & Requests ▶
//         </button>
//       </div>
//     </div>
//   );
// };

// export default VolunteerDashboard;
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./VolunteerDashboard.css";

const VolunteerDashboard = () => {
  const navigate = useNavigate();
  const [volunteer, setVolunteer] = useState(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [editingField, setEditingField] = useState("");
  const [editValue, setEditValue] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const needPassword = localStorage.getItem("needVolunteerPassword"); // Check if password prompt is needed

  useEffect(() => {
    const fetchVolunteer = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3001/volunteer/profile/${user.email}`,
        );
        setVolunteer(response.data);
      } catch (error) {
        console.log(error);
      }
    };

    if (user?.email) {
      fetchVolunteer();
    }
  }, [user?.email]);

  // Handle password submission
  const handlePasswordSubmit = async () => {
    try {
      const res = await axios.post("http://localhost:3001/volunteer/login", {
        email: user.email,
        password: password,
      });

      if (res.status === 200) {
        // Successfully verified the password, remove the needPassword flag
        localStorage.setItem("needVolunteerPassword", "false");
        navigate("/volunteer-dashboard");
      }
    } catch (err) {
      setError("Incorrect volunteer password.");
    }
  };

  const startEdit = (field, currentValue) => {
    setEditingField(field);
    setEditValue(currentValue || "");
  };

  const cancelEdit = () => {
    setEditingField("");
    setEditValue("");
  };

  const saveEdit = async () => {
    try {
      await axios.put(`http://localhost:3001/volunteer/update/${user.email}`, {
        [editingField]: editValue,
      });

      setVolunteer((prev) => ({
        ...prev,
        [editingField]: editValue,
      }));

      setEditingField("");
      setEditValue("");
      alert("Volunteer information updated successfully");
    } catch (error) {
      console.log(error);
      alert("Could not update volunteer information");
    }
  };

  if (!volunteer) {
    return <div className="volunteer-dashboard-page">Loading...</div>;
  }

  return (
    <div className="volunteer-dashboard-page">
      {/* If password is required, prompt for the password */}
      {needPassword === "true" && (
        <div>
          <h2>Enter Volunteer Password</h2>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />
          {error && <p>{error}</p>}
          <button onClick={handlePasswordSubmit}>Submit</button>
        </div>
      )}

      {/* Dashboard content */}
      {needPassword !== "true" && (
        <div>
          <div className="volunteer-dashboard-card">
            <h1>Volunteer Dashboard</h1>
            <p>
              Welcome back, {volunteer.fullName}. Your volunteer profile is
              active and ready.
            </p>
          </div>

          <div className="volunteer-info-card">
            <h2>Volunteer Information</h2>

            <div className="info-row">
              <span className="info-label">Name:</span>
              <span className="info-value">{volunteer.fullName}</span>
            </div>

            <div className="info-row">
              <span className="info-label">Email:</span>
              <span className="info-value">{volunteer.email}</span>
            </div>

            <div className="info-row">
              <span className="info-label">Phone:</span>

              {editingField === "phone" ? (
                <div className="edit-inline-box">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                  />
                  <button className="save-btn" onClick={saveEdit}>
                    Save
                  </button>
                  <button className="cancel-btn" onClick={cancelEdit}>
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <span className="info-value">{volunteer.phone}</span>
                  <button
                    className="mini-edit-btn"
                    onClick={() => startEdit("phone", volunteer.phone)}
                  >
                    Edit
                  </button>
                </>
              )}
            </div>

            <div className="info-row">
              <span className="info-label">Address:</span>

              {editingField === "address" ? (
                <div className="edit-inline-box">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                  />
                  <button className="save-btn" onClick={saveEdit}>
                    Save
                  </button>
                  <button className="cancel-btn" onClick={cancelEdit}>
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <span className="info-value">{volunteer.address}</span>
                  <button
                    className="mini-edit-btn"
                    onClick={() => startEdit("address", volunteer.address)}
                  >
                    Edit
                  </button>
                </>
              )}
            </div>

            <div className="info-row">
              <span className="info-label">Emergency Contact:</span>

              {editingField === "emergencyContact" ? (
                <div className="edit-inline-box">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                  />
                  <button className="save-btn" onClick={saveEdit}>
                    Save
                  </button>
                  <button className="cancel-btn" onClick={cancelEdit}>
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <span className="info-value">
                    {volunteer.emergencyContact}
                  </span>
                  <button
                    className="mini-edit-btn"
                    onClick={() =>
                      startEdit("emergencyContact", volunteer.emergencyContact)
                    }
                  >
                    Edit
                  </button>
                </>
              )}
            </div>

            <div className="info-row">
              <span className="info-label">Preferred Zone:</span>
              <span className="info-value">
                {volunteer.preferredZone || "Not selected yet"}
              </span>
            </div>

            <div className="info-row">
              <span className="info-label">Role:</span>
              <span className="info-value">
                {volunteer.volunteerRole || "Not selected yet"}
              </span>
            </div>

            <div className="info-row">
              <span className="info-label">Preferred Time:</span>
              <span className="info-value">
                {volunteer.preferredTime || "Not selected yet"}
              </span>
            </div>

            <div className="info-row">
              <span className="info-label">Status:</span>
              <span className="info-value">
                {volunteer.isVerified ? "Verified Volunteer" : "Pending"}
              </span>
            </div>
          </div>

          <div className="volunteer-skills-card">
            <h2>Skills & Experience</h2>
            <p>
              {volunteer.skillsExperience || "No skills/experience added yet."}
            </p>
          </div>

          <div className="dashboard-stats">
            <div className="stat-card">
              <h3>{volunteer.preferredZone || "N/A"}</h3>
              <p>Your Zone</p>
            </div>

            <div className="stat-card">
              <h3>{volunteer.volunteerRole || "N/A"}</h3>
              <p>Your Role</p>
            </div>

            <div className="stat-card">
              <h3>{volunteer.preferredTime || "Flexible"}</h3>
              <p>Availability</p>
            </div>
          </div>

          <div className="dashboard-buttons">
            <button
              onClick={() =>
                navigate("/volunteer-zone-select", {
                  state: { editMode: true },
                })
              }
            >
              Edit Zone ▶
            </button>

            <button
              onClick={() =>
                navigate("/volunteer-role-setup", { state: { editMode: true } })
              }
            >
              Edit Role & Availability ▶
            </button>

            <button onClick={() => navigate("/volunteer-directory")}>
              View All Volunteers ▶
            </button>

            <button onClick={() => navigate("/volunteer-map-board")}>
              Open Live Map & Requests ▶
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerDashboard;
