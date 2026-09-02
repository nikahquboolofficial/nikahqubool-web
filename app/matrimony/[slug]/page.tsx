import Metadata from 'next';
import Link from 'next/link';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const formattedTitle = slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    title: `${formattedTitle} - Verified Muslim Matrimony | Nikah Qubool`,
    description: `Find 100% verified ${formattedTitle}. Connect with educated Muslim brides and grooms across India on Nikah Qubool.`,
    openGraph: {
      title: `${formattedTitle} | Nikah Qubool Muslim Matrimony`,
      description: `Browse verified Muslim profiles for ${formattedTitle}. Free Registration & Direct Messaging.`,
      url: `https://nikahqubool.in/matrimony/${slug}`,
      siteName: 'Nikah Qubool',
      images: [
        {
          url: 'https://cdn.nikahqubool.in/banner-og.jpg',
          width: 1200,
          height: 630,
          alt: formattedTitle,
        },
      ],
      type: 'website',
    },
  };
}

export default async function MatrimonySeoPage({ params }: Props) {
  const { slug } = await params;
  const formattedTitle = slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${formattedTitle} - Nikah Qubool Matrimony`,
    provider: {
      '@type': 'Organization',
      name: 'Nikah Qubool',
      url: 'https://nikahqubool.in',
    },
    areaServed: 'India',
    description: `Find verified ${formattedTitle} on Nikah Qubool.`,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{formattedTitle}</h1>
        <p className="text-lg text-gray-600 mb-6">
          Welcome to Nikah Qubool. Browse verified profiles for {formattedTitle} with complete privacy, family values, and direct matchmaking.
        </p>

        <div className="flex gap-4 mb-8">
          <Link
            href="/dashboard/find-match"
            prefetch={true}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-all shadow-md"
          >
            Find Matches Now
          </Link>
          <Link
            href="/register"
            prefetch={true}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-xl transition-all"
          >
            Register Free Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
