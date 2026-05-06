import React from 'react';

function Footer() {
  return (
    <>
      {/* Footer */}
      {/* Footer Content */}


      {/* New License and Description Section */}
      <div style={{
        margin: '30px auto',
        maxWidth: '900px',
        border: '1px solid #d1d1d1',
        borderRadius: '12px',
        padding: '25px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        fontFamily: 'Arial, Helvetica, sans-serif'
      }}>
        {/* Logos Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          borderRight: '1px solid #e0e0e0',
          paddingRight: '25px',
          marginRight: '25px',
          flexShrink: 0
        }}>
          <div style={{
            width: '100px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}>
            <img
              src="https://www.gaming-curacao.com/images/gc-logo.png"
              style={{ width: '100%', objectFit: 'contain' }}
              alt="GC Logo"
              onError={(e) => e.target.src = '/images/transparent.gif'}
            />
          </div>
          <div style={{
            width: '140px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            background: '#1a1a1a',
            borderRadius: '6px'
          }}>
            <img
              src="/images/logo.png"
              style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
              alt="Skyexch Logo"
            />
          </div>
        </div>

        {/* Description Text */}
        <div style={{ fontSize: '11px', color: '#444', lineHeight: '1.7', textAlign: 'left' }}>
          <p style={{ marginBottom: '12px' }}>
            <strong>Skyexch</strong> is your one-stop platform for online sports betting and casino gaming, offering a wide range of games including cricket, football, tennis, and live casino experiences.
          </p>
          <p style={{ marginBottom: '12px' }}>
            This platform operates under <strong>AllWhiteLabel247</strong> and is licensed and regulated by the Curaçao Authority under N.V. License No. B2C-669UN7GS-2678JAZ.
          </p>
          <p style={{ color: '#666' }}>
            Skyexch promotes responsible gaming and is strictly for users aged 18+. Users must ensure that online gaming is legal in their jurisdiction.
          </p>
        </div>
      </div>

      {/* Browser Support */}
      <div className="browser-wrap" style={{ textAlign: 'center', color: '#666', fontSize: '11px', marginBottom: '20px' }}>
        <p>Our website works best in the newest and last prior version of these browsers: <strong>Google Chrome, Firefox</strong></p>
      </div>

      {/* Policy Links */}
      <ul className="policy-link">
        {[
          'Privacy Policy', 'Terms and Conditions', 'Rules and Regulations',
          'KYC', 'Responsible Gaming', 'About Us', 'Self-exclusion Policy', 'Underage Policy'
        ].map((item) => (
          <li key={item}>
            <a href="#" onClick={(e) => e.preventDefault()}>{item}</a>
          </li>
        ))}
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
