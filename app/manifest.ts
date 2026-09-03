import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Nikah Qubool - Muslim Matrimony',
    short_name: 'Nikah Qubool',
    description: 'Most Trusted Halal Muslim Matrimony & Matchmaking Platform',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#d91b5c',
    icons: [
      {
        src: '/nikah-qubool-favicon.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/nikah-qubool-logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
