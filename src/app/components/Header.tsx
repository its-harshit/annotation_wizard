"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTimer } from "../contexts/TimerContext";

export default function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isAnnotating = pathname.startsWith("/annotate");
  const { sessionTime, annotationTime, isAnnotationActive } = useTimer();
  
  // Debug logging
  console.log('Header timer state:', { sessionTime, annotationTime, isAnnotationActive });
  return (
    <header className="w-full bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
      {isAnnotating ? (
        <span className="text-xl font-bold text-blue-300 cursor-not-allowed opacity-60">Annotation Wizard</span>
      ) : (
        <Link href="/projects" className="text-xl font-bold text-blue-700">Annotation Wizard</Link>
      )}
      <div className="flex items-center gap-4">
        {/* Timer Display */}
        {session?.user && (
          <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span className="text-sm font-mono font-semibold text-blue-700">
              {isAnnotationActive ? annotationTime : sessionTime}
            </span>
            {isAnnotationActive && (
              <span className="text-xs text-blue-600 font-medium">(Annotation)</span>
            )}
          </div>
        )}
        
        {status === "loading" ? null : session?.user ? (
          <>
            <span className="text-gray-700 text-sm">{session.user.email} ({((session.user as { role?: string }).role || 'user')})</span>
            {((session.user as { role?: string }).role) === 'admin' && (
              <Link href="/admin" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded font-semibold text-sm">Admin</Link>
            )}
            <button
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-1 rounded font-semibold text-sm"
              onClick={() => {
                localStorage.removeItem('sessionStartTime');
                signOut({ callbackUrl: "/auth/signin" });
              }}
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