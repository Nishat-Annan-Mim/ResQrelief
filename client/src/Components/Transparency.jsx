import { useEffect, useState } from "react";
import {
  Eye,
  Utensils,
  Shirt,
  Pill,
  BedDouble,
  Package,
  Banknote,
  Boxes,
  MapPin,
  TrendingUp,
  Receipt,
} from "lucide-react";
import "./Transparency.css";
import AdminLayout from "./AdminLayout";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Picks a lucide icon for a supply category by name. */
const ItemIcon = ({ name, size = 14 }) => {
  const n = (name || "").toLowerCase();
  const Icon = n.includes("food")
    ? Utensils
    : n.includes("cloth")
      ? Shirt
      : n.includes("medicine")
        ? Pill
        : n.includes("blanket")
          ? BedDouble
          : Package;
  return <Icon size={size} strokeWidth={2} />;
};

const fmt = (num) => {
  if (!num) return "৳ 0";
  if (num >= 1000) return "৳ " + (num / 1000).toFixed(1) + " K";
  return "৳ " + num;
};

export default function Transparency() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://resqrelief-fj7z.onrender.com/admin/transparency")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <AdminLayout>
        <div className="tr-state">Loading dashboard…</div>
      </AdminLayout>
    );

  if (!data)
    return (
      <AdminLayout>
        <div className="tr-state">Failed to load data.</div>
      </AdminLayout>
    );

  const maxMonthly = Math.max(...data.monthlyTrend.map((m) => m.total), 1);

  return (
    <AdminLayout>
      <div className="tr-page">
        <div className="tr-container">
          <h1 className="tr-title">
            <Eye size={22} strokeWidth={1.75} />
            Transparency
          </h1>

          {/* ── Headline figures ── */}
          <div className="tr-stat-grid">
            {[
              {
                label: "Total Raised",
                value: fmt(data.totalFundsCollected),
                Icon: Banknote,
              },
              {
                label: "Total Disbursed",
                value: fmt(data.totalFundsUtilized),
                Icon: TrendingUp,
              },
              {
                label: "Total Donors",
                value: data.totalDonors ?? 0,
                Icon: Receipt,
              },
            ].map(({ label, value, Icon }) => (
              <div key={label} className="tr-stat-card">
                <p className="tr-stat-label">
                  <Icon size={13} strokeWidth={2} />
                  {label}
                </p>
                <p className="tr-stat-value">{value}</p>
              </div>
            ))}
          </div>

          {/* ── Items distributed ── */}
          {data.itemsDistributed.length > 0 && (
            <div className="tr-card">
              <h3 className="tr-card-title">
                <Boxes size={17} strokeWidth={1.75} />
                Items Distributed
              </h3>
              {data.itemsDistributed.map((item) => {
                const maxQty = Math.max(
                  ...data.itemsDistributed.map((x) => x.totalQuantity),
                  1,
                );
                const pct = (item.totalQuantity / maxQty) * 100;
                return (
                  <div key={item._id} className="tr-item-row">
                    <div className="tr-item-head">
                      <span className="tr-item-name">
                        <ItemIcon name={item._id} />
                        {item._id}
                      </span>
                      <span className="tr-item-qty">
                        {item.totalQuantity} pcs
                      </span>
                    </div>
                    <div className="tr-bar-track">
                      <div
                        className="tr-bar-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Areas served ── */}
          {data.servedAreas.length > 0 && (
            <div className="tr-area-grid">
              {data.servedAreas.map((area) => (
                <div key={area._id} className="tr-area-card">
                  <p className="tr-area-name">
                    <MapPin size={13} strokeWidth={2} />
                    {area._id?.toUpperCase()}
                  </p>
                  <div className="tr-area-stats">
                    <div className="tr-area-row">
                      <span className="tr-area-key">Families Aided</span>
                      <span className="tr-area-val">{area.familiesAided}</span>
                    </div>
                    <div className="tr-area-row">
                      <span className="tr-area-key">Funds</span>
                      <span className="tr-area-val">{fmt(area.fundsUsed)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Monthly trend ── */}
          {data.monthlyTrend.length > 0 && (
            <div className="tr-card">
              <h3 className="tr-card-title">
                <TrendingUp size={17} strokeWidth={1.75} />
                Monthly Donations
              </h3>
              <div className="tr-chart">
                {data.monthlyTrend.map((m) => (
                  <div
                    key={`${m._id.year}-${m._id.month}`}
                    className="tr-chart-col"
                  >
                    <span className="tr-chart-value">{fmt(m.total)}</span>
                    <div
                      className="tr-chart-bar"
                      style={{ height: `${(m.total / maxMonthly) * 100}px` }}
                    />
                    <span className="tr-chart-month">
                      {MONTH_NAMES[m._id.month - 1]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Recent transactions ── */}
          <div className="tr-card">
            <h3 className="tr-card-title">
              <Receipt size={17} strokeWidth={1.75} />
              Transactions
            </h3>
            {data.recentTransactions.length === 0 ? (
              <p className="tr-empty">No transactions yet.</p>
            ) : (
              data.recentTransactions.map((tx) => (
                <div key={tx._id} className="tr-tx-row">
                  <div>
                    <p className="tr-tx-name">{tx.donorName}</p>
                    <p className="tr-tx-meta">
                      {tx.donationType === "money" ? (
                        <Banknote size={13} strokeWidth={2} />
                      ) : (
                        <Package size={13} strokeWidth={2} />
                      )}
                      {tx.donationType === "money" ? "Money" : "Supplies"} ·{" "}
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="tr-tx-amount">
                    {tx.donationType === "money"
                      ? fmt(tx.amount)
                      : tx.supplies
                          ?.map((s) => `${s.item} x${s.quantity}`)
                          .join(", ")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
