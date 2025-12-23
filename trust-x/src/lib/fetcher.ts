export const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch ${url}: ${res.status} ${text}`);
  }
  const json = await res.json();
  if (json && typeof json === 'object' && 'data' in json) return json.data;
  return json;
};
