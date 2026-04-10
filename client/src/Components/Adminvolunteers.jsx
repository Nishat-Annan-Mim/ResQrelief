import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Adminvolunteers.css";

const Adminvolunteers = () => {
  const [volunteers, setVolunteers] = useState([]);

  useEffect(() => {
    // Fetch volunteers with "pending" status
    axios
      .get("http://localhost:3001/api/volunteers/all")
      .then((response) => {
        setVolunteers(
          response.data.filter(
            (volunteer) =>
              volunteer.status === "pending" || volunteer.status == null,
          ),
        );
      })
      .catch((error) => console.log(error));
  }, []);

  const confirmVolunteer = (volunteerId) => {
    // Confirm volunteer's registration by updating their status
    axios
      .put(`http://localhost:3001/api/volunteer/confirm/${volunteerId}`)
      .then(() => {
        setVolunteers(volunteers.filter((vol) => vol._id !== volunteerId)); // Remove confirmed volunteer from the list
      })
      .catch((error) => console.log(error));
  };

  return (
    <div>
      <h1>Volunteer Registration Confirmation</h1>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {volunteers.map((volunteer) => (
            <tr key={volunteer._id}>
              <td>{volunteer.fullName}</td>
              <td>{volunteer.email}</td>
              <td>{volunteer.phone}</td>
              <td>{volunteer.status}</td>
              <td>
                <button onClick={() => confirmVolunteer(volunteer._id)}>
                  Confirm
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Adminvolunteers;
