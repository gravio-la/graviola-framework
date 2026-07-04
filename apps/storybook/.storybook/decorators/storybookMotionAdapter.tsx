import React from "react";
import { AnimatePresence, motion } from "motion/react";
import type { MotionAdapter } from "@graviola/edb-detail-renderer";

/**
 * Storybook motion adapter — shared-element slots via `layoutId` and expand/collapse
 * via AnimatePresence. Keeps framer/motion out of shipped packages.
 */
export const StorybookMotionAdapter: MotionAdapter = {
  Slot: ({ motionId, children }) => (
    <motion.div
      layoutId={motionId}
      layout="position"
      style={{ display: "contents" }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
    >
      {children}
    </motion.div>
  ),
  AnimatePresence: ({ children }) => (
    <AnimatePresence mode="sync">{children}</AnimatePresence>
  ),
};

export default StorybookMotionAdapter;
