import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import BetSlip from '../components/BetSlip';
import { useAuthStore } from '../store/authStore';
import { marketController } from '../controllers';
import MultiMarketTable from '../components/MultiMarketTable';

function MultiMarketsPage() {
  const navigate = useNavigate();
  const { isLoggedIn, loginToken } = useAuthStore();
  const [favorites, setFavorites] = useState([]);
  const [liveRates, setLiveRates] = useState({});
  const [loading, setLoading] = useState(true);

  // 1. Fetch Followed Markets (Favorites)
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!isLoggedIn || !loginToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await marketController.getMultiMarketList(loginToken);
        if (response) {
          let dataArray = [];
          const rawData = response.data || response.list || response.BankList || response;

          if (Array.isArray(rawData)) {
            dataArray = rawData;
          } else if (typeof rawData === 'object' && rawData !== null) {
            if (rawData.eid || rawData.Eid || rawData.MarketId) {
              dataArray = [rawData];
            } else {
              dataArray = Object.values(rawData).filter(v =>
                v && typeof v === 'object' && (v.eid || v.Eid || v.gid || v.Gid || v.MarketId)
              );
            }
          }
          
          setFavorites(dataArray);
        }
      } catch (error) {
        console.error('Failed to fetch favorites:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [isLoggedIn, loginToken]);

  // 2. Polling for Live Rates
  useEffect(() => {
    if (favorites.length === 0) return;

    const marketIds = favorites
      .map(f => f.MarketId || f.marketid || f.eid || f.Eid || '')
      .filter(id => id !== '')
      .join(',');

    const ids = favorites
      .map(f => {
        const gkey = f.gkey || f.gid || f.Gid || '';
        const ekey = f.ekey || f.eid || f.Eid || f.MarketId || '';
        return { gkey, ekey };
      })
      .filter(id => id.ekey);

    if (ids.length === 0 || !marketIds) return;

    let isMounted = true;
    let timeoutId;

    const pollRates = async () => {
      try {
        const res = await marketController.getMultiMarketRate(marketIds, ids);
        if (res && typeof res === 'object' && isMounted) {
          if (res.error === undefined || res.error === '0') {
            setLiveRates(prev => ({ ...prev, ...res }));
          }
        }
      } catch (err) {
        console.error('Failed to poll multi-market rates:', err);
      }

      if (isMounted) {
        timeoutId = setTimeout(pollRates, 1000);
      }
    };

    pollRates();
    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [favorites]);

  const handleToggleFav = async (eid) => {
    if (!loginToken) return;
    try {
      const res = await marketController.toggleFavourite(loginToken, eid);
      // Backend might return success or error field
      if (res.error === '0' || res.status === 'Success' || !res.error) {
        setFavorites(prev => prev.filter(f => (f.eid || f.Eid || f.MarketId) !== eid));
      }
    } catch (err) {
      console.error('Failed to untoggle fav:', err);
    }
  };

  // 3. Fetch Competition Details for Sidebar
  const [sidebarData, setSidebarData] = useState([]);
  const [isSidebarLoading, setIsSidebarLoading] = useState(false);
  const [openAccordions, setOpenAccordions] = useState({});

  useEffect(() => {
    const fetchSidebarData = async () => {
      if (favorites.length === 0) {
        setSidebarData([]);
        return;
      }

      try {
        setIsSidebarLoading(true);
        const uniqueGids = [...new Set(favorites.map(f => f.gid || f.Gid || f.gkey).filter(Boolean))];
        
        const results = await Promise.all(uniqueGids.map(gid => marketController.getGameData(gid)));
        
        const sportsGroups = {};
        results.forEach(res => {
          if (res && !res.error) {
            let data = typeof res === 'string' ? JSON.parse(res) : res;
            if (data["0"]) data = data["0"];
            
            const sportName = (data.Sport || data.GameType || 'Cricket').toUpperCase();
            
            if (!sportsGroups[sportName]) {
              sportsGroups[sportName] = {
                name: sportName,
                events: []
              };
            }
            if (!sportsGroups[sportName].events.some(g => (g.gid || g.Gid) === (data.gid || data.Gid))) {
              sportsGroups[sportName].events.push(data);
            }
          }
        });
        
        setSidebarData(Object.values(sportsGroups));
      } catch (err) {
        console.error('Sidebar fetch error:', err);
      } finally {
        setIsSidebarLoading(false);
      }
    };

    fetchSidebarData();
  }, [favorites]);

  const toggleAccordion = (key) => {
    setOpenAccordions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const sidebarStyle = {
    display: 'flex',
    flexDirection: 'column',
    height: 'fit-content',
    backgroundColor: '#fff',
    fontFamily: 'Tahoma, Helvetica, sans-serif',
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
    <Layout>
      <main className="main">
        {/* Left sidebar: Dynamic followed competitions with LeftSidebar theme */}
        <aside style={sidebarStyle} className="sidebar sideNav">
          <div style={headerStyle}>MULTI MARKETS</div>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {isSidebarLoading ? (
              <div className="p-10 text-center">
                <div className="w-5 h-5 border-2 border-[#ffb400] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              </div>
            ) : sidebarData.length === 0 ? (
              <div className="p-8 text-center text-[11px] text-gray-500 font-bold uppercase leading-relaxed bg-[#f8f9fa]">
                No followed markets.<br/>Pin markets to see them here.
              </div>
            ) : (
              sidebarData.map((sportGroup, idx) => {
                const key = `multi-sport-${idx}`;
                const isOpen = openAccordions[key];
                
                return (
                  <div key={key}>
                    <div 
                      style={{
                        ...compLinkStyle,
                        backgroundColor: isOpen ? '#f1f5f9' : '#f8f9fa'
                      }}
                      onClick={() => toggleAccordion(key)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isOpen ? '#f1f5f9' : '#f8f9fa'}
                    >
                      <span className="uppercase">{sportGroup.name}</span>
                      <span style={{ color: '#ffb400', fontSize: '10px' }}>{isOpen ? '▲' : '▼'}</span>
                    </div>
                    
                    {isOpen && (
                      <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#fff' }}>
                        {sportGroup.events.map((game, gIdx) => (
                          <Link 
                            key={gIdx} 
                            to={`/${(game.Sport || 'cricket').toLowerCase()}/${game.gid || game.Gid}`}
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
                            {game.Game_name || `${game.Team1} v ${game.Team2}`}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Center column */}
        <div className="center">
          <div className="multi-markets-board">
            <h4 className="multi-markets-title">Multi Markets</h4>
            <div className="multi-markets-body" style={{ background: '#f0f0f0', padding: '10px' }}>
              {!isLoggedIn ? (
                <div className="bg-white p-6 text-center border rounded">
                  <p className="text-gray-600 mb-4">Please login to view your multi markets.</p>
                  <button onClick={() => navigate('/')} className="bg-[#243a48] text-white px-6 py-2 rounded font-bold">LOGIN</button>
                </div>
              ) : loading ? (
                <div className="text-center py-10">
                   <p className="text-gray-500 font-bold">Loading followed markets...</p>
                </div>
              ) : favorites.length === 0 ? (
                <div className="bg-white p-4 border rounded">
                   <p className="multi-markets-empty">There are currently no followed multi markets.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {favorites.map((market) => {
                    const mIds = [
                      market.MarketId, market.marketid,
                      market.eid, market.Eid, market.ekey,
                      market.gid, market.Gid, market.gkey
                    ].filter(id => !!id);

                    let marketRate = null;
                    for (const id of mIds) {
                      if (liveRates[id]) {
                        marketRate = liveRates[id];
                        break;
                      }
                    }

                    if (!marketRate) {
                      marketRate = Object.values(liveRates).find((r) =>
                        r && (mIds.includes(r.MarketId) || mIds.includes(r.marketid) || mIds.includes(r.eid) || mIds.includes(r.Eid))
                      );
                    }

                    const staticRunners = Array.isArray(market.runners) ? market.runners : Object.values(market.runners || {});
                    const liveRunnersMap = marketRate?.runners || marketRate?.runner || {};
                    const liveRunners = Array.isArray(liveRunnersMap) ? liveRunnersMap : Object.values(liveRunnersMap);

                    const runnersArray = staticRunners.map((sr, idx) => {
                      const liveData = liveRunners.find((lr) => lr.SelectionId === sr.SelectionId) || liveRunners[idx] || {};
                      return { ...sr, ...liveData };
                    });

                    const matchName = market.name || 
                                     (market.Team1 && market.Team2 ? `${market.Team1} vs ${market.Team2}` : 
                                      market.Event_Name || market.Game_Name || 'Main Market');

                    const sport = (market.Event_Type || market.sport || 'Cricket');

                    return (
                      <MultiMarketTable
                        key={market.eid || market.Eid || market.MarketId}
                        sportName={sport}
                        matchName={matchName}
                        marketName={market.name || 'Winner'}
                        runners={runnersArray}
                        rateData={marketRate || {}}
                        onToggleFav={() => handleToggleFav(market.eid || market.Eid || market.MarketId)}
                        onHeaderClick={() => {
                           const s = sport.toLowerCase();
                           const mid = market.gid || market.Gid || marketRate?.gid || marketRate?.Gid;
                           if (mid) {
                             navigate(`/${s}/${mid}`);
                           } else {
                             // Fallback to MarketId if gid is not available
                             navigate(`/${s}/${market.eid || market.Eid || market.MarketId}`);
                           }
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Bet Slip */}
        <div className="betslip">
          <BetSlip />
        </div>
      </main>
    </Layout>
  );
}

export default MultiMarketsPage;
