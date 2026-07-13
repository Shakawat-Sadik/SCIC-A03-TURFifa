'use client';

import Link from 'next/link';
import { useAppStore, type ViewName } from '@/store/use-store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Menu, X, LogOut, User, LayoutDashboard, Search, Shield, Sun, Moon, Bell,
} from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const { user, currentView, navigate, logout, hasActiveMatch, theme, toggleTheme } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItem = (label: string, view: ViewName, icon?: React.ReactNode) => (
    <button
      onClick={() => { navigate(view); setMobileOpen(false); }}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
        currentView === view ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
      }`}
    >
      {icon} {label}
    </button>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <button onClick={() => navigate('landing')} className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">A</span>
          </div>
          <span className="text-xl font-bold tracking-tight hidden sm:inline">Turfifa</span>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItem('Home', 'landing')}
          {navItem('Explore Turfs', 'explore', <Search className="w-4 h-4" />)}
          {user?.role === 'player' && navItem('Matchmaking', 'matchmaking')}
          {user && navItem('Dashboard', user.role === 'admin' ? 'admin-dashboard' : user.role === 'turf_manager' ? 'manager-dashboard' : 'player-dashboard', <LayoutDashboard className="w-4 h-4" />)}
          {user?.role === 'admin' && navItem('Admin', 'admin-dashboard', <Shield className="w-4 h-4" />)}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Match Badge */}
          {hasActiveMatch && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-primary/40 text-primary animate-pulse"
              onClick={() => navigate('player-dashboard')}
            >
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Match</span>
            </Button>
          )}

          {/* Theme Toggle */}
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9">
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.role.replace('_', ' ')}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('profile')}>
                  <User className="mr-2 h-4 w-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(user.role === 'admin' ? 'admin-dashboard' : user.role === 'turf_manager' ? 'manager-dashboard' : 'player-dashboard')}>
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('login')}>Log In</Button>
              <Button size="sm" onClick={() => navigate('register')}>Sign Up</Button>
            </div>
          )}

          {/* Mobile menu button */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <nav className="md:hidden border-t px-4 py-3 space-y-1 bg-background">
          {navItem('Home', 'landing')}
          {navItem('Explore Turfs', 'explore')}
          {user?.role === 'player' && navItem('Matchmaking', 'matchmaking')}
          {user && navItem('Dashboard', user.role === 'admin' ? 'admin-dashboard' : user.role === 'turf_manager' ? 'manager-dashboard' : 'player-dashboard')}
          {!user && (
            <div className="pt-2 border-t flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { navigate('login'); setMobileOpen(false); }}>Log In</Button>
              <Button className="flex-1" onClick={() => { navigate('register'); setMobileOpen(false); }}>Sign Up</Button>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t bg-card mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">A</span>
              </div>
              <span className="font-bold text-lg">Turfifa</span>
            </div>
            <p className="text-sm text-muted-foreground">Tactical Analytics & Turf Booking Platform for amateur football enthusiasts across Bangladesh.</p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><span className="hover:text-foreground cursor-pointer transition-colors">Explore Turfs</span></li>
              <li><span className="hover:text-foreground cursor-pointer transition-colors">How It Works</span></li>
              <li><span className="hover:text-foreground cursor-pointer transition-colors">Pricing</span></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><span className="hover:text-foreground cursor-pointer transition-colors">Help Center</span></li>
              <li><span className="hover:text-foreground cursor-pointer transition-colors">Contact Us</span></li>
              <li><span className="hover:text-foreground cursor-pointer transition-colors">Terms of Service</span></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Connect</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><span className="hover:text-foreground cursor-pointer transition-colors">Facebook</span></li>
              <li><span className="hover:text-foreground cursor-pointer transition-colors">Instagram</span></li>
              <li><span className="hover:text-foreground cursor-pointer transition-colors">YouTube</span></li>
            </ul>
          </div>
        </div>
        <div className="border-t mt-8 pt-6 text-center text-xs text-muted-foreground">
          2026 Turfifa. All rights reserved. Built for the football community.
        </div>
      </div>
    </footer>
  );
}