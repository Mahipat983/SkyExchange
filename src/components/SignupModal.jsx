import React, { useState } from 'react';
import { useUIStore } from '../store/uiStore';
import { useSnackbarStore } from '../store/snackbarStore';
import { authController } from '../controllers';
import { useAuthStore } from '../store/authStore';

const SignupModal = () => {
  const { isSignupModalOpen, closeSignupModal, openLoginModal } = useUIStore();
  const showSnackbar = useSnackbarStore(state => state.show);
  const loginAction = useAuthStore(state => state.login);

  const [isOtpMode, setIsOtpMode] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [campaignCode, setCampaignCode] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isSignupModalOpen) return null;

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!phone.trim()) {
      showSnackbar('Please enter phone number', 'error');
      return;
    }
    if (!isAgreed) {
      showSnackbar('Please agree to terms and conditions', 'error');
      return;
    }

    try {
      setLoading(true);
      const resp = await authController.sendOtp(phone);
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
    if (!otp.trim()) {
      showSnackbar('Please enter OTP', 'error');
      return;
    }
    if (!username.trim()) {
      showSnackbar('Please enter username', 'error');
      return;
    }
    if (!password.trim()) {
      showSnackbar('Please enter password', 'error');
      return;
    }

    try {
      setLoading(true);
      const data = {
        username,
        password,
        mobile: phone,
        otp,
        campaignCode
      };
      
      const response = await authController.createUser(data);

      if (response.error === '0') {
        showSnackbar(response.msg || 'Signup Successful!', 'success');
        if (response.apitoken || response.LoginToken) {
          loginAction(response.username || username, response.apitoken || response.LoginToken);
          closeSignupModal();
        } else {
          closeSignupModal();
          openLoginModal();
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
    <div className="signup-modal-overlay" onClick={closeSignupModal}>
      <div className="signup-modal-box" onClick={e => e.stopPropagation()}>
        {/* Left Section */}
        <div className="signup-modal-left">
          <div className="signup-modal-left-overlay"></div>
          <div className="signup-modal-logo-container">
             <img src="/images/logo.png" alt="SKYEXCH" className="signup-modal-logo" />
          </div>
        </div>

        {/* Right Section */}
        <div className="signup-modal-right">
          <button className="signup-modal-close" onClick={closeSignupModal}>✕</button>
          
          <div className="signup-modal-header-container">
            <h2 className="signup-modal-main-title">Sign Up</h2>
            <p className="signup-modal-sub-title">Create your account by following these simple steps.</p>
          </div>

          <form className="signup-modal-form" onSubmit={isOtpMode ? handleSignup : handleSendOtp}>
            <div className="signup-modal-phone-row">
              {!isOtpMode && (
                <div className="country-code-picker">
                  <img src="https://flagcdn.com/w20/in.png" alt="IN" />
                  <span>+91</span>
                  <span className="arrow-down">▼</span>
                </div>
              )}
              <div style={{ flex: 1 }}>
                {isOtpMode ? (
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%', height: '100%' }}>
                    <input 
                      type="text" 
                      placeholder="Enter OTP" 
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      className="signup-modal-input no-border"
                    />
                    <button 
                      type="button" 
                      onClick={() => setIsOtpMode(false)}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: '#007bff', 
                        fontSize: '11px', 
                        fontWeight: 'bold', 
                        cursor: 'pointer', 
                        padding: '0 10px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Change?
                    </button>
                  </div>
                ) : (
                  <input 
                    type="text" 
                    placeholder="Enter Phone Number" 
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="signup-modal-input no-border"
                  />
                )}
              </div>
            </div>

            {isOtpMode && (
              <div style={{ textAlign: 'right', marginTop: '-10px' }}>
                <span 
                  onClick={handleSendOtp}
                  style={{ fontSize: '12px', color: '#333', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline' }}
                >
                  Resend OTP
                </span>
              </div>
            )}

            <div className="signup-modal-checkbox-row">
              <input 
                type="checkbox" 
                id="terms" 
                checked={isAgreed}
                onChange={e => setIsAgreed(e.target.checked)}
              />
              <label htmlFor="terms">
                I agree to the <a href="#" onClick={e => e.preventDefault()}>Terms and Conditions</a>.
              </label>
            </div>

            <input 
              type="text" 
              placeholder="kabira00025" 
              className="signup-modal-input bg-blue-tint"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />

            <div className="signup-modal-password-wrap">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Ex: Password@123" 
                className="signup-modal-input bg-blue-tint"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <span className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </span>
            </div>

            <input 
              type="text" 
              placeholder="Enter Campaign Code" 
              className="signup-modal-input"
              value={campaignCode}
              onChange={e => setCampaignCode(e.target.value)}
            />

            <button type="submit" className="signup-modal-btn" disabled={loading}>
              {loading ? "Processing..." : (isOtpMode ? "Sign Up" : "Send OTP")}
            </button>
          </form>

          <div className="signup-modal-footer">
            Already have account? <span className="signin-link" onClick={() => { closeSignupModal(); openLoginModal(); }}>Sign in</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupModal;
