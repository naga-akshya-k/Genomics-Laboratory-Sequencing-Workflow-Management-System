import React from 'react';
import { Check, Circle } from 'lucide-react';

const STAGES = [
  { id: 'registered', label: 'Registered', description: 'Specimen Intake' },
  { id: 'qc', label: 'QC Assessment', description: 'Purity & Yield' },
  { id: 'sequencing', label: 'Sequencing', description: 'NGS Flowcell Run' },
  { id: 'analysis', label: 'Analysis', description: 'Bioinformatics' },
  { id: 'report_ready', label: 'Report Ready', description: 'Draft Clinical Findings' },
  { id: 'delivered', label: 'Delivered', description: 'Released to Investigator' },
];

const StageTimeline = ({ currentStage = 'registered', className = '' }) => {
  const currentIndex = STAGES.findIndex((s) => s.id === currentStage);
  const activeIdx = currentIndex !== -1 ? currentIndex : 0;

  return (
    <div className={`w-full py-4 ${className}`}>
      {/* Mobile view: compact badge & progress bar */}
      <div className="block md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase">Workflow Stage</span>
          <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
            {STAGES[activeIdx]?.label} (Step {activeIdx + 1} of {STAGES.length})
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-teal-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${((activeIdx + 1) / STAGES.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop view: Step pipeline */}
      <div className="hidden md:flex items-center justify-between relative">
        {/* Connecting background bar */}
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />
        <div
          className="absolute top-4 left-6 h-0.5 bg-teal-600 transition-all duration-500 -z-0"
          style={{
            width: activeIdx === 0 ? '0%' : `${(activeIdx / (STAGES.length - 1)) * 100}%`,
          }}
        />

        {STAGES.map((stage, idx) => {
          const isCompleted = idx < activeIdx;
          const isCurrent = idx === activeIdx;
          const isUpcoming = idx > activeIdx;

          return (
            <div key={stage.id} className="relative z-10 flex flex-col items-center text-center max-w-[120px]">
              {/* Circle Icon */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs transition-all shadow-sm ${
                  isCompleted
                    ? 'bg-teal-600 text-white ring-4 ring-teal-50'
                    : isCurrent
                    ? 'bg-white text-teal-700 border-2 border-teal-600 ring-4 ring-teal-100 scale-110 font-bold'
                    : 'bg-white text-slate-400 border-2 border-slate-300'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 stroke-[2.5]" />
                ) : isCurrent ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-pulse" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              {/* Text labels */}
              <div className="mt-2.5">
                <p
                  className={`text-xs font-semibold leading-tight ${
                    isCurrent
                      ? 'text-teal-900 font-bold'
                      : isCompleted
                      ? 'text-slate-800'
                      : 'text-slate-400'
                  }`}
                >
                  {stage.label}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5 hidden lg:block leading-tight">
                  {stage.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StageTimeline;
