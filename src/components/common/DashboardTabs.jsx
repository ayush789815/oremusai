'use client';

import { usePathname, useRouter } from 'next/navigation';

const TABS = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Ratios',    path: '/ratios'    },
];

export default function DashboardTabs() {
  const pathname = usePathname();
  const router   = useRouter();

  return (
    <div className="flex gap-6 mb-6 border-b border-navy-100 dark:border-navy-800">
      {TABS.map(({ label, path }) => {
        const active = pathname === path || pathname.startsWith(path + '/');
        return (
          <button
            key={path}
            onClick={() => router.push(path)}
            className={`
              pb-3 text-[14px] border-b-[2.5px] -mb-px transition-colors whitespace-nowrap
              ${active
                ? 'border-blue-500 text-navy-900 dark:text-white font-medium'
                : 'border-transparent text-navy-400 dark:text-navy-500 font-normal hover:text-navy-700 dark:hover:text-navy-300'}
            `}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
