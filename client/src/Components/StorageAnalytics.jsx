import { useEffect, useState } from "react";

export default function StorageAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetch("http://localhost:3001/admin/storage-analytics")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const exportReport = async (data) => {
    const { jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(26, 26, 26);
    doc.rect(0, 0, pageWidth, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("RESQRELIEF — Storage Analytics Report", 14, 13);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    // KPI Summary
    doc.setTextColor(26, 26, 26);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", 14, 38);

    const kpis = [
      ["Total Items", data.totalItems],
      ["Total Quantity", data.totalQuantity],
      ["Expired Items", data.expiredItems.length],
      ["Low Stock Items", data.lowStockItems.length],
    ];

    autoTable(doc, {
      startY: 42,
      head: [["Metric", "Value"]],
      body: kpis,
      theme: "grid",
      headStyles: { fillColor: [26, 26, 26], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 10 },
      columnStyles: { 1: { fontStyle: "bold" } },
    });

    // Category Breakdown
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Stock by Category", 14, doc.lastAutoTable.finalY + 12);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 16,
      head: [["Category", "Item Types", "Total Quantity"]],
      body: Object.entries(data.categoryBreakdown).map(([cat, val]) => [
        cat, val.count, val.totalQuantity,
      ]),
      theme: "striped",
      headStyles: { fillColor: [21, 101, 192], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 10 },
    });

    // Stock Status
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Stock Status", 14, doc.lastAutoTable.finalY + 12);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 16,
      head: [["Status", "Count"]],
      body: Object.entries(data.statusBreakdown).map(([status, count]) => [status, count]),
      theme: "striped",
      headStyles: { fillColor: [46, 125, 50], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 10 },
    });

    // Page 2 - Expiry Report
    doc.addPage();
    doc.setFillColor(26, 26, 26);
    doc.rect(0, 0, pageWidth, 18, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Expiry Report", 14, 13);

    doc.setTextColor(26, 26, 26);
    doc.setFontSize(12);
    doc.text(`Expired Items (${data.expiredItems.length})`, 14, 30);

    if (data.expiredItems.length === 0) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(150, 150, 150);
      doc.text("No expired items.", 14, 38);
      doc.setTextColor(26, 26, 26);
    } else {
      autoTable(doc, {
        startY: 34,
        head: [["Item", "Category", "Quantity", "Expired On"]],
        body: data.expiredItems.map((i) => [
          i.itemName, i.category, i.quantity,
          new Date(i.expiryDate).toLocaleDateString(),
        ]),
        theme: "grid",
        headStyles: { fillColor: [198, 47, 59], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 10 },
      });
    }

    // Expiring in 7 Days
    const y7 = doc.lastAutoTable ? doc.lastAutoTable.finalY + 14 : 50;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 26, 26);
    doc.text(`Expiring in 7 Days (${data.expiringIn7Days.length})`, 14, y7);

    if (data.expiringIn7Days.length === 0) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(150, 150, 150);
      doc.text("None expiring soon.", 14, y7 + 8);
      doc.setTextColor(26, 26, 26);
    } else {
      autoTable(doc, {
        startY: y7 + 4,
        head: [["Item", "Category", "Quantity", "Expires On"]],
        body: data.expiringIn7Days.map((i) => [
          i.itemName, i.category, i.quantity,
          new Date(i.expiryDate).toLocaleDateString(),
        ]),
        theme: "grid",
        headStyles: { fillColor: [245, 127, 23], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 10 },
      });
    }

    // Expiring in 30 Days
    const y30 = doc.lastAutoTable ? doc.lastAutoTable.finalY + 14 : y7 + 20;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 26, 26);
    doc.text(`Expiring in 30 Days (${data.expiringIn30Days.length})`, 14, y30);

    if (data.expiringIn30Days.length === 0) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(150, 150, 150);
      doc.text("None.", 14, y30 + 8);
      doc.setTextColor(26, 26, 26);
    } else {
      autoTable(doc, {
        startY: y30 + 4,
        head: [["Item", "Category", "Quantity", "Expires On"]],
        body: data.expiringIn30Days.map((i) => [
          i.itemName, i.category, i.quantity,
          new Date(i.expiryDate).toLocaleDateString(),
        ]),
        theme: "grid",
        headStyles: { fillColor: [46, 125, 50], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 10 },
      });
    }

    // Page 3 - Low Stock & Warehouse
    doc.addPage();
    doc.setFillColor(26, 26, 26);
    doc.rect(0, 0, pageWidth, 18, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Low Stock & Warehouse Report", 14, 13);

    doc.setTextColor(26, 26, 26);
    doc.setFontSize(12);
    doc.text(`Low Stock Items (${data.lowStockItems.length})`, 14, 30);

    if (data.lowStockItems.length === 0) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(150, 150, 150);
      doc.text("All items are sufficiently stocked.", 14, 38);
      doc.setTextColor(26, 26, 26);
    } else {
      autoTable(doc, {
        startY: 34,
        head: [["Item", "Category", "Quantity", "Location", "Status"]],
        body: data.lowStockItems.map((i) => [
          i.itemName, i.category, i.quantity,
          i.warehouseLocation || "—", i.status || "—",
        ]),
        theme: "grid",
        headStyles: { fillColor: [245, 127, 23], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 10 },
      });
    }

    // Warehouse Breakdown
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 26, 26);
    doc.text("Warehouse Breakdown", 14, doc.lastAutoTable.finalY + 14);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 18,
      head: [["Warehouse", "Item Types", "Total Quantity"]],
      body: Object.entries(data.warehouseBreakdown).map(([wh, val]) => [
        wh, val.count, val.totalQuantity,
      ]),
      theme: "striped",
      headStyles: { fillColor: [26, 26, 26], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 10 },
    });

    // Footer on all pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `RESQRELIEF Storage Analytics Report  |  Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: "center" }
      );
    }

    doc.save(`storage-report-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const s = { fontFamily: "Segoe UI, sans-serif", padding: "2rem", maxWidth: "1000px", margin: "0 auto" };

  if (loading) return <div style={s}><p>Loading analytics...</p></div>;
  if (!data) return <div style={s}><p>Failed to load analytics.</p></div>;

  const tabs = ["overview", "expiry", "low stock", "warehouses"];
  const itemColors = ["#1565c0", "#2e7d32", "#b45309", "#be123c", "#7c3aed"];

  return (
    <div style={s}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: "700", marginBottom: "0.3rem", marginTop: 0 }}>📦 Storage Analytics Dashboard</h1>
          <p style={{ color: "#666", margin: 0 }}>Advanced insights into community storage, expiry alerts, and stock usage.</p>
        </div>
        <button
          onClick={() => exportReport(data)}
          style={{ padding: "0.6rem 1.2rem", backgroundColor: "#1a1a1a", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "0.88rem", whiteSpace: "nowrap" }}
        >
          📄 Download PDF Report
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Total Items", value: data.totalItems, color: "#1565c0", bg: "#e3f0ff" },
          { label: "Total Quantity", value: data.totalQuantity, color: "#2e7d32", bg: "#e8f5e9" },
          { label: "Expired Items", value: data.expiredItems.length, color: "#c62f3b", bg: "#fce4e4" },
          { label: "Low Stock", value: data.lowStockItems.length, color: "#f57f17", bg: "#fff8e1" },
        ].map((card) => (
          <div key={card.label} style={{ backgroundColor: card.bg, borderRadius: "14px", padding: "1.2rem", textAlign: "center" }}>
            <p style={{ fontSize: "0.82rem", fontWeight: "600", color: card.color, marginBottom: "0.4rem", marginTop: 0 }}>{card.label}</p>
            <p style={{ fontSize: "1.8rem", fontWeight: "700", color: "#1a1a1a", margin: 0 }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "2px solid #f0f0f0", paddingBottom: "0.5rem" }}>
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <div style={{ backgroundColor: "#fff", borderRadius: "14px", padding: "1.5rem", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <h3 style={{ marginTop: 0, fontSize: "1rem", fontWeight: "700" }}>Stock by Category</h3>
            {Object.entries(data.categoryBreakdown).map(([cat, val], i) => {
              const max = Math.max(...Object.values(data.categoryBreakdown).map(v => v.totalQuantity), 1);
              const pct = (val.totalQuantity / max) * 100;
              return (
                <div key={cat} style={{ marginBottom: "0.8rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "0.3rem" }}>
                    <span>{cat}</span>
                    <span style={{ fontWeight: "600" }}>{val.totalQuantity} units</span>
                  </div>
                  <div style={{ backgroundColor: "#f0f0f0", borderRadius: "999px", height: "8px" }}>
                    <div style={{ width: `${pct}%`, height: "100%", backgroundColor: itemColors[i % itemColors.length], borderRadius: "999px" }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ backgroundColor: "#fff", borderRadius: "14px", padding: "1.5rem", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <h3 style={{ marginTop: 0, fontSize: "1rem", fontWeight: "700" }}>Stock Status</h3>
            {Object.entries(data.statusBreakdown).map(([status, count]) => (
              <div key={status} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid #f0f0f0" }}>
                <span style={{ fontSize: "0.88rem" }}>{status}</span>
                <span style={{ fontWeight: "700", fontSize: "0.88rem" }}>{count} items</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expiry Tab */}
      {activeTab === "expiry" && (
        <div>
          <div style={{ backgroundColor: "#fce4e4", borderRadius: "14px", padding: "1.5rem", marginBottom: "1rem" }}>
            <h3 style={{ marginTop: 0, color: "#c62f3b" }}>🚨 Expired Items ({data.expiredItems.length})</h3>
            {data.expiredItems.length === 0 ? <p style={{ color: "#888" }}>No expired items.</p> : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
                <thead><tr><th style={th2}>Item</th><th style={th2}>Category</th><th style={th2}>Qty</th><th style={th2}>Expired On</th></tr></thead>
                <tbody>
                  {data.expiredItems.map((item) => (
                    <tr key={item._id}>
                      <td style={td2}>{item.itemName}</td>
                      <td style={td2}>{item.category}</td>
                      <td style={td2}>{item.quantity}</td>
                      <td style={td2}>{new Date(item.expiryDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ backgroundColor: "#fff8e1", borderRadius: "14px", padding: "1.5rem", marginBottom: "1rem" }}>
            <h3 style={{ marginTop: 0, color: "#f57f17" }}>⚠️ Expiring in 7 Days ({data.expiringIn7Days.length})</h3>
            {data.expiringIn7Days.length === 0 ? <p style={{ color: "#888" }}>None expiring soon.</p> : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
                <thead><tr><th style={th2}>Item</th><th style={th2}>Category</th><th style={th2}>Qty</th><th style={th2}>Expires On</th></tr></thead>
                <tbody>
                  {data.expiringIn7Days.map((item) => (
                    <tr key={item._id}>
                      <td style={td2}>{item.itemName}</td>
                      <td style={td2}>{item.category}</td>
                      <td style={td2}>{item.quantity}</td>
                      <td style={td2}>{new Date(item.expiryDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ backgroundColor: "#e8f5e9", borderRadius: "14px", padding: "1.5rem" }}>
            <h3 style={{ marginTop: 0, color: "#2e7d32" }}>📅 Expiring in 30 Days ({data.expiringIn30Days.length})</h3>
            {data.expiringIn30Days.length === 0 ? <p style={{ color: "#888" }}>None.</p> : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
                <thead><tr><th style={th2}>Item</th><th style={th2}>Category</th><th style={th2}>Qty</th><th style={th2}>Expires On</th></tr></thead>
                <tbody>
                  {data.expiringIn30Days.map((item) => (
                    <tr key={item._id}>
                      <td style={td2}>{item.itemName}</td>
                      <td style={td2}>{item.category}</td>
                      <td style={td2}>{item.quantity}</td>
                      <td style={td2}>{new Date(item.expiryDate).toLocaleDateString()}</td>
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
        <div style={{ backgroundColor: "#fff", borderRadius: "14px", padding: "1.5rem", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <h3 style={{ marginTop: 0 }}>⚡ Low Stock Items</h3>
          {data.lowStockItems.length === 0 ? <p style={{ color: "#888" }}>All items are sufficiently stocked.</p> : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
              <thead><tr><th style={th2}>Item</th><th style={th2}>Category</th><th style={th2}>Quantity</th><th style={th2}>Location</th><th style={th2}>Status</th></tr></thead>
              <tbody>
                {data.lowStockItems.map((item) => (
                  <tr key={item._id}>
                    <td style={td2}>{item.itemName}</td>
                    <td style={td2}>{item.category}</td>
                    <td style={td2}><span style={{ color: "#c62f3b", fontWeight: "700" }}>{item.quantity}</span></td>
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
          {Object.entries(data.warehouseBreakdown).map(([wh, val]) => (
            <div key={wh} style={{ backgroundColor: "#fff", borderRadius: "14px", padding: "1.2rem", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", textAlign: "center" }}>
              <p style={{ fontWeight: "700", color: "#1a1a1a", marginBottom: "0.5rem", marginTop: 0 }}>🏭 {wh}</p>
              <p style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1565c0", margin: "0 0 0.3rem 0" }}>{val.totalQuantity}</p>
              <p style={{ fontSize: "0.8rem", color: "#888", margin: 0 }}>{val.count} item types</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const th2 = { padding: "0.6rem 0.8rem", textAlign: "left", fontWeight: "600", color: "#444", backgroundColor: "rgba(0,0,0,0.03)" };
const td2 = { padding: "0.55rem 0.8rem", color: "#333", borderBottom: "1px solid #f0f0f0" };