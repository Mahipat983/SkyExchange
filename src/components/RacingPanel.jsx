import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { marketController } from '../controllers';
import './RacingPanel.css';

const RacingPanel = ({ sportType }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setData([]); // Clear data to prevent flickering from previous sport
        setActiveTab(''); // Reset active tab
        const res = await marketController.getRacingData(sportType);
        if (Array.isArray(res)) {
          setData(res);
          if (res.length > 0) {
            const firstCountry = res[0].Country || 'Unknown';
            setActiveTab(firstCountry);
          }
        }
      } catch (error) {
        console.error('Error fetching racing data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [sportType]);

  // Group by Country and De-duplicate tracks
  const groupedData = data.reduce((acc, item) => {
    const country = item.Country || 'Unknown';
    if (!acc[country]) acc[country] = new Map();
    
    const trackId = item.gid || item.Event_Id;
    if (trackId) {
      if (!acc[country].has(trackId)) {
        acc[country].set(trackId, { ...item });
      }
    }
    return acc;
  }, {});

  const countries = Object.keys(groupedData).sort();
  const activeTracks = activeTab ? Array.from(groupedData[activeTab]?.values() || []) : [];

  useEffect(() => {
    if (!activeTab && countries.length > 0) {
      setActiveTab(countries[0]);
    }
  }, [countries, activeTab]);

  if (loading && data.length === 0) {
    return <div className="racing-loading">Loading {sportType}...</div>;
  }

  if (!loading && data.length === 0) {
    return <div className="racing-no-data">No {sportType} available at the moment.</div>;
  }

  return (
    <div className="racing-container">
      {/* Tabs Header */}
      <div className="racing-tabs-header">
        {countries.map(country => (
          <button 
            key={country} 
            className={`racing-tab-btn ${activeTab === country ? 'active' : ''}`}
            onClick={() => setActiveTab(country)}
          >
            {country}
          </button>
        ))}
      </div>

      <div className="tracks-list">
        {activeTracks.map((track) => (
          <div key={track.gid || track.Event_Id} className="track-row">
            <div className="track-info">
              <div className="tv-icon">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="#333">
                  <path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/>
                </svg>
              </div>
              <span className="track-name">{track.Game_name}</span>
            </div>
            <div className="event-times">
              {track.Events?.map((event, idx) => {
                const time = event.EventTime ? event.EventTime.split(' ')[1].substring(0, 5) : '';
                const isPast = false; // Add logic if needed
                return (
                  <button
                    key={`${event.Eid}-${idx}`}
                    className={`time-btn ${idx === 0 ? 'active' : ''}`}
                    onClick={() => {
                      const sportPath = sportType === 'Horse Racing' ? 'horse-racing' : 'greyhound-racing';
                      navigate(`/${sportPath}/${track.gid}/${event.Eid}`);
                    }}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RacingPanel;
