import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Play,
  RotateCcw,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  FileText,
  Terminal,
  List,
  Layers,
  Sparkles,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { api } from '../../services/api';

export default function JobManagerModal({
  isOpen,
  onClose,
  activeJob,
  onSelectJobResult,
  onRetryJob,
}) {
  const [activeTab, setActiveTab] = useState('current'); // 'current' | 'history'
  const [jobState, setJobState] = useState(activeJob || null);
  const [jobHistory, setJobHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const logContainerRef = useRef(null);

  // Poll active job status while running
  useEffect(() => {
    if (activeJob) {
      setJobState(activeJob);
    }
  }, [activeJob]);

  useEffect(() => {
    let interval = null;
    if (isOpen && jobState && !['completed', 'failed', 'cancelled'].includes(jobState.state)) {
      interval = setInterval(async () => {
        try {
          const updated = await api.getJobStatus(jobState.job_id);
          if (updated && updated.job_id) {
            setJobState(updated);
            if (updated.state === 'completed' && updated.result && onSelectJobResult) {
              onSelectJobResult(updated.result);
            }
          }
        } catch (err) {
          console.error('Job polling error:', err);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, jobState, onSelectJobResult]);

  // Load history when tab clicked
  useEffect(() => {
    if (isOpen && activeTab === 'history') {
      setIsLoadingHistory(true);
      api.listJobs()
        .then((data) => {
          setJobHistory(Array.isArray(data) ? data : []);
        })
        .catch((err) => console.error('Failed to load job history:', err))
        .finally(() => setIsLoadingHistory(false));
    }
  }, [isOpen, activeTab]);

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [jobState?.logs]);

  const handleCancel = async () => {
    if (!jobState?.job_id) return;
    try {
      const res = await api.cancelJob(jobState.job_id);
      setJobState(res);
    } catch (err) {
      console.error('Cancel failed:', err);
    }
  };

  const handleRetry = async () => {
    if (!jobState?.job_id) return;
    try {
      const newJob = await api.retryJob(jobState.job_id);
      setJobState(newJob);
    } catch (err) {
      console.error('Retry failed:', err);
    }
  };

  if (!isOpen) return null;

  const stages = [
    { key: 'queued', label: 'Queued' },
    { key: 'validating', label: 'Validating' },
    { key: 'preprocessing_dem', label: 'Preprocessing DEM' },
    { key: 'generating_mesh', label: 'Generating Mesh' },
    { key: 'running', label: 'Solver Running' },
    { key: 'post_processing', label: 'Post-Processing' },
    { key: 'exporting', label: 'Exporting' },
    { key: 'completed', label: 'Completed' },
  ];

  const currentStageIdx = stages.findIndex((s) => s.key === jobState?.state);
  const isFailed = jobState?.state === 'failed';
  const isCancelled = jobState?.state === 'cancelled';
  const isCompleted = jobState?.state === 'completed';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Asynchronous Job Manager & Worker Queue
              </h2>
              <p className="text-xs text-slate-400">
                Run ID: <code className="text-cyan-400 font-mono">{jobState?.run_id || 'sim_active'}</code> | Scenario: <strong>{jobState?.scenario_name || 'Tehri Dam'}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-2 border-b border-slate-800 bg-slate-950/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('current')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'current'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Current Simulation</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Run History</span>
            </button>
          </div>

          {jobState && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Queue Pos: <strong className="text-slate-200">{jobState.queue_position || 'Active'}</strong></span>
              <span>•</span>
              <span>Est. Duration: <strong className="text-slate-200">{jobState.estimated_duration_s || 12}s</strong></span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {activeTab === 'current' && jobState && (
            <>
              {/* Stage Progress Stepper */}
              <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    {jobState.stage_label || 'Executing...'}
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    {jobState.progress_pct || (isCompleted ? 100 : 45)}%
                  </span>
                </div>

                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      isFailed
                        ? 'bg-red-500'
                        : isCancelled
                        ? 'bg-amber-500'
                        : 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                    }`}
                    style={{ width: `${jobState.progress_pct || (isCompleted ? 100 : 45)}%` }}
                  />
                </div>

                {/* Stage Badges */}
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 pt-1">
                  {stages.map((st, idx) => {
                    const isDone = isCompleted || (currentStageIdx >= 0 && idx < currentStageIdx);
                    const isCurrent = currentStageIdx === idx && !isCompleted;
                    return (
                      <div
                        key={st.key}
                        className={`p-1.5 rounded-lg text-center text-[9px] font-semibold truncate ${
                          isDone
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                            : isCurrent
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-bold'
                            : 'bg-slate-900 text-slate-500'
                        }`}
                        title={st.label}
                      >
                        {st.label}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Worker Console Logs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Real-Time Worker Execution Log</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Elapsed: {jobState.elapsed_seconds || 0}s
                  </span>
                </div>

                <div
                  ref={logContainerRef}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-slate-300 h-52 overflow-y-auto space-y-1.5 selection:bg-cyan-500 selection:text-slate-950"
                >
                  {(jobState.logs && jobState.logs.length > 0) ? (
                    jobState.logs.map((l, i) => (
                      <div key={i} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-slate-500 text-[10px] shrink-0 font-mono">[{l.timestamp}]</span>
                        <span
                          className={`shrink-0 text-[10px] font-bold px-1 rounded ${
                            l.level === 'SUCCESS'
                              ? 'text-emerald-400 bg-emerald-950/60'
                              : l.level === 'ERROR'
                              ? 'text-red-400 bg-red-950/60'
                              : l.level === 'WARNING'
                              ? 'text-amber-400 bg-amber-950/60'
                              : 'text-cyan-400 bg-cyan-950/40'
                          }`}
                        >
                          {l.level}
                        </span>
                        <span className="text-slate-200">{l.message}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 italic">Waiting for log stream from background solver worker...</div>
                  )}
                </div>
              </div>

              {/* Status Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  {!isCompleted && !isFailed && !isCancelled && (
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 text-xs font-semibold transition"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel Simulation</span>
                    </button>
                  )}

                  {(isFailed || isCancelled) && (
                    <button
                      onClick={handleRetry}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs font-semibold transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retry Simulation</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => api.downloadRunReportMarkdown(jobState)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-semibold transition"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Download Run Report (.md)</span>
                  </button>

                  {isCompleted && (
                    <button
                      onClick={() => {
                        if (jobState.result && onSelectJobResult) {
                          onSelectJobResult(jobState.result);
                        }
                        onClose();
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition shadow-md shadow-cyan-500/20"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Results in Simulation Lab</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* TAB 2: Run History */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300">Previous Simulation Runs</h3>
                <button
                  onClick={() => {
                    setIsLoadingHistory(true);
                    api.listJobs()
                      .then((data) => setJobHistory(Array.isArray(data) ? data : []))
                      .finally(() => setIsLoadingHistory(false));
                  }}
                  className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingHistory ? 'animate-spin' : ''}`} /> Refresh
                </button>
              </div>

              {jobHistory.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/40 border border-slate-800 rounded-2xl text-slate-400 text-xs">
                  No previous runs found. Submitted jobs will appear here.
                </div>
              ) : (
                <div className="space-y-2">
                  {jobHistory.map((j) => (
                    <div
                      key={j.job_id}
                      className="p-3.5 bg-slate-950/60 hover:bg-slate-800/40 border border-slate-800 rounded-xl flex items-center justify-between transition group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-200">{j.scenario_name || j.scenario_id}</h4>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              j.state === 'completed'
                                ? 'bg-emerald-950 text-emerald-400'
                                : j.state === 'failed'
                                ? 'bg-red-950 text-red-400'
                                : 'bg-cyan-950 text-cyan-400'
                            }`}
                          >
                            {j.state?.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">
                          Run: {j.run_id} • Solver: {j.solver_type} • Time: {j.elapsed_seconds}s
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => api.downloadRunReportMarkdown(j)}
                          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition"
                          title="Download Report"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {j.result && (
                          <button
                            onClick={() => {
                              if (onSelectJobResult) onSelectJobResult(j.result);
                              onClose();
                            }}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 text-xs font-semibold rounded-lg transition"
                          >
                            Load
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
