import React, { createContext, useContext } from "react";

export interface MotionAdapter {
  Slot: React.ComponentType<{
    id: string;
    motionId?: string;
    children: React.ReactNode;
  }>;
  AnimatePresence?: React.ComponentType<{ children: React.ReactNode }>;
}

export const NoopMotionAdapter: MotionAdapter = {
  Slot: ({ children }) => <div>{children}</div>,
};

const MotionAdapterContext = createContext<MotionAdapter>(NoopMotionAdapter);

export function MotionAdapterProvider({
  adapter,
  children,
}: {
  adapter: MotionAdapter;
  children: React.ReactNode;
}) {
  return (
    <MotionAdapterContext.Provider value={adapter}>
      {children}
    </MotionAdapterContext.Provider>
  );
}

export function useMotionAdapter(): MotionAdapter {
  return useContext(MotionAdapterContext);
}
