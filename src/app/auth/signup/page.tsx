"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      setSuccess('Account created! Redirecting to sign in...');
      setTimeout(() => router.push('/auth/signin'), 1500);
    } else {
      setError(data.error || 'Registration failed');
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md flex flex-col gap-4">
        <h1 className="text-2xl font-bold mb-2 text-gray-800">Sign Up</h1>
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        {success && <div className="text-green-600 text-sm mb-2">{success}</div>}
        <label className="font-medium text-gray-700">Email
          <input type="email" className="mt-1 w-full border rounded p-2" value={email} onChange={e => setEmail(e.target.value)} required />
        </label>
        <label className="font-medium text-gray-700">Password
          <input type="password" className="mt-1 w-full border rounded p-2" value={password} onChange={e => setPassword(e.target.value)} required />
        </label>
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold mt-2">Sign Up</button>
        <div className="text-sm text-gray-600 mt-2">Already have an account? <a href="/auth/signin" className="text-blue-600 hover:underline">Sign in</a></div>
      </form>
    </main>
  );
} 