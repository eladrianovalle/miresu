const externalPattern = /^(?:[a-z]+:)?\/\//i;

function isExternal(path: string) {
  return externalPattern.test(path) || path.startsWith('data:');
}

function ensureLeadingSlash(path: string) {
  return path.startsWith('/') ? path : `/${path}`;
}

export function withBasePath(path: string): string {
  if (!path) {
    return path;
  }

  if (isExternal(path)) {
    return path;
  }

  return ensureLeadingSlash(path);
}
