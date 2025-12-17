import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useApp } from '../../context/AppContext';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { state } = useApp();
  const isRTL = state.locale === 'he';
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Responsive sidebar offset - only apply on desktop (lg and above)
  const sidebarOffsetClass = isRTL ? 'lg:mr-64' : 'lg:ml-64';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar 
        isMobileDrawerOpen={isMobileDrawerOpen}
        onMobileDrawerClose={() => setIsMobileDrawerOpen(false)}
      />
      <Header 
        onMobileMenuClick={() => setIsMobileDrawerOpen(true)}
      />
      <main className={`${sidebarOffsetClass} pt-16 lg:pt-20 ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
      
    </div>
  );
}