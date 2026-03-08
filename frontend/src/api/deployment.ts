import { apiGet } from "./client";

export interface DeploymentSummary {
  platform: string;
  public_url: string;
  has_render_yaml: boolean;
  has_railway_json: boolean;
  is_cloud_hint: boolean;
}

export interface MobileAccessSummary {
  enabled: boolean;
  port: number | null;
  source: string;
}

export interface MobileSummary {
  mobile_access: MobileAccessSummary;
  has_capacitor_wrapper: boolean;
  has_capacitor_config: boolean;
  recommended_manifest: string;
  recommended_start: string;
}

export interface DeploymentStatusResponse {
  ok: boolean;
  timestamp: string;
  deployment: DeploymentSummary;
  mobile: MobileSummary;
}

export const deploymentApi = {
  status: () => apiGet<DeploymentStatusResponse>("/v1/deployment/mobile-status"),
};