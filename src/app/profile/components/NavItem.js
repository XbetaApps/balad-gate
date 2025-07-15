'use client';

export default function NavItem({ icon, label, active, onClick, badgeCount }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full ${
        active
          ? 'bg-[var(--primary)] text-white'
          : 'hover:bg-[var(--background-hover)] text-[var(--text-primary)]'
      }`}
    >
      {icon}
      <div className="flex-1 flex items-center justify-between">
        <span>{label}</span>
        {badgeCount > 0 && (
          <span className="ml-2 px-2 py-1 rounded-full bg-red-500 text-white text-xs font-medium">
            {badgeCount}
          </span>
        )}
      </div>
    </button>
  );
}
