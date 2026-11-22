import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
  gradient?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  change,
  isPositive = true,
  icon,
  gradient = 'from-slate-800 to-slate-850',
}) => {
  return (
    <div
      className={`p-5 rounded-2xl bg-gradient-to-br ${gradient} border border-slate-800 shadow-sm relative overflow-hidden`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        <div className="p-2.5 rounded-xl bg-slate-900/60 text-teal-400 border border-slate-700/50">
          {icon}
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-black text-white tracking-tight">{value}</span>
        {change && (
          <span
            className={`inline-flex items-center text-xs font-bold ${
              isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {change}
          </span>
        )}
      </div>

      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
};
