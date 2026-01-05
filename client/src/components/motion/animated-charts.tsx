
import { motion, Variants } from "framer-motion";
import { ReactNode, forwardRef } from "react";
import { appleEasing } from "./motion-wrapper";

// Chart container animation variants
const chartContainerVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: appleEasing,
    },
  },
};

// Donut chart animation - scale from center
const donutChartVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8, rotate: -10 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      duration: 0.7,
      ease: appleEasing,
      delay: 0.2,
    },
  },
};

// Bar chart staggered animation
const barChartContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const barVariants: Variants = {
  hidden: { opacity: 0, scaleY: 0, originY: 1 },
  visible: {
    opacity: 1,
    scaleY: 1,
    transition: {
      duration: 0.5,
      ease: appleEasing,
    },
  },
};

// Area chart animation - draw from left
const areaChartVariants: Variants = {
  hidden: { opacity: 0, pathLength: 0 },
  visible: {
    opacity: 1,
    pathLength: 1,
    transition: {
      duration: 1,
      ease: appleEasing,
      delay: 0.2,
    },
  },
};

// Line chart animation
const lineChartVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: appleEasing,
    },
  },
};

// Animated Chart Container
interface AnimatedChartContainerProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export const AnimatedChartContainer = forwardRef<HTMLDivElement, AnimatedChartContainerProps>(
  ({ children, className, delay = 0 }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial="hidden"
        animate="visible"
        variants={chartContainerVariants}
        className={className}
        style={{ willChange: "opacity, transform" }}
        transition={{ delay }}
      >
        {children}
      </motion.div>
    );
  }
);

AnimatedChartContainer.displayName = "AnimatedChartContainer";

// Animated Donut Chart Wrapper
interface AnimatedDonutChartProps {
  children: ReactNode;
  className?: string;
}

export const AnimatedDonutChart = forwardRef<HTMLDivElement, AnimatedDonutChartProps>(
  ({ children, className }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial="hidden"
        animate="visible"
        variants={donutChartVariants}
        className={className}
        style={{ willChange: "opacity, transform" }}
      >
        {children}
      </motion.div>
    );
  }
);

AnimatedDonutChart.displayName = "AnimatedDonutChart";

// Animated Bar Chart Wrapper
interface AnimatedBarChartProps {
  children: ReactNode;
  className?: string;
}

export const AnimatedBarChart = forwardRef<HTMLDivElement, AnimatedBarChartProps>(
  ({ children, className }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial="hidden"
        animate="visible"
        variants={barChartContainerVariants}
        className={className}
        style={{ willChange: "opacity, transform" }}
      >
        {children}
      </motion.div>
    );
  }
);

AnimatedBarChart.displayName = "AnimatedBarChart";

// Animated Area Chart Wrapper
interface AnimatedAreaChartProps {
  children: ReactNode;
  className?: string;
}

export const AnimatedAreaChart = forwardRef<HTMLDivElement, AnimatedAreaChartProps>(
  ({ children, className }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial="hidden"
        animate="visible"
        variants={lineChartVariants}
        className={className}
        style={{ willChange: "opacity, transform" }}
      >
        {children}
      </motion.div>
    );
  }
);

AnimatedAreaChart.displayName = "AnimatedAreaChart";

// Animated Stats Card
interface AnimatedStatsCardProps {
  children: ReactNode;
  className?: string;
  index?: number;
}

const statsCardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: appleEasing,
      delay: index * 0.1,
    },
  }),
};

export const AnimatedStatsCard = forwardRef<HTMLDivElement, AnimatedStatsCardProps>(
  ({ children, className, index = 0 }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial="hidden"
        animate="visible"
        variants={statsCardVariants}
        custom={index}
        className={className}
        whileHover={{
          scale: 1.02,
          boxShadow: "0 8px 30px -8px rgba(0,0,0,0.12)",
          transition: { duration: 0.25, ease: appleEasing },
        }}
        style={{ willChange: "opacity, transform, box-shadow" }}
      >
        {children}
      </motion.div>
    );
  }
);

AnimatedStatsCard.displayName = "AnimatedStatsCard";

// Export all variants for custom use
export {
  chartContainerVariants,
  donutChartVariants,
  barChartContainerVariants,
  barVariants,
  areaChartVariants,
  lineChartVariants,
  statsCardVariants,
};

