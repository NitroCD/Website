import { Outlet } from 'react-router-dom';
import Nav from './Nav';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0f172a' }}>
      <Nav />
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>
      <footer className="text-center py-4 text-slate-500 text-sm border-t border-slate-800">
        RSC Season 25 · Rocket Soccar Confederation
      </footer>
    </div>
  );
}
