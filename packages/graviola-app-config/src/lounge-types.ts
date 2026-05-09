/**
 * Types used only by the opinionated Graviola Lounge shell (react-router +
 * notistack defaults). Not part of the headless `AdbProvider` contract.
 */

type Url = URL | string;

type ParsedUrlQuery = Record<string, string | string[] | undefined>;

export type LoungeRouter = {
  query: ParsedUrlQuery;
  asPath: string;
  replace: (url: Url, as?: Url) => Promise<void | boolean>;
  push: (url: Url, as?: Url) => Promise<void | boolean>;
  pathname: string;
  searchParams: URLSearchParams;
  setSearchParams?: (searchParams: URLSearchParams) => void;
};

type SnackbarKey = string | number;

type SnackbarOptions = {
  variant: "error" | "success" | "warning" | "info";
  autoHideDuration?: number;
  anchorOrigin?: {
    vertical: "top" | "bottom";
    horizontal: "left" | "center" | "right";
  };
};

export type LoungeSnackbar = {
  enqueueSnackbar: (message: string, options?: SnackbarOptions) => SnackbarKey;
  closeSnackbar: (key?: SnackbarKey) => void;
};
