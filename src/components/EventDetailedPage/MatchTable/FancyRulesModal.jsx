import React from 'react';

const FancyRulesModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const rules = [
    "1. Once a session/fancy bet is settled, it will not be reversed even if the match is tied or abandoned. Test match innings declaration/all-out rules decide over completion validity.",
    "2. Advance Session, Player Runs, and Fancy bets are valid only in full 20/50-over matches. Advance Session applies only to the first innings.",
    "3. All advance fancy markets are suspended and settled 60 minutes before match start.",
    "4. If a fancy/session market gets suspended and never resumes, all previous bets remain valid as HAAR/JEET bets.",
    "5. Incomplete session/fancy bets are cancelled, but completed sessions are settled.",
    "6. If a match is cancelled, abandoned, or no-result after a session completes, that session still gets settled.",
    "7. Retired Hurt/Retired Out bets remain valid if one ball has been completed after placing the bet.",
    "8. The company is not responsible for losses caused by software glitches.",
    "9. If power or internet failure prevents suspension of the market, company decision is final.",
    "10. Management has the final authority on wrongly offered markets and settlements.",
    "11. Suspicious bets, including stadium-side betting, may be voided anytime at company discretion.",
    "12. Cheating, fund matching, court siding, sharpening, or commission activity can lead to account fund seizure.",
    "13. Fluke hunting is prohibited. Commentary delays/mistakes are not company responsibility.",
    "14. Highest Innings Run and Lowest Innings Run fancy are valid only for the first innings.",
    "15. Certain markets settle only after the value is crossed upward (example: Total Sixes, Total Fours, Highest Score).",
    "16. Certain markets settle only after the value is crossed downward/below (example: Lowest Innings Run, Fastest Fifty).",
    "17. Bets placed on wrong commentary/rates in fancy markets may be cancelled.",
    "18. Bets placed in the wrong fancy by the customer will still be treated as confirmed bets.",
    {
      text: "19. Dot Ball rules:",
      subRules: [
        "Wides, No Balls, Leg Byes, Bye Runs do not count.",
        "Wickets also do not count as dot balls."
      ]
    },
    {
      text: "20. Bookmaker rules:",
      subRules: [
        "Advantage/disadvantage situations are ignored.",
        "ODI winner decided by 25-over comparison.",
        "T20 winner decided by 10-over comparison."
      ]
    },
    "21. Penalty runs are generally not counted in fancy markets, except in newly opened markets after the penalty.",
    "22. Virtual cricket scores are checked on the Sportradar virtual cricket page.",
    "23. In Comparison Markets, ties/equal scores favor the first batting team.",
    {
      text: "24. Boundary rules:",
      subRules: [
        "Only direct fours and sixes count for player boundary fancy.",
        "If the ball reaches boundary visually, it counts as a boundary regardless of scoreboard."
      ]
    },
    "25. Bowler Run Session becomes valid once the bowler completes the required overs plus one ball.",
    "26. Total Match Playing Over ADV settles after match completion using rounded-down overs. Reduced overs due to rain void the market.",
    "27. “3 Wickets or More by Bowler” ADV settles after full match; rain reduction voids it.",
    {
      text: "28. KHADDA fancy:",
      subRules: [
        "Valid only for first innings.",
        "Rain/over reduction voids the market.",
        "Incomplete sessions are cancelled."
      ]
    },
    {
      text: "29. LOTTERY fancy:",
      subRules: [
        "Rain/over reduction voids the market.",
        "Only the last digit of session total is considered."
      ]
    },
    "30. Closed-door match betting using groundline advantage may result in bets being voided.",
    "31. Session Odd-Even markets settle only if the over is fully completed.",
    "32. Company may void winning bets of any event at any point of the match if the company believes there is any cheating/wrong doing in that particular event by the players (either batsman/bowler)",
    "33. If live or TV scoreboards malfunction, settlement is based on company-offered live rates.",
    {
      text: "34. Super Over:",
      subRules: [
        "Match odds settle after final winner declaration.",
        "Bookmaker markets settle/void based on that specific super over market."
      ]
    },
    "35. Total Match 30s market counts players scoring 30–49 only.",
    "36. Total Match Fifty market counts players scoring 50–99 only.",
    "37. Retired Hurt/Out is not considered a wicket in wicket markets.",
    {
      text: "38. TOTAL OVER RUNS:",
      subRules: [
        "Rain-reduced overs void the market.",
        "Penalty runs are counted."
      ]
    },
    "39. Total Match Four Hitters counts batsmen who hit at least one four.",
    "40. Total Match Six Hitters counts batsmen who hit at least one six.",
    "41. Total Match Wicket Takers counts bowlers who take wickets.",
    "42. Total No Boundary Overs excludes boundaries from wides, overthrows, leg byes, etc.",
    "43. Election results are settled according to the Election Commission of India.",
    "44. Accidental election issues are not counted in settlement."
  ];

  return (
    <div 
      className="fancy-rules-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 11000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        className="fancy-rules-modal-container"
        style={{
          width: '100%',
          maxWidth: '550px',
          backgroundColor: '#fff',
          borderRadius: '4px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '80vh',
          animation: 'modalSlideUp 0.3s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="modal-header"
          style={{
            padding: '10px 15px',
            borderBottom: '1px solid #ccc',
            background: '#f5f5f5',
            textAlign: 'center',
            position: 'relative',
            borderTopLeftRadius: '4px',
            borderTopRightRadius: '4px'
          }}
        >
          <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#1a2d3b' }}>
            Rules of Fancy Bets
          </p>
        </div>

        <div 
          className="modal-body"
          style={{
            padding: '15px 20px',
            overflowY: 'auto',
            fontSize: '13px',
            color: '#444',
            lineHeight: '1.6'
          }}
        >
          <div className="rules-content">
            <div style={{ margin: 0, padding: 0 }}>
              {rules.map((rule, index) => (
                <div key={index} style={{ marginBottom: '14px' }}>
                  {typeof rule === 'string' ? (
                    rule
                  ) : (
                    <>
                      <div style={{ fontWeight: '600', color: '#333' }}>{rule.text}</div>
                      <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginTop: '6px' }}>
                        {rule.subRules.map((sub, sIdx) => (
                          <li key={sIdx} style={{ marginBottom: '4px' }}>{sub}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div 
          className="modal-footer"
          style={{
            padding: '12px 15px',
            borderTop: '1px solid #ccc',
            display: 'flex',
            justifyContent: 'center',
            background: '#f5f5f5',
            borderBottomLeftRadius: '4px',
            borderBottomRightRadius: '4px'
          }}
        >
          <button 
            onClick={onClose}
            style={{
              padding: '8px 50px',
              background: 'linear-gradient(to bottom, #ffffff 0%, #e5e5e5 100%)',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#333',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            OK
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalSlideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .rules-content ol li::marker {
          font-weight: bold;
          color: #1a2d3b;
        }
      `}</style>
    </div>
  );
};

export default FancyRulesModal;
