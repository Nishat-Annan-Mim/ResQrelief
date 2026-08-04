import { useEffect, useState } from "react";
import {
  Package,
  FileDown,
  CircleAlert,
  TriangleAlert,
  Calendar,
  Zap,
  Warehouse,
  Boxes,
  Layers,
  ClipboardList,
} from "lucide-react";
import "./StorageAnalytics.css";
import AdminLayout from "./AdminLayout";

export default function StorageAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetch("https://resqrelief-fj7z.onrender.com/admin/storage-analytics")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
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
      headStyles: {
        fillColor: [26, 26, 26],
        textColor: 255,
        fontStyle: "bold",
      },
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
        cat,
        val.count,
        val.totalQuantity,
      ]),
      theme: "striped",
      headStyles: {
        fillColor: [21, 101, 192],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: { fontSize: 10 },
    });

    // Stock Status
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Stock Status", 14, doc.lastAutoTable.finalY + 12);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 16,
      head: [["Status", "Count"]],
      body: Object.entries(data.statusBreakdown).map(([status, count]) => [
        status,
        count,
      ]),
      theme: "striped",
      headStyles: {
        fillColor: [46, 125, 50],
        textColor: 255,
        fontStyle: "bold",
      },
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
          i.itemName,
          i.category,
          i.quantity,
          new Date(i.expiryDate).toLocaleDateString(),
        ]),
        theme: "grid",
        headStyles: {
          fillColor: [198, 47, 59],
          textColor: 255,
          fontStyle: "bold",
        },
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
          i.itemName,
          i.category,
          i.quantity,
          new Date(i.expiryDate).toLocaleDateString(),
        ]),
        theme: "grid",
        headStyles: {
          fillColor: [245, 127, 23],
          textColor: 255,
          fontStyle: "bold",
        },
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
          i.itemName,
          i.category,
          i.quantity,
          new Date(i.expiryDate).toLocaleDateString(),
        ]),
        theme: "grid",
        headStyles: {
          fillColor: [46, 125, 50],
          textColor: 255,
          fontStyle: "bold",
        },
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
          i.itemName,
          i.category,
          i.quantity,
          i.warehouseLocation || "—",
          i.status || "—",
        ]),
        theme: "grid",
        headStyles: {
          fillColor: [245, 127, 23],
          textColor: 255,
          fontStyle: "bold",
        },
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
        wh,
        val.count,
        val.totalQuantity,
      ]),
      theme: "striped",
      headStyles: {
        fillColor: [26, 26, 26],
        textColor: 255,
        fontStyle: "bold",
      },
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
        { align: "center" },
      );
    }

    doc.save(`storage-report-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  if (loading)
    return (
      <AdminLayout>
        <div className="sa-state">Loading analytics…</div>
      </AdminLayout>
    );

  if (!data)
    return (
      <AdminLayout>
        <div className="sa-state">Failed to load analytics.</div>
      </AdminLayout>
    );

  const tabs = ["overview", "expiry", "low stock", "warehouses"];

  const kpis = [
    { label: "Total Items", value: data.totalItems, tone: "info", Icon: Boxes },
    {
      label: "Total Quantity",
      value: data.totalQuantity,
      tone: "success",
      Icon: Layers,
    },
    {
      label: "Expired Items",
      value: data.expiredItems.length,
      tone: "danger",
      Icon: CircleAlert,
    },
    {
      label: "Low Stock",
      value: data.lowStockItems.length,
      tone: "warning",
      Icon: Zap,
    },
  ];

  /** Expiry tables all share the same four columns. */
  const ExpiryTable = ({ items, dateLabel }) => (
    <div className="sa-table-wrap">
      <table className="sa-table ad-stack">
        <thead>
          <tr>
            <th>Item</th>
            <th>Category</th>
            <th>Qty</th>
            <th>{dateLabel}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item._id}>
              <td data-label="Item">{item.itemName}</td>
              <td data-label="Category">{item.category}</td>
              <td data-label="Qty">{item.quantity}</td>
              <td data-label="">{new Date(item.expiryDate).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <AdminLayout>
      <div className="sa-page">
        <div className="sa-container">
          {/* ── Header ── */}
          <div className="sa-header">
            <div>
              <h1 className="sa-title">
                <Package size={22} strokeWidth={1.75} />
                Storage Analytics
              </h1>
              <p className="sa-subtitle">
                Insights into community storage, expiry alerts, and stock usage.
              </p>
            </div>
            <button
              className="sa-export-btn"
              onClick={() => exportReport(data)}
            >
              <FileDown size={15} strokeWidth={2} />
              Download PDF Report
            </button>
          </div>

          {/* ── KPI cards ── */}
          <div className="sa-kpi-grid">
            {kpis.map(({ label, value, tone, Icon }) => (
              <div key={label} className={`sa-kpi-card ${tone}`}>
                <p className="sa-kpi-label">
                  <Icon size={13} strokeWidth={2} />
                  {label}
                </p>
                <p className="sa-kpi-value">{value}</p>
              </div>
            ))}
          </div>

          {/* ── Tabs ── */}
          <div className="sa-tabs">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`sa-tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* ── Overview ── */}
          {activeTab === "overview" && (
            <div className="sa-grid-2">
              <div className="sa-card">
                <h3 className="sa-card-title">
                  <Boxes size={17} strokeWidth={1.75} />
                  Stock by Category
                </h3>
                {Object.entries(data.categoryBreakdown).map(([cat, val]) => {
                  const max = Math.max(
                    ...Object.values(data.categoryBreakdown).map(
                      (v) => v.totalQuantity,
                    ),
                    1,
                  );
                  const pct = (val.totalQuantity / max) * 100;
                  return (
                    <div key={cat} className="sa-bar-row">
                      <div className="sa-bar-head">
                        <span className="sa-bar-label">{cat}</span>
                        <span className="sa-bar-value">
                          {val.totalQuantity} units
                        </span>
                      </div>
                      <div className="sa-bar-track">
                        <div
                          className="sa-bar-fill"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="sa-card">
                <h3 className="sa-card-title">
                  <ClipboardList size={17} strokeWidth={1.75} />
                  Stock Status
                </h3>
                {Object.entries(data.statusBreakdown).map(([status, count]) => (
                  <div key={status} className="sa-status-row">
                    <span>{status}</span>
                    <strong>{count} items</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Expiry ── */}
          {activeTab === "expiry" && (
            <div>
              <div className="sa-card danger">
                <h3 className="sa-card-title">
                  <CircleAlert size={17} strokeWidth={1.75} />
                  Expired Items ({data.expiredItems.length})
                </h3>
                {data.expiredItems.length === 0 ? (
                  <p className="sa-empty">No expired items.</p>
                ) : (
                  <ExpiryTable
                    items={data.expiredItems}
                    dateLabel="Expired On"
                  />
                )}
              </div>

              <div className="sa-card warning">
                <h3 className="sa-card-title">
                  <TriangleAlert size={17} strokeWidth={1.75} />
                  Expiring in 7 Days ({data.expiringIn7Days.length})
                </h3>
                {data.expiringIn7Days.length === 0 ? (
                  <p className="sa-empty">None expiring soon.</p>
                ) : (
                  <ExpiryTable
                    items={data.expiringIn7Days}
                    dateLabel="Expires On"
                  />
                )}
              </div>

              <div className="sa-card success">
                <h3 className="sa-card-title">
                  <Calendar size={17} strokeWidth={1.75} />
                  Expiring in 30 Days ({data.expiringIn30Days.length})
                </h3>
                {data.expiringIn30Days.length === 0 ? (
                  <p className="sa-empty">None.</p>
                ) : (
                  <ExpiryTable
                    items={data.expiringIn30Days}
                    dateLabel="Expires On"
                  />
                )}
              </div>
            </div>
          )}

          {/* ── Low stock ── */}
          {activeTab === "low stock" && (
            <div className="sa-card">
              <h3 className="sa-card-title">
                <Zap size={17} strokeWidth={1.75} />
                Low Stock Items
              </h3>
              {data.lowStockItems.length === 0 ? (
                <p className="sa-empty">All items are sufficiently stocked.</p>
              ) : (
                <div className="sa-table-wrap">
                  <table className="sa-table ad-stack">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Category</th>
                        <th>Quantity</th>
                        <th>Location</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.lowStockItems.map((item) => (
                        <tr key={item._id}>
                          <td data-label="Item">{item.itemName}</td>
                          <td data-label="Category">{item.category}</td>
                          <td data-label="Quantity">
                            <span className="sa-qty-low">{item.quantity}</span>
                          </td>
                          <td data-label="Location">{item.warehouseLocation || "—"}</td>
                          <td data-label="Status">{item.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Warehouses ── */}
          {activeTab === "warehouses" && (
            <div className="sa-grid-3">
              {Object.entries(data.warehouseBreakdown).map(([wh, val]) => (
                <div key={wh} className="sa-wh-card">
                  <p className="sa-wh-name">
                    <Warehouse size={14} strokeWidth={2} />
                    {wh}
                  </p>
                  <p className="sa-wh-value">{val.totalQuantity}</p>
                  <p className="sa-wh-meta">{val.count} item types</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
