import { useNavigate } from "react-router-dom";

export default function PaymentCancel() {
  const navigate = useNavigate();
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f5f5f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Segoe UI, sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "20px",
          padding: "3rem 2.5rem",
          width: "100%",
          maxWidth: "420px",
          textAlign: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            backgroundColor: "#f59e0b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.8rem auto",
            fontSize: "3rem",
            color: "white",
            fontWeight: "bold",
            lineHeight: 1,
          }}
        >
          !
        </div>
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: "600",
            color: "#1a1a1a",
            marginBottom: "0.5rem",
            marginTop: 0,
          }}
        >
          Payment Cancelled
        </h2>
        <p style={{ color: "#888", fontSize: "0.95rem", marginBottom: "1rem" }}>
          You cancelled the payment. No amount was charged.
        </p>
        <button
          onClick={() => navigate("/donate")}
          style={{
            marginTop: "1rem",
            width: "100%",
            padding: "0.85rem",
            backgroundColor: "#1a1a1a",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            fontSize: "1rem",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          Back to Donate
        </button>
      </div>
    </div>
  );
}
