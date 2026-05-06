import React from 'react';
import { Link } from 'react-router-dom';

/**
 * SportCompetition Component
 * 
 * Renders the competition and match navigation for the left sidebar.
 */
const SportCompetition = ({ sport, competition, matchName, events }) => {
  const sidebarStyle = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#fff',
    fontFamily: 'Tahoma, Helvetica, sans-serif'
  };

  const headerStyle = {
    backgroundColor: '#2b3a47',
    color: '#ffb400',
    padding: '10px 12px',
    fontWeight: '800',
    fontSize: '13px',
    textTransform: 'uppercase',
    borderBottom: '1px solid #1a242d',
    letterSpacing: '0.5px'
  };

  const linkStyle = {
    padding: '10px 12px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#333',
    textDecoration: 'none',
    borderBottom: '1px solid #eee',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    transition: 'all 0.2s',
    cursor: 'pointer'
  };

  const sportList = [
    { name: 'Cricket', icon: '🏏', slug: 'cricket' },
    { name: 'Football', icon: '⚽', slug: 'football' },
    { name: 'Tennis', icon: '🎾', slug: 'tennis' },
    { name: 'Horse Racing', icon: '🏇', slug: 'horse-racing' },
    { name: 'Greyhound Racing', icon: '🐕', slug: 'greyhound-racing' }
  ];

  // Dynamically extract market names from events
  const marketList = [];
  let hasFancy = false;

  if (events) {
    Object.values(events).forEach(e => {
      if (e.Type === 'FANCY') {
        hasFancy = true;
      } else {
        const name = e.name || e.Type;
        if (name && !marketList.includes(name)) {
          marketList.push(name);
        }
      }
    });
  }

  // If there are fancy markets, add a generic "Fancy" label at the end
  if (hasFancy) {
    marketList.push('Fancy');
  }

  return (
    <div style={sidebarStyle}>
      <div style={headerStyle}>Sports Menu</div>

      {/* All Sports link */}
      <Link
        to="/in-play"
        style={linkStyle}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
      >
        <span style={{ fontSize: '14px' }}>📡</span>
        <span>All Sports</span>
      </Link>

      {/* Sport List */}
      {sportList.map((s) => {
        const isActive = sport?.toLowerCase() === s.slug;
        return (
          <Link 
            key={s.name} 
            to={`/${s.slug}`}
            style={{ 
              ...linkStyle, 
              backgroundColor: isActive ? '#f0f4f8' : '#fff',
              borderLeft: isActive ? '4px solid #ffb400' : 'none',
              color: isActive ? '#000' : '#333',
              fontWeight: isActive ? '700' : '600'
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.backgroundColor = '#f8f9fa';
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.backgroundColor = '#fff';
            }}
          >
            <span style={{ fontSize: '14px' }}>{s.icon}</span>
            <span>{s.name}</span>
          </Link>
        );
      })}

      {/* Event Header Section */}
      <div style={{
        backgroundColor: '#0c161c',
        color: '#fff',
        padding: '10px 12px',
        fontSize: '11px',
        fontWeight: '800',
        textTransform: 'uppercase',
        marginTop: '15px',
        borderLeft: '4px solid #ffb400'
      }}>
        {matchName || 'Current Event'}
      </div>

      {/* Informational Market List */}
      <div style={{ backgroundColor: '#fcfcfc', flex: 1 }}>
        {marketList.map((market) => (
          <div 
            key={market} 
            onClick={() => {
              const id = `market-${market.replace(/\s+/g, '-').toUpperCase()}`;
              const element = document.getElementById(id);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            style={{ 
              padding: '8px 12px 8px 25px', 
              fontSize: '11px', 
              color: '#4b5965', 
              fontWeight: '700', 
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
              e.currentTarget.style.color = '#ffb400';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#4b5965';
            }}
          >
            <span style={{ color: '#ffb400', fontSize: '8px' }}>●</span>
            {market}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SportCompetition;
