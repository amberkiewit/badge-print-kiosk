'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Attendee, searchAttendees, checkInAttendee } from '@/lib/api-client';
import { Badge } from './Badge';

interface SearchKioskProps {
  onAdminClick?: () => void;
}

type KioskState = 'search' | 'results' | 'badge';

export function SearchKiosk({ onAdminClick }: SearchKioskProps) {
  const [state, setState] = useState<KioskState>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Attendee[]>([]);
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [editedFirstName, setEditedFirstName] = useState('');
  const [editedLastName, setEditedLastName] = useState('');
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-reset to search after inactivity
  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (state !== 'search') {
      timeoutRef.current = setTimeout(() => {
        setState('search');
        setQuery('');
        setResults([]);
        setSelectedAttendee(null);
      }, 60000); // 60 second timeout
    }
  }, [state]);

  useEffect(() => {
    resetTimer();
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [state, resetTimer]);

  // Focus input on search state
  useEffect(() => {
    if (state === 'search' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [state]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const searchResults = await searchAttendees(query);
      setResults(searchResults);
      setState('results');
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSelectAttendee = async (attendee: Attendee) => {
    setSelectedAttendee(attendee);
    setEditedFirstName(attendee.first_name);
    setEditedLastName(attendee.last_name);
    
    const result = await checkInAttendee(attendee.id);
    setAlreadyCheckedIn(result.alreadyCheckedIn || false);
    
    setState('badge');
    resetTimer();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    if (state === 'badge') {
      setState('results');
    } else {
      setState('search');
      setQuery('');
      setResults([]);
    }
  };

  const handleNewSearch = () => {
    setState('search');
    setQuery('');
    setResults([]);
    setSelectedAttendee(null);
    setAlreadyCheckedIn(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0d0d14]" onClick={resetTimer}>
      {/* Animated background */}
      <div className="no-print pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 h-full w-full animate-spin-slow rounded-full bg-gradient-to-br from-amber-500/10 via-transparent to-transparent" style={{ animationDuration: '60s' }} />
        <div className="absolute -bottom-1/2 -right-1/2 h-full w-full animate-spin-slow rounded-full bg-gradient-to-tl from-orange-500/10 via-transparent to-transparent" style={{ animationDuration: '45s', animationDirection: 'reverse' }} />
      </div>

      {/* Header */}
      <header className="no-print relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/20">
            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Badge Kiosk</h1>
            <p className="text-sm text-white/40">Check in & print your badge</p>
          </div>
        </div>
        <button
          onClick={onAdminClick}
          className="rounded-lg px-4 py-2 text-sm text-white/30 transition-colors hover:bg-white/5 hover:text-white/50"
        >
          Admin
        </button>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-8 pb-16">
        {state === 'search' && (
          <div className="w-full max-w-2xl animate-fade-in text-center">
            <h2 className="mb-4 text-5xl font-bold text-white">
              Welcome!
            </h2>
            <p className="mb-12 text-xl text-white/50">
              Enter your name to find your registration
            </p>

            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search by name..."
                className="w-full rounded-2xl border-2 border-white/10 bg-white/5 px-8 py-6 text-2xl text-white placeholder-white/30 outline-none backdrop-blur-sm transition-all focus:border-amber-500/50 focus:bg-white/10"
                autoComplete="off"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || !query.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white shadow-lg shadow-amber-500/25 transition-all hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100"
              >
                {isSearching ? (
                  <svg className="h-7 w-7 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}

        {state === 'results' && (
          <div className="w-full max-w-3xl animate-fade-in">
            <button
              onClick={handleBack}
              className="mb-6 flex items-center gap-2 text-white/50 transition-colors hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Back to search
            </button>

            <h2 className="mb-2 text-3xl font-bold text-white">
              {results.length === 0 ? 'No Results Found' : `Found ${results.length} Result${results.length !== 1 ? 's' : ''}`}
            </h2>
            <p className="mb-8 text-white/50">
              {results.length === 0 ? 'Try a different search term' : 'Select your name to print your badge'}
            </p>

            {results.length > 0 && (
              <div className="grid gap-3">
                {results.map((attendee) => (
                  <button
                    key={attendee.id}
                    onClick={() => handleSelectAttendee(attendee)}
                    className="group flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-6 text-left transition-all hover:border-amber-500/50 hover:bg-white/10"
                  >
                    <div className="flex items-center gap-5">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-xl font-bold text-amber-400">
                        {attendee.first_name[0]}{attendee.last_name[0]}
                      </div>
                      <div>
                        <div className="text-xl font-semibold text-white">
                          {attendee.first_name} {attendee.last_name}
                        </div>
                        {attendee.meal_preference?.trim() && (
                          <div className="mt-1 text-sm text-white/50">
                            <span role="img" aria-label="meal">🍽️</span> {attendee.meal_preference.trim()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {attendee.checked_in ? (
                        <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-medium text-emerald-400">
                          Checked In
                        </span>
                      ) : null}
                      <svg className="h-6 w-6 text-white/30 transition-transform group-hover:translate-x-1 group-hover:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {results.length === 0 && (
              <button
                onClick={handleNewSearch}
                className="mt-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-4 font-semibold text-white shadow-lg shadow-amber-500/25 transition-all hover:scale-105"
              >
                Try Another Search
              </button>
            )}
          </div>
        )}

        {state === 'badge' && selectedAttendee && (
          <div className="animate-fade-in text-center">
            <div className="no-print">
              <button
                onClick={handleBack}
                className="mb-8 flex items-center gap-2 text-white/50 transition-colors hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                Back to results
              </button>

              {alreadyCheckedIn ? (
                <div className="mb-6">
                  <div className="mb-4 rounded-xl bg-amber-500/20 border-2 border-amber-500 px-6 py-4">
                    <h2 className="text-2xl font-bold text-amber-400">⚠️ Already Checked In</h2>
                    <p className="mt-2 text-amber-200/80">This person has already checked in and received their badge.</p>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="mb-4 text-3xl font-bold text-white">
                    Welcome! 🎉
                  </h2>

                  {/* Editable name fields */}
                  <div className="mb-6 flex flex-col items-center gap-3">
                    <p className="text-sm text-white/50">Edit name if needed:</p>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={editedFirstName}
                        onChange={(e) => setEditedFirstName(e.target.value)}
                        className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-center text-lg text-white outline-none focus:border-amber-500"
                        placeholder="First name"
                      />
                      <input
                        type="text"
                        value={editedLastName}
                        onChange={(e) => setEditedLastName(e.target.value)}
                        className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-center text-lg text-white outline-none focus:border-amber-500"
                        placeholder="Last name"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <Badge
              ref={badgeRef}
              attendee={{
                ...selectedAttendee,
                first_name: editedFirstName,
                last_name: editedLastName,
              }}
              showPrintButton={!alreadyCheckedIn}
              onPrint={handlePrint}
            />

            <div className="no-print">
              <button
                onClick={handleNewSearch}
                className="mt-8 text-white/50 transition-colors hover:text-white"
              >
                Done? Start New Search
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Print styles */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-spin-slow {
          animation: spin-slow 60s linear infinite;
        }
        
        @media print {
          body * {
            visibility: hidden;
          }
          .badge-print-area, .badge-print-area * {
            visibility: visible;
          }
          .badge-print-area {
            position: absolute;
            left: 0;
            top: 0;
          }
        }
      `}</style>
    </div>
  );
}
