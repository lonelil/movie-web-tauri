import { Fetcher, makeSimpleProxyFetcher } from "@movie-web/providers";
import { ResponseType, fetch as tauriFetch } from "@tauri-apps/api/http";

import { sendExtensionRequest } from "@/backend/extension/messaging";
import { getApiToken, setApiToken } from "@/backend/helpers/providerApi";
import { getProviderApiUrls, getProxyUrls } from "@/utils/proxyUrls";

import { convertBodyToObject, getBodyTypeFromBody } from "../extension/request";

function makeLoadbalancedList(getter: () => string[]) {
  let listIndex = -1;
  return () => {
    const fetchers = getter();
    if (listIndex === -1 || listIndex >= fetchers.length) {
      listIndex = Math.floor(Math.random() * fetchers.length);
    }
    const proxyUrl = fetchers[listIndex];
    listIndex = (listIndex + 1) % fetchers.length;
    return proxyUrl;
  };
}

export const getLoadbalancedProxyUrl = makeLoadbalancedList(getProxyUrls);
export const getLoadbalancedProviderApiUrl =
  makeLoadbalancedList(getProviderApiUrls);

async function fetchButWithApiTokens(
  input: RequestInfo | URL,
  init?: RequestInit | undefined,
): Promise<Response> {
  const apiToken = await getApiToken();
  const headers = new Headers(init?.headers);
  if (apiToken) headers.set("X-Token", apiToken);
  const response = await fetch(
    input,
    init
      ? {
          ...init,
          headers,
        }
      : undefined,
  );
  const newApiToken = response.headers.get("X-Token");
  if (newApiToken) setApiToken(newApiToken);
  return response;
}

export function makeLoadBalancedSimpleProxyFetcher() {
  const fetcher: Fetcher = async (a, b) => {
    const currentFetcher = makeSimpleProxyFetcher(
      getLoadbalancedProxyUrl(),
      fetchButWithApiTokens,
    );
    return currentFetcher(a, b);
  };
  return fetcher;
}

function makeFinalHeaders(
  readHeaders: string[],
  headers: Record<string, string>,
): Headers {
  const lowercasedHeaders = readHeaders.map((v) => v.toLowerCase());
  return new Headers(
    Object.entries(headers).filter((entry) =>
      lowercasedHeaders.includes(entry[0].toLowerCase()),
    ),
  );
}

export function makeExtensionFetcher() {
  const fetcher: Fetcher = async (url, ops) => {
    const result = await sendExtensionRequest<any>({
      url,
      ...ops,
      body: convertBodyToObject(ops.body),
      bodyType: getBodyTypeFromBody(ops.body),
    });
    if (!result?.success) throw new Error(`extension error: ${result?.error}`);
    const res = result.response;
    return {
      body: res.body,
      finalUrl: res.finalUrl,
      statusCode: res.statusCode,
      headers: makeFinalHeaders(ops.readHeaders, res.headers),
    };
  };
  return fetcher;
}

export function makeTauriFetcher() {
  const fetcher: Fetcher = async (url, ops) => {
    // @ts-expect-error something about the fetch args
    const result = await tauriFetch<any>(`${ops.baseUrl}${url}`, {
      ...ops,
      responseType: ResponseType.Text,
    });
    // @ts-expect-error there is ok in result
    if (!result?.ok) throw new Error(`tauri error: ${result?.error}`);

    return {
      body: result.headers["content-type"].includes("json")
        ? JSON.parse(result.data)
        : result.data,
      finalUrl: result.url,
      statusCode: result.status,
      headers: new Headers(result.headers),
    };
  };
  return fetcher;
}
