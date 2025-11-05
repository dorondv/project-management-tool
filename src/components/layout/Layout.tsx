import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useApp } from '../../context/AppContext';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { state } = useApp();
  const isRTL = state.locale === 'he';
  const sidebarOffsetClass = isRTL ? 'mr-64' : 'ml-64';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <Header />
      <main className={`${sidebarOffsetClass} pt-16 ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}