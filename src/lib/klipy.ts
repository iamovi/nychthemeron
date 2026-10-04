export interface KlipyGif {
  id: string;
  title: string;
  url: string;
  previewUrl: string;
  width?: number;
  height?: number;
}

const API_KEY = import.meta.env.VITE_KLIPY_API_KEY || "";
const BASE_URL = "https://api.klipy.com/api/v1";

export async function fetchTrendingGifs(limit = 24, page = 1): Promise<KlipyGif[]> {
  if (!API_KEY) {
    console.warn("VITE_KLIPY_API_KEY is not set in environment.");
    return [];
  }

  try {
    let res = await fetch(`${BASE_URL}/${API_KEY}/gifs/trending?limit=${limit}&page=${page}`);
    if (!res.ok) {
      res = await fetch(`https://api.klipy.com/v1/gifs/trending?key=${API_KEY}&limit=${limit}&page=${page}`);
    }

    if (!res.ok) throw new Error(`Klipy API error: ${res.status}`);

    const json = await res.json();
    return parseKlipyResponse(json);
  } catch (err) {
    console.error("Error fetching trending GIFs from Klipy:", err);
    return [];
  }
}

export async function searchGifs(query: string, limit = 24, page = 1): Promise<KlipyGif[]> {
  if (!API_KEY || !query.trim()) return fetchTrendingGifs(limit, page);

  try {
    const encodedQuery = encodeURIComponent(query.trim());
    let res = await fetch(`${BASE_URL}/${API_KEY}/gifs/search?q=${encodedQuery}&limit=${limit}&page=${page}`);
    if (!res.ok) {
      res = await fetch(`https://api.klipy.com/v1/gifs/search?key=${API_KEY}&q=${encodedQuery}&limit=${limit}&page=${page}`);
    }

    if (!res.ok) throw new Error(`Klipy API error: ${res.status}`);

    const json = await res.json();
    return parseKlipyResponse(json);
  } catch (err) {
    console.error("Error searching GIFs on Klipy:", err);
    return [];
  }
}

function parseKlipyResponse(json: any): KlipyGif[] {
  const items = Array.isArray(json?.data?.data)
    ? json.data.data
    : Array.isArray(json?.data)
    ? json.data
    : Array.isArray(json?.results)
    ? json.results
    : Array.isArray(json)
    ? json
    : [];

  return items
    .map((item: any, idx: number) => {
      const file = item?.file;

      const gifUrl =
        file?.hd?.gif?.url ||
        file?.md?.gif?.url ||
        file?.sm?.gif?.url ||
        file?.gif?.url ||
        item?.gif?.url ||
        item?.images?.original?.url ||
        item?.url ||
        item?.media_url;

      const previewUrl =
        file?.sm?.gif?.url ||
        file?.xs?.gif?.url ||
        file?.md?.gif?.url ||
        item?.preview_url ||
        item?.images?.preview?.url ||
        gifUrl;

      return {
        id: String(item?.id || item?.slug || idx),
        title: item?.title || item?.slug || "GIF",
        url: gifUrl,
        previewUrl: previewUrl || gifUrl,
        width: file?.hd?.gif?.width || item?.width,
        height: file?.hd?.gif?.height || item?.height,
      };
    })
    .filter((g: KlipyGif) => !!g.url);
}
