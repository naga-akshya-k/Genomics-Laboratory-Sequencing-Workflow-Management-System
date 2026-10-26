import React from 'react';

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'teal',
  trend,
  className = '',
  onClick,
}) => {
  const colorMap = {
    teal: {
      bg: 'bg-teal-50',
      text: 'text-teal-700',
      iconBg: 'bg-teal-100 text-teal-700',
    },
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      iconBg: 'bg-indigo-100 text-indigo-700',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      iconBg: 'bg-amber-100 text-amber-700',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      iconBg: 'bg-emerald-100 text-emerald-700',
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      iconBg: 'bg-rose-100 text-rose-700',
    },
    slate: {
      bg: 'bg-slate-50',
      text: 'text-slate-700',
      iconBg: 'bg-slate-100 text-slate-700',
    },
  };

  const scheme = colorMap[color] || colorMap.teal;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm transition-all hover:shadow-md ${
        onClick ? 'cursor-pointer hover:border-teal-300' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
        {Icon && (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${scheme.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <h4 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{value}</h4>
        {subtitle && (
          <p className="mt-1 text-xs text-slate-500 flex items-center gap-1.5">
            {trend && <span className="font-medium text-emerald-600">{trend}</span>}
            <span>{subtitle}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
