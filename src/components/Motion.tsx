"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

type MotionRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
};

/** Scroll-triggered fade-up that respects prefers-reduced-motion. */
export function MotionReveal({
  children,
  className = "",
  delay = 0,
  y = 22,
}: MotionRevealProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15, margin: "0px 0px -40px 0px" }}
      transition={{
        duration: 0.65,
        delay: delay / 1000,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

type FloatProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
  amplitude?: number;
  duration?: number;
};

export function Float({
  children,
  className = "",
  amplitude = 8,
  duration = 5.5,
  ...props
}: FloatProps) {
  const reduce = useReducedMotion();
  if (reduce) {
    return (
      <div className={className} {...(props as object)}>
        {children}
      </div>
    );
  }
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -amplitude, 0] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
