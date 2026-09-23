// URL PREVIEW FETCHER — ported from lifesync (May) repo
// Fetches Open Graph metadata from a URL so link save auto-fills
// title / description / favicon. Never blocks the save on failure.

export interface UrlPreview {
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
  siteName?: string;
}

export class MetaService {
  static async fetchUrlPreview(url: string): Promise<UrlPreview> {
    try {
      const response = await fetch(url, {
        headers: {
          // Pretend to be a browser so sites don't block us
          "User-Agent":
            "Mozilla/5.0 (compatible; Stash/1.0; +https://stash.app)",
        },
        // Don't wait forever — 5 second timeout
        signal: AbortSignal.timeout(5000),
      });

      const html = await response.text();

      const getMetaContent = (property: string): string | undefined => {
        const match =
          html.match(
            new RegExp(
              `<meta[^>]*property=["']og:${property}["'][^>]*content=["']([^"']+)["']`,
              "i"
            )
          ) ??
          html.match(
            new RegExp(
              `<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`,
              "i"
            )
          );
        return match?.[1];
      };

      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const pageTitle = titleMatch?.[1]?.trim();

      const urlObj = new URL(url);
      const favicon = `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`;

      const result: UrlPreview = {};
      const t = getMetaContent("title") ?? pageTitle;
      if (t !== undefined) result.title = t;
      const d = getMetaContent("description");
      if (d !== undefined) result.description = d;
      const img = getMetaContent("image");
      if (img !== undefined) result.image = img;
      result.favicon = favicon;
      result.siteName = getMetaContent("site_name") ?? urlObj.hostname;

      return result;
    } catch {
      // Preview fetch fail ho to link bina preview ke save hogi — never block
      return {};
    }
  }
}
