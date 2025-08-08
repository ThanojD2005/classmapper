
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';


const navItems = [
  { href: '/', label: 'Classroom', icon: Home },
  { href: '/students', label: 'Students', icon: Users },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <nav className="flex items-center space-x-2">
      {user && navItems.map(item => (
        <Button
          key={item.href}
          variant={pathname === item.href ? 'default' : 'ghost'}
          asChild
        >
          <Link href={item.href}>
            <item.icon className="mr-2 h-4 w-4" />
            {item.label}
          </Link>
        </Button>
      ))}
      {user && (
        <Button variant="ghost" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
        </Button>
      )}
    </nav>
  );
}
