import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import {
  GoogleMap,
  MarkerF,
  InfoWindowF,
  DirectionsRenderer,
  useJsApiLoader,
} from "@react-google-maps/api";
import "./VolunteerMapBoard.css";

const defaultCenter = { lat: 23.8103, lng: 90.4125 };

const requestTypes = [
  "Medical",
  "Food",
  "Shelter",
  "Water",
  "Rescue",
  "Clothes",
];

const severityOptions = [
  { value: "emergency", label: "Emergency" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const mapContainerStyle = {
  width: "100%",
  height: "760px",
};

const volunteerIcon = "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";
const myLocationIcon =
  "http://maps.google.com/mapfiles/ms/icons/purple-dot.png";

const VolunteerMapBoard = () => {
  const user = JSON.parse(localStorage.getItem("user"));

  const [volunteerProfile, setVolunteerProfile] = useState(null);
  const [sharedVolunteers, setSharedVolunteers] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [nearbyRequests, setNearbyRequests] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [routeInfo, setRouteInfo] = useState({
    distance: "",
    duration: "",
  });

  const [requestForm, setRequestForm] = useState({
    requestType: "",
    severity: "medium",
    description: "",
    latitude: "",
    longitude: "",
    address: "",
  });

  const { isLoaded } = useJsApiLoader({
    id: "resqrelief-google-map",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const toNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  };

  const reverseGeocodeWithNominatim = useCallback(async (lat, lng) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2`;

      const response = await fetch(url, {
        headers: {
          "Accept-Language": "en",
        },
      });

      if (!response.ok) {
        return "";
      }

      const data = await response.json();
      return data?.display_name || "";
    } catch (error) {
      console.log(error);
      return "";
    }
  }, []);

  const requestStats = useMemo(() => {
    const need = allRequests.filter((r) => r.status === "need").length;
    const helping = allRequests.filter((r) => r.status === "helping").length;
    const helped = allRequests.filter((r) => r.status === "helped").length;
    return { need, helping, helped };
  }, [allRequests]);

  const requestNumberMap = useMemo(() => {
    const map = {};
    allRequests.forEach((request, index) => {
      map[request._id] = index + 1;
    });
    return map;
  }, [allRequests]);

  const getSeverityLabel = (severity) => {
    if (severity === "emergency") return "Emergency";
    if (severity === "medium") return "Medium";
    return "Low";
  };

  const getSeverityCardColor = (severity) => {
    if (severity === "emergency") return "#d9534f";
    if (severity === "medium") return "#f0ad4e";
    return "#6c757d";
  };

  const getSeverityMarkerIcon = (request) => {
    if (request.status === "helped") {
      return "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
    }

    if (request.severity === "emergency") {
      return "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
    }

    if (request.severity === "medium") {
      return "http://maps.google.com/mapfiles/ms/icons/orange-dot.png";
    }

    return "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
  };

  const loadBoard = useCallback(async () => {
    try {
      const [profileRes, volunteerRes, requestRes] = await Promise.all([
        axios.get(`http://localhost:3001/volunteer/profile/${user.email}`),
        axios.get("http://localhost:3001/volunteer/locations"),
        axios.get("http://localhost:3001/aid-requests"),
      ]);

      const profile = profileRes.data;
      const volunteers = volunteerRes.data;
      const requests = requestRes.data;

      setVolunteerProfile(profile);
      setSharedVolunteers(volunteers);
      setAllRequests(requests);

      const myLat = toNumber(profile.currentLatitude);
      const myLng = toNumber(profile.currentLongitude);

      if (profile.locationSharingEnabled && myLat !== null && myLng !== null) {
        setMapCenter({ lat: myLat, lng: myLng });
      }

      try {
        const nearbyRes = await axios.get(
          `http://localhost:3001/aid-requests/nearby/${user.email}`,
        );
        setNearbyRequests(nearbyRes.data);
      } catch (error) {
        setNearbyRequests([]);
      }
    } catch (error) {
      console.log(error);
      alert("Could not load map board data");
    }
  }, [user?.email]);

  useEffect(() => {
    if (user?.email) {
      loadBoard();
    }
  }, [user?.email, loadBoard]);

  const calculateRoute = async (destinationLat, destinationLng) => {
    if (
      !volunteerProfile?.locationSharingEnabled ||
      volunteerProfile?.currentLatitude == null ||
      volunteerProfile?.currentLongitude == null
    ) {
      return;
    }

    if (!window.google || !window.google.maps) {
      return;
    }

    try {
      const directionsService = new window.google.maps.DirectionsService();

      const results = await directionsService.route({
        origin: {
          lat: Number(volunteerProfile.currentLatitude),
          lng: Number(volunteerProfile.currentLongitude),
        },
        destination: {
          lat: Number(destinationLat),
          lng: Number(destinationLng),
        },
        travelMode: window.google.maps.TravelMode.DRIVING,
      });

      setDirectionsResponse(results);

      const leg = results.routes[0]?.legs[0];
      setRouteInfo({
        distance: leg?.distance?.text || "",
        duration: leg?.duration?.text || "",
      });
    } catch (error) {
      console.log(error);
    }
  };

  const clearRoute = () => {
    setDirectionsResponse(null);
    setRouteInfo({ distance: "", duration: "" });
  };

  const shareMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported on this browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = Number(position.coords.latitude);
        const lng = Number(position.coords.longitude);

        try {
          const address = await reverseGeocodeWithNominatim(lat, lng);

          await axios.put(
            `http://localhost:3001/volunteer/location/${user.email}`,
            {
              lat,
              lng,
              address,
            },
          );

          setMapCenter({ lat, lng });

          setSelectedMarker({
            type: "volunteer",
            title: "My Live Location",
            subtitle: address || `Lat: ${lat}, Lng: ${lng}`,
            position: { lat, lng },
          });

          await loadBoard();
          alert("Your location is now visible on the map");
        } catch (error) {
          console.log(error);
          alert("Could not share location");
        }
      },
      () => {
        alert("Location permission denied");
      },
    );
  };

  const removeMyLocation = async () => {
    try {
      await axios.delete(
        `http://localhost:3001/volunteer/location/${user.email}`,
      );
      setSelectedMarker(null);
      clearRoute();
      await loadBoard();
      alert("Your shared location was removed");
    } catch (error) {
      console.log(error);
      alert("Could not remove location");
    }
  };

  const handleMapClick = async (e) => {
    const lat = Number(e.latLng.lat());
    const lng = Number(e.latLng.lng());

    setRequestForm((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      address: "Finding location...",
    }));

    const address = await reverseGeocodeWithNominatim(lat, lng);

    setRequestForm((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      address: address || "Address not found",
    }));

    await calculateRoute(lat, lng);
  };

  const createRequest = async (e) => {
    e.preventDefault();

    if (
      !requestForm.requestType ||
      !requestForm.severity ||
      !requestForm.description ||
      !requestForm.latitude ||
      !requestForm.longitude
    ) {
      alert("Please select a map location, type, severity, and description");
      return;
    }

    try {
      await axios.post("http://localhost:3001/aid-requests", {
        createdByVolunteerId: volunteerProfile._id,
        createdByVolunteerName: volunteerProfile.fullName,
        createdByVolunteerEmail: volunteerProfile.email,
        requestType: requestForm.requestType,
        severity: requestForm.severity,
        description: requestForm.description,
        latitude: requestForm.latitude,
        longitude: requestForm.longitude,
        address: requestForm.address,
      });

      setRequestForm({
        requestType: "",
        severity: "medium",
        description: "",
        latitude: "",
        longitude: "",
        address: "",
      });

      await loadBoard();
      alert("Request posted successfully");
    } catch (error) {
      console.log(error);
      alert("Could not create request");
    }
  };

  const acceptRequest = async (requestId) => {
    try {
      await axios.put(
        `http://localhost:3001/aid-requests/${requestId}/accept`,
        {
          helperVolunteerId: volunteerProfile._id,
          helperVolunteerName: volunteerProfile.fullName,
          helperVolunteerEmail: volunteerProfile.email,
        },
      );

      await loadBoard();
      alert("You accepted this request");
    } catch (error) {
      console.log(error);
      alert("Could not accept request");
    }
  };

  const markHelped = async (requestId) => {
    try {
      await axios.put(
        `http://localhost:3001/aid-requests/${requestId}/helped`,
        {
          helperVolunteerEmail: volunteerProfile.email,
        },
      );

      await loadBoard();
      alert("Request marked as helped");
    } catch (error) {
      console.log(error);
      alert("Could not mark request as helped");
    }
  };

  const deleteRequest = async (requestId) => {
    try {
      await axios.delete(`http://localhost:3001/aid-requests/${requestId}`, {
        data: { requesterEmail: volunteerProfile.email },
      });

      await loadBoard();
      alert("Request deleted");
    } catch (error) {
      console.log(error);
      alert("Could not delete request");
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const statusLabel = (status) => {
    if (status === "need") return "NEED";
    if (status === "helping") return "COMING FOR HELP";
    return "ALREADY HELPED";
  };

  const statusClass = (status) => {
    if (status === "need") return "status-need";
    if (status === "helping") return "status-helping";
    return "status-helped";
  };

  const myLat = toNumber(volunteerProfile?.currentLatitude);
  const myLng = toNumber(volunteerProfile?.currentLongitude);

  const nearbyDistanceLimit = 10;

  const closeNearbyRequests = nearbyRequests.filter(
    (request) => request.distanceKm <= nearbyDistanceLimit,
  );

  const hasOpenCloseNearby = closeNearbyRequests.some(
    (request) => request.status !== "helped",
  );

  let displayedNearbyRequests = closeNearbyRequests;
  let nearbyInfoMessage = "";

  if (closeNearbyRequests.length === 0) {
    displayedNearbyRequests = nearbyRequests.slice(0, 5);
    nearbyInfoMessage =
      "No close nearby requests found. Showing nearest requests.";
  } else if (!hasOpenCloseNearby) {
    const fartherOpenRequests = nearbyRequests
      .filter(
        (request) =>
          request.distanceKm > nearbyDistanceLimit &&
          request.status !== "helped",
      )
      .slice(0, 5);

    displayedNearbyRequests = [...closeNearbyRequests, ...fartherOpenRequests];
    nearbyInfoMessage =
      "Nearby requests are already completed. Showing farther open requests too.";
  }

  if (!isLoaded) {
    return <div className="map-board-page">Loading map...</div>;
  }

  return (
    <div className="map-board-page">
      <div className="map-board-header">
        <h1>Volunteer Map & Request Board</h1>
        <p>
          Share your live position, view other volunteers, post emergency
          requests, and accept nearby help tasks.
        </p>
      </div>

      <div className="map-board-stats">
        <div className="map-stat-card">
          <h3>{sharedVolunteers.length}</h3>
          <p>Shared Volunteer Locations</p>
        </div>
        <div className="map-stat-card">
          <h3>{requestStats.need}</h3>
          <p>Open Requests</p>
        </div>
        <div className="map-stat-card">
          <h3>{requestStats.helping}</h3>
          <p>Accepted Requests</p>
        </div>
        <div className="map-stat-card">
          <h3>{requestStats.helped}</h3>
          <p>Helped Requests</p>
        </div>
      </div>

      <div className="map-layout">
        <div className="map-panel">
          <div className="map-toolbar">
            <button onClick={shareMyLocation}>Share My Location</button>
            <button onClick={removeMyLocation}>Remove My Location</button>
            <button onClick={clearRoute}>Clear Route</button>
          </div>

          {routeInfo.distance && routeInfo.duration && (
            <div
              style={{
                marginBottom: "10px",
                padding: "10px",
                background: "#f4f4f4",
                borderRadius: "8px",
                fontWeight: "600",
              }}
            >
              Distance: {routeInfo.distance} | Estimated Time:{" "}
              {routeInfo.duration}
            </div>
          )}

          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={11}
            onClick={handleMapClick}
          >
            {sharedVolunteers.map((volunteer) => {
              const lat = toNumber(volunteer.currentLatitude);
              const lng = toNumber(volunteer.currentLongitude);

              if (lat === null || lng === null) return null;

              const isMe = volunteer.email === user?.email;

              return (
                <MarkerF
                  key={`volunteer-${volunteer._id || volunteer.email}`}
                  position={{ lat, lng }}
                  icon={isMe ? myLocationIcon : volunteerIcon}
                  onClick={() =>
                    setSelectedMarker({
                      type: "volunteer",
                      title: isMe ? "My Live Location" : volunteer.fullName,
                      subtitle:
                        volunteer.currentAddress ||
                        `${volunteer.preferredZone || "No zone"} • ${
                          volunteer.volunteerRole || "No role"
                        }`,
                      position: { lat, lng },
                    })
                  }
                />
              );
            })}

            {volunteerProfile?.locationSharingEnabled &&
              myLat !== null &&
              myLng !== null && (
                <MarkerF
                  key="my-live-location"
                  position={{ lat: myLat, lng: myLng }}
                  icon={myLocationIcon}
                  onClick={() =>
                    setSelectedMarker({
                      type: "volunteer",
                      title: "My Live Location",
                      subtitle:
                        volunteerProfile?.currentAddress ||
                        `Lat: ${myLat}, Lng: ${myLng}`,
                      position: { lat: myLat, lng: myLng },
                    })
                  }
                />
              )}

            {allRequests.map((request) => {
              const lat = toNumber(request.latitude);
              const lng = toNumber(request.longitude);

              if (lat === null || lng === null) return null;

              const requestNumber = requestNumberMap[request._id] || 0;

              return (
                <MarkerF
                  key={`request-${request._id}`}
                  position={{ lat, lng }}
                  icon={getSeverityMarkerIcon(request)}
                  onClick={async () => {
                    setSelectedMarker({
                      type: "request",
                      title: `#${requestNumber} ${request.requestType}`,
                      subtitle: `${getSeverityLabel(
                        request.severity,
                      )} • ${request.address || "No address"}`,
                      position: { lat, lng },
                    });

                    await calculateRoute(lat, lng);
                  }}
                />
              );
            })}

            {requestForm.latitude && requestForm.longitude && (
              <MarkerF
                position={{
                  lat: Number(requestForm.latitude),
                  lng: Number(requestForm.longitude),
                }}
              />
            )}

            {directionsResponse && (
              <DirectionsRenderer
                directions={directionsResponse}
                options={{
                  suppressMarkers: true,
                }}
              />
            )}

            {selectedMarker && (
              <InfoWindowF
                position={selectedMarker.position}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div>
                  <strong>{selectedMarker.title}</strong>
                  <div style={{ marginTop: "6px" }}>
                    {selectedMarker.subtitle}
                  </div>
                </div>
              </InfoWindowF>
            )}
          </GoogleMap>
        </div>

        <div className="request-form-panel">
          <div className="request-form-title">
            Details Below for emergency Aid
          </div>

          <p className="request-form-subtitle">
            Mark the disaster location on the map, then fill in the details
            below.
          </p>

          <div className="selected-location-box">
            📍 lat: {requestForm.latitude || "--"}, lng:{" "}
            {requestForm.longitude || "--"}
            <div className="selected-address-line">
              {requestForm.address || "No address selected yet"}
            </div>
          </div>

          <div className="request-type-title">Request Type</div>

          <div className="request-type-grid">
            {requestTypes.map((type) => (
              <button
                key={type}
                type="button"
                className={`request-type-btn ${
                  requestForm.requestType === type
                    ? "request-type-btn-active"
                    : ""
                }`}
                onClick={() =>
                  setRequestForm((prev) => ({
                    ...prev,
                    requestType: type,
                  }))
                }
              >
                {type}
              </button>
            ))}
          </div>

          <div className="request-type-title">Severity Level</div>

          <div className="request-type-grid">
            {severityOptions.map((item) => (
              <button
                key={item.value}
                type="button"
                className={`request-type-btn ${
                  requestForm.severity === item.value
                    ? "request-type-btn-active"
                    : ""
                }`}
                onClick={() =>
                  setRequestForm((prev) => ({
                    ...prev,
                    severity: item.value,
                  }))
                }
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="request-desc-title">Description</div>

          <textarea
            className="request-desc-box"
            value={requestForm.description}
            onChange={(e) =>
              setRequestForm((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            placeholder="Write what help is needed..."
          />

          <button className="submit-request-btn" onClick={createRequest}>
            Submit Request →
          </button>
        </div>
      </div>

      <div className="nearby-section">
        <h2>Nearby Requests</h2>

        {nearbyInfoMessage && (
          <div
            style={{
              marginBottom: "14px",
              padding: "12px 14px",
              background: "#fff6d8",
              borderRadius: "10px",
              fontWeight: "600",
              color: "#7a5d00",
            }}
          >
            {nearbyInfoMessage}
          </div>
        )}

        <div className="table-wrapper">
          <table className="nearby-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Type</th>
                <th>Severity</th>
                <th>Address</th>
                <th>Distance</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedNearbyRequests.length === 0 ? (
                <tr>
                  <td colSpan="7">No nearby requests available right now.</td>
                </tr>
              ) : (
                displayedNearbyRequests.map((request) => (
                  <tr key={request._id}>
                    <td>{requestNumberMap[request._id] || "-"}</td>
                    <td>{request.requestType}</td>
                    <td>{getSeverityLabel(request.severity)}</td>
                    <td>{request.address || "No address"}</td>
                    <td>{request.distanceKm} km</td>
                    <td>{statusLabel(request.status)}</td>
                    <td>
                      {request.status === "need" ? (
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            hidden
                            className="table-action-btn"
                            onClick={() =>
                              calculateRoute(
                                Number(request.latitude),
                                Number(request.longitude),
                              )
                            }
                          >
                            Route
                          </button>
                          <button
                            className="table-action-btn"
                            onClick={() => acceptRequest(request._id)}
                          >
                            Help This
                          </button>
                        </div>
                      ) : request.status === "helping" ? (
                        <span className="table-status-text">
                          {request.helperVolunteerEmail ===
                          volunteerProfile?.email
                            ? "You accepted this"
                            : "Volunteer coming"}
                        </span>
                      ) : (
                        <span className="table-status-text">Completed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="all-requests-section">
        <h2>All Request Cards</h2>

        <div className="request-card-grid">
          {allRequests.length === 0 ? (
            <div className="empty-request-box">No requests posted yet.</div>
          ) : (
            allRequests.map((request) => (
              <div key={request._id} className="request-card">
                <div className="request-card-top">
                  <span
                    className={`request-status-chip ${statusClass(request.status)}`}
                  >
                    {statusLabel(request.status)}
                  </span>

                  {request.createdByVolunteerEmail ===
                    volunteerProfile?.email && (
                    <button
                      className="delete-request-btn"
                      onClick={() => deleteRequest(request._id)}
                    >
                      Delete
                    </button>
                  )}
                </div>

                <div className="request-card-type">
                  #{requestNumberMap[request._id] || "-"} {request.requestType}
                </div>

                <div
                  style={{
                    display: "inline-block",
                    marginBottom: "10px",
                    padding: "6px 10px",
                    borderRadius: "999px",
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: "700",
                    background:
                      request.status === "helped"
                        ? "#28a745"
                        : getSeverityCardColor(request.severity),
                  }}
                >
                  {request.status === "helped"
                    ? "Helped"
                    : getSeverityLabel(request.severity)}
                </div>

                <div className="request-card-address">
                  {request.address || "No address"}
                </div>

                <div className="request-card-time">
                  Posted: {formatTime(request.createdAt)}
                </div>

                <p className="request-card-description">
                  {request.description}
                </p>

                {request.status === "helping" && request.helperMessage && (
                  <div className="helper-message-box">
                    {request.helperMessage}
                  </div>
                )}

                <div className="request-card-actions">
                  {request.status === "need" &&
                    request.createdByVolunteerEmail !==
                      volunteerProfile?.email && (
                      <>
                        <button
                          hidden
                          className="help-btn"
                          onClick={() =>
                            calculateRoute(
                              Number(request.latitude),
                              Number(request.longitude),
                            )
                          }
                        >
                          Show Route
                        </button>

                        <button
                          className="help-btn"
                          onClick={() => acceptRequest(request._id)}
                        >
                          Help This Request
                        </button>
                      </>
                    )}

                  {request.status === "helping" &&
                    request.helperVolunteerEmail ===
                      volunteerProfile?.email && (
                      <button
                        className="helped-btn"
                        onClick={() => markHelped(request._id)}
                      >
                        Mark as Helped
                      </button>
                    )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default VolunteerMapBoard;
