export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL
  if (!url) {
    throw new Error('APP_URL is not configured. Set NEXT_PUBLIC_APP_URL env var.')
  }
  return url.replace(/\/$/, '')
}
