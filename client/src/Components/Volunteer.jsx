import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Volunteer.css";

const Volunteer = () => {
  const [loading, setLoading] = useState(true);
  const [isVolunteer, setIsVolunteer] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const checkVolunteer = async () => {
      try {
        if (!user || !user.email) {
          navigate("/login");
          return;
        }

        const response = await axios.get(
          `https://resqreliefcheck.onrender.com/volunteer/check/${user.email}`,
        );

        if (response.data.isVolunteer) {
          // Check if we need to prompt for the password
          const needPassword = localStorage.getItem("needVolunteerPassword");
          if (needPassword === "true") {
            navigate("/volunteer-dashboard-password"); // Navigate to password input screen
          } else {
            if (response.data.profileCompleted) {
              navigate("/volunteer-dashboard");
            } else {
              navigate("/volunteer-onboarding");
            }
          }
        } else {
          setIsVolunteer(false);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false); // ✅ runs no matter what — success, error, or early return
      }
    };

    checkVolunteer();
  }, [navigate, user?.email]);

  if (loading) {
    return (
      <div className="volunteer-check-wrapper">
        <p>Checking volunteer account...</p>
      </div>
    );
  }

  return (
    <>
      {!isVolunteer && (
        <div className="volunteer-check-wrapper">
          <div className="volunteer-check-box">
            <h1>YOU DO NOT HAVE VOLUNTEER ACCOUNT YET!</h1>
            <button
              className="create-volunteer-btn"
              onClick={() => navigate("/volunteer-register")}
            >
              Create One ....
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Volunteer;
