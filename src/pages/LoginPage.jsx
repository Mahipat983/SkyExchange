import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authController } from '../controllers';
import { useAuthStore } from '../store/authStore';
import { useSnackbarStore } from '../store/snackbarStore';
import '../styles/style-login.css';

function LoginPage() {
  const [validationCode, setValidationCode] = useState('');
  const [loginName, setLoginName] = useState('');
  const [password, setPassword] = useState('');
  const [validationInput, setValidationInput] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const loginAction = useAuthStore((state) => state.login);
  const showSnackbar = useSnackbarStore(state => state.show);

  const generateCode = () => String(Math.floor(1000 + Math.random() * 9000));

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setValidationCode(generateCode());
    
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginName.trim()) { showSnackbar('Username is empty', 'error'); return; }
    if (!password.trim()) { showSnackbar('Password is empty', 'error'); return; }
    if (validationInput.trim() !== validationCode) {
      showSnackbar('Invalid Validation Code!', 'error');
      setValidationCode(generateCode());
      setValidationInput('');
      return;
    }

    try {
      setLoading(true);
      // Fetch user's current logic IP or just pass a mock if not available
      const ip = '127.0.0.1'; // Simple placeholder if no IP fetcher
      const response = await authController.login({
        username: loginName,
        password: password,
        ip: ip
      });

      if (response.error === '0') {
        // Success
        loginAction(response.username || loginName, response.LoginToken);
        showSnackbar('Login Successful', 'success');
        navigate('/');
      } else {
        // Error from API
        showSnackbar(response.msg || 'Login failed. Please check your credentials.', 'error');
        setValidationCode(generateCode());
        setValidationInput('');
      }
    } catch (error) {
      console.error('Login Error:', error);
      showSnackbar('An expected error occurred during login.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='login-bg'>
      <div className="mobile-container login-page-wrap">
        {/* Header with logo + background */}
        <div className="header-section">
          <button
            className="close-btn"
            onClick={() => navigate(-1)}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: '15px',
              right: '15px',
              width: '20px',
              height: '20px',
              background: 'white url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M17 0a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V3a3 3 0 0 1 3-3h14Zm-3.014 5L10 8.986 6.014 5 5 6.014 8.986 10 5 13.986 6.014 15 10 11.014 13.986 15 15 13.986 11.014 10 15 6.014 13.986 5Z\' fill=\'%23000\' fill-rule=\'evenodd\'/%3E%3C/svg%3E") center / contain no-repeat',
              border: 'none',
              cursor: 'pointer',
            }}
          ></button>
          <div className="logo-container">
            <img src="/images/logo.png" width="170" alt="Sky247 Logo" className="logo-img" />
          </div>
        </div>

        {/* Login Form */}
        <main className="content-section">
          <form className="login-form" onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="kabira00025"
              className="form-input"
              value={loginName}
              onChange={(e) => setLoginName(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="validation-input-wrapper">
              <input
                type="text"
                placeholder="Validation Code"
                className="form-input"
                value={validationInput}
                onChange={(e) => setValidationInput(e.target.value)}
                maxLength="4"
              />
              <span className="captcha-code" onClick={() => setValidationCode(generateCode())}>
                {validationCode}
              </span>
            </div>
            <div className="forgot-password-wrap">
              <a href="#" className="forgot-password-link">Forgot Password?</a>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="login-btn" style={{ flex: 1 }}>Login</button>
              <button type="button" className="login-btn" style={{ flex: 1 }}>Demo</button>
            </div>

            <div className="signup-prompt">
              Don't have an account? <a href="/signup" className="signup-link">Sign up</a>
            </div>
            
            <div className="extra-buttons-row">
              <a href="https://wa.me/yournumber" className="extra-btn whatsapp-btn">
                <i className="fab fa-whatsapp"></i> WhatsApp
              </a>
              <a href="/download/app.apk" className="extra-btn apk-btn">
                <i className="fas fa-download"></i> Download APK
              </a>
            </div>
          </form>

        </main>
      </div>
    </div>
  );
}

export default LoginPage;
