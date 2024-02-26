import {
  makeProviders,
  makeStandardFetcher,
  targets,
} from "@movie-web/providers";

import { isExtensionActiveCached } from "@/backend/extension/messaging";
import {
  makeExtensionFetcher,
  makeTauriFetcher,
  // makeLoadBalancedSimpleProxyFetcher,
} from "@/backend/providers/fetchers";

export function getProviders() {
  if (isExtensionActiveCached()) {
    return makeProviders({
      fetcher: makeExtensionFetcher(),
      target: targets.BROWSER_EXTENSION,
      consistentIpForRequests: true,
    });
  }

  // return makeProviders({
  //   fetcher: makeStandardFetcher(fetch),
  //   proxiedFetcher: makeLoadBalancedSimpleProxyFetcher(),
  //   target: targets.BROWSER,
  // });
  return makeProviders({
    fetcher: makeStandardFetcher(fetch),
    proxiedFetcher: makeTauriFetcher(),
    target: targets.BROWSER_EXTENSION,
    consistentIpForRequests: true,
  });
}
