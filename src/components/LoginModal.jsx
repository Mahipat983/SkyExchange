import React, { useState, useEffect } from 'react';
import { authController } from '../controllers';
import { useAuthStore } from '../store/authStore';
import { useSnackbarStore } from '../store/snackbarStore';

function LoginModal({ isOpen, onClose }) {
  const [validationCode, setValidationCode] = useState('');
  const [loginName, setLoginName] = useState('');
  const [password, setPassword] = useState('');
  const [validationInput, setValidationInput] = useState('');
  const [loading, setLoading] = useState(false);
  const loginAction = useAuthStore((state) => state.login);
  const showSnackbar = useSnackbarStore(state => state.show);

  const generateCode = () => String(Math.floor(1000 + Math.random() * 9000));

  useEffect(() => {
    if (isOpen) {
      setValidationCode(generateCode());
    }
  }, [isOpen]);

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
      const response = await authController.login({
        username: loginName,
        password: password,
        ip: '127.0.0.1'
      });

      if (response.error === '0') {
        loginAction(response.username || loginName, response.LoginToken);
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
          <h3 className="login-modal-title">Please login to continue</h3>
          <form onSubmit={handleLogin} className="login-modal-form">
            <input
              type="text"
              placeholder="kabira00025"
              className="login-modal-input"
              value={loginName}
              onChange={(e) => setLoginName(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              className="login-modal-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
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
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="login-modal-btn" style={{ flex: 1 }}>
                Login<span className="login-modal-btn-icon">🚪</span>
              </button>
              <button type="button" className="login-modal-btn" style={{ flex: 1 }}>
                Demo<span className="login-modal-btn-icon">🚪</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginModal;
