import { Link } from 'react-router-dom';
import { Code2, Shield, Menu, X } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="glass-dark sticky top-0 z-50 border-b border-dark-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500">
              <Code2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
              DevConfessions
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/"
              className="px-3 py-2 rounded-md text-sm font-medium text-dark-300 hover:text-white hover:bg-dark-800 transition-colors"
            >
              Home
            </Link>
            <Link
              to="/admin/login"
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-dark-300 hover:text-white hover:bg-dark-800 transition-colors"
            >
              <Shield className="h-4 w-4 mr-2" />
              Admin
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-dark-400 hover:text-white hover:bg-dark-800 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden border-t border-dark-700">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              className="block px-3 py-2 rounded-md text-base font-medium text-dark-300 hover:text-white hover:bg-dark-800"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/admin/login"
              className="block px-3 py-2 rounded-md text-base font-medium text-dark-300 hover:text-white hover:bg-dark-800"
              onClick={() => setIsOpen(false)}
            >
              Admin
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
