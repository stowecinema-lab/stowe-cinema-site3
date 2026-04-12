export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return new Response("Missing url", { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        VeeziAccessToken: process.env.VEEZI_API_TOKEN || "",
        Accept: "*/*",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return new Response(`Poster fetch failed (${response.status})`, {
        status: response.status,
      });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = await response.arrayBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response("Poster proxy failed", { status: 500 });
  }
}
