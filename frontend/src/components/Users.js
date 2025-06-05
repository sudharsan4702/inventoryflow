import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaUserPlus, FaTrash, FaEdit, FaSave, FaTimes } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";

function Users() {
  const [users, setUsers] = useState([]);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editedUser, setEditedUser] = useState({});
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "Staff", password: "" });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchUsers();
    checkAdminStatus();
  }, []);

  const fetchUsers = () => {
    const token = localStorage.getItem("token");
    axios.get("http://localhost:5000/staff", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(response => setUsers(response.data))
    .catch(error => console.error("Error fetching users:", error));
  };

  const checkAdminStatus = () => {
    const role = localStorage.getItem("role");
    setIsAdmin(role === "Admin");
  };

  const handleEdit = (user) => {
    setEditingUserId(user._id);
    setEditedUser({ ...user });
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditedUser({});
  };

  const handleSaveEdit = (id) => {
    const token = localStorage.getItem("token");
    axios.put(`http://localhost:5000/update-staff/${id}`, editedUser, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(() => {
      fetchUsers();
      setEditingUserId(null);
    })
    .catch(error => console.error("Error updating user:", error));
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      const token = localStorage.getItem("token");
      axios.delete(`http://localhost:5000/delete-staff/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(() => fetchUsers())
      .catch(error => console.error("Error deleting user:", error));
    }
  };

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert("Please fill in all fields.");
      return;
    }

    const token = localStorage.getItem("token");
    axios.post("http://localhost:5000/add-staff", newUser, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(() => {
      fetchUsers();
      setNewUser({ name: "", email: "", role: "Staff", password: "" });
    })
    .catch(error => console.error("Error adding user:", error));
  };

  return (
    <div className="container mt-4">
      <h2>User Management</h2>

      {isAdmin && (
        <div className="card p-3 mb-4">
          <h5>Add Staff</h5>
          <div className="row">
            <div className="col-md-3">
              <input type="text" className="form-control" placeholder="Name" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
            </div>
            <div className="col-md-3">
              <input type="email" className="form-control" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
            </div>
            <div className="col-md-2">
              <select className="form-control" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                <option value="Staff">Staff</option>
                <option value="Manager">Manager</option>
              </select>
            </div>
            <div className="col-md-2">
              <input type="password" className="form-control" placeholder="Password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
            </div>
            <div className="col-md-2">
              <button className="btn btn-success w-100" onClick={handleAddUser}>
                <FaUserPlus /> Add Staff
              </button>
            </div>
          </div>
        </div>
      )}

      <table className="table table-bordered">
        <thead className="thead-dark">
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            {isAdmin && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {users.map((user, index) => (
            <tr key={user._id}>
              <td>{index + 1}</td>
              <td>
                {editingUserId === user._id ? (
                  <input type="text" value={editedUser.name} onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })} className="form-control" />
                ) : (
                  user.name
                )}
              </td>
              <td>
                {editingUserId === user._id ? (
                  <input type="email" value={editedUser.email} onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })} className="form-control" />
                ) : (
                  user.email
                )}
              </td>
              <td>
                {editingUserId === user._id ? (
                  <select value={editedUser.role} onChange={(e) => setEditedUser({ ...editedUser, role: e.target.value })} className="form-control">
                    <option value="Staff">Staff</option>
                    <option value="Manager">Manager</option>
                  </select>
                ) : (
                  user.role
                )}
              </td>
              {isAdmin && (
                <td>
                  {editingUserId === user._id ? (
                    <>
                      <button className="btn btn-success btn-sm me-2" onClick={() => handleSaveEdit(user._id)}><FaSave /></button>
                      <button className="btn btn-secondary btn-sm" onClick={handleCancelEdit}><FaTimes /></button>
                    </>
                  ) : (
                    <>
                      <button className="btn btn-warning btn-sm me-2" onClick={() => handleEdit(user)}><FaEdit /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(user._id)}><FaTrash /></button>
                    </>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Users;
