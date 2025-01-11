import React, { useState, useEffect } from "react";
import './App.css';

/**
 * The main component for the User Management application.
 * 
 * @component
 * @returns {JSX.Element} The rendered component.
 * 
 * @example
 * <App />
 * 
 * @description
 * This component handles the following functionalities:
 * - Fetching and displaying a list of users.
 * - Adding a new user.
 * - Deleting a user by ID.
 * - Filtering users by role.
 * - Decrypting sensitive user data using a private key.
 * 
 * @function
 * @name App
 * 
 * @property {Array} users - The list of users.
 * @property {Function} setUsers - Function to update the list of users.
 * @property {Object} newUser - The new user to be added.
 * @property {Function} setNewUser - Function to update the new user.
 * @property {string} roleFilter - The role to filter users by.
 * @property {Function} setRoleFilter - Function to update the role filter.
 * @property {string} deleteUserId - The ID of the user to be deleted.
 * @property {Function} setDeleteUserId - Function to update the user ID to be deleted.
 * 
 * @function handleApiResponse
 * @description Handles the API response, checking for errors and returning the JSON data.
 * @param {Response} response - The API response.
 * @returns {Promise<Object>} The JSON data from the response.
 * 
 * @function pemToArrayBuffer
 * @description Converts a PEM encoded string to an ArrayBuffer.
 * @param {string} pem - The PEM encoded string.
 * @returns {ArrayBuffer} The ArrayBuffer representation of the PEM string.
 * 
 * @function importPrivateKey
 * @description Imports a PEM encoded private key for use with the Web Crypto API.
 * @param {string} pemKey - The PEM encoded private key.
 * @returns {Promise<CryptoKey>} The imported private key.
 * 
 * @function decryptWithPrivateKey
 * @description Decrypts data using the imported private key.
 * @param {string} encryptedData - The encrypted data in base64 format.
 * @returns {Promise<string>} The decrypted data as a string.
 * 
 * @function displayUsers
 * @description Fetches and displays the list of users, decrypting their sensitive data.
 * @returns {Promise<void>}
 * 
 * @function addUser
 * @description Adds a new user by sending a POST request to the API.
 * @returns {Promise<void>}
 * 
 * @function deleteUser
 * @description Deletes a user by sending a DELETE request to the API.
 * @returns {Promise<void>}
 * 
 * @function filterUsersByRole
 * @description Fetches and displays users filtered by role, decrypting their sensitive data.
 * @returns {Promise<void>}
 */
function App() {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "" });
  const [roleFilter, setRoleFilter] = useState("");
  const [deleteUserId, setDeleteUserId] = useState("");
  // const [publicKey, setPublicKey] = useState("");
  // const crypto = require('crypto');

  useEffect(() => {
    displayUsers();
  }, []);

  const handleApiResponse = async (response) => {
    if (response.ok) {
      return response.json();
    }
    const errorData = await response.json();
    alert(`Error: ${errorData.message || response.statusText}`);
    throw new Error(errorData.message || response.statusText);
  };

  // Helper function to convert PEM to ArrayBuffer
  const pemToArrayBuffer = (pem) => {
    const b64Lines = pem.replace(/-----.*-----/g, "").replace(/\s/g, "");
    const b64Decoded = atob(b64Lines);
    const arrayBuffer = new Uint8Array(b64Decoded.length);
    for (let i = 0; i < b64Decoded.length; i++) {
      arrayBuffer[i] = b64Decoded.charCodeAt(i);
    }
    return arrayBuffer.buffer;
  };

  // Function to import the private key correctly
  const importPrivateKey = async (pemKey) => {
    const binaryDer = pemToArrayBuffer(pemKey);

    return await window.crypto.subtle.importKey(
      "pkcs8", // Key format for private keys
      binaryDer, // Binary DER format
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      false, // Non-extractable key
      ["decrypt"] // Key usage
    );
  };

  // Corrected decrypt function
  const decryptWithPrivateKey = async (encryptedData) => {
    const privateKeyPEM =process.env.REACT_APP_PRIVATE_KEY;
    const privateKey = await importPrivateKey(privateKeyPEM);
    const decodedData = Uint8Array.from(atob(encryptedData), (c) =>
      c.charCodeAt(0)
    );

    const decrypted = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      decodedData
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  };

  const displayUsers = async () => {
    try {
      const response = await fetch("http://localhost:3301/api/users");
      const users = await handleApiResponse(response);

      // Decrypt each user's sensitive data
      const decryptedUsers = users.map((user) => ({
        ...user,
        id: decryptWithPrivateKey(user.id),
        name: decryptWithPrivateKey(user.name),
        email: decryptWithPrivateKey(user.email),
        role: decryptWithPrivateKey(user.role),
      }));

      setUsers(decryptedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const addUser = async () => {
    const { name, email, role } = newUser;

    if (!name || !email || !role) {
      alert("All fields are required");
      return;
    }

    try {
      const response = await fetch("http://localhost:3301/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });

      const data = await handleApiResponse(response);
      alert(`User added: ${data.name}`);
      setNewUser({ name: "", email: "", role: "" });
      displayUsers(); // Refresh the user list
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };

  const deleteUser = async () => {
    if (!deleteUserId) {
      alert("User ID is required");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3301/api/users/${deleteUserId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        alert("User deleted successfully");
        displayUsers(); // Refresh the user list
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const filterUsersByRole = async () => {
    if (!roleFilter) {
      alert("Please specify a role");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3301/api/users/${roleFilter}`
      );
      const users = await handleApiResponse(response);
      const decryptedUsers = users.map((user) => ({
        ...user,
        id: decryptWithPrivateKey(user.id),
        name: decryptWithPrivateKey(user.name),
        email: decryptWithPrivateKey(user.email),
        role: decryptWithPrivateKey(user.role),
      }));

      setUsers(decryptedUsers);
    } catch (error) {
      console.error("Error fetching users by role:", error);
    }
  };

  return (
    <div>
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
        User Management
      </h1>

      <div style={{ marginBottom: "30px" }}>
        <h2>Add User</h2>
        <label style={{ marginRight: "10px" }}>Name:</label>
        <input
          type="text"
          value={newUser.name}
          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
          style={{ marginBottom: "10px", padding: "8px", width: "250px" }}
        />
        <br />
        <label style={{ marginRight: "10px" }}>Email:</label>
        <input
          type="email"
          value={newUser.email}
          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
          style={{ marginBottom: "10px", padding: "8px", width: "250px" }}
        />
        <br />
        <label style={{ marginRight: "10px" }}>Role:</label>
        <input
          type="text"
          value={newUser.role}
          onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
          style={{ marginBottom: "10px", padding: "8px", width: "250px" }}
        />
        <br />
        <button
          onClick={addUser}
          style={{
            padding: "10px 15px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          Add User
        </button>
      </div>

      <div style={{ marginBottom: "30px" }}>
        <h2>Get Users by Role</h2>
        <label style={{ marginRight: "10px" }}>Role:</label>
        <input
          type="text"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ marginBottom: "10px", padding: "8px", width: "250px" }}
        />
        <br />
        <button
          onClick={filterUsersByRole}
          style={{
            padding: "10px 15px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          Filter by Role
        </button>
      </div>

      <div style={{ marginBottom: "30px" }}>
        <h2>Delete User</h2>
        <label style={{ marginRight: "10px" }}>User ID:</label>
        <input
          type="text"
          value={deleteUserId}
          onChange={(e) => setDeleteUserId(e.target.value)}
          style={{ marginBottom: "10px", padding: "8px", width: "250px" }}
        />
        <br />
        <button
          onClick={deleteUser}
          style={{
            padding: "10px 15px",
            backgroundColor: "#f44336",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          Delete User
        </button>
      </div>

      <div style={{ marginTop: "30px" }}>
        <h2>Users List</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ padding: "8px", border: "1px solid #ddd" }}>ID</th>
              <th style={{ padding: "8px", border: "1px solid #ddd" }}>Name</th>
              <th style={{ padding: "8px", border: "1px solid #ddd" }}>
                Email
              </th>
              <th style={{ padding: "8px", border: "1px solid #ddd" }}>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                  {user.id}
                </td>
                <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                  {user.name}
                </td>
                <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                  {user.email}
                </td>
                <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                  {user.role}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
