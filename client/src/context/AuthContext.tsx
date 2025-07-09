// // src/context/AuthContext.js
// import { createContext, useContext, useState } from 'react';

// const AuthContext = createContext(null);

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(() => {
//     // Check if user data exists in localStorage
//     const savedUser = localStorage.getItem('user');
//     return savedUser ? JSON.parse(savedUser) : null;
//   });

//   const login = (userData) => {
//     setUser(userData);
//     localStorage.setItem('user', JSON.stringify(userData));
//   };

//   const logout = () => {
//     setUser(null);
//     localStorage.removeItem('user');
//   };

//   return (
//     <AuthContext.Provider value={{ user, login, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);

// // import {
// //   createContext,
// //   useContext,
// //   useState,
// //   ReactNode,
// //   useEffect,
// // } from "react";

// // interface User {
// //   name: string;
// //   email: string;
// //   token: string;
// // }

// // interface AuthContextType {
// //   user: User | null;
// //   login: (userData: User) => void;
// //   logout: () => void;
// // }

// // const AuthContext = createContext<AuthContextType | null>(null);

// // export const AuthProvider = ({ children }: { children: ReactNode }) => {
// //   const [user, setUser] = useState<User | null>(null);

// //   // ✅ Load user from localStorage on mount
// //   useEffect(() => {
// //     const storedUser = localStorage.getItem("user");
// //     if (storedUser) {
// //       const parsedUser: User = JSON.parse(storedUser);
// //       if (parsedUser.token) {
// //         setUser(parsedUser);
// //       } else {
// //         localStorage.removeItem("user");
// //       }
// //     }
// //   }, []);

// //   const login = (userData: User) => {
// //     setUser(userData);
// //     localStorage.setItem("user", JSON.stringify(userData));
// //   };

// //   const logout = () => {
// //     setUser(null);
// //     localStorage.removeItem("user");
// //   };

// //   return (
// //     <AuthContext.Provider value={{ user, login, logout }}>
// //       {children}
// //     </AuthContext.Provider>
// //   );
// // };

// // export const useAuth = () => {
// //   const context = useContext(AuthContext);
// //   if (!context) throw new Error("useAuth must be used within an AuthProvider");
// //   return context;
// // };

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Define the user type
interface User {
  name: string;
  email?: string; // Optional email field
}

// Define the context value type
interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => Promise<void>;
}

// Create context with default value as null
const AuthContext = createContext<AuthContextType | null>(null);

// Define props type for AuthProvider
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Sync authentication state across multiple tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "user") {
        setUser(event.newValue ? JSON.parse(event.newValue) : null);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Login function
  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  // Logout function
  const logout = async () => {
    try {
      // Simulate backend logout API call (replace with actual API call)
      await fetch("/api/logout", { method: "POST" });

      setUser(null);
      localStorage.removeItem("user");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook to use authentication context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
