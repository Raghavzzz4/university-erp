// frontend/src/pages/Login.jsx
import { useState } from 'react';
import API from '../api';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  
  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student'); // Default role
  
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      let response;
      
      if (isLogin) {
        response = await API.post('/auth/login', { email, password });
      } else {
        // Now sending the role during registration!
        response = await API.post('/auth/register', { name, email, password, role });
      }

      const { data } = response;
      
      // Save credentials
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.user.role);
      localStorage.setItem('userId', data.user.id);

      // --- SMART REDIRECT LOGIC ---
      if (data.user.role === 'admin') {
        window.location.href = '/admin';
      } else if (data.user.role === 'accountant') {
        window.location.href = '/accountant';
      } else {
        window.location.href = '/dashboard';
      }

    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f4f7f6' }}>
      <div style={{ background: 'white', padding: '2.5rem', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        
        <h2 style={{ textAlign: 'center', color: '#003366', marginBottom: '1.5rem' }}>
          {isLogin ? 'University Portal Login' : 'Register New Account'}
        </h2>

        {error && <div style={{ background: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '4px', marginBottom: '15px', textAlign: 'center', fontSize: '0.9rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          
          {/* Only show Name and Role fields if Registering */}
          {!isLogin && (
            <>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Full Name</label>
                <input type="text" className="form-control" style={{ width: '100%', padding: '10px' }} value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Account Type</label>
                <select className="form-control" style={{ width: '100%', padding: '10px' }} value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="student">Student</option>
                  <option value="admin">Administrator</option>
                  <option value="accountant">Accountant / Finance</option>
                </select>
              </div>
            </>
          )}

          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Email Address</label>
            <input type="email" className="form-control" style={{ width: '100%', padding: '10px' }} value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Password</label>
            <input type="password" className="form-control" style={{ width: '100%', padding: '10px' }} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: '1rem', backgroundColor: '#003366', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
          <span style={{ color: '#666' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button 
            type="button" 
            style={{ background: 'none', border: 'none', color: '#003366', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
          >
            {isLogin ? 'Register Here' : 'Login Here'}
          </button>
        </div>

      </div>
    </div>
  );
}