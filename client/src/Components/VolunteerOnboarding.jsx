import React from "react";
import { useNavigate } from "react-router-dom";
import { CircleCheck, ArrowRight, Map } from "lucide-react";
import "./VolunteerOnboarding.css";

const VolunteerOnboarding = () => {
  const navigate = useNavigate();

  return (
    <div className="volunteer-onboarding-page">
      <div className="volunteer-onboarding-card">
        <CircleCheck size={40} strokeWidth={1.5} />
        <h1>
          Thank you for registering as a volunteer with ResQRelief. Your
          identity has been successfully verified.
        </h1>

        <p>
          Please continue to select your preferred disaster zones and volunteer
          roles to start helping affected communities.
        </p>
      </div>

      <div className="volunteer-onboarding-buttons">
        <button onClick={() => navigate("/volunteer-zone-select")}>
          Continue to Area &amp; Role Selection
          <ArrowRight size={15} strokeWidth={2.5} />
        </button>

        <button onClick={() => alert("Live Maps page will be added later")}>
          <Map size={15} strokeWidth={2} />
          Go to Live Maps
        </button>
      </div>
    </div>
  );
};

export default VolunteerOnboarding;
