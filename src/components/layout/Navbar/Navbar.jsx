import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

import Button from "../../ui/Button";
import Container from "../../ui/Container";
import Logo from "../../ui/Logo";
import ThemeToggle from "../../ui/ThemeToggle";
import { useAuthModal } from "../../../context/AuthModalContext";

const navLinks = [
  { label: "About", href: "#about", isAnchor: true },
  { label: "How It Works", href: "#how-it-works", isAnchor: true },
  { label: "Contact", to: "/contact", isAnchor: false },
];

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { openModal } = useAuthModal();

  return (
    <header className="sticky top-0 z-50 border-b border-app bg-[var(--bg-surface)]/80 backdrop-blur-md"
      style={{ backgroundColor: "color-mix(in srgb, var(--bg-surface) 80%, transparent)" }}>
      <Container>
        <nav className="flex h-20 items-center justify-between">
          <Logo />

          <ul className="hidden items-center gap-10 md:flex">
            {navLinks.map((item) => (
              <li key={item.label}>
                {item.isAnchor ? (
                  <a
                    href={item.href}
                    className="text-sm font-medium text-app-2 transition hover:text-[var(--accent)]"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    to={item.to}
                    className="text-sm font-medium text-app-2 transition hover:text-[var(--accent)]"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>

          <div className="hidden items-center gap-3 md:flex">
            <ThemeToggle />
            <Button variant="ghost" onClick={() => openModal('login')}>Log In</Button>
            <Button onClick={() => openModal('signup')}>Get Started Free</Button>
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
                item.isAnchor ? (
                  <a
                    key={item.label}
                    href={item.href}
                    className="text-app-2 transition hover:text-[var(--accent)]"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="text-app-2 transition hover:text-[var(--accent)]"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                )
              ))}
              <Button variant="ghost" className="w-full" onClick={() => { setIsOpen(false); openModal('login'); }}>Log In</Button>
              <Button className="w-full" onClick={() => { setIsOpen(false); openModal('signup'); }}>Get Started Free</Button>
            </div>
          </div>
        )}
      </Container>
    </header>
  );
}

export default Navbar;
