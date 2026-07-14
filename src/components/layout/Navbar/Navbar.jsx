import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

import Button from "../../ui/Button";
import Container from "../../ui/Container";
import Logo from "../../ui/Logo";

const navLinks = [
  { label: "About", href: "#about" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Contact Us", href: "#contact" },
];

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <Container>
        <nav className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Logo />

          {/* Desktop Navigation */}
          <ul className="hidden items-center gap-10 md:flex">
            {navLinks.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  className="text-sm font-medium text-slate-600 transition hover:text-violet-600"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Desktop Buttons */}
          <div className="hidden items-center gap-4 md:flex">
            <Link to="/login">
              <Button variant="ghost">
                Log In
              </Button>
            </Link>

            <Link to="/signup">
              <Button>
                Get Started Free
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle Menu"
          >
            {isOpen ? <X /> : <Menu />}
          </button>
        </nav>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="pb-6 md:hidden">
            <div className="flex flex-col gap-4">
              {navLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-slate-700 transition hover:text-violet-600"
                >
                  {item.label}
                </a>
              ))}

              <Link to="/login">
                <Button variant="ghost" className="w-full">
                  Log In
                </Button>
              </Link>

              <Link to="/signup">
                <Button className="w-full">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Container>
    </header>
  );
}

export default Navbar;