import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://nikahqubool.in'),
  title: {
    default: "Nikah Qubool | #1 Trusted Halal Muslim Matrimony & Matchmaking Platform",
    template: "%s | Nikah Qubool Matrimony"
  },
  description: "Nikah Qubool is India's most trusted Halal Muslim Matrimony platform. Find 100% verified Sunni, Shia, Syed, Pathan, Sheikh & Ansari proposals with complete privacy control, family matchmaking, and Sunnah-guided Nikah process.",
  keywords: [
    "Muslim Matrimony",
    "Nikah Qubool",
    "Halal Matrimony",
    "Sunni Matrimony",
    "Shia Matrimony",
    "Syed Matrimony",
    "Pathan Rishte",
    "Sheikh Matrimony",
    "Ansari Matrimony",
    "Halal Matchmaking India",
    "Islamic Matrimony",
    "Verified Muslim Proposals",
    "Free Muslim Matrimonial Site",
    "Bareilly Muslim Matrimony",
    "Delhi Muslim Rishte",
    "UP Muslim Matrimony",
    "Muslim Doctor Matrimony",
    "Muslim Engineer Rishte"
  ],
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: "/nikah-qubool-favicon.png", type: "image/png" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    shortcut: "/nikah-qubool-favicon.png",
    apple: "/nikah-qubool-favicon.png",
  },
  openGraph: {
    title: "Nikah Qubool | #1 Trusted Halal Muslim Matrimony Platform",
    description: "Connect with 100% verified Muslim brides and grooms across India. Complete privacy control, Sunnah-guided Nikah, and zero spam.",
    siteName: "Nikah Qubool Matrimony",
    locale: "en_IN",
    images: [
      {
        url: "/nikah-qubool-logo.png",
        width: 1200,
        height: 630,
        alt: "Nikah Qubool Halal Matrimony Logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nikah Qubool | Most Trusted Halal Muslim Matrimony",
    description: "Find your perfect Halal life partner with 100% verified proposals & complete privacy control.",
    images: ["/nikah-qubool-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const schemaOrgData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://nikahqubool.in/#organization',
        name: 'Nikah Qubool',
        url: 'https://nikahqubool.in',
        logo: 'https://nikahqubool.in/nikah-qubool-logo.png',
        description: 'Most Trusted Halal Muslim Matrimony & Matchmaking Platform.',
        sameAs: []
      },
      {
        '@type': 'WebSite',
        '@id': 'https://nikahqubool.in/#website',
        url: 'https://nikahqubool.in',
        name: 'Nikah Qubool',
        publisher: {
          '@id': 'https://nikahqubool.in/#organization'
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://nikahqubool.in/matrimony/{search_term_string}',
          'query-input': 'required name=search_term_string'
        }
      }
    ]
  };

  return (
    <html
      lang="en"
      className="h-full antialiased font-sans"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap" rel="stylesheet" />
        <link rel="icon" href="/nikah-qubool-favicon.png" type="image/png" sizes="any" />
        <link rel="shortcut icon" href="/nikah-qubool-favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/nikah-qubool-favicon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrgData) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
