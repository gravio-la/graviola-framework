import { createContext, useContext } from "react";

export type EntityFinderChromeOptions = {
  /** When false, result rows omit the inline detail Popper (preview). Default true. */
  showResultDetailPopper: boolean;
};

const defaultOptions: EntityFinderChromeOptions = {
  showResultDetailPopper: true,
};

export const EntityFinderChromeContext =
  createContext<EntityFinderChromeOptions>(defaultOptions);

export function useEntityFinderChrome(): EntityFinderChromeOptions {
  return useContext(EntityFinderChromeContext);
}
