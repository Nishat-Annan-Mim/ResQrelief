import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AidRequestForm.css";

const AID_OPTIONS = [
  { value: "Food", label: "Food", emoji: "🍱" },
  { value: "Medical", label: "Medical", emoji: "💊" },
  { value: "Shelter", label: "Shelter", emoji: "🏠" },
  { value: "Water", label: "Water", emoji: "💧" },
  { value: "Clothing", label: "Clothing", emoji: "👕" },
  { value: "Other", label: "Other", emoji: "✏️" },
];

const BANGLADESH_DISTRICTS = [
  "Bagerhat",
  "Bandarban",
  "Barguna",
  "Barishal",
  "Bhola",
  "Bogura",
  "Brahmanbaria",
  "Chandpur",
  "Chattogram",
  "Chuadanga",
  "Cox's Bazar",
  "Cumilla",
  "Dhaka",
  "Dinajpur",
  "Faridpur",
  "Feni",
  "Gaibandha",
  "Gazipur",
  "Gopalganj",
  "Habiganj",
  "Jamalpur",
  "Jashore",
  "Jhalokathi",
  "Jhenaidah",
  "Joypurhat",
  "Khagrachhari",
  "Khulna",
  "Kishoreganj",
  "Kurigram",
  "Kushtia",
  "Lakshmipur",
  "Lalmonirhat",
  "Madaripur",
  "Magura",
  "Manikganj",
  "Meherpur",
  "Moulvibazar",
  "Munshiganj",
  "Mymensingh",
  "Naogaon",
  "Narail",
  "Narayanganj",
  "Narsingdi",
  "Natore",
  "Netrokona",
  "Nilphamari",
  "Noakhali",
  "Pabna",
  "Panchagarh",
  "Patuakhali",
  "Pirojpur",
  "Rajbari",
  "Rajshahi",
  "Rangamati",
  "Rangpur",
  "Satkhira",
  "Shariatpur",
  "Sherpur",
  "Sirajganj",
  "Sunamganj",
  "Sylhet",
  "Tangail",
  "Thakurgaon",
];

const AidRequestForm = () => {
  const [coords, setCoords] = useState({ latitude: null, longitude: null });
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }),
        () => {},
        { timeout: 5000 },
      );
    }
  }, []);
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    district: "",
    fullAddress: "",
    peopleAffected: "",
    selectedAidTypes: [],
    additionalDetails: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [modal, setModal] = useState(null);
  const [otherText, setOtherText] = useState("");

  const toggleAidType = (value) => {
    setFormData((prev) => ({
      ...prev,
      selectedAidTypes: prev.selectedAidTypes.includes(value)
        ? prev.selectedAidTypes.filter((v) => v !== value)
        : [...prev.selectedAidTypes, value],
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validatePhone = (number) => {
    const bdPhoneRegex = /^(?:\+88|88)?(01[3-9]\d{8})$/;
    return bdPhoneRegex.test(number);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validatePhone(formData.phoneNumber)) {
      setModal({ message: "Please enter a valid number" });
      return;
    }

    try {
      const response = await axios.post(
        "https://resqrelief-fj7z.onrender.com/api/requests",
        {
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          district: formData.district,
          fullAddress: formData.fullAddress,
          peopleAffected: formData.peopleAffected,
          aidTypes: formData.selectedAidTypes,
          additionalDetails: formData.additionalDetails,
          otherDetails: otherText,
          latitude: coords.latitude, // ← missing
          longitude: coords.longitude,
          email: sessionStorage.getItem("email"),
        },
      );

      if (response.data.duplicate) {
        setModal({ message: "This number has already requested" });
        return;
      }

      setSubmitted(true);
    } catch (error) {
      if (error.response?.status === 409) {
        setModal({ message: "This number has already requested" });
      } else if (error.response?.status === 403) {
        // ✅ ADD THIS
        setModal({
          message: "This number has been banned due to a fraudulent request.",
        });
      } else {
        setModal({ message: "Something went wrong. Please try again." });
      }
    }
  };

  const handleReset = () => {
    setFormData({
      fullName: "",
      phoneNumber: "",
      district: "",
      fullAddress: "",
      peopleAffected: "",
      selectedAidTypes: [],
      additionalDetails: "",
    });
    setOtherText("");
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className="arf-page">
        <div className="arf-success-card">
          <span className="arf-success-icon">✅</span>
          <p className="arf-success-text">
            Thank you for submitting your aid request. Our team will review and
            verify it shortly.
          </p>
          <button className="arf-another-btn" onClick={handleReset}>
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="arf-page">
      {modal && (
        <div className="arf-modal-overlay">
          <div className="arf-modal">
            <p className="arf-modal-text">
              <span className="arf-modal-icon">⚠️</span> {modal.message}
            </p>
            <button className="arf-modal-ok" onClick={() => setModal(null)}>
              OK
            </button>
          </div>
        </div>
      )}

      <h1 className="arf-page-title">Request Aid</h1>

      <div className="arf-card">
        <p className="arf-select-label">Select all that you need -</p>

        <div className="arf-aid-grid">
          {AID_OPTIONS.map(({ value, label, emoji }) => (
            <button
              key={value}
              type="button"
              className={`arf-aid-btn ${formData.selectedAidTypes.includes(value) ? "selected" : ""}`}
              onClick={() => toggleAidType(value)}
            >
              <span className="arf-aid-emoji">{emoji}</span>
              <span className="arf-aid-label">{label}</span>
            </button>
          ))}
        </div>

        {formData.selectedAidTypes.includes("Other") && (
          <div className="arf-field" style={{ marginBottom: "20px" }}>
            <label>Please specify what you need</label>
            <input
              type="text"
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              placeholder="Describe what you need..."
              required
            />
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="arf-row">
            <div className="arf-field">
              <label>Your name or local leader name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="arf-field">
              <label>Phone Number</label>
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="01XXXXXXXXX"
                required
              />
            </div>
          </div>

          {/* ✅ NEW — District dropdown + People affected */}
          <div className="arf-row">
            <div className="arf-field">
              <label>District</label>
              <select
                name="district"
                value={formData.district}
                onChange={handleChange}
                required
              >
                <option value="" disabled>
                  Select your district
                </option>
                {BANGLADESH_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="arf-field">
              <label>Approximate people affected</label>
              <input
                type="number"
                name="peopleAffected"
                value={formData.peopleAffected}
                onChange={handleChange}
                min="1"
                required
              />
            </div>
          </div>

          {/* ✅ NEW — Full address field */}
          <div className="arf-field arf-full" style={{ marginBottom: "20px" }}>
            <label>Full Address</label>
            <input
              type="text"
              name="fullAddress"
              value={formData.fullAddress}
              onChange={handleChange}
              placeholder="House / Road / Area details..."
              required
            />
          </div>

          <div className="arf-field arf-full">
            <label>Describe the situation</label>
            <textarea
              name="additionalDetails"
              value={formData.additionalDetails}
              onChange={handleChange}
              rows="4"
            />
          </div>

          <div className="arf-submit-row">
            <button type="submit" className="arf-submit-btn">
              Submit →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AidRequestForm;
