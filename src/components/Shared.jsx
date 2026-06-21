import React from 'react';
import { X } from 'lucide-react';

export function Badge({ value }) {
  const cls = `badge-${String(value).replaceAll(' ', '-').toLowerCase()}`;
  return (
    <span className={`inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${cls}`}>
      {value}
    </span>
  );
}

export function Field({ label, value, onChange, className = '', ...props }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      {label && <span className="text-xs font-medium text-textMuted">{label}</span>}
      <input
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-bgSecondary border border-borderCool text-textPrimary text-sm rounded-md px-3.5 py-2.5 outline-none placeholder:text-textMuted/60 focus:border-primary focus:ring-2 focus:ring-primary-light transition-all"
        {...props}
      />
    </label>
  );
}

export function TextArea({ label, value, onChange, className = '', ...props }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      {label && <span className="text-xs font-medium text-textMuted">{label}</span>}
      <textarea
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-bgSecondary border border-borderCool text-textPrimary text-sm rounded-md px-3.5 py-2.5 outline-none placeholder:text-textMuted/60 focus:border-primary focus:ring-2 focus:ring-primary-light transition-all min-h-[80px] resize-y"
        {...props}
      />
    </label>
  );
}

export function Select({ label, value, onChange, options, className = '', ...props }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      {label && <span className="text-xs font-medium text-textMuted">{label}</span>}
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-bgSecondary border border-borderCool text-textPrimary text-sm rounded-md px-3.5 py-2.5 outline-none cursor-pointer focus:border-primary focus:ring-2 focus:ring-primary-light transition-all"
        {...props}
      >
        {options.map(([v, l]) => (
          <option key={v || l} value={v}>{l}</option>
        ))}
      </select>
    </label>
  );
}

export function DataList({ children, emptyText }) {
  const items = React.Children.toArray(children).filter(Boolean);
  if (!items.length) return <p className="text-center text-sm text-textMuted py-8">{emptyText}</p>;
  return <div className="flex flex-col gap-2">{items}</div>;
}

export function Row({ title, meta, children }) {
  return (
    <div className="flex justify-between items-center bg-bgPrimary border border-borderCool rounded-lg px-4 py-3 hover:border-primary/30 transition-colors">
      <div className="min-w-0 flex-1">
        <span className="text-[13px] font-medium text-textPrimary block truncate">{title}</span>
        {meta && <small className="text-[11px] text-textMuted block mt-0.5 truncate">{meta}</small>}
      </div>
      <div className="flex items-center gap-2 ml-3 shrink-0">{children}</div>
    </div>
  );
}

export function Notice({ text }) {
  return <p className="text-sm text-warning bg-warning-light border border-warning/20 rounded-lg px-4 py-2.5 font-medium">{text}</p>;
}

export function SectionTitle({ icon: Icon, title }) {
  return (
    <h2 className="flex items-center gap-2 font-title text-base font-semibold text-textPrimary">
      <Icon size={18} className="text-primary" /> {title}
    </h2>
  );
}

export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000] animate-fade-in" onClick={onClose}>
      <div className="bg-bgSecondary border border-borderCool rounded-2xl p-7 w-[min(540px,92vw)] max-h-[88vh] overflow-y-auto shadow-xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-borderCool">
          <h3 className="font-title text-lg font-semibold text-textPrimary">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-textMuted hover:text-textPrimary hover:bg-bgHover transition-colors">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
