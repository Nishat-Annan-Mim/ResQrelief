import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  ArrowLeftRight,
  TriangleAlert,
  Inbox,
  Send,
  Truck,
  PackageCheck,
  Megaphone,
} from "lucide-react";
import { BASE_URL as API_ROOT } from "../api";

const API = `${API_ROOT}/api`;

const WAREHOUSE_OPTIONS = [
  "Warehouse A",
  "Warehouse B",
  "Warehouse C",
  "Warehouse D",
];

const TRANSFER_STATUS_STYLES = {
  pending:      { color: "#e67e22", background: "#fef5e7" },
  approved:     { color: "#2980b9", background: "#eaf4fb" },
  "in-transit": { color: "#8e44ad", background: "#f4ecf9" },
  received:     { color: "#27ae60", background: "#eafaf1" },
  rejected:     { color: "#c0392b", background: "#fdf2f2" },
  cancelled:    { color: "#7f8c8d", background: "#f4f4f4" },
};

const labelStyle = {
  fontSize: "12px",
  fontWeight: 700,
  textTransform: "uppercase",
  color: "#888",
  display: "block",
  marginBottom: "6px",
  letterSpacing: "0.5px",
};
const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  border: "1.5px solid #ddd",
  borderRadius: "8px",
  fontSize: "14px",
  boxSizing: "border-box",
  outline: "none",
};

/** The logged-in coordinator, for the audit trail. */
const currentAdmin = () =>
  sessionStorage.getItem("email") || localStorage.getItem("email") || "admin";

/** Item names are hand-typed, so compare them loosely. */
const sameItem = (a, b) =>
  (a || "").trim().toLowerCase() === (b || "").trim().toLowerCase();

const fmt = (d) =>
  d
    ? new Date(d).toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const fmtDay = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: "2-digit", month: "short" }) : "—";

const Pill = ({ status }) => (
  <span
    style={{
      padding: "3px 10px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: 700,
      whiteSpace: "nowrap",
      ...(TRANSFER_STATUS_STYLES[status] || {}),
    }}
  >
    {status}
  </span>
);

const btn = (bg) => ({
  background: bg,
  color: "#fff",
  border: "none",
  padding: "5px 12px",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "13px",
});

/* ── Request Transfer Modal ───────────────────────────────────────────────
 * Sources are derived from the full inventory list rather than from the
 * shortage endpoint, so a transfer can always be started -- including for
 * items that are not currently short.
 * ───────────────────────────────────────────────────────────────────────── */
const RequestTransferModal = ({ toWarehouse, items, presetItemName, onClose, onCreated }) => {
  // Every stocked row sitting in some OTHER warehouse.
  const candidates = items.filter(
    (i) =>
      i.warehouseLocation &&
      i.warehouseLocation !== toWarehouse &&
      (i.quantity ?? 0) > 0
  );

  const itemNames = [...new Set(candidates.map((c) => c.itemName))].sort();

  const [itemName, setItemName] = useState(
    itemNames.find((n) => sameItem(n, presetItemName)) || presetItemName || itemNames[0] || ""
  );
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [neededBy, setNeededBy] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const sources = candidates.filter((c) => sameItem(c.itemName, itemName));
  const chosen = sources.find((s) => s._id === itemId);

  // Default to whichever warehouse holds the most whenever the item changes.
  useEffect(() => {
    const best = [...sources].sort((a, b) => (b.quantity ?? 0) - (a.quantity ?? 0))[0];
    setItemId(best?._id || "");
  }, [itemName]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    if (!itemId || !quantity) {
      setError("Pick a source warehouse and enter a quantity.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await axios.post(`${API}/transfers`, {
        itemId,
        quantity: Number(quantity),
        toWarehouse,
        reason,
        neededBy: neededBy || undefined,
        requestedBy: currentAdmin(),
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to create the request.");
    } finally {
      setSaving(false);
    }
  };

  const nothingAnywhere = candidates.length === 0;
  const noneOfThisItem = !nothingAnywhere && sources.length === 0;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        style={{ background: "#fff", borderRadius: "16px", padding: "36px 32px", maxWidth: "480px", width: "90%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: "0 0 6px 0", fontSize: "20px", fontWeight: 700 }} className="ad-icon-inline">
          <ArrowLeftRight size={19} strokeWidth={2.25} />
          Move Stock In
        </h2>
        <p style={{ margin: "0 0 24px 0", color: "#888", fontSize: "14px" }}>
          Bring stock from another warehouse into <strong>{toWarehouse}</strong>.
        </p>

        {error && (
          <div className="ad-msg ad-msg-warning" style={{ marginBottom: "16px" }}>
            <TriangleAlert size={15} strokeWidth={2} />
            {error}
          </div>
        )}

        {nothingAnywhere && (
          <div className="ad-msg ad-msg-warning" style={{ marginBottom: "16px" }}>
            <TriangleAlert size={15} strokeWidth={2} />
            No other warehouse has any stock recorded. Add inventory elsewhere first.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={labelStyle}>Item *</label>
            <select
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              {presetItemName && !itemNames.some((n) => sameItem(n, presetItemName)) && (
                <option value={presetItemName}>{presetItemName} — not stocked elsewhere</option>
              )}
              {itemNames.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#aaa" }}>
              Only items held by another warehouse can be transferred.
            </p>
          </div>

          <div>
            <label style={labelStyle}>Source Warehouse *</label>
            <select
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              disabled={sources.length === 0}
              style={{ ...inputStyle, cursor: sources.length ? "pointer" : "not-allowed" }}
            >
              <option value="">Select a warehouse…</option>
              {sources
                .slice()
                .sort((a, b) => (b.quantity ?? 0) - (a.quantity ?? 0))
                .map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.warehouseLocation} — {s.quantity} in stock
                  </option>
                ))}
            </select>
            {noneOfThisItem && (
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#c0392b" }}>
                No other warehouse stocks <strong>{itemName}</strong>. You cannot transfer
                stock that does not exist — this one needs a donation or purchase. Pick a
                different item above, or check the spelling matches the other warehouse's entry.
              </p>
            )}
          </div>

          <div>
            <label style={labelStyle}>Quantity *</label>
            <input
              type="number"
              min="1"
              max={chosen?.quantity}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              style={inputStyle}
            />
            {chosen && (
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#aaa" }}>
                {chosen.warehouseLocation} has {chosen.quantity} available.
              </p>
            )}
          </div>

          <div>
            <label style={labelStyle}>Needed By</label>
            <input type="date" value={neededBy} onChange={(e) => setNeededBy(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Why this warehouse needs the stock"
              style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "28px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1.5px solid #ddd", background: "#f7f7f7", color: "#555", fontWeight: 600, fontSize: "15px", cursor: "pointer" }}>
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving || !itemId}
            style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: "#2b7cff", color: "#fff", fontWeight: 700, fontSize: "15px", cursor: saving || !itemId ? "not-allowed" : "pointer", opacity: saving || !itemId ? 0.6 : 1 }}
          >
            {saving ? "Saving…" : "Create Transfer"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Supply Appeal Modal ──────────────────────────────────────────────────
 * For shortages that no transfer can fix, because no other warehouse holds
 * the item. Raises an Alert through the existing alert system.
 *
 * Deliberately defaults to volunteers + in-app only. POST /api/alerts emails
 * every recipient it is given, and beneficiaries should not receive a mass
 * email about a warehouse running low on stock. The admin can widen it, but
 * has to choose to.
 * ───────────────────────────────────────────────────────────────────────── */
const SupplyAppealModal = ({ shortage, warehouse, onClose, onSent }) => {
  const [alertTitle, setAlertTitle] = useState(
    `Supply shortage: ${shortage.itemName}`
  );
  const [message, setMessage] = useState(
    `${warehouse} is low on ${shortage.itemName} (${shortage.quantity} left, ` +
      `below the ${shortage.threshold}-unit threshold). No other warehouse currently ` +
      `holds this item, so it cannot be covered by an internal transfer. ` +
      `Donations or procurement are needed.`
  );
  const [emailToo, setEmailToo] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const send = async () => {
    setSending(true);
    setError("");
    try {
      await axios.post(
        `${API}/alerts`,
        {
          alertTitle,
          message,
          audience: ["volunteers"],
          channels: emailToo ? ["app", "email"] : ["app"],
        },
        { headers: { role: "admin" } }
      );
      onSent();
      onClose();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to raise the appeal."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        style={{ background: "#fff", borderRadius: "16px", padding: "36px 32px", maxWidth: "480px", width: "90%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: "0 0 6px 0", fontSize: "20px", fontWeight: 700 }} className="ad-icon-inline">
          <Megaphone size={19} strokeWidth={2.25} />
          Raise Supply Appeal
        </h2>
        <p style={{ margin: "0 0 24px 0", color: "#888", fontSize: "14px" }}>
          No warehouse has <strong>{shortage.itemName}</strong> to spare, so this needs new
          stock rather than a transfer.
        </p>

        {error && (
          <div className="ad-msg ad-msg-warning" style={{ marginBottom: "16px" }}>
            <TriangleAlert size={15} strokeWidth={2} />
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={labelStyle}>Title</label>
            <input value={alertTitle} onChange={(e) => setAlertTitle(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
            />
          </div>

          <div style={{ padding: "12px 14px", borderRadius: "8px", background: "#f7f4ee", border: "1px solid #e8e4dc" }}>
            <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#555" }}>
              Goes to <strong>volunteers</strong> as an in-app notification. Beneficiaries are
              not included — a stock shortage is an operations matter, not something to mass
              mail aid recipients about.
            </p>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#555", cursor: "pointer" }}>
              <input type="checkbox" checked={emailToo} onChange={(e) => setEmailToo(e.target.checked)} />
              Also email volunteers
            </label>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "28px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1.5px solid #ddd", background: "#f7f7f7", color: "#555", fontWeight: 600, fontSize: "15px", cursor: "pointer" }}>
            Cancel
          </button>
          <button
            onClick={send}
            disabled={sending || !alertTitle.trim()}
            style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: "#e67e22", color: "#fff", fontWeight: 700, fontSize: "15px", cursor: sending ? "not-allowed" : "pointer", opacity: sending ? 0.7 : 1 }}
          >
            {sending ? "Sending…" : "Raise Appeal"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main Transfer Panel ─────────────────────────────────────────────────── */
const TransferPanel = ({ items = [], onStockChange }) => {
  const warehouses = [
    ...new Set([
      ...items.map((i) => i.warehouseLocation).filter(Boolean),
      ...WAREHOUSE_OPTIONS,
    ]),
  ];

  const [managed, setManaged] = useState(warehouses[0] || "");
  const [transfers, setTransfers] = useState([]);
  const [shortages, setShortages] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // { presetItemName }
  const [appeal, setAppeal] = useState(null); // shortage row needing new stock
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    if (!managed) return;
    try {
      const [t, s] = await Promise.all([
        axios.get(`${API}/transfers`, { params: { warehouse: managed } }),
        axios.get(`${API}/transfers/shortages`, { params: { warehouse: managed } }),
      ]);
      setTransfers(t.data);
      setShortages(s.data);
      setError("");
    } catch {
      setError("Could not load transfers. Is the server running?");
    }
  }, [managed]);

  useEffect(() => { load(); }, [load]);

  // This warehouse is the SOURCE — stock would leave here.
  const outbound = transfers.filter((t) => t.fromWarehouse === managed);
  // This warehouse is the DESTINATION — stock is coming here.
  const inbound = transfers.filter((t) => t.toWarehouse === managed);

  const act = async (id, action, body = {}) => {
    setBusyId(id);
    setError("");
    try {
      await axios.patch(`${API}/transfers/${id}/${action}`, {
        respondedBy: currentAdmin(),
        ...body,
      });
      await load();
      onStockChange?.();
    } catch (err) {
      setError(err?.response?.data?.error || `Could not ${action} this transfer.`);
    } finally {
      setBusyId(null);
    }
  };

  const dispatch = (t) => {
    const days = window.prompt("Estimated days until arrival?", "2");
    if (days === null) return;
    const eta = new Date();
    eta.setDate(eta.getDate() + Number(days || 0));
    act(t._id, "dispatch", { eta });
  };

  const reject = (t) => {
    const note = window.prompt("Reason for rejecting (optional):", "");
    if (note === null) return;
    act(t._id, "reject", { responseNote: note });
  };

  return (
    <div>
      {/* Warehouse switcher + new transfer */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "20px", flexWrap: "wrap" }}>
        <label style={{ ...labelStyle, marginBottom: 0 }}>Managing</label>
        <select
          value={managed}
          onChange={(e) => setManaged(e.target.value)}
          style={{ padding: "9px 14px", border: "1.5px solid #ddd", borderRadius: "8px", fontSize: "14px", fontWeight: 600, background: "#fff", cursor: "pointer", outline: "none", minWidth: "180px" }}
        >
          {warehouses.map((w) => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>

        <button
          onClick={() => setModal({ presetItemName: "" })}
          style={{ background: "#2b7cff", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 18px", fontWeight: 700, fontSize: "14px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", marginLeft: "auto" }}
        >
          <ArrowLeftRight size={15} strokeWidth={2.5} />
          Move Stock In
        </button>
      </div>

      {error && (
        <div className="ad-msg ad-msg-warning" style={{ marginBottom: "16px" }}>
          <TriangleAlert size={15} strokeWidth={2} />
          {error}
        </div>
      )}

      {notice && (
        <div
          style={{ marginBottom: "16px", padding: "12px 16px", borderRadius: "8px", background: "#eafaf1", border: "1px solid #cdeedd", color: "#1e7a4c", fontSize: "14px", fontWeight: 600, display: "flex", justifyContent: "space-between", gap: "12px" }}
        >
          {notice}
          <button
            onClick={() => setNotice("")}
            style={{ background: "none", border: "none", color: "#1e7a4c", cursor: "pointer", fontWeight: 700 }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── Shortages ─────────────────────────────────────────────── */}
      <div className="inv-card" style={{ marginBottom: "20px" }}>
        <h3 style={{ margin: "0 0 4px", fontSize: "17px", fontWeight: 700 }} className="ad-icon-inline">
          <TriangleAlert size={17} strokeWidth={2.25} />
          Shortages at {managed}
        </h3>
        <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#aaa" }}>
          Items below 100 units. Pull a top-up from a warehouse that has spare stock.
        </p>

        {shortages.length === 0 ? (
          <p style={{ margin: 0, fontSize: "14px", color: "#27ae60", fontWeight: 600 }}>
            No shortages here.
          </p>
        ) : (
          <table className="inv-table ad-stack">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>In Stock</th>
                <th>Available Elsewhere</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {shortages.map((s) => (
                <tr key={s._id}>
                  <td style={{ fontWeight: 600 }} data-label="Item">{s.itemName}</td>
                  <td data-label="Category">{s.category || "—"}</td>
                  <td style={{ fontWeight: 600, color: "#e67e22" }} data-label="In Stock">{s.quantity}</td>
                  <td data-label="Available Elsewhere">
                    {s.availableFrom.length === 0 ? (
                      <span style={{ color: "#c0392b" }}>
                        Not stocked elsewhere — needs a donation
                      </span>
                    ) : (
                      s.availableFrom
                        .map((a) => `${a.warehouseLocation} (${a.quantity})`)
                        .join(", ")
                    )}
                  </td>
                  <td data-label="">
                    {/* A transfer can only redistribute stock that exists somewhere.
                        When it doesn't, the remedy is new stock, not a transfer. */}
                    {s.availableFrom.length === 0 ? (
                      <button onClick={() => setAppeal(s)} style={btn("#e67e22")}>
                        <Megaphone size={13} strokeWidth={2} /> Raise Supply Appeal
                      </button>
                    ) : (
                      <button
                        onClick={() => setModal({ presetItemName: s.itemName })}
                        style={btn("#2b7cff")}
                      >
                        Request Transfer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Outbound: this warehouse is the source ────────────────── */}
      <div className="inv-card" style={{ marginBottom: "20px" }}>
        <h3 style={{ margin: "0 0 4px", fontSize: "17px", fontWeight: 700 }} className="ad-icon-inline">
          <Inbox size={17} strokeWidth={2.25} />
          Stock Leaving {managed}
        </h3>
        <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#aaa" }}>
          Transfers where {managed} is the source. Approving deducts the quantity immediately —
          the goods are then on the truck and belong to neither warehouse.
        </p>

        {outbound.length === 0 ? (
          <p style={{ margin: 0, fontSize: "14px", color: "#aaa" }}>Nothing leaving.</p>
        ) : (
          <table className="inv-table ad-stack">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>To</th>
                <th>Requested</th>
                <th>Needed By</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {outbound.map((t) => (
                <tr key={t._id}>
                  <td style={{ fontWeight: 600 }} data-label="Item">
                    {t.itemName}
                    {t.reason && (
                      <div style={{ fontSize: "12px", color: "#aaa", fontWeight: 400 }}>{t.reason}</div>
                    )}
                  </td>
                  <td style={{ fontWeight: 600 }} data-label="Qty">{t.quantity}</td>
                  <td data-label="To">{t.toWarehouse}</td>
                  <td data-label="Requested">{fmt(t.requestedAt)}</td>
                  <td data-label="Needed By">{fmtDay(t.neededBy)}</td>
                  <td data-label="Status"><Pill status={t.status} /></td>
                  <td style={{ display: "flex", gap: "8px", flexWrap: "wrap" }} data-label="">
                    {t.status === "pending" && (
                      <>
                        <button disabled={busyId === t._id} onClick={() => act(t._id, "approve")} style={btn("#27ae60")}>Approve</button>
                        <button disabled={busyId === t._id} onClick={() => reject(t)} style={btn("#c0392b")}>Reject</button>
                      </>
                    )}
                    {t.status === "approved" && (
                      <button disabled={busyId === t._id} onClick={() => dispatch(t)} style={btn("#8e44ad")}>
                        <Truck size={13} strokeWidth={2} /> Dispatch
                      </button>
                    )}
                    {t.status === "in-transit" && (
                      <span style={{ fontSize: "12px", color: "#888" }}>ETA {fmtDay(t.eta)}</span>
                    )}
                    {t.status === "received" && (
                      <span style={{ fontSize: "12px", color: "#888" }}>Delivered {fmt(t.receivedAt)}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Inbound: this warehouse is the destination ────────────── */}
      <div className="inv-card">
        <h3 style={{ margin: "0 0 4px", fontSize: "17px", fontWeight: 700 }} className="ad-icon-inline">
          <Send size={17} strokeWidth={2.25} />
          Stock Coming To {managed}
        </h3>
        <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#aaa" }}>
          Confirm receipt once the delivery physically arrives — that is when the quantity is
          added to {managed}.
        </p>

        {inbound.length === 0 ? (
          <p style={{ margin: 0, fontSize: "14px", color: "#aaa" }}>No open requests.</p>
        ) : (
          <table className="inv-table ad-stack">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>From</th>
                <th>Requested</th>
                <th>Dispatched</th>
                <th>ETA</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {inbound.map((t) => (
                <tr key={t._id}>
                  <td style={{ fontWeight: 600 }} data-label="Item">{t.itemName}</td>
                  <td style={{ fontWeight: 600 }} data-label="Qty">{t.quantity}</td>
                  <td data-label="From">{t.fromWarehouse}</td>
                  <td data-label="Requested">{fmt(t.requestedAt)}</td>
                  <td data-label="Dispatched">{fmt(t.dispatchedAt)}</td>
                  <td data-label="ETA">{fmtDay(t.eta)}</td>
                  <td data-label="Status">
                    <Pill status={t.status} />
                    {t.status === "rejected" && t.responseNote && (
                      <div style={{ fontSize: "12px", color: "#aaa" }}>{t.responseNote}</div>
                    )}
                  </td>
                  <td style={{ display: "flex", gap: "8px", flexWrap: "wrap" }} data-label="">
                    {(t.status === "approved" || t.status === "in-transit") && (
                      <button disabled={busyId === t._id} onClick={() => act(t._id, "receive")} style={btn("#27ae60")}>
                        <PackageCheck size={13} strokeWidth={2} /> Confirm Receipt
                      </button>
                    )}
                    {t.status === "pending" && (
                      <button disabled={busyId === t._id} onClick={() => act(t._id, "cancel")} style={btn("#7f8c8d")}>Cancel</button>
                    )}
                    {t.status === "received" && (
                      <span style={{ fontSize: "12px", color: "#888" }}>Received {fmt(t.receivedAt)}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {appeal && (
        <SupplyAppealModal
          shortage={appeal}
          warehouse={managed}
          onClose={() => setAppeal(null)}
          onSent={() => setNotice(`Supply appeal raised for ${appeal.itemName}.`)}
        />
      )}

      {modal && (
        <RequestTransferModal
          toWarehouse={managed}
          items={items}
          presetItemName={modal.presetItemName}
          onClose={() => setModal(null)}
          onCreated={() => { load(); onStockChange?.(); }}
        />
      )}
    </div>
  );
};

export default TransferPanel;
