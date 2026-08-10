import type { MetadataRoute } from "next";

type ShareTargetManifest = MetadataRoute.Manifest & {
  share_target: {
    action: string;
    method: "GET";
    params: {
      title: string;
      text: string;
      url: string;
    };
  };
};

export function manifest(): ShareTargetManifest {
  return {
    name: "Deferred Attention",
    short_name: "Later",
    description: "Save things now. Come back when you have time.",
    start_url: "/",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#fafafa",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
      }
    ],
    share_target: {
      action: "/share",
      method: "GET",
      params: {
        title: "title",
        text: "text",
        url: "url"
      }
    }
  };
}

export default manifest;
