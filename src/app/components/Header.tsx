"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isAnnotating = pathname.startsWith("/annotate");
  return (
    <header className="w-full bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
      {isAnnotating ? (
        <span className="text-xl font-bold text-blue-300 cursor-not-allowed opacity-60">Annotation Wizard</span>
      ) : (
        <Link href="/projects" className="text-xl font-bold text-blue-700">Annotation Wizard</Link>
      )}
      <div className="flex items-center gap-4">
        {status === "loading" ? null : session?.user ? (
          <>
            <span className="text-gray-700 text-sm">{session.user.email} ({(session.user as any).role})</span>
            {(session.user as any).role === 'admin' && (
              <Link href="/admin" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded font-semibold text-sm">Admin</Link>
            )}
            <button
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-1 rounded font-semibold text-sm"
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/auth/signin" className="text-blue-600 hover:underline text-sm">Sign In</Link>
            <Link href="/auth/signup" className="text-blue-600 hover:underline text-sm">Sign Up</Link>
          </>
        )}
      </div>
    </header>
  );
} 