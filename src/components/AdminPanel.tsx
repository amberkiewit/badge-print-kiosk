'use client';

import { useState, useRef, useEffect } from 'react';
import { importCSV, getStats, clearAllAttendees } from '@/lib/api-client';

interface AdminPanelProps {
  onClose: () => void;
}

export function AdminPanel({ onClose }: AdminPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'idle' | 'loading' | 'success' | 'error';
    message?: string;
    details?: string[];
  }>({ type: 'idle' });
  const [stats, setStats] = useState<{ total: number; checkedIn: number } | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const s = await getStats();
      setStats(s);
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
  };

  const processFile = async (file: File) => {
    setUploadStatus({ type: 'loading', message: 'Processing CSV file...' });

    try {
      const csvContent = await file.text();
      const result = await importCSV(csvContent);

      if (!result.success) {
        setUploadStatus({
          type: 'error',
          message: 'Failed to parse CSV',
          details: result.errors?.slice(0, 10),
        });
        return;
      }

      await loadStats();

      setUploadStatus({
        type: 'success',
        message: `Successfully imported ${result.insertedCount} attendees`,
        details: result.errors && result.errors.length > 0 
          ? [`${result.errors.length} rows had errors`, ...result.errors.slice(0, 5)]
          : undefined,
      });
    } catch (e) {
      setUploadStatus({
        type: 'error',
        message: `Failed to process file: ${e instanceof Error ? e.message : 'Unknown error'}`,
      });
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      await processFile(file);
    } else {
      setUploadStatus({ type: 'error', message: 'Please upload a CSV file' });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleClearAll = async () => {
    await clearAllAttendees();
    await loadStats();
    setShowConfirmClear(false);
    setUploadStatus({ type: 'success', message: 'All attendees cleared' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#12121a] p-8 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="mb-2 text-2xl font-bold text-white">Admin Panel</h2>
        <p className="mb-8 text-white/50">Manage attendee data and system settings</p>

        {/* Stats */}
        {stats && (
          <div className="mb-8 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="text-4xl font-bold text-white">{stats.total}</div>
              <div className="text-sm text-white/50">Total Attendees</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="text-4xl font-bold text-emerald-400">{stats.checkedIn}</div>
              <div className="text-sm text-white/50">Checked In</div>
            </div>
          </div>
        )}

        {/* Upload area */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mb-6 cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-all ${
            isDragging
              ? 'border-amber-500 bg-amber-500/10'
              : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileSelect}
            className="hidden"
          />

          <svg className="mx-auto mb-4 h-12 w-12 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>

          <p className="mb-2 text-lg font-medium text-white">
            Drop CSV file here or click to browse
          </p>
          <p className="text-sm text-white/40">
            Columns: first_name, last_name, meal_preference
          </p>
        </div>

        {/* Upload status */}
        {uploadStatus.type !== 'idle' && (
          <div
            className={`mb-6 rounded-xl p-4 ${
              uploadStatus.type === 'loading'
                ? 'bg-blue-500/20 text-blue-400'
                : uploadStatus.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            <div className="flex items-center gap-3">
              {uploadStatus.type === 'loading' && (
                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {uploadStatus.type === 'success' && (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
              {uploadStatus.type === 'error' && (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              )}
              <span className="font-medium">{uploadStatus.message}</span>
            </div>
            {uploadStatus.details && uploadStatus.details.length > 0 && (
              <ul className="mt-3 space-y-1 border-t border-current/20 pt-3 text-sm opacity-80">
                {uploadStatus.details.map((detail, i) => (
                  <li key={i}>• {detail}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-white/10 pt-6">
          <div>
            {!showConfirmClear ? (
              <button
                onClick={() => setShowConfirmClear(true)}
                className="rounded-lg px-4 py-2 text-red-400 transition-colors hover:bg-red-500/10"
              >
                Clear All Attendees
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-sm text-red-400">Are you sure?</span>
                <button
                  onClick={handleClearAll}
                  className="rounded-lg bg-red-500 px-4 py-2 font-medium text-white transition-colors hover:bg-red-600"
                >
                  Yes, Clear All
                </button>
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="rounded-lg px-4 py-2 text-white/50 transition-colors hover:text-white"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="rounded-lg bg-white/10 px-6 py-2 font-medium text-white transition-colors hover:bg-white/20"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
