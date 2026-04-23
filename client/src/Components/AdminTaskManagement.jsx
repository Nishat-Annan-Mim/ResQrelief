import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AdminTaskManagement.css";

const TASK_TYPES = [
  "Food Distribution",
  "Medical Aid",
  "Transport Coordination",
  "Shelter Setup",
  "Search & Rescue",
  "Water Supply",
  "Communication",
  "Logistics",
];

const TASK_TYPE_ICONS = {
  "Food Distribution": "🍱",
  "Medical Aid": "🏥",
  "Transport Coordination": "🚛",
  "Shelter Setup": "🏕️",
  "Search & Rescue": "🔍",
  "Water Supply": "💧",
  Communication: "📡",
  Logistics: "📦",
};

const STATUS_COLORS = {
  pending: "#e67e22",
  "in-progress": "#2980b9",
  completed: "#27ae60",
  cancelled: "#c0392b",
};

const PRIORITY_COLORS = {
  high: "#c0392b",
  medium: "#e67e22",
  low: "#27ae60",
};

const AdminTaskManagement = () => {
  const [tasks, setTasks] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const emptyForm = {
    title: "",
    taskType: "",
    description: "",
    zone: "",
    priority: "medium",
    dueDate: "",
    assignedTo: { volunteerEmail: "", volunteerName: "", volunteerId: "" },
  };
  const [form, setForm] = useState(emptyForm);
  const [modalMsg, setModalMsg] = useState({ text: "", type: "" });

  useEffect(() => {
    fetchTasks();
    fetchVolunteers();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(
        "https://resqreliefcheck.onrender.com/api/tasks",
      );
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVolunteers = async () => {
    try {
      const res = await axios.get(
        "https://resqreliefcheck.onrender.com/api/volunteers/all",
      );
      // Show all volunteers who have completed their profile (confirmed OR pending)
      setVolunteers(
        res.data.filter((v) => v.volunteerRole && v.volunteerRole !== ""),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleVolunteerSelect = (e) => {
    const email = e.target.value;
    const vol = volunteers.find((v) => v.email === email);
    setForm({
      ...form,
      assignedTo: {
        volunteerEmail: email,
        volunteerName: vol ? vol.fullName : "",
        volunteerId: vol ? vol._id : "",
      },
    });
  };

  //   const handleSubmit = async () => {
  //     if (!form.title || !form.taskType || !form.description) {
  //       setModalMsg({ text: "Please fill in title, type, and description.", type: "error" });
  //       return;
  //     }
  //     try {
  //       if (editingTask) {
  //         await axios.put(`http://localhost:3001/api/tasks/${editingTask._id}`, form);
  //         setModalMsg({ text: "Task updated successfully!", type: "success" });
  //       } else {
  //         await axios.post("http://localhost:3001/api/tasks", form);
  //         setModalMsg({ text: form.assignedTo.volunteerEmail ? "Task created and volunteer notified!" : "Task created successfully!", type: "success" });
  //       }
  //       setTimeout(() => {
  //         setShowModal(false);
  //         setEditingTask(null);
  //         setForm(emptyForm);
  //         setModalMsg({ text: "", type: "" });
  //         fetchTasks();
  //       }, 1200);
  //     } catch (err) {
  //       setModalMsg({ text: "Failed to save task. Please try again.", type: "error" });
  //     }
  //   };

  const handleSubmit = async () => {
    if (!form.title || !form.taskType || !form.description) {
      setModalMsg({
        text: "Please fill in title, type, and description.",
        type: "error",
      });
      return;
    }
    try {
      let response;
      if (editingTask) {
        response = await axios.put(
          `https://resqreliefcheck.onrender.com/api/tasks/${editingTask._id}`,
          form,
        );
      } else {
        response = await axios.post("https://resqreliefcheck.onrender.com/api/tasks", form);
      }

      // If we reach here, the request succeeded (axios throws on non-2xx)
      const successMsg = editingTask
        ? "Task updated successfully!"
        : form.assignedTo.volunteerEmail
          ? "Task created and volunteer notified!"
          : "Task created successfully!";

      setModalMsg({ text: successMsg, type: "success" });

      setTimeout(() => {
        setShowModal(false);
        setEditingTask(null);
        setForm(emptyForm);
        setModalMsg({ text: "", type: "" });
        fetchTasks();
      }, 1200);
    } catch (err) {
      console.error("Task save error:", err);
      const serverMsg =
        err?.response?.data?.message || err?.response?.data?.error;
      setModalMsg({
        text: serverMsg
          ? `Failed: ${serverMsg}`
          : "Failed to save task. Please try again.",
        type: "error",
      });
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      taskType: task.taskType,
      description: task.description,
      zone: task.zone,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
      assignedTo: {
        volunteerEmail: task.assignedTo?.volunteerEmail || "",
        volunteerName: task.assignedTo?.volunteerName || "",
        volunteerId: task.assignedTo?.volunteerId || "",
      },
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    await axios.delete(`https://resqreliefcheck.onrender.com/api/tasks/${id}`);
    fetchTasks();
  };

  const handleStatusChange = async (id, status) => {
    await axios.put(
      `https://resqreliefcheck.onrender.com/api/tasks/${id}/status`,
      { status },
    );
    fetchTasks();
  };

  const filtered = tasks.filter((t) => {
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    const matchType = filterType === "all" || t.taskType === filterType;
    const matchSearch =
      !searchQuery ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.assignedTo?.volunteerName || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchStatus && matchType && matchSearch;
  });

  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    inProgress: tasks.filter((t) => t.status === "in-progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  return (
    <div className="atm-page">
      {/* Stats Bar */}
      <div className="atm-stats-row">
        <div className="atm-stat-card">
          <span className="atm-stat-num">{stats.total}</span>
          <span className="atm-stat-label">Total Tasks</span>
        </div>
        <div className="atm-stat-card pending">
          <span className="atm-stat-num">{stats.pending}</span>
          <span className="atm-stat-label">Pending</span>
        </div>
        <div className="atm-stat-card inprogress">
          <span className="atm-stat-num">{stats.inProgress}</span>
          <span className="atm-stat-label">In Progress</span>
        </div>
        <div className="atm-stat-card completed">
          <span className="atm-stat-num">{stats.completed}</span>
          <span className="atm-stat-label">Completed</span>
        </div>
      </div>

      {/* Controls */}
      <div className="atm-controls">
        <input
          className="atm-search"
          placeholder="Search tasks or volunteer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="atm-select"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="atm-select"
        >
          <option value="all">All Types</option>
          {TASK_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button
          className="atm-btn-create"
          onClick={() => {
            setEditingTask(null);
            setForm(emptyForm);
            setModalMsg({ text: "", type: "" });
            setShowModal(true);
          }}
        >
          + Assign New Task
        </button>
      </div>

      {/* Task Table */}
      {loading ? (
        <p className="atm-loading">Loading tasks...</p>
      ) : filtered.length === 0 ? (
        <div className="atm-empty">
          No tasks found. Assign a new task above.
        </div>
      ) : (
        <div className="atm-table-wrapper">
          <table className="atm-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Type</th>
                <th>Assigned To</th>
                <th>Zone</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((task) => (
                <tr key={task._id}>
                  <td className="atm-task-title">{task.title}</td>
                  <td>
                    <span className="atm-type-badge">
                      {TASK_TYPE_ICONS[task.taskType]} {task.taskType}
                    </span>
                  </td>
                  <td>
                    {task.assignedTo?.volunteerName || (
                      <span className="atm-unassigned">Unassigned</span>
                    )}
                  </td>
                  <td>{task.zone || "—"}</td>
                  <td>
                    <span
                      className="atm-priority-dot"
                      style={{ background: PRIORITY_COLORS[task.priority] }}
                    >
                      {task.priority.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <select
                      className="atm-status-select"
                      value={task.status}
                      style={{ color: STATUS_COLORS[task.status] }}
                      onChange={(e) =>
                        handleStatusChange(task._id, e.target.value)
                      }
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td>
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="atm-actions">
                    <button
                      className="atm-btn-edit"
                      onClick={() => handleEdit(task)}
                    >
                      Edit
                    </button>
                    <button
                      className="atm-btn-delete"
                      onClick={() => handleDelete(task._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="atm-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="atm-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingTask ? "Edit Task" : "Assign New Task"}</h2>

            {modalMsg.text && (
              <div className={`atm-modal-msg atm-modal-msg-${modalMsg.type}`}>
                {modalMsg.type === "error" ? "⚠️" : "✅"} {modalMsg.text}
              </div>
            )}

            <div className="atm-modal-grid">
              <div className="atm-field">
                <label>Task Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Distribute food packs in Feni North"
                />
              </div>

              <div className="atm-field">
                <label>Task Type *</label>
                <select
                  value={form.taskType}
                  onChange={(e) =>
                    setForm({ ...form, taskType: e.target.value })
                  }
                >
                  <option value="">Select task type</option>
                  {TASK_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="atm-field atm-full">
                <label>Description *</label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Describe the task in detail..."
                  rows={3}
                />
              </div>

              <div className="atm-field">
                <label>Assign Volunteer</label>
                <select
                  value={form.assignedTo.volunteerEmail}
                  onChange={handleVolunteerSelect}
                >
                  <option value="">— Unassigned —</option>
                  {volunteers.map((v) => (
                    <option key={v._id} value={v.email}>
                      {v.fullName} · {v.volunteerRole} · {v.preferredZone}
                      {v.status === "confirmed" ? " ✓" : ""}
                    </option>
                  ))}
                </select>
                {volunteers.length === 0 && (
                  <span
                    style={{
                      fontSize: "0.78rem",
                      color: "#e67e22",
                      marginTop: 4,
                    }}
                  >
                    No volunteers with completed profiles found.
                  </span>
                )}
                {form.assignedTo.volunteerEmail &&
                  (() => {
                    const sel = volunteers.find(
                      (v) => v.email === form.assignedTo.volunteerEmail,
                    );
                    return sel ? (
                      <div className="atm-volunteer-preview">
                        <span>🧑 {sel.fullName}</span>
                        <span>🎯 Role: {sel.volunteerRole}</span>
                        <span>📍 Zone: {sel.preferredZone}</span>
                        <span>
                          🕐 Available: {sel.preferredTime || "Any time"}
                        </span>
                        <span className={`atm-vol-status ${sel.status}`}>
                          {sel.status === "confirmed"
                            ? "✓ Confirmed"
                            : "⏳ Pending"}
                        </span>
                      </div>
                    ) : null;
                  })()}
              </div>

              <div className="atm-field">
                <label>Zone / Location</label>
                <input
                  value={form.zone}
                  onChange={(e) => setForm({ ...form, zone: e.target.value })}
                  placeholder="e.g. Dhaka, Sylhet North"
                />
              </div>

              <div className="atm-field">
                <label>
                  Priority{" "}
                  <span
                    style={{
                      fontWeight: 400,
                      textTransform: "none",
                      color: "#aaa",
                    }}
                  >
                    (manual)
                  </span>
                </label>
                <select
                  value={form.priority}
                  onChange={(e) =>
                    setForm({ ...form, priority: e.target.value })
                  }
                >
                  <option value="high">🔴 High — Urgent, life-critical</option>
                  <option value="medium">
                    🟠 Medium — Important but not immediate
                  </option>
                  <option value="low">🟢 Low — Can be scheduled</option>
                </select>
              </div>

              <div className="atm-field">
                <label>Due Date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm({ ...form, dueDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="atm-modal-actions">
              <button
                className="atm-btn-cancel"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button className="atm-btn-save" onClick={handleSubmit}>
                {editingTask ? "Update Task" : "Assign Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTaskManagement;
