import Link from "next/link";

const PERKS = [
  {
    icon: "⚡",
    title: "Sign up in minutes",
    text: "Complete your enrollment entirely online from any device.",
  },
  {
    icon: "🪪",
    title: "Secure verification",
    text: "Your identity is verified with an ID document before confirmation.",
  },
  {
    icon: "🎟️",
    title: "Instant membership",
    text: "Get your membership number and confirmation email right after payment.",
  },
];

export default function Home() {
  return (
    <main className="min-h-full bg-gradient-to-b from-indigo-50 to-slate-50">
      <div className="mx-auto flex max-w-4xl flex-col items-center px-4 py-20 text-center sm:py-28">
        <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700">
          Club Connect
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Join the club — online, in minutes.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-slate-600">
          Become a member from the comfort of your home. No lines, no paperwork,
          no in-person visit required.
        </p>
        <Link
          href="/signup"
          className="mt-8 rounded-xl bg-indigo-600 px-8 py-3.5 font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          Become a member
        </Link>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {PERKS.map((perk) => (
            <div
              key={perk.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm"
            >
              <div className="text-2xl" aria-hidden>
                {perk.icon}
              </div>
              <h3 className="mt-3 font-semibold text-slate-900">
                {perk.title}
              </h3>
              <p className="mt-1 text-sm text-slate-600">{perk.text}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
