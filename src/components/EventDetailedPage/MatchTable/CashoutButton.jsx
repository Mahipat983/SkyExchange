'use client'
import React from 'react'
import { DollarSign, Loader2 } from 'lucide-react'

/**
 * CashoutButton - A premium, high-converting cashout UI component
 * Ported from betting-pwa for SkyExchange integration.
 */
const CashoutButton = ({
  amount = 0,
  currency = '₹',
  onCashout,
  isLoading = false,
  disabled = false,
  className = "",
  mobileView = false
}) => {

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled && !isLoading && onCashout) onCashout();
      }}
      disabled={disabled || isLoading}
      className={`
        relative group overflow-hidden
        ${mobileView ? 'h-6 px-1.5' : 'h-7 px-2'} rounded-[4px]
        flex items-center justify-center gap-1
        transition-all duration-300 ease-out
        ${disabled
          ? 'bg-gray-400 cursor-not-allowed opacity-50'
          : 'bg-gradient-to-b from-[#fcd489] to-[#d4a85a] hover:brightness-110 active:opacity-90 shadow-sm'
        }
        ${className}
      `}
    >
      <div className="flex items-center gap-1 z-10">
        <span className="text-[10px] font-bold text-black/80 leading-none">
          {currency}
        </span>

        {isLoading ? (
          <Loader2 size={mobileView ? 10 : 11} className="animate-spin text-black/60" />
        ) : (
          <span className={`${mobileView ? 'text-[11px]' : 'text-[12px]'} font-black leading-none text-[#ff5722]`}>
            {amount.toLocaleString()}
          </span>
        )}

        <span className="text-[9px] font-black uppercase tracking-tight text-black/80 leading-none ml-0.5">
          CASH OUT
        </span>
      </div>

      {/* Shine Effect */}
      <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:animate-shine transition-all" />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shine {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        .group:hover .animate-shine {
          animation: shine 0.8s ease-in-out;
        }
      ` }} />
    </button>
  )
}

export default CashoutButton;
