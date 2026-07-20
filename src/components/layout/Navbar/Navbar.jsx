import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

import Button from "../../ui/Button";
import Container from "../../ui/Container";
import Logo from "../../ui/Logo";
import ThemeToggle from "../../ui/ThemeToggle";

const navLinks = [
  { label: "About", href: "#about" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Contact Us", href: "#contact" },
];

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-app bg-[var(--bg-surface)]/80 backdrop-blur-md"
      style={{ backgroundColor: "color-mix(in srgb, var(--bg-surface) 80%, transparent)" }}>
      <Container>
        <nav className="flex h-20 items-center justify-between">
          <Logo />

          <ul className="hidden items-center gap-10 md:flex">
            {navLinks.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  className="text-sm font-medium text-app-2 transition hover:text-[var(--accent)]"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="hidden items-center gap-3 md:flex">
            <ThemeToggle />
            <Link to="/login">
              <Button variant="ghost">Log In</Button>
            </Link>
            <Link to="/signup">
              <Button>Get Started Free</Button>
            </Link>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
              className="text-app"
            >
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </nav>

        {isOpen && (
          <div className="pb-6 md:hidden">
            <div className="flex flex-col gap-4">
              {navLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-app-2 transition hover:text-[var(--accent)]"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <Link to="/login" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full">Log In</Button>
              </Link>
              <Link to="/signup" onClick={() => setIsOpen(false)}>
                <Button className="w-full">Get Started Free</Button>
              </Link>
            </div>
          </div>
        )}
      </Container>
    </header>
  );
}

export default Navbar;
