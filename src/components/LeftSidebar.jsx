import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { marketController } from '../controllers';

function LeftSidebar({ sport, competitions = [], countries = [] }) {
  const [openAccordions, setOpenAccordions] = useState({});
  const [compMatches, setCompMatches] = useState({});
  const navigate = useNavigate();

  const getDisplayName = (obj) => {
    if (!obj) return 'Unknown';
    if (typeof obj === 'string') return obj;
    // Prioritize Game_name for individual matches, then fallback to other common name fields
    return obj.Game_name || obj.GameName || obj.Competition_Name || obj.CompetitionName || obj.name || obj.ename || obj.Competition || 'Unknown';
  };

  const toggleAccordion = async (key, code) => {
    const isOpening = !openAccordions[key];
    setOpenAccordions((prev) => ({
      ...prev,
      [key]: isOpening,
    }));

    if (isOpening && code && !compMatches[key]) {
      try {
        const res = await marketController.getCompetitionGames(code);
        if (Array.isArray(res)) {
          setCompMatches(prev => ({ ...prev, [key]: res }));
        } else if (res && typeof res === 'object') {
          const list = Object.values(res).filter(v => typeof v === 'object' && v !== null);
          setCompMatches(prev => ({ ...prev, [key]: list }));
        }
      } catch (err) {
        console.error('Failed to fetch comp games:', err);
      }
    }
  };

  const sidebarStyle = {
    display: 'flex',
    flexDirection: 'column',
    height: 'fit-content',
    backgroundColor: '#fff',
    fontFamily: 'Tahoma, Helvetica, sans-serif',
    position: 'sticky',
    top: '0px',
    zIndex: 10,
    borderRight: '1px solid #ccc'
  };

  const headerStyle = {
    backgroundColor: '#2b3a47',
    color: '#ffb400',
    padding: '12px 15px',
    fontWeight: '800',
    fontSize: '14px',
    textTransform: 'uppercase',
    borderBottom: '2px solid #ffb400',
    letterSpacing: '0.5px'
  };

  const compLinkStyle = {
    padding: '10px 15px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#333',
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #eee',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    transition: 'all 0.2s'
  };

  const matchLinkStyle = {
    padding: '8px 15px 8px 30px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#4b5965',
    backgroundColor: '#fff',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textDecoration: 'none'
  };

  return (
    <aside style={sidebarStyle} className="sidebar sideNav">
      <div style={headerStyle}>{sport}</div>
      
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {competitions.map((comp, idx) => {
          const compName = getDisplayName(comp);
          const compCode = comp.Competition_Code || comp.CompetitionCode || comp.code;
          const keyId = compCode || String(compName).replace(/\s+/g, '-').toLowerCase();
          const key = `comp-${keyId}-${idx}`;
          const isOpen = openAccordions[key];
          const matches = compMatches[key] || [];

          return (
            <div key={key}>
              <div 
                style={{
                  ...compLinkStyle,
                  backgroundColor: isOpen ? '#f1f5f9' : '#f8f9fa'
                }}
                onClick={() => toggleAccordion(key, compCode)}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isOpen ? '#f1f5f9' : '#f8f9fa'}
              >
                <span>{compName}</span>
                <span style={{ color: '#ffb400', fontSize: '10px' }}>{isOpen ? '▲' : '▼'}</span>
              </div>
              
              {isOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#fff' }}>
                  {matches.length > 0 ? (
                    matches.map((m, mIdx) => (
                      <Link 
                        key={mIdx} 
                        to={`/${sport.toLowerCase()}/${m.gid || m.Event_Id || m.MarketId}`}
                        style={matchLinkStyle}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#fafafa';
                          e.currentTarget.style.color = '#ffb400';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#fff';
                          e.currentTarget.style.color = '#4b5965';
                        }}
                      >
                        <span style={{ color: '#ffb400', fontSize: '8px' }}>●</span>
                        {getDisplayName(m)}
                      </Link>
                    ))
                  ) : (
                    <div style={{ ...matchLinkStyle, color: '#999', fontStyle: 'italic' }}>
                      Loading events...
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

export default LeftSidebar;
