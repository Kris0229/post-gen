import { NavLink, Outlet } from 'react-router-dom';

const tabs = [
  { to: '/', label: '新聞流' },
  { to: '/materials', label: '素材庫' },
  { to: '/write', label: '寫作' },
];

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 text-sm font-medium border-b-2 ${
    isActive
      ? 'border-giants-orange text-giants-orange'
      : 'border-transparent text-giants-black/60 hover:text-giants-black'
  }`;

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-giants-black/10 bg-white px-2">
        <nav className="flex gap-1">
          {tabs.map((tab) => (
            <NavLink key={tab.to} to={tab.to} end={tab.to === '/'} className={tabClass}>
              {tab.label}
            </NavLink>
          ))}
        </nav>
        <NavLink
          to="/settings"
          aria-label="設定"
          className={({ isActive }) =>
            `p-2 rounded-full ${isActive ? 'text-giants-orange' : 'text-giants-black/60 hover:text-giants-black'}`
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065Z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        </NavLink>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
