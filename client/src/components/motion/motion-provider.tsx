
import { ReactNode } from "react";
import { AnimatePresence, LazyMotion, domAnimation } from "framer-motion";

interface MotionProviderProps {
  children: ReactNode;
}

export function MotionProvider({ children }: MotionProviderProps) {
  return (
    <LazyMotion features={domAnimation} strict>
      <AnimatePresence mode="wait" initial={false}>
        {children}
      </AnimatePresence>
    </LazyMotion>
  );
}

