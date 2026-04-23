import { useEffect, useState } from "react";

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

const itemEmoji = (name) => {
  const n = (name || "").toLowerCase();
  if (n.includes("food")) return "🍱";
  if (n.includes("cloth")) return "👕";
  if (n.includes("medicine")) return "💊";
  if (n.includes("blanket")) return "🛏️";
  return "📦";
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
    fetch("https://resqreliefcheck.onrender.com/admin/transparency")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f0ede8",
        }}
      >
        <p style={{ color: "#888" }}>Loading dashboard...</p>
      </div>
    );

  if (!data)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f0ede8",
        }}
      >
        <p style={{ color: "#888" }}>Failed to load data.</p>
      </div>
    );

  const maxMonthly = Math.max(...data.monthlyTrend.map((m) => m.total), 1);
  const itemColors = ["#5b21b6", "#16a34a", "#b45309", "#be123c", "#0369a1"];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f0ede8",
        fontFamily: "Segoe UI, sans-serif",
        padding: "2rem 1.5rem",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "700",
            color: "#1a1a1a",
            marginBottom: "1.5rem",
          }}
        >
          Transparency
        </h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          {[
            { label: "Total Raised", value: fmt(data.totalFundsCollected) },
            { label: "Total Disbursed", value: fmt(data.totalFundsUtilized) },
            { label: "Total Donors", value: data.totalDonors ?? 0 },
          ].map((card) => (
            <div
              key={card.label}
              style={{
                backgroundColor: "#e8e4de",
                borderRadius: "16px",
                padding: "1.5rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <p
                style={{
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  color: "#7c3aed",
                  marginBottom: "0.5rem",
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

        {data.itemsDistributed.length > 0 && (
          <div
            style={{
              backgroundColor: "#e8e4de",
              borderRadius: "16px",
              padding: "1.5rem",
              marginBottom: "1.5rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: "700",
                marginBottom: "1.2rem",
                marginTop: 0,
              }}
            >
              Items Distributed
            </h3>
            {data.itemsDistributed.map((item, i) => {
              const maxQty = Math.max(
                ...data.itemsDistributed.map((x) => x.totalQuantity),
                1,
              );
              const pct = (item.totalQuantity / maxQty) * 100;
              return (
                <div key={item._id} style={{ marginBottom: "0.8rem" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.82rem",
                      marginBottom: "0.3rem",
                    }}
                  >
                    <span style={{ color: "#555" }}>
                      {itemEmoji(item._id)} {item._id}
                    </span>
                    <span style={{ color: "#555", fontWeight: "600" }}>
                      {item.totalQuantity} pcs
                    </span>
                  </div>
                  <div
                    style={{
                      backgroundColor: "#d5d0c9",
                      borderRadius: "999px",
                      height: "10px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        backgroundColor: itemColors[i % itemColors.length],
                        borderRadius: "999px",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {data.servedAreas.length > 0 && (
          <div style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "1rem",
              }}
            >
              {data.servedAreas.map((area) => (
                <div
                  key={area._id}
                  style={{
                    backgroundColor: "#e8e4de",
                    borderRadius: "16px",
                    padding: "1.2rem",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  }}
                >
                  <p
                    style={{
                      fontWeight: "700",
                      fontSize: "0.95rem",
                      color: "#1a1a1a",
                      marginBottom: "0.8rem",
                      marginTop: 0,
                      textAlign: "center",
                    }}
                  >
                    {area._id?.toUpperCase()}
                  </p>
                  <div
                    style={{
                      borderTop: "1px solid #ccc",
                      paddingTop: "0.7rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.78rem",
                        marginBottom: "0.4rem",
                      }}
                    >
                      <span style={{ color: "#7c3aed", fontWeight: "600" }}>
                        FAMILIES AIDED
                      </span>
                      <span style={{ fontWeight: "700" }}>
                        {area.familiesAided}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.78rem",
                      }}
                    >
                      <span style={{ color: "#555" }}>Funds</span>
                      <span style={{ fontWeight: "600" }}>
                        {fmt(area.fundsUsed)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.monthlyTrend.length > 0 && (
          <div
            style={{
              backgroundColor: "#e8e4de",
              borderRadius: "16px",
              padding: "1.5rem",
              marginBottom: "1.5rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: "700",
                marginBottom: "1.2rem",
                marginTop: 0,
              }}
            >
              Monthly Donations
            </h3>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: "0.8rem",
                height: "140px",
              }}
            >
              {data.monthlyTrend.map((m) => (
                <div
                  key={`${m._id.year}-${m._id.month}`}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: "#666",
                      marginBottom: "4px",
                    }}
                  >
                    {fmt(m.total)}
                  </span>
                  <div
                    style={{
                      width: "100%",
                      height: `${(m.total / maxMonthly) * 100}px`,
                      backgroundColor: "#7c3aed",
                      borderRadius: "6px 6px 0 0",
                      minHeight: "4px",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.72rem",
                      color: "#777",
                      marginTop: "4px",
                    }}
                  >
                    {MONTH_NAMES[m._id.month - 1]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div
          style={{
            backgroundColor: "#e8e4de",
            borderRadius: "16px",
            padding: "1.5rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: "700",
              marginBottom: "1.2rem",
              marginTop: 0,
            }}
          >
            Transactions
          </h3>
          {data.recentTransactions.length === 0 ? (
            <p
              style={{ color: "#aaa", fontSize: "0.9rem", textAlign: "center" }}
            >
              No transactions yet.
            </p>
          ) : (
            data.recentTransactions.map((tx) => (
              <div
                key={tx._id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.7rem 0",
                  borderBottom: "1px solid #d0cbc4",
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: "600",
                      fontSize: "0.9rem",
                      color: "#1a1a1a",
                    }}
                  >
                    {tx.donorName}
                  </p>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "#888" }}>
                    {tx.donationType === "money" ? "💰 Money" : "📦 Supplies"} ·{" "}
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  style={{
                    fontWeight: "700",
                    fontSize: "0.95rem",
                    color: "#1a1a1a",
                  }}
                >
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
  );
}
