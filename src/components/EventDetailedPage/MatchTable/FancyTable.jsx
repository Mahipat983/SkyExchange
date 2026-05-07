import React, { useState } from 'react';
import { getRunnerRates, getMarketStatus } from '../../../utils/rateRefiner';
import InlineBetBox from './InlineBetBox';

/**
 * FancyTable Component
 *
 * Matches the Sky247 Fancy Bet table UI:
 * - Teal header bar with "Fancy Bet" title and info icon
 * - Filter tabs: All | Fancy | Ball by Ball | Khadda | Lottery | Odd/Even
 * - Dark pinned sub-header "Fancy Bet"
 * - Column labels: no (pink/lay) | yes (blue/back)
 * - Each row: market name | no cell (pink) | yes cell (blue) | Min/Max info
 */

const FILTER_TABS = ['All', 'Fancy', 'Ball by Ball', 'Khadda', 'Lottery', 'Odd/Even'];

const DEMO_MARKETS = [
  { id: 1, name: '20 Over UAE', no: 137, noRate: 100, yes: 139, yesRate: 100, min: '1.00', max: '781.00' },
  { id: 2, name: '18 Over NEP', no: 102, noRate: 100, yes: 103, yesRate: 100, min: '1.00', max: '500.00' },
  { id: 3, name: '6 Over Run UAE', no: 42, noRate: 100, yes: 44, yesRate: 100, min: '1.00', max: '300.00' },
];

const FancyTable = ({ fancyData, onBetClick, liveRates = {}, selectedBet, onCancelBet, matchId, onOpenFancyChart }) => {
  const [activeTab, setActiveTab] = useState('All');

  const allMarkets = fancyData && fancyData.length > 0
    ? fancyData.map(m => {
      const runners = m.runners ? Object.values(m.runners) : [];
      const runnerMsgs = runners.map(r => r.Msg || r.msg).filter(Boolean);
      const combinedMsg = [m.Msg, ...runnerMsgs].filter(Boolean).join(' | ');

      return {
        id: m.eid || m.MarketId || m.marketid,
        name: m.name,
        no: '-',
        noRate: '-',
        yes: '-',
        yesRate: '-',
        min: m.min,
        max: m.max,
        subType: m.SubType,
        Type: m.Type,
        msg: combinedMsg,
        Chart: m.Chart,
        Chart1: m.Chart1,
        Chart2: m.Chart2,
      };
    })
    : DEMO_MARKETS;

  const markets = allMarkets.filter(m => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Ball by Ball') return m.subType === 'SINGLE_OVER';
    if (activeTab === 'Odd/Even') return m.name?.toLowerCase().includes('odd run bhav');
    if (activeTab === 'Fancy') {
      const isBallByBall = m.subType === 'SINGLE_OVER';
      const isOddEven = m.name?.toLowerCase().includes('odd run bhav');
      return !isBallByBall && !isOddEven;
    }
    if (activeTab === 'Khadda') return m.name?.toLowerCase().includes('khadda');
    if (activeTab === 'Lottery') return m.name?.toLowerCase().includes('lottery');
    return false;
  });

  const suspensionOverlayStyle = {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(224, 224, 224, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    pointerEvents: 'none'
  };

  const suspensionTextStyle = {
    color: '#0d47a1',
    fontSize: '9px',
    fontWeight: '900',
    textTransform: 'uppercase',
    textAlign: 'center',
    lineHeight: '1',
    whiteSpace: 'nowrap'
  };

  return (
    <div style={{ fontFamily: 'Tahoma, Arial, sans-serif', fontSize: '13px', marginBottom: '8px' }}>

      {/* ── Header row: dark outer, limited-width teal badge ── */}
      <div style={{
        background: '#243a48',
        display: 'flex',
        alignItems: 'center',
        padding: '4px 8px',
        gap: '6px',
      }}>
        {/* Limited-width teal badge containing clock + label */}
        <div style={{
          background: '#1a8a8a',
          color: '#fff',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '3px 10px 3px 6px',
          borderRadius: '2px',
        }}>
          {/* Green clock icon */}
          <span style={{
            background: '#4caf50',
            borderRadius: '50%',
            width: '17px',
            height: '17px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            flexShrink: 0,
          }}>⏱</span>
          <span style={{ fontWeight: 'bold', fontSize: '13px', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
            Fancy Bet
          </span>
        </div>
        {/* Info icon — outside the badge */}
        <span style={{
          border: '1px solid rgba(255,255,255,0.5)',
          borderRadius: '50%',
          width: '16px',
          height: '16px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          cursor: 'pointer',
          color: 'rgba(255,255,255,0.75)',
          flexShrink: 0,
        }}>i</span>
      </div>

      {/* ── Filter tabs row (matches special_bets-tab reference) ── */}
      <div style={{
        background: '#1a8a8a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6px 8px',
        minHeight: '32px',
      }}>
        <ul style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 'auto',
          background: 'rgba(255, 255, 255, 0.5)',
          borderRadius: '5px',
          margin: '0',
          padding: '0',
          listStyle: 'none',
          gap: '0',
          height: '24px',
        }}>
          {FILTER_TABS.map((tab) => (
            <li
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                borderRadius: '5px',
                background: activeTab === tab ? '#ffffff' : 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                height: '100%',
              }}
            >
              <a style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 12px',
                fontSize: '12px',
                fontWeight: '600',
                color: activeTab === tab ? '#1a8a8a' : '#076875',
                whiteSpace: 'nowrap',
                textDecoration: 'none',
                userSelect: 'none',
                height: '100%',
              }}>
                {tab}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Dark pinned sub-header ── */}
      <div style={{
        background: '#243a48',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        padding: '5px 8px',
        gap: '6px',
        fontWeight: 'bold',
        fontSize: '13px',
      }}>

        <span>Fancy Bet</span>
      </div>

      {/* ── Column header row ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: '#f5f5f5',
        borderBottom: '1px solid #e0e0e0',
      }}>
        <div style={{ flex: 1, borderRight: '1px solid #e0e0e0' }} />
        <div style={{ width: '229.376px' }} />
        <div style={{ width: '114.688px', textAlign: 'center', textTransform: "uppercase", fontWeight: 'bold', fontSize: '12px', color: '#333', padding: '4px 0' }}>
          no
        </div>
        <div style={{ width: '114.688px', textAlign: 'center', textTransform: "uppercase", fontWeight: 'bold', fontSize: '12px', color: '#333', padding: '4px 0' }}>
          yes
        </div>
        <div style={{ width: '229.376px' }} />
      </div>

      {/* ── Market rows ── */}
      <div style={{ background: '#fff' }}>
        {markets.map((market, idx) => {
          const rateData = liveRates[market.id];
          const rates = getRunnerRates(rateData, null, 0, 'FANCY');
          const { isSuspended, msg: suspensionMsg } = getMarketStatus(rateData, 'FANCY');

          return (
            <React.Fragment key={market.id ?? idx}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'stretch',
                  borderBottom: '1px solid #e8e8e8',
                  minHeight: '40px',
                }}
              >
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px 16px',
                  borderRight: '1px solid #e8e8e8',
                }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#222' }}>{market.name}</div>
                    {(() => {
                      const chartVal = rates?.chart ??
                        (market.Chart !== undefined && market.Chart !== null ? parseFloat(market.Chart) :
                          market.Chart1 !== undefined && market.Chart1 !== null ? parseFloat(market.Chart1) :
                            market.Chart2 !== undefined && market.Chart2 !== null ? parseFloat(market.Chart2) : null);

                      if (chartVal !== null && !isNaN(chartVal) && chartVal !== 0) {
                        return (
                          <div style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            marginTop: '2px',
                            color: chartVal < 0 ? '#d0021b' : '#2aa84a'
                          }}>
                            {chartVal < 0 ? chartVal.toFixed(0) : `(${chartVal.toFixed(2)})`}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  
                  {/* Book Button */}
                  {(() => {
                    const chartVal = rates?.chart ??
                      (market.Chart !== undefined && market.Chart !== null ? parseFloat(market.Chart) :
                        market.Chart1 !== undefined && market.Chart1 !== null ? parseFloat(market.Chart1) :
                          market.Chart2 !== undefined && market.Chart2 !== null ? parseFloat(market.Chart2) : null);

                    if (chartVal !== null && !isNaN(chartVal) && chartVal !== 0 && onOpenFancyChart) {
                      return (
                        <button
                          onClick={() => onOpenFancyChart(market.id, market.name)}
                          style={{
                            background: '#ffb400',
                            border: '1px solid #e5a200',
                            borderRadius: '4px',
                            padding: '3px 8px',
                            fontSize: '11px',
                            fontWeight: '800',
                            cursor: 'pointer',
                            color: '#000',
                            textTransform: 'uppercase',
                            marginLeft: '8px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                            transition: 'all 0.1s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#e5a200'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#ffb400'}
                        >
                          Book
                        </button>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Left spacer for alignment */}
                <div style={{ width: '229.376px' }} />

                {/* Betting Cells Container for single overlay */}
                <div style={{ display: 'flex', position: 'relative' }}>
                  {/* no (Lay / pink) cell */}
                  <div
                    onClick={() => !isSuspended && onBetClick && onBetClick({ name: market.name, side: 'lay', price: rates?.lay?.p1, runnerIndex: 0, marketData: { ...market, noVal: parseFloat(rates?.lay?.v1 || '100'), yesVal: parseFloat(rates?.back?.v1 || '100') } })}
                    style={{
                      width: '114.688px',
                      background: '#faa9ba',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      borderLeft: '1px solid #fff',
                      transition: 'opacity 0.15s',
                    }}
                  >
                    <span style={{ fontWeight: 'bold', fontSize: '14px', lineHeight: 1.1, color: '#000' }}>
                      {rates?.lay?.p1 || '-'}
                    </span>
                    <span style={{ fontSize: '11px', color: '#444', lineHeight: 1.1 }}>
                      {rates?.lay?.v1 || '-'}
                    </span>
                  </div>

                  {/* yes (Back / blue) cell */}
                  <div
                    onClick={() => !isSuspended && onBetClick && onBetClick({ name: market.name, side: 'back', price: rates?.back?.p1, runnerIndex: 0, marketData: { ...market, noVal: parseFloat(rates?.lay?.v1 || '100'), yesVal: parseFloat(rates?.back?.v1 || '100') } })}
                    style={{
                      width: '114.688px',
                      background: '#72bbef',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      borderLeft: '1px solid #fff',
                      transition: 'opacity 0.15s',
                    }}
                  >
                    <span style={{ fontWeight: 'bold', fontSize: '14px', lineHeight: 1.1, color: '#000' }}>
                      {rates?.back?.p1 || '-'}
                    </span>
                    <span style={{ fontSize: '11px', color: '#444', lineHeight: 1.1 }}>
                      {rates?.back?.v1 || '-'}
                    </span>
                  </div>

                  {/* Single Suspension Overlay across both cells */}
                  {isSuspended && (
                    <div style={{
                      ...suspensionOverlayStyle,
                      width: '100%',
                      borderLeft: '1px solid #fff'
                    }}>
                      <span style={suspensionTextStyle}>{suspensionMsg}</span>
                    </div>
                  )}
                </div>

                {/* Min/Max info */}
                <div style={{
                  width: '229.376px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  fontSize: '10px',
                  color: '#777',
                  textAlign: 'center',
                  lineHeight: 1.4,
                }}>
                  <span style={{ color: '#707c8a' }}>Min/Max</span>
                  <span style={{ fontSize: '13px', color: '#2b3a47', fontWeight: '400' }}>
                    {market.min} / {market.max}
                  </span>
                </div>
              </div>

              {/* News Message Row */}
              {market.msg && market.msg !== '' && (
                <div style={{ background: '#1a1a1a', padding: '2px 16px', borderBottom: '1px solid #e8e8e8', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '20px' }}>

                    <div style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      <span className="animate-ticker" style={{ fontSize: '10px', fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {market.msg}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Render Inline Bet Box if this fancy market is selected */}
              {selectedBet?.runner === market.name && selectedBet?.market === 'Fancy Bet' && (
                <div style={{ padding: 0 }}>
                  <InlineBetBox
                    selection={selectedBet}
                    matchId={matchId}
                    onCancel={onCancelBet}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default FancyTable;
