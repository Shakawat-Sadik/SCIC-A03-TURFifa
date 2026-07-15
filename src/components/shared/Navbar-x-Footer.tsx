"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { iNavItems } from "@/lib/interfaces";

const navLinks: iNavItems[] = [
  { name: "Home", href: "/" },
  { name: "Explore", href: "/explore" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

export const Navbar = () => {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderLink = (link: iNavItems, i: number) => (
    <Link
      key={i}
      href={link.href}
      onClick={() => setMobileMenuOpen(false)}
      className={cn(
        "menu-item px-3 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground",
        pathname === link.href ? "text-primary" : "text-muted-foreground",
      )}
    >
      {link.name}
    </Link>
  );

  return (
    <div className="navbar flex items-center justify-between px-4 py-3 border-b border-border">
      <Link href="/" className="font-bold text-lg">
        Turfifa
      </Link>

      <div className="desktop-menu hidden md:flex items-center gap-1">
        {navLinks.map(renderLink)}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="p-2 rounded-lg hover:bg-accent"
          aria-label="Toggle theme"
        >
          {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        <button
          type="button"
          className="md:hidden p-2 rounded-lg hover:bg-accent"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="mobile-menu absolute top-full left-0 right-0 flex flex-col gap-1 bg-background border-b border-border p-3 md:hidden">
          {navLinks.map(renderLink)}
        </div>
      )}
    </div>
  );
};

export const Footer = () => {
  return (
    <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
      Turfifa. All rights reserved.
    </div>
  );
};
