import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'The Curse of the Pharaoh',
  description: 'A playable 3D first-person survival horror experience set within an ancient Egyptian tomb. Navigate atmospheric corridors, manage your flashlight, and uncover ancient relics.',
  openGraph: {
    title: 'The Curse of the Pharaoh',
    description: 'A playable 3D first-person survival horror experience set within an ancient Egyptian tomb. Navigate atmospheric corridors, manage your flashlight, and uncover ancient relics.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Curse of the Pharaoh',
    description: 'A playable 3D first-person survival horror experience set within an ancient Egyptian tomb. Navigate atmospheric corridors, manage your flashlight, and uncover ancient relics.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className="dark bg-black text-stone-100">
      <body suppressHydrationWarning className="overflow-hidden select-none bg-black text-stone-100 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
