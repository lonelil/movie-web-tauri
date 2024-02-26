import {
  Fetcher,
  makeProviders,
  makeStandardFetcher,
  targets,
} from "@movie-web/providers";
import { fetch as tauriFetch } from "@tauri-apps/api/http";

import { isExtensionActiveCached } from "@/backend/extension/messaging";
import {
  makeExtensionFetcher,
  // makeLoadBalancedSimpleProxyFetcher,
} from "@/backend/providers/fetchers";

// function makeTauriFetcher() {
//   const fetcher: Fetcher = async (url, ops) => {
//     //@ts-expect-error
//     const result = await tauriFetch(url, { ...ops });
//     //if (!result?.success) throw new Error(`extension error: ${result?.error}`);
//     //const res = result.response;
//     return {
//       body: result,
//       finalUrl: url,
//       statusCode: 200,
//       headers: makeFinalHeaders(ops.readHeaders, res.headers),
//     };
//   };
//   return fetcher;
// }

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
    // @ts-expect-error  aaaaaa
    fetcher: makeStandardFetcher(tauriFetch),
    // @ts-expect-error  aaaaaa
    proxiedFetcher: makeStandardFetcher(tauriFetch),
    target: targets.BROWSER_EXTENSION,
    consistentIpForRequests: true,
  });
}
