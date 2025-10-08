import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("fullName", fullName);
    formData.append("email", email);
    formData.append("username", username);
    formData.append("password", password);
    if (avatarFile) formData.append("avatar", avatarFile);
    if (coverFile) formData.append("coverImage", coverFile);

    try {
      await axios.post("http://localhost:8000/api/v1/users/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("User registered successfully!");
      navigate("/"); // ✅ Redirect to Home
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div>
      <h1>Register</h1>
      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <br />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <br />
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <br />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setAvatarFile(e.target.files[0])}
        />
        <br />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setCoverFile(e.target.files[0])}
        />
        <br />
        <button type="submit">Register</button>
      </form>
    </div>
  );
}

export default Register;
