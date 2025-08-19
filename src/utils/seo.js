function upsertMeta(selector, attributes) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    Object.entries(attributes).forEach(([k, v]) => el.setAttribute(k, v));
    document.head.appendChild(el);
  } else {
    Object.entries(attributes).forEach(([k, v]) => el.setAttribute(k, v));
  }
}

export function setSEO({ title, description, ogImage }) {
  if (typeof document === 'undefined') return;
  if (title) document.title = title;
  if (description) upsertMeta('meta[name="description"]', { name: 'description', content: description });
  if (title) upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title });
  if (description) upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
  if (ogImage) upsertMeta('meta[property="og:image"]', { property: 'og:image', content: ogImage });
}


