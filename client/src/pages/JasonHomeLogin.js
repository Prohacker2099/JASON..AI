import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, User, ArrowRight } from "lucide-react";

const JasonHomeLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [logoAnimationComplete, setLogoAnimationComplete] = useState(false);

  // Simulate initial loading and animation sequence
  useEffect(() => {
    // First show the logo animation
    setTimeout(() => {
      setIsLoading(false);

      // After logo animation, show the login form
      setTimeout(() => {
        setLogoAnimationComplete(true);
        setTimeout(() => {
          setShowLoginForm(true);
        }, 500);
      }, 2000);
    }, 1000);
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    // Handle login logic here
    console.log("Login with:", email, password);
  };

  const handleCreateAccount = () => {
    // Navigate to create account page
    console.log("Navigate to create account");
  };

  return (
    <div className="login-container">
      <AnimatePresence>
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center"
          >
            <div className="w-16 h-16 rounded-full border-2 border-jason-electric border-t-transparent animate-spin"></div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            className="w-full max-w-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Logo Animation */}
            <div className="flex flex-col items-center mb-8">
              <motion.div
                className="login-logo"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                  scale: logoAnimationComplete ? 1 : [0.8, 1.1, 1],
                  opacity: 1,
                }}
                transition={{
                  duration: logoAnimationComplete ? 0 : 2,
                  ease: "easeOut",
                }}
              >
                <div className="w-full h-full rounded-full bg-gradient-to-r from-jason-sapphire to-jason-electric flex items-center justify-center">
                  <span className="text-white font-bold text-4xl">J</span>
                </div>

                {!logoAnimationComplete && (
                  <>
                    <div className="network-animation"></div>
                    <div className="network-animation"></div>
                    <div className="network-animation"></div>
                  </>
                )}
              </motion.div>

              <motion.h1
                className="text-3xl font-bold mt-4 text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                JASON Home
              </motion.h1>

              <motion.p
                className="text-gray-400 mt-2 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                Your intuitive smart home, powered by advanced AI
              </motion.p>
            </div>

            {/* Login Form */}
            <AnimatePresence>
              {showLoginForm && (
                <motion.div
                  key="login-form"
                  className="login-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="text-xl font-semibold mb-6 text-center">
                    Welcome Back
                  </h2>

                  <form onSubmit={handleLogin}>
                    <div className="input-group">
                      <div className="input-group-icon">
                        <Mail className="h-5 w-5" />
                      </div>
                      <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-gray-800/50"
                      />
                      <div className="input-highlight"></div>
                    </div>

                    <div className="input-group">
                      <div className="input-group-icon">
                        <Lock className="h-5 w-5" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-gray-800/50"
                      />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                      <div className="input-highlight"></div>
                    </div>

                    <div className="flex justify-end mb-6">
                      <a
                        href="#"
                        className="text-sm text-jason-electric hover:text-jason-amber transition-colors"
                      >
                        Forgot password?
                      </a>
                    </div>

                    <button
                      type="submit"
                      className="btn w-full mb-4 flex items-center justify-center"
                    >
                      <span>Log In</span>
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </button>

                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-700"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-surface px-4 text-sm text-gray-400">
                          or
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCreateAccount}
                      className="btn btn-outline w-full flex items-center justify-center"
                    >
                      <User className="h-4 w-4 mr-2" />
                      <span>Create Account</span>
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JasonHomeLogin;
