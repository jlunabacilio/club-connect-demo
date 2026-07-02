import Link from "next/link";
import type { Metadata } from "next";
import { SignupForm } from "@/components/signup/SignupForm";

export const metadata: Metadata = {
  title: "Become a member · Club Connect",
  description: "Enroll as a Club Connect member from the portal.",
};

export default function SignupPage() {
  return (
    <main className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <header className="mb-8">
          <Link
            href="/"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            ← Back
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Become a member
          </h1>
          <p className="mt-2 text-slate-600">
            Sign up online — no need to visit the club in person. Fill in your
            details below to get started.
          </p>
        </header>
        <SignupForm />
      </div>
    </main>
  );
}
