import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const tranId = params.get("tran_id");
  const [info, setInfo] = useState(null);

  useEffect(() => {
    if (tranId) {
      fetch(`https://resqreliefcheck.onrender.com/donation/status/${tranId}`)
        .then((r) => r.json())
        .then(setInfo)
        .catch(() => {});
    }
  }, [tranId]);

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#f5f5f0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Segoe UI, sans-serif",
    }}>
      <div style={{
        backgroundColor: "#ffffff",
        borderRadius: "24px",
        padding: "4rem 3rem",
        width: "100%",
        maxWidth: "460px",
        textAlign: "center",
        boxShadow: "0 4px 32px rgba(0,0,0,0.08)",
      }}>

        {/* Green circle with SVG checkmark */}
        <div style={{
          width: "110px",
          height: "110px",
          borderRadius: "50%",
          backgroundColor: "#22c55e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 2rem auto",
        }}>
          <svg
            width="55"
            height="55"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <polyline
              points="20 6 9 17 4 12"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2 style={{
          fontSize: "1.6rem",
          fontWeight: "600",
          color: "#1a1a1a",
          marginBottom: "0.5rem",
          marginTop: 0,
        }}>
          Payment Successful
        </h2>

        <p style={{ color: "#888", fontSize: "0.95rem" }}>
          Thank you for your donation to RESQRELIEF.
        </p>

        {info && (
          <div style={{
            marginTop: "1.5rem",
            backgroundColor: "#f9fafb",
            borderRadius: "12px",
            padding: "1.2rem",
            textAlign: "left",
            fontSize: "0.9rem",
            color: "#444",
            lineHeight: "1.8",
          }}>
            <p style={{ margin: "0 0 0.4rem 0" }}>
              <strong>Donor:</strong> {info.donorName}
            </p>
            <p style={{ margin: "0 0 0.4rem 0" }}>
              <strong>Amount:</strong> ৳{info.amount?.toLocaleString()}
            </p>
            <p style={{ margin: 0 }}>
              <strong>Transaction ID:</strong>{" "}
              <span style={{ fontSize: "0.78rem", color: "#888" }}>
                {info.transactionId}
              </span>
            </p>
          </div>
        )}

        <button
          onClick={() => navigate("/home")}
          style={{
            marginTop: "2rem",
            width: "100%",
            padding: "0.9rem",
            backgroundColor: "#1a1a1a",
            color: "#fff",
            border: "none",
            borderRadius: "12px",
            fontSize: "1rem",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          Back to Home
        </button>

      </div>
    </div>
  );
}
