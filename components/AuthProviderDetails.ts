import { Providers } from "../types/providers";

export interface ProviderData {
  name: string;
  logo: string;
  logoDark: string;
}

export function getProviderDetails(
  enabledProviders: Providers[],
): ProviderData[] {
  const providers: ProviderData[] = [];
  if (enabledProviders.includes("google")) {
    providers.push({
      name: "google",
      logo: "/providers/google.svg",
      logoDark: "/providers/google.svg",
    });
  }
  if (enabledProviders.includes("github")) {
    providers.push({
      name: "github",
      logo: "/providers/github-dark.svg",
      logoDark: "/providers/github-light.svg",
    });
  }
  return providers;
}
