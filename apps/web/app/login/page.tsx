"use client";

import { useActionState, useEffect, useState } from "react";
import { loginAction } from "../actions/auth";
import { motion } from "framer-motion";
import { GraduationCapIcon, Loader2, Mail, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const initialState = {
  error: "",
};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction as any, initialState);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // Avoid hydration mismatch on motion layout

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="glass-panel p-8 sm:p-10 rounded-[28px] shadow-2xl relative overflow-hidden">
          {/* Decorative background glow inside the card */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-primary/20 blur-[60px] pointer-events-none rounded-full" />
          
          <div className="relative z-10 flex flex-col items-center mb-8">
            <motion.div
              initial={{ rotate: -15, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 rounded-[20px] bg-primary flex items-center justify-center glow-primary mb-5"
            >
              <GraduationCapIcon className="w-8 h-8 text-primary-foreground" />
            </motion.div>
            
            <h1 className="font-heading font-bold text-3xl tracking-tight text-foreground text-center">
              Welcome back
            </h1>
            <p className="text-muted-foreground mt-2 text-center text-sm">
              Sign in to the platform administration portal
            </p>
          </div>

          <form action={formAction} className="relative z-10 space-y-5">
            {state?.error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-3.5 rounded-xl bg-destructive/15 border border-destructive/20 text-destructive text-sm font-medium text-center"
              >
                {state.error}
              </motion.div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground/80 px-1">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="admin@ashesi.edu.gh"
                    className="w-full h-12 pl-11 pr-4 bg-background/50 border border-border rounded-xl outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-muted-foreground/60"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <label className="text-sm font-semibold text-foreground/80">
                    Password
                  </label>
                  <a href="#" className="text-xs font-medium text-primary hover:underline hover:text-primary/80 transition-colors">
                    Forgot password?
                  </a>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <input
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full h-12 pl-11 pr-4 bg-background/50 border border-border rounded-xl outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-muted-foreground/60"
                  />
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              disabled={isPending}
              type="submit"
              className={cn(
                "w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center transition-all glow-primary cursor-pointer",
                isPending ? "opacity-80 cursor-not-allowed" : "hover:bg-primary/90"
              )}
            >
              {isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Sign In"
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </main>
  );
}
