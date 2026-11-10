export function GET(request: Request) {
  return Response.redirect(new URL("/icon.png?v=3", request.url), 308);
}
