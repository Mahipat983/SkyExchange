import React from 'react';
import { getRunnerRates, getMarketStatus } from '../../../utils/rateRefiner';
import InlineBetBox from './InlineBetBox';

const OddsTable = ({ marketData, onBetClick, marketName, liveRates = {}, selectedBet, onCancelBet, sport, isInPlay }) => {
  const displayName = marketData?.name || marketName || 'Match Odds';
  const oddsWidth = '114.688px';
  const uniformHeight = '35px';

  // Market ID for rates
  const marketId = (marketData?.MarketId?.toString().startsWith('1.') || marketData?.marketid?.toString().startsWith('1.'))
    ? (marketData?.MarketId || marketData?.marketid)
    : (marketData?.eid || marketData?.MarketId || marketData?.marketid);

  const rateData = liveRates[marketId];
  const { isSuspended: isMarketSuspended, msg: marketSuspensionMsg } = getMarketStatus(rateData, marketData?.Type);

  const baseFont = {
    fontFamily: 'Tahoma, Helvetica, sans-serif',
    fontSize: '12px',
    lineHeight: '15px',
    fontWeight: '400',
    letterSpacing: 'normal'
  };

  const cellStyle = (bgColor) => ({
    width: oddsWidth,
    minWidth: oddsWidth,
    height: uniformHeight,
    backgroundColor: bgColor,
    textAlign: 'center',
    cursor: 'pointer',
    borderRight: '1px solid #fff',
    borderBottom: '1px solid #fff',
    verticalAlign: 'middle',
    padding: '2px 0',
    position: 'relative',
    ...baseFont
  });

  const suspensionOverlayStyle = {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(224, 224, 224, 0.85)',
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

  const headerTabStyle = (bgColor, textColor, isBack) => ({
    height: '20px',
    width: '100%',
    backgroundColor: bgColor,
    color: textColor || '#1e1e1e',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    marginTop: '0px',
    border: '1px solid rgba(0,0,0,0.08)',
    borderBottom: 'none',
    clipPath: isBack
      ? 'polygon(10px 0, 100% 0, 100% 100%, 0 100%)'
      : 'polygon(0 0, calc(100% - 10px) 0, 100% 100%, 0 100%)'
  });

  return (
    <div style={{ width: '100%', marginBottom: '16px' }}>

      {/* HEADER SECTION */}
      {marketData?.Type === 'ODDS' ? (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#fff',
          border: '1px solid #d9d9d9',
          borderBottom: 'none',
          height: '42px',
          position: 'relative',
          ...baseFont
        }}>
          {/* Left Section */}
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <div style={{
              background: '#cfd8dc',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              fontWeight: '700',
              color: '#2b3a47'
            }}>
              {displayName}
            </div>

            {isInPlay && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                color: '#2aa84a',
                fontWeight: '600',
                marginLeft: '15px'
              }}>
                <span style={{ width: '12px', height: '12px' }}>
                  <img src="/icons/in-play.svg" alt="" style={{ width: '100%' }} />
                </span>
                In-Play
              </div>
            )}
          </div>

          {/* Right Section */}
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', paddingRight: '10px' }}>



          </div>
        </div>
      ) : (
        <div className="bg-[#1f2933] text-white flex items-center px-3 py-2">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
            </svg>
            <span className="font-bold text-sm">{displayName}</span>
            <span className="mx-2 text-gray-400">|</span>
            <span className="text-sm text-gray-300">Zero Commission</span>
          </div>
        </div>
      )}

      {/* TABLE */}
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        backgroundColor: '#e4e7ed',
        border: '1px solid #d9d9d9'
      }}>

        <thead>
          <tr style={{
            height: '32px',
            color: '#1e1e1e',
            borderBottom: '1px solid #d9d9d9',
            position: 'relative',
            ...baseFont
          }}>
            <th style={{ textAlign: 'left', paddingLeft: '12px', width: 'auto' }}>
              {Object.keys(marketData?.runners || {}).length} selections
            </th>

            {/* 6 Fixed Rate Columns */}
            <th style={{ width: oddsWidth }}></th>
            <th style={{ width: oddsWidth }}></th>
            <th style={{ width: oddsWidth, padding: 0, verticalAlign: 'bottom' }}>
              <div style={{ overflow: 'hidden', borderTopLeftRadius: '6px' }}>
                <div style={headerTabStyle('#72bbef', '#1e1e1e', true)}>
                  Back all
                </div>
              </div>
            </th>
            <th style={{ width: oddsWidth, padding: 0, verticalAlign: 'bottom' }}>
              <div style={{ overflow: 'hidden', borderTopRightRadius: '6px' }}>
                <div style={headerTabStyle('#faa9ba', '#1e1e1e', false)}>
                  Lay all
                </div>
              </div>
            </th>
            <th style={{ width: oddsWidth }}></th>
            <th style={{ width: oddsWidth }}></th>

            {/* Floating Min/Max on the right of the header */}
            <div style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              zIndex: 5
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '11px' }}>
                <span style={{ background: '#4b5965', color: '#fff', padding: '1px 4px', borderRadius: '2px', fontSize: '10px' }}>Min</span>
                <span style={{ fontWeight: '700' }}>{marketData?.min || '0'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '11px' }}>
                <span style={{ background: '#4b5965', color: '#fff', padding: '1px 4px', borderRadius: '2px', fontSize: '10px' }}>Max</span>
                <span style={{ fontWeight: '700' }}>{marketData?.max || '0'}</span>
              </div>
            </div>
          </tr>
        </thead>

        <tbody style={{ backgroundColor: 'white' }}>
          {Object.values(marketData?.runners || {}).map((runner, idx) => {
            const runnerId = runner.selectionId || runner.SelectionId || runner.id || idx;
            const rates = getRunnerRates(rateData, runnerId, idx, marketData?.Type);
            const isSuspended = isMarketSuspended || rates?.isRunnerSuspended;
            const suspensionMsg = rates?.suspensionMsg || marketSuspensionMsg;

            return (
              <React.Fragment key={idx}>
                <tr style={{ height: uniformHeight, borderBottom: '1px solid #e4e7ed' }}>
                  <td style={{ paddingLeft: '16px', fontWeight: '700', color: '#2b3a47', borderRight: '1px solid #e4e7ed' }}>
                    {runner.RunnerName}
                  </td>

                  <td colSpan={6} style={{ padding: 0, position: 'relative' }}>
                    <div style={{ display: 'flex', width: '100%', height: uniformHeight }}>
                      {/* Back 3 */}
                      <div style={cellStyle('#e2f2fe')} onClick={() => !isSuspended && onBetClick(runner.RunnerName, 'back', rates?.back?.p3, idx, runnerId)}>
                        <div style={{ fontWeight: '700' }}>{rates?.back?.p3 || '-'}</div>
                        <div style={{ fontSize: '10px', color: '#707c8a' }}>{rates?.back?.v3 || '-'}</div>
                      </div>

                      {/* Back 2 */}
                      <div style={cellStyle('#add8f4')} onClick={() => !isSuspended && onBetClick(runner.RunnerName, 'back', rates?.back?.p2, idx, runnerId)}>
                        <div style={{ fontWeight: '700' }}>{rates?.back?.p2 || '-'}</div>
                        <div style={{ fontSize: '10px', color: '#707c8a' }}>{rates?.back?.v2 || '-'}</div>
                      </div>

                      {/* Back 1 */}
                      <div style={cellStyle('#72bbef')} onClick={() => !isSuspended && onBetClick(runner.RunnerName, 'back', rates?.back?.p1, idx, runnerId)}>
                        <div style={{ fontWeight: '700' }}>{rates?.back?.p1 || '-'}</div>
                        <div style={{ fontSize: '10px' }}>{rates?.back?.v1 || '-'}</div>
                      </div>

                      {/* Lay 1 */}
                      <div style={cellStyle('#faa9ba')} onClick={() => !isSuspended && onBetClick(runner.RunnerName, 'lay', rates?.lay?.p1, idx, runnerId)}>
                        <div style={{ fontWeight: '700' }}>{rates?.lay?.p1 || '-'}</div>
                        <div style={{ fontSize: '10px' }}>{rates?.lay?.v1 || '-'}</div>
                      </div>

                      {/* Lay 2 */}
                      <div style={cellStyle('#fbcbd5')} onClick={() => !isSuspended && onBetClick(runner.RunnerName, 'lay', rates?.lay?.p2, idx, runnerId)}>
                        <div style={{ fontWeight: '700' }}>{rates?.lay?.p2 || '-'}</div>
                        <div style={{ fontSize: '10px', color: '#707c8a' }}>{rates?.lay?.v2 || '-'}</div>
                      </div>

                      {/* Lay 3 */}
                      <div style={{ ...cellStyle('#fde4ea'), borderRight: 'none' }} onClick={() => !isSuspended && onBetClick(runner.RunnerName, 'lay', rates?.lay?.p3, idx, runnerId)}>
                        <div style={{ fontWeight: '700' }}>{rates?.lay?.p3 || '-'}</div>
                        <div style={{ fontSize: '10px', color: '#707c8a' }}>{rates?.lay?.v3 || '-'}</div>
                      </div>

                      {/* Single Suspension Overlay across all 6 cells */}
                      {isSuspended && (
                        <div style={suspensionOverlayStyle}>
                          <span style={suspensionTextStyle}>{suspensionMsg}</span>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Render Inline Bet Box if this runner is selected */}
                {selectedBet?.runner === runner.RunnerName && selectedBet?.market === displayName && (
                  <tr>
                    <td colSpan={7} style={{ padding: 0 }}>
                      <InlineBetBox 
                        selection={selectedBet}
                        matchId={marketId}
                        onCancel={onCancelBet}
                        sport={sport}
                      />
                    </td>
                  </tr>
                )}

                {/* Runner Message Row */}
                {runner.Msg && runner.Msg !== '' && (
                  <tr style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #e4e7ed' }}>
                    <td colSpan={7} style={{ padding: '2px 16px', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '20px' }}>

                        <div style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          <span className="animate-ticker" style={{ fontSize: '10px', fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {runner.Msg}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}

          {/* Market-level Message Row */}
          {marketData?.Msg && marketData?.Msg !== '' && (
            <tr style={{ backgroundColor: '#1a1a1a' }}>
              <td colSpan={7} style={{ padding: '2px 16px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '20px' }}>

                  <div style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    <span className="animate-ticker" style={{ fontSize: '10px', fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {marketData.Msg}
                    </span>
                  </div>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default OddsTable;