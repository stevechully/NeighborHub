import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // ✅ Added Link import
import { supabase } from '../../lib/supabase'; 
import '../../styles/login.css';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
  
    try {
      // ✅ IMPORTANT: clear any broken session before login
      await supabase.auth.signOut();
  
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
  
      if (error) throw error;
  
      if (!data?.session) {
        throw new Error("Login succeeded but session was not created.");
      }
  
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleLogin}>
        <h2>Resident Portal Login</h2>
        <div className="field">
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        
        <button type="submit" disabled={loading} className="login-button">
          {loading ? 'Logging in...' : 'Login'}
        </button>

        {/* ✅ Added Signup Link */}
        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
          New user?{' '}
          <Link to="/signup" style={{ color: '#007bff', textDecoration: 'none', fontWeight: 500 }}>
            Create account
          </Link>
        </p>

      </form>
    </div>
  );
}