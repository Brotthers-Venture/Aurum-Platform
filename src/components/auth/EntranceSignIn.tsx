"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { AuthShell, Field, inputClass } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui";
import { useBrand } from "@/components/brand/BrandProvider";
import { entranceById } from "@/lib/entrances";

/** Sign-in for one door (investors, clients, a client company, a solution), in that door's look. */
export function EntranceSignIn({ id }: { id: string }) {
  const { brand } = useBrand();
  const router = useRouter();
  const door = entranceById(brand, id);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  if (!door)
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-center text-[14px] text-stone-600">
        This entrance doesn’t exist.{" "}
        <Link href="/login" className="ml-1 underline">
          Go to sign-in
        </Link>
      </div>
    );
  const welcome = door.org ? `Welcome to ${door.name}` : door.group === "Solutions" ? door.name : `Welcome to ${brand.legalName}`;
  return (
    <AuthShell entrance={id}>
      <h2 className="font-serif text-[24px] leading-tight text-ink-900">{welcome}</h2>
      <p className="mt-1.5 text-[13px] text-stone-500">
        {door.group === "Investors" ? "Sign in to your investor account." : door.group === "Clients" ? "Sign in to your client portal." : `Sign in to ${door.name}.`}
      </p>
      <form
        className="mt-6 space-y-5"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter your email address.");
          setError(null);
          router.push(door.to);
        }}
      >
        <Field label="Email address">
          <input type="email" autoComplete="username" className={inputClass} placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password">
          <input type="password" autoComplete="current-password" className={inputClass} defaultValue="" />
        </Field>
        {error && <p className="text-[12.5px] text-[#9A4422]">{error}</p>}
        <Button type="submit" variant="brand" size="lg" className="w-full">
          Continue
        </Button>
      </form>
      <p className="mt-6 flex items-start gap-2 text-[12px] text-stone-500">
        <Lock size={13} strokeWidth={1.8} className="mt-[2px] shrink-0" />
        Multi-factor authentication is required for every session.
      </p>
      <p className="mt-4 rounded-[8px] bg-stone-50 px-3.5 py-3 text-[12px] leading-relaxed text-stone-500">
        <span className="font-semibold text-stone-600">Preview.</span> Any password works. The look of this page is set in Brand &amp; white label → Entrances.
      </p>
    </AuthShell>
  );
}
