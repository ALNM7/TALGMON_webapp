export const environment = {
  production: true,
  // Ruta relativa: Vercel reenvía /api/* al backend en Render (rewrite en
  // vercel.json). Así las cookies de sesión son del mismo dominio y Safari
  // no las bloquea como cookies de terceros.
  apiUrl: '/api',
};
