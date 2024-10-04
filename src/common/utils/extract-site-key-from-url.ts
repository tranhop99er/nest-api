export const extractSiteKeyFromUrl = (url: string): string | null => {
  const regex = /\/api\/v1\/([^/]+)\//;
  const match = url.match(regex);
  return match ? match[1] : null;
};
