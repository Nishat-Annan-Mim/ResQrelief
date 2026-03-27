import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "./VolunteerZoneSelect.css";

import dhakaImg from "../assets/images/dhaka.jfif";
import sylhetImg from "../assets/images/sylhet.jfif";
import rajshahiImg from "../assets/images/rajshahi.jfif";
import chattagramImg from "../assets/images/chattagram.jfif";
import rangpurImg from "../assets/images/rangpur.jfif";
import mymenshinghImg from "../assets/images/mymenshingh.jfif";
import khulnaImg from "../assets/images/khulna.jfif";
import barishalImg from "../assets/images/Barishal.jfif";

const zones = [
  { name: "Dhaka", image: dhakaImg },
  { name: "Sylhet", image: sylhetImg },
  { name: "Rajshahi", image: rajshahiImg },
  { name: "Chittagong", image: chattagramImg },
  { name: "Rangpur", image: rangpurImg },
  { name: "Mymensingh", image: mymenshinghImg },
  { name: "Khulna", image: khulnaImg },
  { name: "Barisal", image: barishalImg },
];

const VolunteerZoneSelect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user"));
  const isEditMode = location.state?.editMode || false;

  const [selectedZone, setSelectedZone] = useState("");

  useEffect(() => {
    const fetchVolunteer = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3001/volunteer/profile/${user.email}`,
        );

        if (response.data.preferredZone) {
          setSelectedZone(response.data.preferredZone);
        }
      } catch (error) {
        console.log(error);
      }
    };

    if (user?.email) {
      fetchVolunteer();
    }
  }, [user?.email]);

  const handleNext = async () => {
    if (!selectedZone) {
      alert("Please select a preferred zone");
      return;
    }

    try {
      await axios.put(`http://localhost:3001/volunteer/zone/${user.email}`, {
        preferredZone: selectedZone,
      });

      navigate("/volunteer-role-setup", {
        state: { editMode: isEditMode },
      });
    } catch (error) {
      console.log(error);
      alert("Could not save zone");
    }
  };

  return (
    <div className="zone-page">
      <div className="zone-title-box">
        <h1>Select Your Zones & Roles</h1>
      </div>

      <div className="zone-selected-box">
        Preferred Disaster Zone -{" "}
        <span>{selectedZone ? selectedZone.toUpperCase() : "NONE"}</span>
      </div>

      <div className="zone-grid">
        {zones.map((zone) => (
          <div
            key={zone.name}
            className={`zone-card ${
              selectedZone === zone.name ? "zone-card-active" : ""
            }`}
            onClick={() => setSelectedZone(zone.name)}
          >
            <img src={zone.image} alt={zone.name} />
            <h2>{zone.name.toUpperCase()}</h2>
          </div>
        ))}
      </div>

      <div className="zone-next-wrap">
        <button onClick={handleNext}>
          {isEditMode ? "NEXT TO EDIT ROLE →" : "NEXT →"}
        </button>
      </div>
    </div>
  );
};

export default VolunteerZoneSelect;
