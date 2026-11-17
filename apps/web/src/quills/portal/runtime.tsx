import { createContext, type ReactNode, useContext } from "react";
import type { EvaluateMyPortalAccessResponse } from "../api/portal/evaluate-my-portal-access";
import type { GetPublicPortalConfigResponse } from "../api/portal/get-public-portal-config";
import type { PortalProblem, Viewer } from "../core/types";

export interface PortalRuntimeValue {
  config: GetPublicPortalConfigResponse;
  viewer: Viewer;
  access: EvaluateMyPortalAccessResponse | null;
  accessLoading: boolean;
  accessProblem: PortalProblem | null;
  retryAccess?: () => void;
}

export interface PortalRouteContext {
  workspaceId: string;
  viewer: Viewer;
  portalAvailable: boolean;
  accessGranted: boolean;
}

const PortalRuntimeContext = createContext<PortalRuntimeValue | null>(null);

export function PortalRuntimeProvider({
  value,
  children,
}: {
  value: PortalRuntimeValue;
  children: ReactNode;
}) {
  return (
    <PortalRuntimeContext.Provider value={value}>
      {children}
    </PortalRuntimeContext.Provider>
  );
}

/** The runtime inside a portal page, or null in a page that renders without one. */
export const useOptionalPortalRuntime = () => useContext(PortalRuntimeContext);

export function usePortalRuntime() {
  const value = useContext(PortalRuntimeContext);
  if (!value)
    throw new Error(
      "usePortalRuntime must be used inside PortalRuntimeProvider",
    );
  return value;
}
