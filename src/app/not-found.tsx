import Link from 'next/link';

export default function NotFound() {
  return (
    <div>
      <h2>Not Found</h2>
      <p>We couldn&apos;t find the requested resource.</p>
      <p>If you believe this is an error, please contact support.</p>
      <Link href="/">Return Home</Link>
    </div>
  );
}
