import { useLayoutEffect } from 'react';
import { actualizarCabecera } from '../lib/seo.mjs';
export { SITE_URL } from '../lib/seo.mjs';

const DEFAULT_IMAGE = '/img/adnbigfour.jpg';

export default function Seo({
  title,
  description,
  path = '',
  image = DEFAULT_IMAGE,
  noindex = false,
}) {
  useLayoutEffect(() => {
    actualizarCabecera(document, { title, description, path, image, noindex });
  }, [title, description, path, image, noindex]);
  return null;
}
