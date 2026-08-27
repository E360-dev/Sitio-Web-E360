// src/components/Seo.jsx
//
// React 19 eleva automáticamente <title>, <meta> y <link> al <head>, así que
// basta con renderizarlos desde la página. No hace falta react-helmet.

export const SITE_URL = 'https://e360.pro';

const DEFAULT_IMAGE = '/img/adnbigfour.jpg';

export default function Seo({
  title,
  description,
  path = '',
  image = DEFAULT_IMAGE,
  noindex = false,
}) {
  const url = `${SITE_URL}${path}`;
  const absoluteImage = image.startsWith('http') ? image : `${SITE_URL}${image}`;

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={absoluteImage} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="es_MX" />
      <meta property="og:site_name" content="E360" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteImage} />
    </>
  );
}
