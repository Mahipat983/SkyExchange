import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authController, userController } from '../controllers';
import { useAuthStore } from '../store/authStore';
import { useSnackbarStore } from '../store/snackbarStore';
import '../styles/style-login.css';

function LoginPage() {
  const [validationCode, setValidationCode] = useState('');
  const [loginName, setLoginName] = useState('');
  const [password, setPassword] = useState('');
  const [validationInput, setValidationInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('login'); // 'login' or 'forgot'
  const [forgotMobile, setForgotMobile] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const loginAction = useAuthStore((state) => state.login);
  const showSnackbar = useSnackbarStore(state => state.show);

  const generateCode = () => String(Math.floor(1000 + Math.random() * 9000));

  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) {
      navigate('/?login=true', { replace: true });
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setValidationCode(generateCode());
    setView('login');

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [navigate]);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
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
      const ip = '127.0.0.1';
      const response = await authController.login({
        username: loginName,
        password: password,
        ip: ip
      });

      if (response.error === '0') {
        const token = response.LoginToken || response.apitoken || response.token;
        loginAction(response.username || loginName, token);
        showSnackbar('Login Successful', 'success');
        navigate('/');
      } else {
        showSnackbar(response.msg || 'Login failed.', 'error');
        setValidationCode(generateCode());
        setValidationInput('');
      }
    } catch (error) {
      console.error('Login Error:', error);
      showSnackbar('An unexpected error occurred during login.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppClick = async (e) => {
    if (e) e.preventDefault();
    try {
      const res = await userController.getWhatsAppLink();
      let targetLink = 'https://go.wa.link/ambikaexchangesupport';
      if (res) {
        if (res.error === '0' && res.Link) targetLink = res.Link;
        else if (res.url) targetLink = res.url;
        else if (typeof res === 'string' && res.startsWith('http')) targetLink = res;
      }
      window.open(targetLink, '_blank');
    } catch (err) {
      window.open('https://go.wa.link/ambikaexchangesupport', '_blank');
    }
  };

  const handleForgotPassword = async (e) => {
    if (e) e.preventDefault();
    if (!forgotMobile.trim()) {
      showSnackbar('Please enter mobile number', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await authController.forgotPassword(forgotMobile);
      if (response.error === '0') {
        showSnackbar(response.msg || 'Password reset request sent!', 'success');
        setView('login');
      } else {
        showSnackbar(response.msg || 'Failed to request password reset', 'error');
      }
    } catch (err) {
      console.error(err);
      showSnackbar('Error processing request', 'error');
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
            onClick={() => navigate("/")}
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
          {view === 'login' ? (
            <form className="login-form" onSubmit={handleLogin}>
              <input
                type="text"
                placeholder="Username"
                className="form-input"
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
              />
              <div className="password-input-wrapper" style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '15px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#666',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0'
                  }}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
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
                <span 
                  className="forgot-password-link" 
                  onClick={() => setView('forgot')}
                  style={{ cursor: 'pointer' }}
                >
                  Forgot Password?
                </span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="login-btn" style={{ flex: 1 }} disabled={loading}>
                  {loading ? '...' : 'Login'}
                </button>
                <button type="button" className="login-btn" style={{ flex: 1 }}>Demo</button>
              </div>

              <div className="signup-prompt">
                Don't have an account? <a href="/signup" className="signup-link">Sign up</a>
              </div>

              <div className="extra-buttons-row">
                <a href="https://go.wa.link/ambikaexchangesupport" onClick={handleWhatsAppClick} className="extra-btn whatsapp-btn">
                  <i className="fab fa-whatsapp"></i> WhatsApp
                </a>
                <a href="/download/app.apk" className="extra-btn apk-btn">
                  <i className="fas fa-download"></i> Download APK
                </a>
              </div>
            </form>
          ) : (
            <form className="login-form" onSubmit={handleForgotPassword}>
              <h2 style={{ color: '#ffc107', marginBottom: '10px' }}>Forgot Password</h2>
              <p style={{ color: '#fff', fontSize: '14px', marginBottom: '20px' }}>Enter your mobile number to reset your password.</p>
              <input
                type="text"
                placeholder="Mobile Number"
                className="form-input"
                value={forgotMobile}
                onChange={(e) => setForgotMobile(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="login-btn" style={{ flex: 1 }} disabled={loading}>
                  {loading ? '...' : 'Submit'}
                </button>
                <button 
                  type="button" 
                  className="login-btn" 
                  style={{ flex: 1, backgroundColor: '#6c757d' }} 
                  onClick={() => setView('login')}
                >
                  Back
                </button>
              </div>
            </form>
          )}

        </main>
      </div>
    </div>
  );
}

export default LoginPage;
