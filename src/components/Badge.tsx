'use client';

import { Attendee } from '@/lib/api-client';
import { forwardRef } from 'react';

interface BadgeProps {
  attendee: Attendee;
  showPrintButton?: boolean;
  onPrint?: () => void;
}

const MEAL_ICONS: Record<string, { icon: string; color: string }> = {
  'vegetarian': { icon: '🥬', color: '#22c55e' },
  'vegan': { icon: '🌱', color: '#22c55e' },
  'gluten free': { icon: '🌾', color: '#f59e0b' },
  'halal': { icon: '☪', color: '#3b82f6' },
};

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  function Badge({ attendee, showPrintButton = false, onPrint }, ref) {
    const mealPref = attendee.meal_preference?.toLowerCase().trim() || '';
    const mealConfig = MEAL_ICONS[mealPref];

    return (
      <div className="flex flex-col items-center gap-6">
        <div
          ref={ref}
          className="badge-print-area relative overflow-hidden bg-white"
          style={{
            width: '4in',
            height: '6in',
            fontFamily: 'system-ui, sans-serif',
            margin: 0,
            padding: 0,
          }}
        >
          {/* Background SVG */}
          <img
            src="/KIE_2026_Name Tags_3.svg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectFit: 'fill' }}
          />

          {/* Top half content area - name and meal centered in first 3 inches */}
          <div 
            className="absolute top-0 left-0 right-0 flex flex-col items-center justify-center"
            style={{ height: '3in' }}
          >
            {/* Name */}
            <div className="text-center px-4">
              <div
                className="text-4xl font-black leading-tight tracking-tight text-gray-900"
                style={{ fontFamily: 'Arial Black, sans-serif' }}
              >
                {attendee.first_name}
              </div>
              <div
                className="mt-1 text-3xl font-black leading-tight tracking-tight text-gray-900"
                style={{ fontFamily: 'Arial Black, sans-serif' }}
              >
                {attendee.last_name}
              </div>
            </div>

            {/* Meal preference indicator */}
            {mealConfig && (
              <div 
                className="mt-4 flex items-center gap-2 rounded-full px-4 py-2"
                style={{ backgroundColor: mealConfig.color + '20', border: `2px solid ${mealConfig.color}` }}
              >
                <span className="text-xl">{mealConfig.icon}</span>
                <span 
                  className="text-sm font-bold uppercase tracking-wider"
                  style={{ color: mealConfig.color }}
                >
                  {attendee.meal_preference}
                </span>
              </div>
            )}
          </div>
        </div>

        {showPrintButton && (
          <button
            onClick={onPrint}
            className="no-print group flex items-center gap-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-amber-500/30"
          >
            <svg
              className="h-6 w-6 transition-transform group-hover:-translate-y-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Print Badge
          </button>
        )}
      </div>
    );
  }
);
