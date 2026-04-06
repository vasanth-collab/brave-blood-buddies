import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Droplets, Menu, X, LogOut, User, LayoutDashboard, Search, PlusCircle } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  const navLinks = user ? [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/search', label: 'Find Donors', icon: Search },
    { to: '/request', label: 'Request Blood', icon: PlusCircle },
    { to: '/profile', label: 'Profile', icon: User },
  ] : [];

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <Droplets className="h-7 w-7 text-primary" />
          <span className="text-foreground">Blood<span className="text-primary">Link</span></span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(l => (
            <Link key={l.to} to={l.to}>
              <Button variant="ghost" size="sm" className="gap-2">
                <l.icon className="h-4 w-4" />
                {l.label}
              </Button>
            </Link>
          ))}
          {user ? (
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-muted-foreground">
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          ) : (
            <div className="flex gap-2 ml-2">
              <Link to="/login"><Button variant="outline" size="sm">Login</Button></Link>
              <Link to="/register"><Button size="sm">Register</Button></Link>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-card px-4 pb-4 animate-slide-up">
          {navLinks.map(l => (
            <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" className="w-full justify-start gap-2 my-1">
                <l.icon className="h-4 w-4" />
                {l.label}
              </Button>
            </Link>
          ))}
          {user ? (
            <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground" onClick={handleLogout}>
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          ) : (
            <div className="flex flex-col gap-2 mt-2">
              <Link to="/login" onClick={() => setMobileOpen(false)}><Button variant="outline" className="w-full">Login</Button></Link>
              <Link to="/register" onClick={() => setMobileOpen(false)}><Button className="w-full">Register</Button></Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
