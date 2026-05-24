import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-5xl p-10">
      <h1 className="text-4xl font-bold">CharacterForge</h1>
      <p className="mt-3 text-gray-300">
        Build a digital character recipe and try it on your own photos.
      </p>
      <div className="mt-6 flex gap-3">
        <Link className="rounded bg-white px-4 py-2 text-black" href="/studio">
          New Design
        </Link>
        <Link className="rounded border border-gray-500 px-4 py-2" href="/community">
          Browse Community
        </Link>
      </div>
    </main>
  );
}
