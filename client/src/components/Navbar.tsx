import { GraduationCap, Menu, X, ChevronDown, User, LogOut } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleSignUp = () => {
    navigate("/signnnup");
  };

  const handleLogin = () => {
    navigate("/loginpage");
  };

  const handleProfile = () => {
    navigate("/profile");
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleTestimonials = () => {
    navigate("/Testimonials");
  };

  return (
    <nav className="fixed top-0 w-full bg-violet-200/80 backdrop-blur-md z-50 border-b border-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo Section */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center"
          >
            <Link to="/" className="flex items-center">
              <div className="bg-gradient-to-r from-primary to-secondary p-2 rounded-xl">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gradient">Sahay</span>
            </Link>
          </motion.div>
          
          {/* Desktop Menu */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden md:flex items-center gap-8"
          >
            <button 
              onClick={handleTestimonials}
              className="text-gray-600 hover:text-primary transition-colors"
            >
              Testimonials
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center text-gray-600 hover:text-primary transition-colors"
              >
                Features <ChevronDown className="ml-1 w-5 h-5" />
              </button>
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute left-0 mt-2 w-64 bg-white shadow-lg rounded-xl overflow-hidden z-50"
                  >
                    <ul className="py-2">
                      <li><Link to="/SkillAssessment" className="block px-4 py-2 hover:bg-amber-400">AI Skill Assessment & Tracking</Link></li>
                      <li><Link to="/PathwayGenerator" className="block px-4 py-2 hover:bg-amber-400">Optimized Learning Paths</Link></li>
                      <li><Link to="/GamifiedLearning" className="block px-4 py-2 hover:bg-amber-400">Gamified Learning & Motivation</Link></li>
                      <li><Link to="/jobmatching" className="block px-4 py-2 hover:bg-amber-400">24/7 AI Guidance</Link></li>
                      <li><Link to="/JobSearch" className="block px-4 py-2 hover:bg-amber-400">Job Matching & Career Tool</Link></li>
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Conditional Rendering Based on User State */}
            {user ? (
              <>
                <span className="text-gray-600">Welcome, {user.name}</span>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleProfile}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <User className="h-5 w-5 text-gray-600" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <LogOut className="h-5 w-5 text-gray-600" />
                </motion.button>
              </>
            ) : (
              <>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSignUp}
                  className="bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
                >
                  Sign Up
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogin}
                  className="bg-secondary text-white px-4 py-2 rounded-xl hover:bg-secondary/90 transition-colors shadow-lg shadow-secondary/25"
                >
                  Login
                </motion.button>
              </>
            )}
          </motion.div>
          
          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-primary transition-colors"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden"
            >
              <div className="px-2 pt-2 pb-3 space-y-1">
                <button 
                  onClick={handleTestimonials}
                  className="block w-full text-left px-3 py-2 text-gray-600 hover:text-primary transition-colors"
                >
                  Testimonials
                </button>
                {user ? (
                  <>
                    <button
                      onClick={handleProfile}
                      className="w-full mt-2 flex items-center justify-center py-2 text-gray-600 hover:text-primary transition-colors"
                    >
                      <User className="h-5 w-5 mr-2" />
                      Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full mt-2 flex items-center justify-center py-2 text-gray-600 hover:text-primary transition-colors"
                    >
                      <LogOut className="h-5 w-5 mr-2" />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleSignUp}
                      className="w-full mt-2 bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
                    >
                      Sign Up
                    </button>
                    <button
                      onClick={handleLogin}
                      className="w-full mt-2 bg-secondary text-white px-4 py-2 rounded-xl hover:bg-secondary/90 transition-colors shadow-lg shadow-secondary/25"
                    >
                      Login
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
