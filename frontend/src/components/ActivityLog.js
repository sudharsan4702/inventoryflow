import React, { useEffect, useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

function ActivityLog() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = () => {
    const token = localStorage.getItem("token");
    axios.get("http://localhost:5000/activity-log", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(response => setLogs(response.data))
      .catch(error => console.error("Error fetching logs:", error));
  };
  

  return (
    <div className="container mt-4">
      <h2>Activity Log</h2>
      <table className="table table-bordered">
        <thead className="thead-dark">
          <tr>
            <th>#</th>
            <th>Action</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, index) => (
            <tr key={log._id}>
              <td>{index + 1}</td>
              <td>{log.action}</td>
              <td>{new Date(log.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ActivityLog;
