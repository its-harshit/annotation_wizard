"use client";
import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

function SignInContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const params = useSearchParams();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    if (res?.error) {
      setError('Invalid email or password');
    } else {
      router.push('/projects');
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md flex flex-col gap-4">
        <h1 className="text-2xl font-bold mb-2 text-gray-800">Sign In</h1>
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        <label className="font-medium text-gray-700">Email
          <input type="email" className="mt-1 w-full border rounded p-2" value={email} onChange={e => setEmail(e.target.value)} required />
        </label>
        <label className="font-medium text-gray-700">Password
          <input type="password" className="mt-1 w-full border rounded p-2" value={password} onChange={e => setPassword(e.target.value)} required />
        </label>
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold mt-2">Sign In</button>
        <div className="text-sm text-gray-600 mt-2">Don&apos;t have an account? <a href="/auth/signup" className="text-blue-600 hover:underline">Sign up</a></div>
      </form>
    </main>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
} 