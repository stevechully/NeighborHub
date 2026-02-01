import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signupUser } from "../../api/auth.api";

export default function Signup() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("RESIDENT");
  const [workerType, setWorkerType] = useState(""); // ✅ New State for Worker Type
  const [loading, setLoading] = useState(false);

  // ✅ Worker Type Options
  const workerTypes = useMemo(() => [
    "ELECTRICIAN",
    "PLUMBER",
    "CARPENTER",
    "CLEANER",
    "GARDENER",
  ], []);

  async function handleSignup(e) {
    e.preventDefault();

    try {
      setLoading(true);

      // ✅ Construct Payload
      const payload = {
        full_name: fullName,
        email: email,
        password: password,
        role: role,
      };

      // ✅ Add worker_type only if role is WORKER
      if (role === "WORKER") {
        if (!workerType) {
          throw new Error("Please select a worker type");
        }
        payload.worker_type = workerType;
      }

      await signupUser(payload);

      alert("Signup successful ✅ Please login with your credentials.");
      navigate("/login");
    } catch (err) {
      alert(err.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 40, maxWidth: 450, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h2>Create Account</h2>
        <p style={{ color: "#666" }}>Join the Resident Portal community</p>
      </div>

      <form onSubmit={handleSignup} style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={labelStyle}>Full Name</label>
          <input
            style={inputStyle}
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={labelStyle}>Email Address</label>
          <input
            style={inputStyle}
            placeholder="name@example.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={labelStyle}>Password</label>
          <input
            style={inputStyle}
            placeholder="••••••••"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={labelStyle}>Select Your Role</label>
          <select 
            style={inputStyle} 
            value={role} 
            onChange={(e) => {
                setRole(e.target.value);
                if (e.target.value !== "WORKER") setWorkerType(""); // Reset workerType if role changes
            }}
            disabled={loading}
          >
            <option value="RESIDENT">Resident</option>
            <option value="SELLER">Seller (Marketplace)</option>
            <option value="SECURITY">Security</option>
            <option value="WORKER">Worker</option>
          </select>
        </div>

        {/* ✅ Conditional Worker Type Dropdown */}
        {role === "WORKER" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
            <label style={labelStyle}>Worker Type</label>
            <select
              style={inputStyle}
              value={workerType}
              onChange={(e) => setWorkerType(e.target.value)}
              required
              disabled={loading}
            >
              <option value="">Select Worker Type</option>
              {workerTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          style={{
            ...buttonStyle,
            backgroundColor: loading ? "#ccc" : "#007bff",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Processing..." : "Sign Up"}
        </button>

        <p style={{ textAlign: "center", marginTop: 16, fontSize: "0.9rem" }}>
          Already have an account? <Link to="/login" style={{ color: "#007bff", textDecoration: "none", fontWeight: "bold" }}>Login here</Link>
        </p>
      </form>
    </div>
  );
}

// Styles
const labelStyle = {
  fontSize: "0.85rem",
  fontWeight: "600",
  color: "#444",
};

const inputStyle = {
  padding: "10px",
  borderRadius: "6px",
  border: "1px solid #ddd",
  fontSize: "1rem",
};

const buttonStyle = {
  padding: "12px",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  fontSize: "1rem",
  fontWeight: "bold",
  marginTop: "10px",
  transition: "background-color 0.2s",
};