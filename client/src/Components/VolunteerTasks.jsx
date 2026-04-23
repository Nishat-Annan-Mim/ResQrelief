import React, { useEffect, useState } from "react";
import axios from "axios";
import "./VolunteerTasks.css";

const STATUS_LABELS = {
  pending: { label: "Pending", color: "#e67e22" },
  "in-progress": { label: "In Progress", color: "#2980b9" },
  completed: { label: "Completed", color: "#27ae60" },
  cancelled: { label: "Cancelled", color: "#c0392b" },
};

const PRIORITY_LABELS = {
  high: { label: "HIGH", color: "#c0392b" },
  medium: { label: "MED", color: "#e67e22" },
  low: { label: "LOW", color: "#27ae60" },
};

const TASK_ICONS = {
  "Food Distribution": "🍱",
  "Medical Aid": "🏥",
  "Transport Coordination": "🚛",
  "Shelter Setup": "🏕️",
  "Search & Rescue": "🔍",
  "Water Supply": "💧",
  "Communication": "📡",
  "Logistics": "📦",
};

const TAB_LABELS = {
  all: "All",
  pending: "Pending",
  "in-progress": "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const isOverdue = (task) =>
  task.dueDate &&
  task.status !== "completed" &&
  task.status !== "cancelled" &&
  new Date(task.dueDate) < new Date();

const VolunteerTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [noteModal, setNoteModal] = useState(null);
  const [note, setNote] = useState("");
  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.email) fetchTasks(user.email);
    else setLoading(false);
  }, []);

  const fetchTasks = async (email) => {
    try {
      const res = await axios.get(
        `https://resqreliefcheck.onrender.com/api/tasks/volunteer/${email}`
      );
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (text, type = "success") => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg({ text: "", type: "" }), 3000);
  };

  const handleStatusUpdate = async (taskId, status) => {
    if (status === "completed") {
      setNoteModal(taskId);
      return;
    }
    try {
      await axios.put(`https://resqreliefcheck.onrender.com/api/tasks/${taskId}/status`, { status });
      showMsg("Task marked as in progress!");
      const user = JSON.parse(localStorage.getItem("user"));
      fetchTasks(user.email);
    } catch (err) {
      showMsg("Failed to update status. Please try again.", "error");
    }
  };

  const handleCompleteWithNote = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      await axios.put(`https://resqreliefcheck.onrender.com/api/tasks/${noteModal}/status`, {
        status: "completed",
        completionNote: note,
      });
      setNoteModal(null);
      setNote("");
      showMsg("Task marked as complete! Great work 🎉");
      fetchTasks(user.email);
    } catch (err) {
      showMsg("Failed to mark as complete. Please try again.", "error");
    }
  };

  const filteredTasks =
    activeFilter === "all" ? tasks : tasks.filter((t) => t.status === activeFilter);

  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    inProgress: tasks.filter((t) => t.status === "in-progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  const overdueCount = tasks.filter(isOverdue).length;

  return (
    <div className="vt-page">
      <div className="vt-header">
        <h1>📋 My Tasks</h1>
        <p>View and manage tasks assigned to you by the admin.</p>
      </div>

      {/* Inline status feedback */}
      {statusMsg.text && (
        <div className={`vt-status-msg vt-status-msg-${statusMsg.type}`}>
          {statusMsg.type === "error" ? "⚠️" : "✅"} {statusMsg.text}
        </div>
      )}

      {/* Overdue warning banner */}
      {overdueCount > 0 && (
        <div className="vt-overdue-banner">
          🚨 You have <strong>{overdueCount}</strong> overdue task{overdueCount > 1 ? "s" : ""}. Please action them as soon as possible.
        </div>
      )}

      {/* Stats */}
      <div className="vt-stats">
        <div className="vt-stat">
          <span className="vt-stat-num">{stats.total}</span>
          <span>Total</span>
        </div>
        <div className="vt-stat vt-stat-pending">
          <span className="vt-stat-num">{stats.pending}</span>
          <span>Pending</span>
        </div>
        <div className="vt-stat vt-stat-inprogress">
          <span className="vt-stat-num">{stats.inProgress}</span>
          <span>In Progress</span>
        </div>
        <div className="vt-stat vt-stat-done">
          <span className="vt-stat-num">{stats.completed}</span>
          <span>Done</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="vt-tabs">
        {Object.entries(TAB_LABELS).map(([key, label]) => (
          <button
            key={key}
            className={`vt-tab ${activeFilter === key ? "vt-tab-active" : ""}`}
            onClick={() => setActiveFilter(key)}
          >
            {label}
            {key === "pending" && stats.pending > 0 && (
              <span className="vt-tab-badge">{stats.pending}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="vt-loading">Loading your tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="vt-empty">
          <p>📭 No tasks assigned to you yet.</p>
          <span>The admin will assign tasks here. Check back soon.</span>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="vt-empty">
          <p>✅ No tasks in this category.</p>
        </div>
      ) : (
        <div className="vt-task-list">
          {filteredTasks.map((task) => {
            const overdue = isOverdue(task);
            return (
              <div
                key={task._id}
                className={`vt-task-card vt-priority-${task.priority}${overdue ? " vt-overdue" : ""}`}
              >
                <div
                  className="vt-task-header"
                  onClick={() => setExpandedId(expandedId === task._id ? null : task._id)}
                >
                  <div className="vt-task-left">
                    <span className="vt-task-icon">{TASK_ICONS[task.taskType] || "📌"}</span>
                    <div>
                      <h3 className="vt-task-title">
                        {task.title}
                        {overdue && <span className="vt-overdue-tag">OVERDUE</span>}
                      </h3>
                      <span className="vt-task-type">{task.taskType}</span>
                    </div>
                  </div>
                  <div className="vt-task-right">
                    <span
                      className="vt-priority-badge"
                      style={{ background: PRIORITY_LABELS[task.priority]?.color }}
                    >
                      {PRIORITY_LABELS[task.priority]?.label}
                    </span>
                    <span
                      className="vt-status-badge"
                      style={{ color: STATUS_LABELS[task.status]?.color, borderColor: STATUS_LABELS[task.status]?.color }}
                    >
                      {STATUS_LABELS[task.status]?.label}
                    </span>
                    <span className="vt-expand-arrow">{expandedId === task._id ? "▲" : "▼"}</span>
                  </div>
                </div>

                {expandedId === task._id && (
                  <div className="vt-task-body">
                    <p className="vt-task-desc">{task.description}</p>

                    <div className="vt-task-meta">
                      {task.zone && <span>📍 {task.zone}</span>}
                      {task.dueDate && (
                        <span style={overdue ? { color: "#c0392b", fontWeight: 700 } : {}}>
                          📅 Due: {new Date(task.dueDate).toLocaleDateString()}
                          {overdue && " — OVERDUE"}
                        </span>
                      )}
                      <span>🕐 Assigned: {new Date(task.createdAt).toLocaleDateString()}</span>
                    </div>

                    {task.completionNote && (
                      <div className="vt-completion-note">
                        <strong>Completion Note:</strong> {task.completionNote}
                      </div>
                    )}

                    {task.status !== "completed" && task.status !== "cancelled" && (
                      <div className="vt-task-actions">
                        {task.status === "pending" && (
                          <button
                            className="vt-btn-start"
                            onClick={() => handleStatusUpdate(task._id, "in-progress")}
                          >
                            ▶ Start Task
                          </button>
                        )}
                        {task.status === "in-progress" && (
                          <button
                            className="vt-btn-complete"
                            onClick={() => handleStatusUpdate(task._id, "completed")}
                          >
                            ✓ Mark Complete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Completion Note Modal */}
      {noteModal && (
        <div className="vt-modal-overlay" onClick={() => { setNoteModal(null); setNote(""); }}>
          <div className="vt-modal" onClick={(e) => e.stopPropagation()}>
            <h3>✓ Complete Task</h3>
            <p>Add a brief note about what was accomplished (optional):</p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Distributed 200 food packs to 80 families in sector 3..."
              rows={4}
            />
            <div className="vt-modal-actions">
              <button className="vt-btn-cancel" onClick={() => { setNoteModal(null); setNote(""); }}>
                Cancel
              </button>
              <button className="vt-btn-confirm" onClick={handleCompleteWithNote}>
                Mark as Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerTasks;
