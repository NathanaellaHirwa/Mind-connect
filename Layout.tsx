import SidebarNav from '../components/SidebarNav';
import Topbar from '../components/Topbar';
import Footer from '../components/Footer';
import { useIsMobile } from '../hooks/useIsMobile';

type Props = {
  children: React.ReactNode;
  user: { name: string; email: string } | null;
  onSignOut: () => void;
};

export default function Layout({ children, user, onSignOut }: Props) {
  const isMobile = useIsMobile();
  return (
    <div className="min-h-screen bg-brand-50 flex">
      {!isMobile && <SidebarNav user={user} onSignOut={onSignOut} />}
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="max-w-6xl mx-auto w-full px-4 py-6 flex-1">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
