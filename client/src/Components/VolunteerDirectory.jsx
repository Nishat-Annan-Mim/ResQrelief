import React, { useEffect, useState } from "react";
import axios from "axios";
import "./VolunteerDirectory.css";

const VolunteerDirectory = () => {
  const [groupedVolunteers, setGroupedVolunteers] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState("All");

  useEffect(() => {
    const fetchVolunteers = async () => {
      try {
        const response = await axios.get(
          "https://resqreliefcheck.onrender.com/volunteers/grouped-by-zone",
        );
        setGroupedVolunteers(response.data);
      } catch (error) {
        console.log(error);
        alert("Could not load volunteer directory");
      } finally {
        setLoading(false);
      }
    };

    fetchVolunteers();
  }, []);

  const allZoneNames = Object.keys(groupedVolunteers);

  const zoneNames =
    zoneFilter === "All"
      ? allZoneNames
      : allZoneNames.filter((zone) => zone === zoneFilter);

  if (loading) {
    return (
      <div className="volunteer-directory-page">Loading volunteers...</div>
    );
  }

  return (
    <div className="volunteer-directory-page">
      <div className="volunteer-directory-header">
        <h1>Volunteer Directory</h1>
        <p>
          View all registered volunteers grouped by their selected disaster
          zone.
        </p>
      </div>

      <div className="directory-controls">
        <div className="directory-search">
          <input
            type="text"
            placeholder="Search volunteer by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="directory-filter">
          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
          >
            <option value="All">All Zones</option>
            <option value="Dhaka">Dhaka</option>
            <option value="Sylhet">Sylhet</option>
            <option value="Rajshahi">Rajshahi</option>
            <option value="Chittagong">Chittagong</option>
            <option value="Rangpur">Rangpur</option>
            <option value="Mymensingh">Mymensingh</option>
            <option value="Khulna">Khulna</option>
            <option value="Barisal">Barisal</option>
          </select>
        </div>
      </div>

      {zoneNames.length === 0 ? (
        <div className="no-volunteers-box">
          No completed volunteer profiles found yet.
        </div>
      ) : (
        zoneNames.map((zone) => {
          const filteredVolunteers = groupedVolunteers[zone].filter(
            (volunteer) =>
              volunteer.fullName.toLowerCase().includes(search.toLowerCase()),
          );

          if (filteredVolunteers.length === 0) {
            return null;
          }

          return (
            <div key={zone} className="zone-section">
              <h2 className="zone-heading">{zone.toUpperCase()}</h2>

              <div className="table-wrapper">
                <table className="volunteer-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Preferred Role</th>
                      <th>Available Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVolunteers.map((volunteer) => (
                      <tr key={volunteer._id}>
                        <td>{volunteer.fullName}</td>
                        <td>{volunteer.email}</td>
                        <td>{volunteer.phone}</td>
                        <td>{volunteer.volunteerRole || "Not set"}</td>
                        <td>
                          {volunteer.availableFrom && volunteer.availableUntil
                            ? `${volunteer.availableFrom} to ${volunteer.availableUntil}`
                            : "Not set"}
                          <br />
                          <span className="preferred-time-inline">
                            {volunteer.preferredTime || "No preferred time"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default VolunteerDirectory;
