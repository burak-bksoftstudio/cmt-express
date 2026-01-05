
import { motion, HTMLMotionProps, Variants } from "framer-motion";
import { forwardRef, ReactNode } from "react";

// Apple-like easing curves
export const appleEasing = [0.16, 1, 0.3, 1] as const;
export const springConfig = { type: "spring", stiffness: 300, damping: 30 };

// Common animation variants
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, ease: appleEasing },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: appleEasing },
  },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: appleEasing },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.3, ease: appleEasing },
  },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: appleEasing },
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: { duration: 0.3, ease: appleEasing },
  },
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: appleEasing },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.3, ease: appleEasing },
  },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: appleEasing },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: 0.3, ease: appleEasing },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: appleEasing },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2, ease: appleEasing },
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: appleEasing },
  },
};

// Page transition variants
export const pageVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: appleEasing,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.3,
      ease: appleEasing,
    },
  },
};

// Section transition for paper detail
export const sectionVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: appleEasing,
    },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: {
      duration: 0.25,
      ease: appleEasing,
    },
  },
};

// Motion Wrapper Props
interface MotionWrapperProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  variant?: "fadeIn" | "fadeInUp" | "fadeInDown" | "fadeInLeft" | "fadeInRight" | "scaleIn" | "page" | "section";
  delay?: number;
  className?: string;
}

const variantMap = {
  fadeIn,
  fadeInUp,
  fadeInDown,
  fadeInLeft,
  fadeInRight,
  scaleIn,
  page: pageVariants,
  section: sectionVariants,
};

export const MotionWrapper = forwardRef<HTMLDivElement, MotionWrapperProps>(
  ({ children, variant = "fadeInUp", delay = 0, className, ...props }, ref) => {
    const selectedVariant = variantMap[variant];

    return (
      <motion.div
        ref={ref}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={selectedVariant}
        className={className}
        style={{ willChange: "opacity, transform" }}
        custom={delay}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

MotionWrapper.displayName = "MotionWrapper";

// Stagger Container Component
interface StaggerContainerProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export const StaggerContainer = forwardRef<HTMLDivElement, StaggerContainerProps>(
  ({ children, className, staggerDelay = 0.08, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: staggerDelay,
              delayChildren: 0.1,
            },
          },
        }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

StaggerContainer.displayName = "StaggerContainer";

// Stagger Item Component
interface StaggerItemProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  className?: string;
}

export const StaggerItem = forwardRef<HTMLDivElement, StaggerItemProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        variants={staggerItem}
        className={className}
        style={{ willChange: "opacity, transform" }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

StaggerItem.displayName = "StaggerItem";

// Animated Card Component
interface AnimatedCardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  className?: string;
  hoverScale?: number;
  tapScale?: number;
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ children, className, hoverScale = 1.02, tapScale = 0.98, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={className}
        whileHover={{
          scale: hoverScale,
          boxShadow: "0 10px 40px -10px rgba(0,0,0,0.15)",
          transition: { duration: 0.3, ease: appleEasing },
        }}
        whileTap={{
          scale: tapScale,
          transition: { duration: 0.15, ease: appleEasing },
        }}
        style={{ willChange: "transform, box-shadow" }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

AnimatedCard.displayName = "AnimatedCard";

// Animated Button Component
interface AnimatedButtonProps extends HTMLMotionProps<"button"> {
  children: ReactNode;
  className?: string;
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={className}
        whileHover={{
          scale: 1.02,
          transition: { duration: 0.2, ease: appleEasing },
        }}
        whileTap={{
          scale: 0.97,
          transition: { duration: 0.1, ease: appleEasing },
        }}
        style={{ willChange: "transform" }}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";

// Table Row Animation
export const tableRowVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: appleEasing },
  },
};

// Chart Animation Variants
export const chartVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: appleEasing },
  },
};

// Progress bar animation
export const progressVariants: Variants = {
  hidden: { width: 0 },
  visible: (width: number) => ({
    width: `${width}%`,
    transition: { duration: 1, ease: appleEasing, delay: 0.2 },
  }),
};

// Sidebar item animation
export const sidebarItemVariants: Variants = {
  inactive: {
    backgroundColor: "transparent",
    transition: { duration: 0.2, ease: appleEasing },
  },
  active: {
    backgroundColor: "var(--accent)",
    transition: { duration: 0.3, ease: appleEasing },
  },
};

