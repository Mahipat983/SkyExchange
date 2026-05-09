import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authController } from '../controllers';
import { useAuthStore } from '../store/authStore';
import { useSnackbarStore } from '../store/snackbarStore';
import '../styles/style-login.css';

function SignupPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [campaignCode, setCampaignCode] = useState('');
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const loginAction = useAuthStore((state) => state.login);
  const showSnackbar = useSnackbarStore(state => state.show);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!mobile.trim()) { showSnackbar('Please enter mobile number', 'error'); return; }
    if (!isAgreed) { showSnackbar('Please agree to terms and conditions', 'error'); return; }
    
    try {
      setLoading(true);
      const resp = await authController.sendOtp(mobile);
      if (resp.error === '0') {
        showSnackbar(resp.msg || 'OTP Sent Successfully', 'success');
        setIsOtpMode(true);
      } else {
        showSnackbar(resp.msg || 'Failed to send OTP', 'error');
      }
    } catch (err) {
      console.error(err);
      showSnackbar('Error sending OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    if (e) e.preventDefault();
    if (!isOtpMode) {
      handleSendOtp();
      return;
    }
    if (!otp) { showSnackbar('Please enter OTP', 'error'); return; }
    if (!username) { showSnackbar('Please enter username', 'error'); return; }
    if (!password) { showSnackbar('Please enter password', 'error'); return; }

    try {
      setLoading(true);
      const data = {
        username,
        password,
        mobile,
        otp,
        campaignCode
      };
      
      const response = await authController.createUser(data);

      if (response.error === '0') {
        showSnackbar(response.msg || 'Signup Successful!', 'success');
        if (response.apitoken || response.LoginToken) {
            loginAction(response.username || username, response.apitoken || response.LoginToken);
            navigate('/');
        } else {
            navigate('/login');
        }
      } else {
        showSnackbar(response.msg || 'Signup failed', 'error');
      }
    } catch (err) {
      console.error('Signup Error:', err);
      showSnackbar('An unexpected error occurred during signup.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrap">
      <div className="mobile-container">
        <div className="header-section">
          <button className="close-btn" onClick={() => navigate(-1)} aria-label="Close">
            <i className="fa-solid fa-xmark"></i>
          </button>
          <div className="logo-container">
            <img src="/images/logo.png" alt="Sky247 Logo" className="logo-img" />
          </div>
        </div>

        <main className="content-section">
          <form className="login-form" onSubmit={handleSignup}>
            <div className="validation-input-wrapper">
              {isOtpMode ? (
                <div style={{ display: 'flex', alignItems: 'center', width: '100%', position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    className="form-input"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                  <span 
                    onClick={() => setIsOtpMode(false)}
                    style={{ position: 'absolute', right: '15px', color: '#007bff', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Change?
                  </span>
                </div>
              ) : (
                <div className="phone-input-group">
                  <div className="country-code-picker">
                    <img src="https://flagcdn.com/w20/in.png" alt="IN" />
                    <span>+91</span>
                    <span className="arrow-down">▼</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Mobile Number"
                    className="form-input"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="signup-modal-checkbox-row">
              <input 
                type="checkbox" 
                id="terms" 
                checked={isAgreed}
                onChange={e => setIsAgreed(e.target.checked)}
              />
              <label htmlFor="terms">
                I agree to the <a href="#" onClick={e => e.preventDefault()}>Terms and Conditions</a>
              </label>
            </div>

            <input
              type="text"
              placeholder="kabira00025"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <div className="validation-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span
                className="captcha-code"
                onClick={() => setShowPassword(!showPassword)}
                style={{ cursor: 'pointer', color: '#333', fontSize: '16px' }}
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </span>
            </div>

            <input
              type="text"
              placeholder="Campaign Code (Optional)"
              className="form-input"
              value={campaignCode}
              onChange={(e) => setCampaignCode(e.target.value)}
            />

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Processing...' : (isOtpMode ? 'Sign Up' : 'Send OTP')}
            </button>

            <div className="signup-prompt">
              Already have an account? <a href="/login" className="signup-link">Sign in</a>
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

export default SignupPage;
