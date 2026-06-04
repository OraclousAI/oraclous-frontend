import type { ReactNode } from 'react';
import { DashProvider } from '../../context/dash.js';
import { TopBar } from './TopBar.js';
import { Sidebar } from './Sidebar.js';
import './shell.css';

export function Page({
  children,
  padded = true,
  scroll = true,
}: {
  children: ReactNode;
  padded?: boolean;
  scroll?: boolean;
}) {
  return (
    <main className="shell-page" style={{ overflowY: scroll ? 'auto' : 'hidden' }}>
      <div className={padded ? 'shell-page-inner' : 'shell-page-inner shell-page-inner--flush'}>
        {children}
      </div>
    </main>
  );
}

export function DashLayout({ children, padded = true }: { children: ReactNode; padded?: boolean }) {
  return (
    <DashProvider>
      <div className="shell-root">
        <Sidebar />
        <div className="shell-maincol">
          <TopBar />
          <Page padded={padded}>{children}</Page>
        </div>
      </div>
    </DashProvider>
  );
}
