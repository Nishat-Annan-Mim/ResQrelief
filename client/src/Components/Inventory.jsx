import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Inventory.css";

const CATEGORY_OPTIONS = [
  "Food",
  "Baby Food",
  "Medical",
  "Emergency Supplies",
  "Water",
  "Clothing",
  "Shelter",
  "Hygiene",
  "Other",
];

const WAREHOUSE_OPTIONS = [
  "Warehouse A",
  "Warehouse B",
  "Warehouse C",
  "Warehouse D",
];

const BASE_URL = "http://localhost:3001/api";

const getStatus = (qty, expiry) => {
  const today = new Date();
  const exp = new Date(expiry);
  if (qty < 100) return "Low";
  if (expiry && exp < today) return "Expired";
  if (expiry) {
    const diffDays = (exp - today) / (1000 * 60 * 60 * 24);
    if (diffDays < 7) return "Expiring";
  }
  return "OK";
};

const STATUS_STYLES = {
  OK:       { color: "#27ae60", background: "#eafaf1" },
  Low:      { color: "#e67e22", background: "#fef5e7" },
  Expiring: { color: "#2980b9", background: "#eaf4fb" },
  Expired:  { color: "#c0392b", background: "#fdf2f2" },
};

// ── ComboBox: dropdown + manual type ─────────────────────────────────────────
const ComboBox = ({ value, onChange, options, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [inputVal, setInputVal] = useState(value || "");

  useEffect(() => { setInputVal(value || ""); }, [value]);

  const handleInput = (e) => {
    setInputVal(e.target.value);
    onChange(e.target.value);
    setOpen(true);
  };

  const handleSelect = (opt) => {
    setInputVal(opt);
    onChange(opt);
    setOpen(false);
  };

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(inputVal.toLowerCase())
  );

  return (
    <div style={{ position: "relative" }}>
      <input
        value={inputVal}
        onChange={handleInput}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #ddd", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box", outline: "none" }}
      />
      {open && filtered.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1.5px solid #ddd", borderRadius: "8px", zIndex: 100, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", maxHeight: "180px", overflowY: "auto" }}>
          {filtered.map((opt) => (
            <div
              key={opt}
              onMouseDown={() => handleSelect(opt)}
              style={{ padding: "10px 14px", cursor: "pointer", fontSize: "14px", color: "#333", borderBottom: "1px solid #f0f0f0" }}
              onMouseEnter={(e) => e.target.style.background = "#f7f4ee"}
              onMouseLeave={(e) => e.target.style.background = ""}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Add Item Modal ─────────────────────────────────────────────────────────────
const AddItemModal = ({ onClose, onAdded }) => {
  const [form, setForm] = useState({
    itemName: "", category: "", warehouseLocation: "",
    quantity: "", expiryDate: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleAdd = async () => {
    if (!form.itemName.trim() || !form.quantity) {
      setError("Item Name and Quantity are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const status = getStatus(Number(form.quantity), form.expiryDate);
      await axios.post(`${BASE_URL}/inventory`, { ...form, quantity: Number(form.quantity), status });
      onAdded();
      onClose();
    } catch {
      setError("Failed to add item. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
      onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: "16px", padding: "36px 32px", maxWidth: "480px", width: "90%", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}
        onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: "0 0 6px 0", fontSize: "20px", fontWeight: 700 }}>➕ Add Inventory Item</h2>
        <p style={{ margin: "0 0 24px 0", color: "#888", fontSize: "14px" }}>Fill in the details below to add a new item to stock.</p>

        {error && (
          <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: "8px", padding: "10px 14px", color: "#92400e", fontSize: "13px", marginBottom: "16px" }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={labelStyle}>Item Name *</label>
            <input
              value={form.itemName}
              onChange={(e) => set("itemName", e.target.value)}
              placeholder="e.g. Rice Bags"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Category</label>
            <ComboBox
              value={form.category}
              onChange={(v) => set("category", v)}
              options={CATEGORY_OPTIONS}
              placeholder="Select or type category"
            />
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#aaa" }}>Choose from list or type a custom category.</p>
          </div>

          <div>
            <label style={labelStyle}>Warehouse Location</label>
            <ComboBox
              value={form.warehouseLocation}
              onChange={(v) => set("warehouseLocation", v)}
              options={WAREHOUSE_OPTIONS}
              placeholder="Select or type warehouse"
            />
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#aaa" }}>Choose from existing or type a new location.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>Quantity *</label>
              <input
                type="number"
                min="0"
                value={form.quantity}
                onChange={(e) => set("quantity", e.target.value)}
                placeholder="0"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Expiry Date</label>
              <input
                type="date"
                value={form.expiryDate}
                onChange={(e) => set("expiryDate", e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Preview status */}
          {form.quantity && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", borderRadius: "8px", background: "#f7f4ee", border: "1px solid #e8e4dc" }}>
              <span style={{ fontSize: "13px", color: "#888" }}>Auto-computed status:</span>
              <span style={{ fontSize: "13px", fontWeight: 700, ...STATUS_STYLES[getStatus(Number(form.quantity), form.expiryDate)] || {}, padding: "2px 10px", borderRadius: "999px" }}>
                {getStatus(Number(form.quantity), form.expiryDate)}
              </span>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "28px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1.5px solid #ddd", background: "#f7f7f7", color: "#555", fontWeight: 600, fontSize: "15px", cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={handleAdd} disabled={saving} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: "#2b7cff", color: "#fff", fontWeight: 700, fontSize: "15px", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Adding..." : "Add Item"}
          </button>
        </div>
      </div>
    </div>
  );
};

const labelStyle = { fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "#888", display: "block", marginBottom: "6px", letterSpacing: "0.5px" };
const inputStyle = { width: "100%", padding: "10px 14px", border: "1.5px solid #ddd", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box", outline: "none" };

// ── Edit Item Modal ────────────────────────────────────────────────────────────
const EditItemModal = ({ item, onClose, onUpdated }) => {
  const [form, setForm] = useState({
    itemName: item.itemName || "",
    category: item.category || "",
    warehouseLocation: item.warehouseLocation || "",
    quantity: item.quantity ?? "",
    expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split("T")[0] : "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleUpdate = async () => {
    if (!form.itemName.trim() || form.quantity === "") {
      setError("Item Name and Quantity are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const status = getStatus(Number(form.quantity), form.expiryDate);
      await axios.put(`${BASE_URL}/inventory/${item._id}`, { ...form, quantity: Number(form.quantity), status });
      onUpdated();
      onClose();
    } catch {
      setError("Failed to update item. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
      onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: "16px", padding: "36px 32px", maxWidth: "480px", width: "90%", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}
        onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: "0 0 6px 0", fontSize: "20px", fontWeight: 700 }}>✏️ Edit Inventory Item</h2>
        <p style={{ margin: "0 0 24px 0", color: "#888", fontSize: "14px" }}>Update the details for <strong>{item.itemName}</strong>.</p>

        {error && (
          <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: "8px", padding: "10px 14px", color: "#92400e", fontSize: "13px", marginBottom: "16px" }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={labelStyle}>Item Name *</label>
            <input value={form.itemName} onChange={(e) => set("itemName", e.target.value)} placeholder="e.g. Rice Bags" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Category</label>
            <ComboBox value={form.category} onChange={(v) => set("category", v)} options={CATEGORY_OPTIONS} placeholder="Select or type category" />
          </div>

          <div>
            <label style={labelStyle}>Warehouse Location</label>
            <ComboBox value={form.warehouseLocation} onChange={(v) => set("warehouseLocation", v)} options={WAREHOUSE_OPTIONS} placeholder="Select or type warehouse" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>Quantity *</label>
              <input type="number" min="0" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} placeholder="0" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Expiry Date</label>
              <input type="date" value={form.expiryDate} onChange={(e) => set("expiryDate", e.target.value)} style={inputStyle} />
            </div>
          </div>

          {form.quantity !== "" && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", borderRadius: "8px", background: "#f7f4ee", border: "1px solid #e8e4dc" }}>
              <span style={{ fontSize: "13px", color: "#888" }}>Auto-computed status:</span>
              <span style={{ fontSize: "13px", fontWeight: 700, ...(STATUS_STYLES[getStatus(Number(form.quantity), form.expiryDate)] || {}), padding: "2px 10px", borderRadius: "999px" }}>
                {getStatus(Number(form.quantity), form.expiryDate)}
              </span>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "28px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1.5px solid #ddd", background: "#f7f7f7", color: "#555", fontWeight: 600, fontSize: "15px", cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={handleUpdate} disabled={saving} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: "#2b7cff", color: "#fff", fontWeight: 700, fontSize: "15px", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Category Dropdown Filter ───────────────────────────────────────────────────
const CategoryDropdown = ({ value, onChange, categories }) => {
  const isCustom = value !== "All" && !categories.includes(value);
  const [customText, setCustomText] = useState(isCustom ? value : "");

  const handleSelect = (e) => {
    const v = e.target.value;
    if (v === "__custom__") {
      setCustomText("");
      onChange("");
    } else {
      setCustomText("");
      onChange(v);
    }
  };

  const selectValue = isCustom ? "__custom__" : value;

  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      <select
        value={selectValue}
        onChange={handleSelect}
        style={{
          padding: "9px 14px",
          border: "1.5px solid #ddd",
          borderRadius: "8px",
          fontSize: "14px",
          background: "#fff",
          color: "#333",
          cursor: "pointer",
          outline: "none",
          minWidth: "170px",
          fontWeight: 600,
        }}
      >
        <option value="All">All Categories</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
        <option value="__custom__">Other (type…)</option>
      </select>

      {(selectValue === "__custom__" || isCustom) && (
        <input
          value={customText}
          onChange={(e) => {
            setCustomText(e.target.value);
            onChange(e.target.value);
          }}
          placeholder="Type category…"
          style={{
            padding: "9px 14px",
            border: "1.5px solid #2b7cff",
            borderRadius: "8px",
            fontSize: "14px",
            outline: "none",
            width: "150px",
          }}
        />
      )}
    </div>
  );
};

// ── Main Inventory Component ───────────────────────────────────────────────────
const Inventory = () => {
  const [items, setItems] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  useEffect(() => { fetchInventory(); }, []);

  const fetchInventory = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/inventory`);
      setItems(res.data);
    } catch { console.error("Failed to fetch inventory"); }
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    await axios.delete(`${BASE_URL}/inventory/${id}`);
    fetchInventory();
  };

  // Derive unique categories from items + preset options
  const allCategories = ["All", ...Array.from(new Set([...CATEGORY_OPTIONS, ...items.map((i) => i.category).filter(Boolean)]))];

  const filtered = items.filter((item) => {
    const matchSearch =
      !search ||
      item.itemName?.toLowerCase().includes(search.toLowerCase()) ||
      item.category?.toLowerCase().includes(search.toLowerCase()) ||
      item.warehouseLocation?.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "All" || !categoryFilter ||
      item.category?.toLowerCase().includes(categoryFilter.toLowerCase());
    return matchSearch && matchCat;
  });

  // Summary
  const totalItems = items.length;
  const lowStock = items.filter((i) => i.quantity < 100).length;
  const expiring = items.filter((i) => i.status === "Expiring").length;
  const warehouses = [...new Set(items.map((i) => i.warehouseLocation).filter(Boolean))].length;

  return (
    <div className="inv-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 className="inv-title" style={{ margin: 0 }}>Inventory Management</h1>
        <button
          onClick={() => setShowAddModal(true)}
          style={{ background: "#2b7cff", color: "#fff", border: "none", borderRadius: "8px", padding: "12px 22px", fontWeight: 700, fontSize: "15px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
        >
          ➕ Add Item
        </button>
      </div>

      {/* Summary */}
      <div className="inv-summary">
        <div><span style={{ fontSize: "24px", fontWeight: 800, display: "block", color: "#1a1a2e" }}>{totalItems}</span>Total Items</div>
        <div style={{ color: lowStock > 0 ? "#e67e22" : undefined }}><span style={{ fontSize: "24px", fontWeight: 800, display: "block", color: lowStock > 0 ? "#e67e22" : "#1a1a2e" }}>{lowStock}</span>Low Stock</div>
        <div style={{ color: expiring > 0 ? "#2980b9" : undefined }}><span style={{ fontSize: "24px", fontWeight: 800, display: "block", color: expiring > 0 ? "#2980b9" : "#1a1a2e" }}>{expiring}</span>Expiring Soon</div>
        <div><span style={{ fontSize: "24px", fontWeight: 800, display: "block", color: "#1a1a2e" }}>{warehouses}</span>Warehouses</div>
      </div>

      <div className="inv-card">
        {/* Search & Filter Bar */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: "200px", position: "relative" }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#aaa", fontSize: "16px" }}>🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by item name, category, warehouse..."
              style={{ width: "100%", padding: "10px 14px 10px 36px", border: "1.5px solid #ddd", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box", outline: "none" }}
            />
          </div>
          <CategoryDropdown
            value={categoryFilter}
            onChange={setCategoryFilter}
            categories={CATEGORY_OPTIONS}
          />
        </div>

        {/* Results count */}
        <p style={{ fontSize: "13px", color: "#aaa", marginBottom: "12px" }}>
          Showing {filtered.length} of {items.length} items
          {search && ` for "${search}"`}
          {categoryFilter !== "All" && ` in ${categoryFilter}`}
        </p>

        {/* Table */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#aaa" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>📭</div>
            <p style={{ margin: 0, fontSize: "15px" }}>No items found.</p>
            {(search || categoryFilter !== "All") && (
              <p style={{ margin: "6px 0 0", fontSize: "13px" }}>Try clearing the search or filter.</p>
            )}
          </div>
        ) : (
          <table className="inv-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Warehouse</th>
                <th>Qty</th>
                <th>Expiry</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const st = STATUS_STYLES[item.status] || {};
                return (
                  <tr key={item._id}>
                    <td style={{ fontWeight: 600 }}>{item.itemName}</td>
                    <td>{item.category || "—"}</td>
                    <td>{item.warehouseLocation || "—"}</td>
                    <td style={{ fontWeight: 600, color: item.quantity < 100 ? "#e67e22" : undefined }}>{item.quantity}</td>
                    <td>{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "N/A"}</td>
                    <td>
                      <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 700, ...st }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => setEditItem(item)}
                        style={{ background: "#2b7cff", color: "#fff", border: "none", padding: "5px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteItem(item._id)}
                        style={{ background: "#c0392b", color: "#fff", border: "none", padding: "5px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <AddItemModal
          onClose={() => setShowAddModal(false)}
          onAdded={fetchInventory}
        />
      )}

      {/* Edit Item Modal */}
      {editItem && (
        <EditItemModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onUpdated={fetchInventory}
        />
      )}
    </div>
  );
};

export default Inventory;
