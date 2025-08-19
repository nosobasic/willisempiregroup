export function getCurrentUtmParams() {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search);
  const utmParams = new URLSearchParams();
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach((key) => {
    if (params.get(key)) utmParams.set(key, params.get(key));
  });
  return utmParams.toString();
}

export function appendQuery(url, extraParams = {}) {
  try {
    const current = typeof window !== 'undefined' ? window.location : { origin: '' };
    const isAbsolute = /^(https?:)?\//.test(url);
    const base = isAbsolute ? '' : current.origin;
    const target = new URL(url, base || 'http://local');

    const utm = getCurrentUtmParams();
    const utmSearch = new URLSearchParams(utm);
    utmSearch.forEach((value, key) => {
      if (!target.searchParams.has(key)) target.searchParams.set(key, value);
    });

    Object.entries(extraParams || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        target.searchParams.set(key, String(value));
      }
    });

    return isAbsolute ? target.toString() : `${target.pathname}${target.search}${target.hash}`;
  } catch (e) {
    return url;
  }
}

export function getParam(name) {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

export function getAllParams() {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const out = {};
  params.forEach((v, k) => { out[k] = v; });
  return out;
}


