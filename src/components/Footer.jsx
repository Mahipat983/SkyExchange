import React from 'react';

function Footer() {
  return (
    <>
      {/* Footer */}
      {/* Footer Content */}


      {/* New License and Description Section */}
      <div style={{
        margin: '15px auto',
        maxWidth: '950px',
        border: '1px solid #d1d1d1',
        borderRadius: '12px',
        padding: '15px 20px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '20px',
        backgroundColor: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        fontFamily: 'Arial, Helvetica, sans-serif'
      }}>
        {/* Logo Section Container */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px',

          borderRadius: '8px',
          border: '1px solid #333',
          width: '200px',
          height: '90px',
          flexShrink: 0
        }}>
          <img
            src="/Logo/allWhiteLabel.png"
            style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
            alt="AllWhiteLabel Logo"
          />
        </div>

        {/* Description Text Container */}
        <div style={{
          fontSize: '11px',
          color: '#444',
          lineHeight: '1.6',
          textAlign: 'left',
          padding: '12px',
          border: '1px solid #f0f0f0',
          borderRadius: '8px',
          flex: 1
        }}>
          <p style={{ marginBottom: '8px' }}>
            <strong>All white label 247</strong> is your one-stop platform for online sports betting and casino gaming, offering a wide range of games including cricket, football, tennis, and live casino experiences.
          </p>
          <p style={{ marginBottom: '8px' }}>
            <strong>Sky Exchange 247</strong> platform operates under <strong>All white label 247</strong> and is licensed and regulated by the Curaçao Authority under N.V. License No. B2C-669UN7GS-2678JAZ.

          </p>
          <p style={{ color: '#666', margin: 0 }}>
            <strong>All white label 247</strong> promotes responsible gaming and is strictly for users aged 18+. Users must ensure that online gaming is legal in their jurisdiction.
          </p>
        </div>
      </div>

      {/* Browser Support */}
      <div className="browser-wrap" style={{ textAlign: 'center', color: '#666', fontSize: '11px', marginBottom: '15px' }}>
        <p>Our website works best in the newest and last prior version of these browsers: <strong>Google Chrome, Firefox</strong></p>
      </div>

      {/* Policy Links */}
      <ul className="policy-link">
        <li><a href="https://allwhitelabel247.io/terms-conditions" target="_blank" rel="noopener noreferrer">Terms & Conditions</a></li>
        <li><a href="https://allwhitelabel247.io/responsible-gaming" target="_blank" rel="noopener noreferrer">Responsible Gaming</a></li>
        <li><a href="https://allwhitelabel247.io/age-policy" target="_blank" rel="noopener noreferrer">Age Policy</a></li>
        <li><a href="https://allwhitelabel247.io/rules" target="_blank" rel="noopener noreferrer">Rules</a></li>
      </ul>

      {/* App Download */}
      <div className="app-link" style={{ display: 'block' }}>
        <a href="#" onClick={(e) => e.preventDefault()}>
          <img src="/images/btn-appdl.png" alt="" />
        </a>
        <p>v1.15 - 2025-09-17 - 3.1MB</p>
      </div>
    </>
  );
}

export default Footer;
