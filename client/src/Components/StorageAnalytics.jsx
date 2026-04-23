import { useEffect, useState } from "react";

export default function StorageAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetch("https://resqreliefcheck.onrender.com/admin/storage-analytics")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const s = {
    fontFamily: "Segoe UI, sans-serif",
    padding: "2rem",
    maxWidth: "1000px",
    margin: "0 auto",
  };

  if (loading)
    return (
      <div style={s}>
        <p>Loading analytics...</p>
      </div>
    );
  if (!data)
    return (
      <div style={s}>
        <p>Failed to load analytics.</p>
      </div>
    );

  const tabs = ["overview", "expiry", "low stock", "warehouses"];
  const exportReport = (data) => {
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Storage Analytics Report</title>
      <style>
        body { font-family: Segoe UI, sans-serif; max-width: 900px; margin: 0 auto; padding: 2rem; background: #f5f5f5; color: #1a1a1a; }
        h1 { color: #1a1a1a; border-bottom: 3px solid #1a1a1a; padding-bottom: 0.5rem; }
        h2 { color: #1565c0; margin-top: 2rem; border-left: 4px solid #1565c0; padding-left: 0.8rem; }
        .meta { color: #888; font-size: 0.9rem; margin-bottom: 2rem; }
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
        .kpi { background: white; border-radius: 12px; padding: 1.2rem; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .kpi-label { font-size: 0.8rem; font-weight: 600; color: #888; margin-bottom: 0.4rem; }
        .kpi-value { font-size: 1.8rem; font-weight: 700; }
        .kpi.blue .kpi-value { color: #1565c0; }
        .kpi.green .kpi-value { color: #2e7d32; }
        .kpi.red .kpi-value { color: #c62f3b; }
        .kpi.orange .kpi-value { color: #f57f17; }
        table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); margin-bottom: 1.5rem; }
        th { background: #f0f0f0; padding: 0.8rem 1rem; text-align: left; font-weight: 600; color: #444; }
        td { padding: 0.7rem 1rem; border-bottom: 1px solid #f5f5f5; color: #333; }
        tr:last-child td { border-bottom: none; }
        .badge-red { background: #fce4e4; color: #c62f3b; padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.78rem; font-weight: 600; }
        .badge-orange { background: #fff8e1; color: #f57f17; padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.78rem; font-weight: 600; }
        .badge-green { background: #e8f5e9; color: #2e7d32; padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.78rem; font-weight: 600; }
        .empty { color: #aaa; font-style: italic; padding: 1rem; background: white; border-radius: 12px; text-align: center; }
        .footer { margin-top: 3rem; text-align: center; color: #aaa; font-size: 0.8rem; border-top: 1px solid #ddd; padding-top: 1rem; }
        @media print { body { background: white; } }
      </style>
    </head>
    <body>
      <h1>📦 RESQRELIEF — Storage Analytics Report</h1>
      <p class="meta">Generated: ${new Date().toLocaleString()} &nbsp;|&nbsp; Total Items: ${data.totalItems}</p>

      <div class="kpi-grid">
        <div class="kpi blue"><div class="kpi-label">Total Items</div><div class="kpi-value">${data.totalItems}</div></div>
        <div class="kpi green"><div class="kpi-label">Total Quantity</div><div class="kpi-value">${data.totalQuantity}</div></div>
        <div class="kpi red"><div class="kpi-label">Expired Items</div><div class="kpi-value">${data.expiredItems.length}</div></div>
        <div class="kpi orange"><div class="kpi-label">Low Stock</div><div class="kpi-value">${data.lowStockItems.length}</div></div>
      </div>

      <h2>📊 Category Breakdown</h2>
      <table>
        <thead><tr><th>Category</th><th>Item Types</th><th>Total Quantity</th></tr></thead>
        <tbody>
          ${Object.entries(data.categoryBreakdown)
            .map(
              ([cat, val]) => `
            <tr><td>${cat}</td><td>${val.count}</td><td>${val.totalQuantity}</td></tr>
          `,
            )
            .join("")}
        </tbody>
      </table>

      <h2>🚨 Expired Items (${data.expiredItems.length})</h2>
      ${
        data.expiredItems.length === 0
          ? `<div class="empty">No expired items.</div>`
          : `<table>
            <thead><tr><th>Item</th><th>Category</th><th>Quantity</th><th>Expired On</th></tr></thead>
            <tbody>
              ${data.expiredItems
                .map(
                  (i) => `
                <tr>
                  <td>${i.itemName}</td>
                  <td>${i.category}</td>
                  <td>${i.quantity}</td>
                  <td><span class="badge-red">${new Date(i.expiryDate).toLocaleDateString()}</span></td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>`
      }

      <h2>⚠️ Expiring in 7 Days (${data.expiringIn7Days.length})</h2>
      ${
        data.expiringIn7Days.length === 0
          ? `<div class="empty">None expiring soon.</div>`
          : `<table>
            <thead><tr><th>Item</th><th>Category</th><th>Quantity</th><th>Expires On</th></tr></thead>
            <tbody>
              ${data.expiringIn7Days
                .map(
                  (i) => `
                <tr>
                  <td>${i.itemName}</td>
                  <td>${i.category}</td>
                  <td>${i.quantity}</td>
                  <td><span class="badge-orange">${new Date(i.expiryDate).toLocaleDateString()}</span></td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>`
      }

      <h2>📅 Expiring in 30 Days (${data.expiringIn30Days.length})</h2>
      ${
        data.expiringIn30Days.length === 0
          ? `<div class="empty">None.</div>`
          : `<table>
            <thead><tr><th>Item</th><th>Category</th><th>Quantity</th><th>Expires On</th></tr></thead>
            <tbody>
              ${data.expiringIn30Days
                .map(
                  (i) => `
                <tr>
                  <td>${i.itemName}</td>
                  <td>${i.category}</td>
                  <td>${i.quantity}</td>
                  <td><span class="badge-green">${new Date(i.expiryDate).toLocaleDateString()}</span></td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>`
      }

      <h2>⚡ Low Stock Items (${data.lowStockItems.length})</h2>
      ${
        data.lowStockItems.length === 0
          ? `<div class="empty">All items are sufficiently stocked.</div>`
          : `<table>
            <thead><tr><th>Item</th><th>Category</th><th>Quantity</th><th>Location</th><th>Status</th></tr></thead>
            <tbody>
              ${data.lowStockItems
                .map(
                  (i) => `
                <tr>
                  <td>${i.itemName}</td>
                  <td>${i.category}</td>
                  <td><span class="badge-red">${i.quantity}</span></td>
                  <td>${i.warehouseLocation || "—"}</td>
                  <td>${i.status || "—"}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>`
      }

      <h2>🏭 Warehouse Breakdown</h2>
      <table>
        <thead><tr><th>Warehouse</th><th>Item Types</th><th>Total Quantity</th></tr></thead>
        <tbody>
          ${Object.entries(data.warehouseBreakdown)
            .map(
              ([wh, val]) => `
            <tr><td>${wh}</td><td>${val.count}</td><td>${val.totalQuantity}</td></tr>
          `,
            )
            .join("")}
        </tbody>
      </table>

      <div class="footer">
        RESQRELIEF Disaster Relief System &nbsp;|&nbsp; Report generated on ${new Date().toLocaleString()}
      </div>
    </body>
    </html>
  `;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `storage-report-${new Date().toISOString().split("T")[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div style={s}>
      <h1
        style={{
          fontSize: "1.8rem",
          fontWeight: "700",
          marginBottom: "0.5rem",
        }}
      >
        📦 Storage Analytics Dashboard
      </h1>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <p style={{ color: "#666", margin: 0 }}>
          Advanced insights into community storage, expiry alerts, and stock
          usage.
        </p>
        <button
          onClick={() => exportReport(data)}
          style={{
            padding: "0.6rem 1.2rem",
            backgroundColor: "#1a1a1a",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "0.88rem",
          }}
        >
          📥 Download Report
        </button>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        {[
          {
            label: "Total Items",
            value: data.totalItems,
            color: "#1565c0",
            bg: "#e3f0ff",
          },
          {
            label: "Total Quantity",
            value: data.totalQuantity,
            color: "#2e7d32",
            bg: "#e8f5e9",
          },
          {
            label: "Expired Items",
            value: data.expiredItems.length,
            color: "#c62f3b",
            bg: "#fce4e4",
          },
          {
            label: "Low Stock",
            value: data.lowStockItems.length,
            color: "#f57f17",
            bg: "#fff8e1",
          },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              backgroundColor: card.bg,
              borderRadius: "14px",
              padding: "1.2rem",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: "0.82rem",
                fontWeight: "600",
                color: card.color,
                marginBottom: "0.4rem",
                marginTop: 0,
              }}
            >
              {card.label}
            </p>
            <p
              style={{
                fontSize: "1.8rem",
                fontWeight: "700",
                color: "#1a1a1a",
                margin: 0,
              }}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1.5rem",
          borderBottom: "2px solid #f0f0f0",
          paddingBottom: "0.5rem",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "0.5rem 1.2rem",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "0.88rem",
              backgroundColor: activeTab === tab ? "#1a1a1a" : "#f0f0f0",
              color: activeTab === tab ? "#fff" : "#333",
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.5rem",
          }}
        >
          {/* Category Breakdown */}
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "14px",
              padding: "1.5rem",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            }}
          >
            <h3 style={{ marginTop: 0, fontSize: "1rem", fontWeight: "700" }}>
              Stock by Category
            </h3>
            {Object.entries(data.categoryBreakdown).map(([cat, val], i) => {
              const max = Math.max(
                ...Object.values(data.categoryBreakdown).map(
                  (v) => v.totalQuantity,
                ),
                1,
              );
              const pct = (val.totalQuantity / max) * 100;
              const colors = [
                "#1565c0",
                "#2e7d32",
                "#b45309",
                "#be123c",
                "#7c3aed",
              ];
              return (
                <div key={cat} style={{ marginBottom: "0.8rem" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.82rem",
                      marginBottom: "0.3rem",
                    }}
                  >
                    <span>{cat}</span>
                    <span style={{ fontWeight: "600" }}>
                      {val.totalQuantity} units
                    </span>
                  </div>
                  <div
                    style={{
                      backgroundColor: "#f0f0f0",
                      borderRadius: "999px",
                      height: "8px",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        backgroundColor: colors[i % colors.length],
                        borderRadius: "999px",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Status Breakdown */}
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "14px",
              padding: "1.5rem",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            }}
          >
            <h3 style={{ marginTop: 0, fontSize: "1rem", fontWeight: "700" }}>
              Stock Status
            </h3>
            {Object.entries(data.statusBreakdown).map(([status, count]) => (
              <div
                key={status}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0.5rem 0",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                <span style={{ fontSize: "0.88rem" }}>{status}</span>
                <span style={{ fontWeight: "700", fontSize: "0.88rem" }}>
                  {count} items
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expiry Tab */}
      {activeTab === "expiry" && (
        <div>
          {/* Expired */}
          <div
            style={{
              backgroundColor: "#fce4e4",
              borderRadius: "14px",
              padding: "1.5rem",
              marginBottom: "1rem",
            }}
          >
            <h3 style={{ marginTop: 0, color: "#c62f3b" }}>
              🚨 Expired Items ({data.expiredItems.length})
            </h3>
            {data.expiredItems.length === 0 ? (
              <p style={{ color: "#888" }}>No expired items.</p>
            ) : (
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.88rem",
                }}
              >
                <thead>
                  <tr>
                    <th style={th2}>Item</th>
                    <th style={th2}>Category</th>
                    <th style={th2}>Qty</th>
                    <th style={th2}>Expired On</th>
                  </tr>
                </thead>
                <tbody>
                  {data.expiredItems.map((item) => (
                    <tr key={item._id}>
                      <td style={td2}>{item.itemName}</td>
                      <td style={td2}>{item.category}</td>
                      <td style={td2}>{item.quantity}</td>
                      <td style={td2}>
                        {new Date(item.expiryDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Expiring in 7 days */}
          <div
            style={{
              backgroundColor: "#fff8e1",
              borderRadius: "14px",
              padding: "1.5rem",
              marginBottom: "1rem",
            }}
          >
            <h3 style={{ marginTop: 0, color: "#f57f17" }}>
              ⚠️ Expiring in 7 Days ({data.expiringIn7Days.length})
            </h3>
            {data.expiringIn7Days.length === 0 ? (
              <p style={{ color: "#888" }}>None expiring soon.</p>
            ) : (
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.88rem",
                }}
              >
                <thead>
                  <tr>
                    <th style={th2}>Item</th>
                    <th style={th2}>Category</th>
                    <th style={th2}>Qty</th>
                    <th style={th2}>Expires On</th>
                  </tr>
                </thead>
                <tbody>
                  {data.expiringIn7Days.map((item) => (
                    <tr key={item._id}>
                      <td style={td2}>{item.itemName}</td>
                      <td style={td2}>{item.category}</td>
                      <td style={td2}>{item.quantity}</td>
                      <td style={td2}>
                        {new Date(item.expiryDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Expiring in 30 days */}
          <div
            style={{
              backgroundColor: "#e8f5e9",
              borderRadius: "14px",
              padding: "1.5rem",
            }}
          >
            <h3 style={{ marginTop: 0, color: "#2e7d32" }}>
              📅 Expiring in 30 Days ({data.expiringIn30Days.length})
            </h3>
            {data.expiringIn30Days.length === 0 ? (
              <p style={{ color: "#888" }}>None.</p>
            ) : (
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.88rem",
                }}
              >
                <thead>
                  <tr>
                    <th style={th2}>Item</th>
                    <th style={th2}>Category</th>
                    <th style={th2}>Qty</th>
                    <th style={th2}>Expires On</th>
                  </tr>
                </thead>
                <tbody>
                  {data.expiringIn30Days.map((item) => (
                    <tr key={item._id}>
                      <td style={td2}>{item.itemName}</td>
                      <td style={td2}>{item.category}</td>
                      <td style={td2}>{item.quantity}</td>
                      <td style={td2}>
                        {new Date(item.expiryDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Low Stock Tab */}
      {activeTab === "low stock" && (
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "14px",
            padding: "1.5rem",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}
        >
          <h3 style={{ marginTop: 0 }}>
            ⚡ Low Stock Items (quantity &lt; 10)
          </h3>
          {data.lowStockItems.length === 0 ? (
            <p style={{ color: "#888" }}>All items are sufficiently stocked.</p>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.88rem",
              }}
            >
              <thead>
                <tr>
                  <th style={th2}>Item</th>
                  <th style={th2}>Category</th>
                  <th style={th2}>Quantity</th>
                  <th style={th2}>Location</th>
                  <th style={th2}>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStockItems.map((item) => (
                  <tr key={item._id}>
                    <td style={td2}>{item.itemName}</td>
                    <td style={td2}>{item.category}</td>
                    <td style={td2}>
                      <span style={{ color: "#c62f3b", fontWeight: "700" }}>
                        {item.quantity}
                      </span>
                    </td>
                    <td style={td2}>{item.warehouseLocation || "—"}</td>
                    <td style={td2}>{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Warehouses Tab */}
      {activeTab === "warehouses" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1rem",
          }}
        >
          {Object.entries(data.warehouseBreakdown).map(([wh, val]) => (
            <div
              key={wh}
              style={{
                backgroundColor: "#fff",
                borderRadius: "14px",
                padding: "1.2rem",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontWeight: "700",
                  color: "#1a1a1a",
                  marginBottom: "0.5rem",
                  marginTop: 0,
                }}
              >
                🏭 {wh}
              </p>
              <p
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "700",
                  color: "#1565c0",
                  margin: "0 0 0.3rem 0",
                }}
              >
                {val.totalQuantity}
              </p>
              <p style={{ fontSize: "0.8rem", color: "#888", margin: 0 }}>
                {val.count} item types
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const th2 = {
  padding: "0.6rem 0.8rem",
  textAlign: "left",
  fontWeight: "600",
  color: "#444",
  backgroundColor: "rgba(0,0,0,0.03)",
};
const td2 = {
  padding: "0.55rem 0.8rem",
  color: "#333",
  borderBottom: "1px solid #f0f0f0",
};
