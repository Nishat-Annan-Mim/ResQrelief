import React, { useState } from "react";
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

const AidRequestForm = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    district: "",
    peopleAffected: "",
    selectedAidTypes: [],
    additionalDetails: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [modal, setModal] = useState(null); // { message: string }

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
      const response = await axios.post("http://localhost:3001/api/requests", {
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        district: formData.district,
        peopleAffected: formData.peopleAffected,
        aidTypes: formData.selectedAidTypes,
        additionalDetails: formData.additionalDetails,
      });

      if (response.data.duplicate) {
        setModal({ message: "This number has already requested" });
        return;
      }

      setSubmitted(true);
    } catch (error) {
      if (error.response?.status === 409) {
        setModal({ message: "This number has already requested" });
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
      peopleAffected: "",
      selectedAidTypes: [],
      additionalDetails: "",
    });
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className="arf-page">
        <div className="arf-success-card">
          <span className="arf-success-icon">✅</span>
          <p className="arf-success-text">
            Thank you for submitting your aid request. Our team will review and verify it shortly.
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

          <div className="arf-row">
            <div className="arf-field">
              <label>District</label>
              <input
                type="text"
                name="district"
                value={formData.district}
                onChange={handleChange}
                required
              />
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
