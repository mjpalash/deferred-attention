import type { ParsedSharedContent } from "@/lib/share/parse";

type CaptureResult = {
  item: {
    id: string;
  };
};

export type ShareCaptureDependencies = {
  getUserId(): Promise<string | null>;
  capture(input: {
    userId: string;
    shared: ParsedSharedContent;
  }): Promise<CaptureResult>;
};

export type ShareCaptureResult =
  | {
      kind: "saved";
      itemId: string;
    }
  | {
      kind: "login-required";
      loginPath: string;
    }
  | {
      kind: "error";
      message: string;
    };

export async function handleShareCapture({
  shared,
  returnPath,
  dependencies
}: {
  shared: ParsedSharedContent;
  returnPath: string;
  dependencies: ShareCaptureDependencies;
}): Promise<ShareCaptureResult> {
  const userId = await dependencies.getUserId();

  if (!userId) {
    return {
      kind: "login-required",
      loginPath: `/login?next=${encodeURIComponent(returnPath)}`
    };
  }

  try {
    const result = await dependencies.capture({
      userId,
      shared
    });

    return {
      kind: "saved",
      itemId: result.item.id
    };
  } catch (error) {
    return {
      kind: "error",
      message:
        error instanceof Error
          ? error.message
          : "Could not save item"
    };
  }
}
