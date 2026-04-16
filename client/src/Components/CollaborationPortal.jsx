import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./CollaborationPortal.css";

const POST_TYPES = [
  "Resource Offer",
  "Resource Request",
  "Coordination Update",
  "Joint Plan",
  "Situation Report",
];

const POST_TYPE_ICONS = {
  "Resource Offer": "🟢",
  "Resource Request": "🔴",
  "Coordination Update": "🔵",
  "Joint Plan": "🟡",
  "Situation Report": "📊",
};

const POST_TYPE_COLORS = {
  "Resource Offer": "#27ae60",
  "Resource Request": "#c0392b",
  "Coordination Update": "#2980b9",
  "Joint Plan": "#f39c12",
  "Situation Report": "#8e44ad",
};

const RESOURCE_TAGS = [
  "Medical", "Food", "Water", "Shelter", "Transport", "Volunteers", "Funding", "Rescue", "Communication",
];

const CollaborationPortal = () => {
  const navigate = useNavigate();
  const role = sessionStorage.getItem("role");
  const isAdmin = role === "admin";

  // NGO session (stored separately)
  const [ngoSession, setNgoSession] = useState(() => {
    const stored = sessionStorage.getItem("ngoAgency");
    return stored ? JSON.parse(stored) : null;
  });

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");

  const [posts, setPosts] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const [showNewPost, setShowNewPost] = useState(false);
  const [postForm, setPostForm] = useState({
    postType: "",
    title: "",
    content: "",
    resourceTags: [],
    targetDistricts: "",
  });

  const [expandedPost, setExpandedPost] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [activeTab, setActiveTab] = useState("posts"); // posts | agencies (admin only)
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    fetchPosts();
    if (isAdmin) fetchAgencies();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/collab/posts");
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPosts(false);
    }
  };

  const fetchAgencies = async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/ngo/agencies");
      setAgencies(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNGOLogin = async () => {
    setLoginError("");
    try {
      const res = await axios.post("http://localhost:3001/api/ngo/login", loginForm);
      sessionStorage.setItem("ngoAgency", JSON.stringify(res.data.agency));
      setNgoSession(res.data.agency);
    } catch (err) {
      setLoginError(err.response?.data?.message || "Login failed");
    }
  };

  const handleNGOLogout = () => {
    sessionStorage.removeItem("ngoAgency");
    setNgoSession(null);
  };

  const handleCreatePost = async () => {
    if (!postForm.postType || !postForm.title || !postForm.content) {
      alert("Please fill in type, title, and content.");
      return;
    }
    const poster = isAdmin
      ? { agencyName: "ResQRelief Admin", agencyType: "Government", district: "National" }
      : { agencyId: ngoSession._id, agencyName: ngoSession.agencyName, agencyType: ngoSession.agencyType, district: ngoSession.district };

    try {
      await axios.post("http://localhost:3001/api/collab/posts", {
        postedBy: poster,
        postType: postForm.postType,
        title: postForm.title,
        content: postForm.content,
        resourceTags: postForm.resourceTags,
        targetDistricts: postForm.targetDistricts ? postForm.targetDistricts.split(",").map((s) => s.trim()) : [],
      });
      setShowNewPost(false);
      setPostForm({ postType: "", title: "", content: "", resourceTags: [], targetDistricts: "" });
      fetchPosts();
    } catch (err) {
      alert("Failed to create post.");
    }
  };

  const handleReply = async (postId) => {
    if (!replyText.trim()) return;
    const responder = isAdmin
      ? { respondedByAgency: "ResQRelief Admin", respondedByType: "Government" }
      : { respondedByAgency: ngoSession.agencyName, respondedByType: ngoSession.agencyType };

    try {
      await axios.post(`http://localhost:3001/api/collab/posts/${postId}/respond`, {
        ...responder,
        message: replyText,
      });
      setReplyText("");
      fetchPosts();
    } catch (err) {
      alert("Failed to post reply.");
    }
  };

  const handleAgencyStatus = async (id, status) => {
    await axios.put(`http://localhost:3001/api/ngo/agencies/${id}/status`, { status });
    fetchAgencies();
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm("Delete this post?")) return;
    await axios.delete(`http://localhost:3001/api/collab/posts/${id}`);
    fetchPosts();
  };

  const toggleTag = (tag) => {
    setPostForm((prev) => ({
      ...prev,
      resourceTags: prev.resourceTags.includes(tag)
        ? prev.resourceTags.filter((t) => t !== tag)
        : [...prev.resourceTags, tag],
    }));
  };

  const canPost = isAdmin || ngoSession;
  const filtered = filterType === "all" ? posts : posts.filter((p) => p.postType === filterType);

  // If not admin and not NGO logged in → show login/register
  if (!isAdmin && !ngoSession) {
    return (
      <div className="cp-gate-page">
        <div className="cp-gate-card">
          <div className="cp-gate-header">
            <h1>🤝 NGO & Authority Collaboration Portal</h1>
            <p>A secure space for verified agencies to coordinate relief efforts, share resources, and jointly plan operations.</p>
          </div>

          <div className="cp-gate-body">
            <div className="cp-login-box">
              <h3>Agency Login</h3>
              {loginError && <p className="cp-login-error">{loginError}</p>}
              <input
                placeholder="Agency email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              />
              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              />
              <button className="cp-btn-login" onClick={handleNGOLogin}>Access Portal →</button>
            </div>

            <div className="cp-gate-divider">or</div>

            <div className="cp-register-prompt">
              <p>New agency? Register to request verification and join the network.</p>
              <button className="cp-btn-register" onClick={() => navigate("/ngo-register")}>
                Register Your Agency
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cp-page">
      {/* Portal Header */}
      <div className="cp-portal-header">
        <div>
          <h1>🤝 Collaboration Portal</h1>
          <p>
            {isAdmin
              ? "Manage agencies and coordinate inter-agency relief operations."
              : `Logged in as ${ngoSession.agencyName} · ${ngoSession.agencyType}`}
          </p>
        </div>
        <div className="cp-header-actions">
          {canPost && (
            <button className="cp-btn-new-post" onClick={() => setShowNewPost(true)}>
              + New Post
            </button>
          )}
          {!isAdmin && (
            <button className="cp-btn-logout" onClick={handleNGOLogout}>Logout Agency</button>
          )}
        </div>
      </div>

      {/* Admin Tabs */}
      {isAdmin && (
        <div className="cp-tabs">
          <button className={`cp-tab ${activeTab === "posts" ? "active" : ""}`} onClick={() => setActiveTab("posts")}>
            📋 Posts & Updates
          </button>
          <button className={`cp-tab ${activeTab === "agencies" ? "active" : ""}`} onClick={() => setActiveTab("agencies")}>
            🏢 Agencies ({agencies.length})
          </button>
        </div>
      )}

      {/* ===== AGENCIES TAB (Admin only) ===== */}
      {isAdmin && activeTab === "agencies" && (
        <div className="cp-agencies-section">
          <div className="cp-agencies-grid">
            {agencies.map((a) => (
              <div key={a._id} className={`cp-agency-card cp-status-${a.status}`}>
                <div className="cp-agency-top">
                  <div>
                    <h3>{a.agencyName}</h3>
                    <span className="cp-agency-type">{a.agencyType}</span>
                  </div>
                  <span className={`cp-status-badge cp-badge-${a.status}`}>
                    {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                  </span>
                </div>

                <div className="cp-agency-info">
                  <p>👤 {a.contactPerson}</p>
                  <p>📧 {a.email}</p>
                  <p>📍 {a.district}</p>
                  {a.resourcesAvailable?.length > 0 && (
                    <div className="cp-agency-resources">
                      {a.resourcesAvailable.map((r) => (
                        <span key={r} className="cp-resource-chip">{r}</span>
                      ))}
                    </div>
                  )}
                </div>

                {a.status === "pending" && (
                  <div className="cp-agency-actions">
                    <button className="cp-btn-verify" onClick={() => handleAgencyStatus(a._id, "verified")}>
                      ✓ Verify
                    </button>
                    <button className="cp-btn-reject" onClick={() => handleAgencyStatus(a._id, "rejected")}>
                      ✗ Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== POSTS TAB ===== */}
      {(!isAdmin || activeTab === "posts") && (
        <>
          {/* Filter bar */}
          <div className="cp-filter-bar">
            <button className={`cp-filter-btn ${filterType === "all" ? "active" : ""}`} onClick={() => setFilterType("all")}>
              All
            </button>
            {POST_TYPES.map((t) => (
              <button
                key={t}
                className={`cp-filter-btn ${filterType === t ? "active" : ""}`}
                onClick={() => setFilterType(t)}
                style={filterType === t ? { background: POST_TYPE_COLORS[t], borderColor: POST_TYPE_COLORS[t] } : {}}
              >
                {POST_TYPE_ICONS[t]} {t}
              </button>
            ))}
          </div>

          {loadingPosts ? (
            <div className="cp-loading">Loading posts...</div>
          ) : filtered.length === 0 ? (
            <div className="cp-empty">No posts yet. Be the first to share an update!</div>
          ) : (
            <div className="cp-posts-list">
              {filtered.map((post) => (
                <div key={post._id} className="cp-post-card">
                  <div className="cp-post-top">
                    <div className="cp-post-type-pill" style={{ background: POST_TYPE_COLORS[post.postType] }}>
                      {POST_TYPE_ICONS[post.postType]} {post.postType}
                    </div>
                    <div className="cp-post-meta">
                      <span className="cp-post-agency">{post.postedBy?.agencyName}</span>
                      <span className="cp-post-dot">·</span>
                      <span className="cp-post-district">{post.postedBy?.district}</span>
                      <span className="cp-post-dot">·</span>
                      <span className="cp-post-time">{new Date(post.createdAt).toLocaleDateString()}</span>
                      {isAdmin && (
                        <button className="cp-btn-del-post" onClick={() => handleDeletePost(post._id)}>✕</button>
                      )}
                    </div>
                  </div>

                  <h3 className="cp-post-title">{post.title}</h3>
                  <p className="cp-post-content">{post.content}</p>

                  {post.resourceTags?.length > 0 && (
                    <div className="cp-post-tags">
                      {post.resourceTags.map((t) => (
                        <span key={t} className="cp-tag-chip">{t}</span>
                      ))}
                    </div>
                  )}

                  {post.targetDistricts?.length > 0 && (
                    <p className="cp-post-districts">
                      📍 Target areas: {post.targetDistricts.join(", ")}
                    </p>
                  )}

                  {/* Responses */}
                  {post.responses?.length > 0 && (
                    <div className="cp-responses">
                      <p className="cp-responses-label">
                        💬 {post.responses.length} response{post.responses.length > 1 ? "s" : ""}
                      </p>
                      {expandedPost === post._id &&
                        post.responses.map((r, i) => (
                          <div key={i} className="cp-response-item">
                            <strong>{r.respondedByAgency}</strong>
                            <span className="cp-resp-type"> ({r.respondedByType})</span>
                            <p>{r.message}</p>
                          </div>
                        ))}
                      <button
                        className="cp-toggle-responses"
                        onClick={() => setExpandedPost(expandedPost === post._id ? null : post._id)}
                      >
                        {expandedPost === post._id ? "Hide responses ▲" : "View responses ▼"}
                      </button>
                    </div>
                  )}

                  {/* Reply Box */}
                  {canPost && (
                    <div className="cp-reply-box">
                      <input
                        placeholder="Write a response..."
                        value={expandedPost === post._id ? replyText : ""}
                        onFocus={() => setExpandedPost(post._id)}
                        onChange={(e) => setReplyText(e.target.value)}
                      />
                      <button
                        className="cp-btn-reply"
                        onClick={() => handleReply(post._id)}
                      >
                        Reply
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* New Post Modal */}
      {showNewPost && (
        <div className="cp-modal-overlay" onClick={() => setShowNewPost(false)}>
          <div className="cp-modal" onClick={(e) => e.stopPropagation()}>
            <h2>📝 Create New Post</h2>

            <div className="cp-modal-field">
              <label>POST TYPE *</label>
              <div className="cp-type-picker">
                {POST_TYPES.map((t) => (
                  <div
                    key={t}
                    className={`cp-type-option ${postForm.postType === t ? "selected" : ""}`}
                    style={postForm.postType === t ? { background: POST_TYPE_COLORS[t], borderColor: POST_TYPE_COLORS[t] } : {}}
                    onClick={() => setPostForm({ ...postForm, postType: t })}
                  >
                    {POST_TYPE_ICONS[t]} {t}
                  </div>
                ))}
              </div>
            </div>

            <div className="cp-modal-field">
              <label>TITLE *</label>
              <input
                value={postForm.title}
                onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                placeholder="Brief, descriptive title"
              />
            </div>

            <div className="cp-modal-field">
              <label>CONTENT *</label>
              <textarea
                rows={4}
                value={postForm.content}
                onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                placeholder="Describe your resource offer, request, or update in detail..."
              />
            </div>

            <div className="cp-modal-field">
              <label>RESOURCE TAGS</label>
              <div className="cp-tag-picker">
                {RESOURCE_TAGS.map((t) => (
                  <div
                    key={t}
                    className={`cp-tag-pick-chip ${postForm.resourceTags.includes(t) ? "selected" : ""}`}
                    onClick={() => toggleTag(t)}
                  >
                    {t}
                  </div>
                ))}
              </div>
            </div>

            <div className="cp-modal-field">
              <label>TARGET DISTRICTS (comma-separated)</label>
              <input
                value={postForm.targetDistricts}
                onChange={(e) => setPostForm({ ...postForm, targetDistricts: e.target.value })}
                placeholder="e.g. Feni, Noakhali, Cox's Bazar"
              />
            </div>

            <div className="cp-modal-actions">
              <button className="cp-btn-modal-cancel" onClick={() => setShowNewPost(false)}>Cancel</button>
              <button className="cp-btn-modal-save" onClick={handleCreatePost}>Publish Post</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaborationPortal;
