import React from 'react';

/**
 * EventLayout Component
 * 
 * A 3-column layout specifically designed for the Event Detailed Page.
 * Structure: [Left: Sports/Competition Nav] | [Center: Main Content/Scoreboard] | [Right: BetSlip]
 * 
 * NOTE: Using inline styles for layout to guarantee row alignment even if Tailwind CSS is not yet installed.
 */
const EventLayout = ({ left, children, right }) => {
  return (
    <div 
      style={{ 
        display: 'grid', 
        gridTemplateColumns: '250px 1fr 450px', 
        gridGap: '10px',
        width: '100%', 
        minHeight: 'calc(100vh - 70px)', 
        backgroundColor: '#f5f5f5',
        alignItems: 'start'
      }}
      className="event-layout-row-container"
    >
      {/* Left Sidebar: Sport/Competition Navigation */}
      <aside style={{ 
        backgroundColor: '#f7f7f7', 
        borderRight: '1px solid #ccc', 
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column', 
        height: 'fit-content',
        position: 'sticky',
        top: '0px',
        zIndex: 10
      }}>
        {left}
      </aside>

      {/* Middle: Main Content Area (Scoreboard, Market Odds) */}
      <main style={{ backgroundColor: '#fff', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        {children}
      </main>

      {/* Right Sidebar: BetSlip and other actions */}
      <aside style={{ 
        backgroundColor: '#fff', 
        borderLeft: '1px solid #ccc', 
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column', 
        height: 'fit-content',
        position: 'sticky',
        top: '0px',
        zIndex: 10
      }}>
        {right}
      </aside>
    </div>
  );
};

export default EventLayout;
