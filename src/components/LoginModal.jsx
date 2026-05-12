import React, { useState, useEffect } from 'react';
import { authController } from '../controllers';
import { useAuthStore } from '../store/authStore';
import { useSnackbarStore } from '../store/snackbarStore';
import { useUIStore } from '../store/uiStore';

function LoginModal({ isOpen, onClose }) {
  const loginModalView = useUIStore(state => state.loginModalView);
  const [validationCode, setValidationCode] = useState('');
  const [loginName, setLoginName] = useState('');
  const [password, setPassword] = useState('');
  const [validationInput, setValidationInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('login'); // 'login' or 'forgot'
  const [forgotMobile, setForgotMobile] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const loginAction = useAuthStore((state) => state.login);
  const showSnackbar = useSnackbarStore(state => state.show);

  const generateCode = () => String(Math.floor(1000 + Math.random() * 9000));

  useEffect(() => {
    if (isOpen) {
      setValidationCode(generateCode());
      setView(loginModalView || 'login'); // Use view from store
    }
  }, [isOpen, loginModalView]);

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
      const response = await authController.login({
        username: loginName,
        password: password,
        ip: '127.0.0.1'
      });

      if (response.error === '0') {
        const token = response.LoginToken || response.apitoken || response.token;
        loginAction(response.username || loginName, token);
        showSnackbar('Login Successful', 'success');
        onClose();
      } else {
        showSnackbar(response.msg || 'Login failed.', 'error');
        setValidationCode(generateCode());
        setValidationInput('');
      }
    } catch (error) {
      console.error('Modal Login Error:', error);
      showSnackbar('Error during login.', 'error');
    } finally {
      setLoading(false);
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

  if (!isOpen) return null;

  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <div className="login-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Left panel - dark with logo */}
        <div className="login-modal-left">
          <img src="/images/logo.png" alt="SKY247" className="login-modal-logo" />
        </div>

        {/* Right panel - yellow with form */}
        <div className="login-modal-right">
          <button className="login-modal-close" onClick={onClose}>✕</button>

          {view === 'login' ? (
            <>
              <h3 className="login-modal-title">Please login to continue</h3>
              <form onSubmit={handleLogin} className="login-modal-form">
                <input
                  type="text"
                  placeholder="kabira00025"
                  className="login-modal-input"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                />
                <div className="password-input-wrapper" style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="login-modal-input"
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
                <div className="login-modal-valid-wrap">
                  <input
                    type="text"
                    placeholder="Validation Code"
                    className="login-modal-input"
                    value={validationInput}
                    onChange={(e) => setValidationInput(e.target.value)}
                    maxLength="4"
                  />
                  <span
                    className="login-modal-captcha"
                    onClick={() => setValidationCode(generateCode())}
                    title="Click to refresh"
                  >
                    {validationCode}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                  <button type="submit" className="login-modal-btn" style={{ flex: 1 }} disabled={loading}>
                    {loading ? '...' : 'Login'}
                  </button>
                  <button type="button" className="login-modal-btn" style={{ flex: 1 }}>
                    Demo
                  </button>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <span
                    onClick={() => setView('forgot')}
                    style={{ fontSize: '11px', color: '#333', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
                  >
                    Forgot Password?
                  </span>
                </div>
              </form>
            </>
          ) : (
            <>
              <h3 className="login-modal-title">Forgot Password</h3>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>Enter your mobile number to reset your password.</p>
              <form onSubmit={handleForgotPassword} className="login-modal-form">
                <input
                  type="text"
                  placeholder="Mobile Number"
                  className="login-modal-input"
                  value={forgotMobile}
                  onChange={(e) => setForgotMobile(e.target.value)}
                />

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="submit" className="login-modal-btn" style={{ flex: 1 }} disabled={loading}>
                    {loading ? '...' : 'Submit'}
                  </button>
                  <button
                    type="button"
                    className="login-modal-btn"
                    style={{ flex: 1, background: '#7c8e9d' }}
                    onClick={() => setView('login')}
                  >
                    Back
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginModal;
