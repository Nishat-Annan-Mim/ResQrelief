import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./VolunteerRegister.css";

const VolunteerRegister = () => {
  const navigate = useNavigate();

  // Retrieve user data from localStorage
  const user = JSON.parse(localStorage.getItem("user"));

  const [validNidNumbers, setValidNidNumbers] = useState([]);
  const [formData, setFormData] = useState({
    fullName: user?.name || "", // Prefill fullName with localStorage value
    email: user?.email || "", // Prefill email with localStorage value
    dateOfBirth: "",
    phone: "",
    address: "",
    gender: "",
    emergencyContact: "", // Initially stores phone number
    emergencyContactRelation: "", // Relation field after phone entry
    nidNumber: "",
    confirmNidNumber: "",
    volunteerPassword: "",
    confirmVolunteerPassword: "",
  });

  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [showRelation, setShowRelation] = useState(false);

  // Add this at the top of the useEffect in VolunteerRegister.jsx
  useEffect(() => {
    const checkExisting = async () => {
      if (!user?.email) return;
      try {
        const res = await axios.get(
          `https://resqrelief-fj7z.onrender.com/volunteer/check/${user.email}`,
        );
        if (res.data.isVolunteer) {
          // Already registered — navigate to the onboarding page
          navigate("/volunteer-onboarding");
        }
      } catch (err) {
        console.log(err);
        setMessage("Error checking for existing volunteer.");
      }
    };
    checkExisting();
  }, [user?.email, navigate]);

  // Fetch valid NID numbers from the backend when the component is mounted
  useEffect(() => {
    const fetchValidNids = async () => {
      try {
        const response = await axios.get(
          "https://resqrelief-fj7z.onrender.com/valid-nids",
        );
        setValidNidNumbers(response.data); // Store fetched NIDs
        console.log("Fetched NID numbers:", response.data);
      } catch (error) {
        console.error("Error fetching NID numbers:", error);
        setMessage("Failed to load NID numbers. Please try again later.");
      }
    };

    fetchValidNids();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhoneSubmit = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // ⚠️ important
      setShowRelation(true);
    }
  };

  // Step 1: Handle personal info form submission
  const handleStep1 = () => {
    const {
      fullName,
      email,
      dateOfBirth,
      phone,
      address,
      gender,
      emergencyContact,
    } = formData;

    if (
      !fullName ||
      !email ||
      !dateOfBirth ||
      !phone ||
      !address ||
      !gender ||
      !emergencyContact ||
      !formData.emergencyContactRelation
    ) {
      setMessage("Please fill up all personal information fields.");
      return;
    }

    setMessage(""); // Clear any previous messages
    setStep(2); // Proceed to Step 2 (NID verification)
  };

  // Step 2: NID verification logic
  const handleStep2 = () => {
    const { nidNumber, confirmNidNumber } = formData;

    if (!nidNumber || !confirmNidNumber) {
      setMessage("Please enter both NID fields.");
      return;
    }

    if (nidNumber !== confirmNidNumber) {
      setMessage("NID numbers do not match.");
      return;
    }

    if (!(nidNumber.length === 10 || nidNumber.length === 17)) {
      setMessage("NID must be 10 or 17 digits.");
      return;
    }
    if (!validNidNumbers.map(String).includes(nidNumber)) {
      setMessage("Invalid NID. Not found in database.");
      return;
    }

    setMessage(""); // Clear any error message
    setStep(3); // Proceed to Step 3 (Password setup)
  };

  // Step 3: Final submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const { volunteerPassword, confirmVolunteerPassword } = formData;

    if (!volunteerPassword || !confirmVolunteerPassword) {
      setMessage("Please enter password and confirm password.");
      return;
    }

    if (volunteerPassword.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    if (volunteerPassword !== confirmVolunteerPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    try {
      const response = await axios.post(
        "https://resqrelief-fj7z.onrender.com/volunteer/register", // Backend registration route
        {
          userId: user?.id, // Include the user ID
          fullName: formData.fullName,
          email: formData.email,
          dateOfBirth: formData.dateOfBirth,
          phone: formData.phone,
          address: formData.address,
          gender: formData.gender,
          emergencyContact: `${formData.emergencyContact} (${formData.emergencyContactRelation})`,
          nidNumber: formData.nidNumber,
          volunteerPassword: formData.volunteerPassword,
          status: "pending",
        },
      );
      alert(response.data.message);
      navigate("/volunteer-onboarding");
    } catch (error) {
      setMessage(error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="volunteer-register-page">
      <div className="volunteer-register-header">
        <h1>Create Your Account as Volunteer</h1>
        <p>
          Join the ResQRelief volunteer network. Complete all steps to get
          started.
        </p>
      </div>

      <div className="step-indicator">
        <div className={`step-item ${step >= 1 ? "active-green" : ""}`}>
          <span>1</span>
          <p>Personal Info</p>
        </div>

        <div className={`step-item ${step >= 2 ? "active-yellow" : ""}`}>
          <span>2</span>
          <p>Verification</p>
        </div>

        <div className={`step-item ${step >= 3 ? "active-blue" : ""}`}>
          <span>3</span>
          <p>Password</p>
        </div>
      </div>

      {message && <div className="form-message">{message}</div>}

      {/* Step 1: Personal Info */}
      {step === 1 && (
        <div className="step-box">
          <div className="form-grid">
            <div>
              <label>FULL NAME</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="eg. Nishat Annan Mim"
              />
            </div>

            <div>
              <label>DATE OF BIRTH</label>
              <input
                type="text"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                placeholder="mm/dd/yy"
              />
            </div>

            <div>
              <label>EMAIL ADDRESS</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@gmail.com"
              />
            </div>

            <div>
              <label>PHONE NUMBER</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onKeyDown={handlePhoneSubmit} // Handle Enter key press
                placeholder="+8801111111111"
              />
            </div>

            <div className="full-width">
              <label>CURRENT ADDRESS</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="full address with district"
              />
            </div>

            <div>
              <label>GENDER</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Dynamic emergency contact input */}
            {/* Emergency contact phone number */}
            <div>
              <label>EMERGENCY CONTACT</label>
              <input
                type="text"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleChange}
                onKeyDown={handlePhoneSubmit}
                placeholder="After placeing phone number must press-'Enter' "
              />
            </div>
            {/* ✅ Show relation AFTER pressing Enter */}
            {showRelation && (
              <div>
                <label>RELATION WITH CONTACT</label>
                <input
                  type="text"
                  name="emergencyContactRelation"
                  value={formData.emergencyContactRelation}
                  onChange={handleChange}
                  placeholder="e.g., Father, Friend"
                />
              </div>
            )}
          </div>

          <button className="confirm-btn" onClick={handleStep1}>
            CONFIRM ▶
          </button>
        </div>
      )}

      {/* Step 2: NID Verification */}
      {step === 2 && (
        <div className="step-box">
          <h2>Verify Your National ID</h2>
          <p>
            Enter your NID number to confirm your identity. This is required to
            complete registration.
          </p>
          <div className="form-single">
            <label>NID NUMBER</label>
            <input
              type="text"
              name="nidNumber"
              value={formData.nidNumber}
              onChange={handleChange}
            />

            <label>Re-enter NID NUMBER</label>
            <input
              type="text"
              name="confirmNidNumber"
              value={formData.confirmNidNumber}
              onChange={handleChange}
            />
          </div>
          <button className="confirm-btn" onClick={handleStep2}>
            CONFIRM ▶
          </button>
        </div>
      )}

      {/* Step 3: Password Setup */}
      {step === 3 && (
        <div className="step-box">
          <h2>SET PASSWORD</h2>
          <div className="form-grid">
            <div>
              <label>Password</label>
              <input
                type="password"
                name="volunteerPassword"
                value={formData.volunteerPassword}
                onChange={handleChange}
                placeholder="min 8 character"
              />
            </div>

            <div>
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirmVolunteerPassword"
                value={formData.confirmVolunteerPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <button className="complete-btn" onClick={handleSubmit}>
            Complete Registration
          </button>
        </div>
      )}
    </div>
  );
};

export default VolunteerRegister;
