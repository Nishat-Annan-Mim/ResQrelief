import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./AdminHome.css";
import "./Adminvolunteers.css";
import "./AdminOperations.css";

const AdminOperations = () => {
  const navigate = useNavigate();
  const [volunteers, setVolunteers] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [operations, setOperations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [districtFilter, setDistrictFilter] = useState("");

  const [form, setForm] = useState({
    selectedVolunteers: [], // [{ volunteerId, volunteerName, volunteerEmail }]
    operationName: "",
    supplyPickupPoint: "",
    locationInput: "",
    locations: [],
    customSupply: "",
    scheduledDate: "",
    departureTime: "",
    notes: "",
  });

  useEffect(() => {
    axios
      .get("http://localhost:3001/api/volunteers/all")
      .then((res) => setVolunteers(res.data));
    axios
      .get("http://localhost:3001/api/inventory")
      .then((res) => setInventoryItems(res.data));
    fetchOperations();
  }, []);

  const fetchOperations = () => {
    axios
      .get("http://localhost:3001/api/operations")
      .then((res) => setOperations(res.data));
  };

  // All unique districts from confirmed volunteers
  const allDistricts = [
    ...new Set(
      volunteers
        .filter((v) => v.status === "confirmed")
        .map((v) => v.preferredZone)
        .filter(Boolean),
    ),
  ];

  // Volunteers filtered by selected district AND availability matching operation date
  const filteredVolunteers = volunteers.filter((v) => {
    if (v.status !== "confirmed") return false;
    if (districtFilter && v.preferredZone !== districtFilter) return false;

    // Check availability if operation date is set
    if (form.scheduledDate) {
      const opDate = new Date(form.scheduledDate);
      const from = v.availableFrom ? new Date(v.availableFrom) : null;
      const until = v.availableUntil ? new Date(v.availableUntil) : null;

      if (from && until) {
        // Volunteer must be available on the operation date
        if (opDate < from || opDate > until) return false;
      }
    }

    return true;
  });

  const isVolunteerSelected = (volunteerId) =>
    form.selectedVolunteers.some((v) => v.volunteerId === volunteerId);

  const toggleVolunteer = (vol) => {
    const already = isVolunteerSelected(vol._id);
    setForm((prev) => ({
      ...prev,
      selectedVolunteers: already
        ? prev.selectedVolunteers.filter((v) => v.volunteerId !== vol._id)
        : [
            ...prev.selectedVolunteers,
            {
              volunteerId: vol._id,
              volunteerName: vol.fullName,
              volunteerEmail: vol.email,
            },
          ],
    }));
  };

  const addLocation = () => {
    if (!form.locationInput.trim()) return;
    const alreadyExists = form.locations.find(
      (l) => l.name.toLowerCase() === form.locationInput.trim().toLowerCase(),
    );
    if (alreadyExists) return alert("Location already added.");
    setForm((prev) => ({
      ...prev,
      locations: [
        ...prev.locations,
        { name: prev.locationInput.trim(), supplies: [] },
      ],
      locationInput: "",
    }));
  };

  const removeLocation = (locationName) => {
    setForm((prev) => ({
      ...prev,
      locations: prev.locations.filter((l) => l.name !== locationName),
    }));
  };

  const toggleSupplyForLocation = (locationName, supplyKey) => {
    setForm((prev) => ({
      ...prev,
      locations: prev.locations.map((l) => {
        if (l.name !== locationName) return l;
        const hasIt = l.supplies.includes(supplyKey);
        return {
          ...l,
          supplies: hasIt
            ? l.supplies.filter((s) => s !== supplyKey)
            : [...l.supplies, supplyKey],
        };
      }),
    }));
  };

  const addCustomSupplyToLocation = (locationName) => {
    if (!form.customSupply.trim()) return;
    setForm((prev) => ({
      ...prev,
      locations: prev.locations.map((l) => {
        if (l.name !== locationName) return l;
        if (l.supplies.includes(form.customSupply.trim())) return l;
        return { ...l, supplies: [...l.supplies, form.customSupply.trim()] };
      }),
      customSupply: "",
    }));
  };

  const handleSubmit = async () => {
    if (
      form.selectedVolunteers.length === 0 ||
      !form.operationName ||
      form.locations.length === 0
    ) {
      return alert(
        "Please select at least one volunteer, fill in operation name, and add at least one location.",
      );
    }
    await axios.post("http://localhost:3001/api/operations", {
      operationName: form.operationName,
      volunteers: form.selectedVolunteers,
      supplyPickupPoint: form.supplyPickupPoint,
      locations: form.locations,
      scheduledDate: form.scheduledDate,
      departureTime: form.departureTime,
      notes: form.notes,
    });
    setShowForm(false);
    setDistrictFilter("");
    setForm({
      selectedVolunteers: [],
      operationName: "",
      supplyPickupPoint: "",
      locationInput: "",
      locations: [],
      customSupply: "",
      scheduledDate: "",
      departureTime: "",
      notes: "",
    });
    fetchOperations();
  };

  const deleteOperation = async (id) => {
    if (!window.confirm("Delete this operation?")) return;
    await axios.delete(`http://localhost:3001/api/operations/${id}`);
    fetchOperations();
  };

  const getStatusClass = (status) => {
    if (status === "Completed") return "op-status-completed";
    if (status === "On the way") return "op-status-ontheway";
    if (status === "Arrived") return "op-status-arrived";
    return "op-status-pending";
  };

  return (
    <div className="admin-dashboard-container">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <ul className="sidebar-nav">
          <li className="sidebar-item" onClick={() => navigate("/admin-home")}>
            Dashboard
          </li>
          <li
            className="sidebar-item"
            onClick={() => navigate("/admin-requests")}
          >
            Requests
          </li>
          <li className="sidebar-item" onClick={() => navigate("/inventory")}>
            Inventory
          </li>
          <li
            className="sidebar-item"
            onClick={() => navigate("/admin-volunteers")}
          >
            Volunteers
          </li>
          <li className="sidebar-item active">Operations</li>
          <li
            className="sidebar-item"
            onClick={() => navigate("/admin-alerts")}
          >
            Alerts
          </li>
        </ul>
      </aside>

      <main className="admin-main-content op-main-padding">
        <div className="admin-header">
          <h2>🚛 Relief Operations</h2>
          <button className="btn-admin" onClick={() => setShowForm(!showForm)}>
            {showForm ? "✕ Cancel" : "+ Assign Operation"}
          </button>
        </div>

        {/* ASSIGNMENT FORM */}
        {showForm && (
          <div className="op-form-container">
            <h3>New Operation Assignment</h3>

            {/* ── ROW 1: Operation Name + Date + Departure ── */}
            <div className="op-form-grid">
              <div className="op-form-group">
                <label>Operation Name *</label>
                <input
                  placeholder="e.g. Flood Relief - Sylhet North"
                  value={form.operationName}
                  onChange={(e) =>
                    setForm({ ...form, operationName: e.target.value })
                  }
                />
              </div>

              <div className="op-form-group">
                <label>Operation Date</label>
                <input
                  type="date"
                  value={form.scheduledDate}
                  onChange={(e) =>
                    setForm({ ...form, scheduledDate: e.target.value })
                  }
                />
              </div>

              <div className="op-form-group">
                <label>Departure Time</label>
                <input
                  type="time"
                  value={form.departureTime}
                  onChange={(e) =>
                    setForm({ ...form, departureTime: e.target.value })
                  }
                />
              </div>
            </div>

            {/* ── VOLUNTEER SELECTION ── */}
            <div className="op-form-row">
              <label>
                Select Volunteers *{" "}
                <span
                  style={{ fontWeight: 400, color: "#888", fontSize: "12px" }}
                >
                  (filter by district, tick to select multiple)
                </span>
              </label>

              {/* District filter */}
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  fontSize: "14px",
                  marginBottom: "10px",
                  background: "#fff",
                  boxSizing: "border-box",
                }}
              >
                <option value="">-- All Districts --</option>
                {allDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              {/* Volunteer checklist */}
              <div className="op-volunteer-checklist">
                {filteredVolunteers.length === 0 && (
                  <p
                    style={{
                      color: "#aaa",
                      fontSize: "13px",
                      padding: "12px",
                      textAlign: "center",
                    }}
                  >
                    {form.scheduledDate
                      ? "No available volunteers for this date and district."
                      : "No confirmed volunteers found."}
                  </p>
                )}
                {filteredVolunteers.map((vol) => {
                  const selected = isVolunteerSelected(vol._id);
                  return (
                    <div
                      key={vol._id}
                      onClick={() => toggleVolunteer(vol)}
                      className={`op-volunteer-row ${selected ? "selected" : ""}`}
                    >
                      <div className="op-volunteer-checkbox">
                        {selected ? "☑" : "☐"}
                      </div>
                      <div className="op-volunteer-info">
                        <span className="op-volunteer-name">
                          {vol.fullName}
                        </span>
                        <span className="op-volunteer-meta">
                          {vol.preferredZone} &nbsp;·&nbsp;{" "}
                          {vol.volunteerRole || "No role"} &nbsp;·&nbsp;
                          Available:{" "}
                          {vol.availableFrom && vol.availableUntil
                            ? `${vol.availableFrom} → ${vol.availableUntil}`
                            : "Not set"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected summary */}
              {form.selectedVolunteers.length > 0 && (
                <div
                  className="op-selected-supplies"
                  style={{ marginTop: "8px" }}
                >
                  ✅ Selected:{" "}
                  {form.selectedVolunteers
                    .map((v) => v.volunteerName)
                    .join(", ")}
                </div>
              )}
            </div>

            {/* ── SUPPLY PICKUP POINT ── */}
            <div className="op-form-row">
              <label>📦 Supply Collection Point</label>
              <input
                placeholder="e.g. Central Warehouse, Farmgate, Dhaka"
                value={form.supplyPickupPoint}
                onChange={(e) =>
                  setForm({ ...form, supplyPickupPoint: e.target.value })
                }
              />
              <p className="op-field-hint">
                Specify the address or landmark where volunteers must collect
                supplies before heading to destinations.
              </p>
            </div>

            {/* ── LOCATIONS + SUPPLIES PER LOCATION ── */}
            <div className="op-form-row">
              <label>Add Destination Location *</label>
              <div className="op-custom-supply-row">
                <input
                  placeholder="e.g. Mirpur-10"
                  value={form.locationInput}
                  onChange={(e) =>
                    setForm({ ...form, locationInput: e.target.value })
                  }
                  onKeyDown={(e) => e.key === "Enter" && addLocation()}
                />
                <button className="btn-admin" onClick={addLocation}>
                  + Add
                </button>
              </div>
            </div>

            {form.locations.length > 0 && (
              <div className="op-locations-list">
                {form.locations.map((loc) => (
                  <div key={loc.name} className="op-location-card">
                    <div className="op-location-card-header">
                      <span className="op-location-name">📍 {loc.name}</span>
                      <button
                        className="op-remove-location-btn"
                        onClick={() => removeLocation(loc.name)}
                      >
                        ✕ Remove
                      </button>
                    </div>

                    <p className="op-supply-label">
                      Select supplies to deliver to this location:
                    </p>

                    <div className="op-supply-chips">
                      {inventoryItems.map((item) => {
                        const key = `${item.itemName} (${item.quantity} available)`;
                        return (
                          <button
                            key={item._id}
                            onClick={() =>
                              toggleSupplyForLocation(loc.name, key)
                            }
                            className={`op-supply-chip ${loc.supplies.includes(key) ? "selected" : ""}`}
                          >
                            {item.itemName}
                          </button>
                        );
                      })}
                    </div>

                    <div
                      className="op-custom-supply-row"
                      style={{ marginTop: "10px" }}
                    >
                      <input
                        placeholder="Extra supply (e.g. Tents x2)"
                        value={form.customSupply}
                        onChange={(e) =>
                          setForm({ ...form, customSupply: e.target.value })
                        }
                      />
                      <button
                        className="btn-admin"
                        onClick={() => addCustomSupplyToLocation(loc.name)}
                      >
                        Add
                      </button>
                    </div>

                    {loc.supplies.length > 0 && (
                      <div className="op-selected-supplies">
                        ✅ {loc.supplies.join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── NOTES ── */}
            <div className="op-form-row">
              <label>Special Notes / Instructions</label>
              <div className="op-form-group">
                <textarea
                  placeholder="Any additional instructions for the volunteers..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>

            <button className="confirm-btn" onClick={handleSubmit}>
              ✅ Assign Operation
            </button>
          </div>
        )}

        {/* OPERATIONS TABLE */}
        <div className="table-wrapper op-table-wrapper">
          <table className="op-table">
            <thead>
              <tr
                style={{
                  background: "linear-gradient(135deg, #1a1a2e, #e63946)",
                  color: "#fff",
                }}
              >
                <th>Operation</th>
                <th>Volunteers</th>
                <th>Destinations & Supplies</th>
                <th>Date & Departure</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {operations.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: "center",
                      padding: "30px",
                      color: "#888",
                    }}
                  >
                    No operations yet.
                  </td>
                </tr>
              )}
              {operations.map((op) => (
                <tr key={op._id}>
                  <td>
                    <strong>{op.operationName}</strong>
                  </td>
                  <td>
                    {op.volunteers?.map((v, i) => (
                      <div
                        key={i}
                        style={{
                          fontSize: "13px",
                          color: "#333",
                          marginBottom: "2px",
                        }}
                      >
                        👤 {v.volunteerName}
                      </div>
                    ))}
                  </td>
                  <td>
                    {op.locations?.map((loc, i) => (
                      <div key={i} className="op-table-location-row">
                        <span className="op-table-location-name">
                          📍 {loc.name}
                        </span>
                        <span className="op-table-location-supplies">
                          {loc.supplies?.length > 0
                            ? loc.supplies.join(", ")
                            : "No supplies"}
                        </span>
                      </div>
                    ))}
                  </td>
                  <td>
                    <div>{op.scheduledDate || "—"}</div>
                    {op.departureTime && (
                      <div style={{ fontSize: "12px", color: "#888" }}>
                        🕐 Departs {op.departureTime}
                      </div>
                    )}
                  </td>
                  <td>
                    <span
                      className={`op-status-badge ${getStatusClass(op.status)}`}
                    >
                      {op.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="remove-btn"
                      onClick={() => deleteOperation(op._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default AdminOperations;
