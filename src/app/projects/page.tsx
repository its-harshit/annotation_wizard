"use client";
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ProjectsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const userId = session?.user?.email;
  const isAdmin = (session?.user as any)?.role === 'admin';

  useEffect(() => {
    setLoading(true);
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        setProjects(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load projects');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/projects/progress?userId=${encodeURIComponent(userId || '')}`)
      .then(res => res.json())
      .then(data => setProgress(data));
  }, [userId]);

  const userProjects = projects.filter((p) => p.members?.includes(userId));

  function getProjectProgress(projectId: string) {
    return progress.find((p) => p.projectId === projectId || p.projectId?.toString() === projectId?.toString());
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, createdBy: userId }),
    });
    if (res.ok) {
      setShowForm(false);
      setName('');
      setDescription('');
      // Reload projects
      fetch('/api/projects')
        .then(res => res.json())
        .then(data => setProjects(data));
      // Reload progress
      fetch(`/api/projects/progress?userId=${encodeURIComponent(userId || '')}`)
        .then(res => res.json())
        .then(data => setProgress(data));
    } else {
      const data = await res.json();
      setCreateError(data.error || 'Failed to create project');
    }
    setCreating(false);
  }

  if (loading) return <main className="min-h-screen flex items-center justify-center">Loading projects...</main>;
  if (error) return <main className="min-h-screen flex items-center justify-center text-red-600">{error}</main>;

  return (
    <main className="max-w-5xl mx-auto py-10 px-4">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-2">
          <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M16 3v4M8 3v4M4 11h16" /></svg>
          Your Projects
        </h1>
        {isAdmin && (
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold flex items-center gap-2 shadow"
            onClick={() => setShowForm((v) => !v)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            {showForm ? 'Cancel' : 'Create New Project'}
          </button>
        )}
      </div>
      {isAdmin && showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <form onSubmit={handleCreate} className="bg-white p-8 rounded-xl shadow-xl flex flex-col gap-4 min-w-[320px] max-w-md w-full relative">
            <h2 className="text-xl font-bold mb-2 text-blue-800">Create New Project</h2>
            <label className="font-medium">Project Name
              <input className="border rounded p-2 w-full mt-1" value={name} onChange={e => setName(e.target.value)} required />
            </label>
            <label className="font-medium">Description
              <textarea className="border rounded p-2 w-full mt-1" value={description} onChange={e => setDescription(e.target.value)} />
            </label>
            {createError && <div className="text-red-600 text-sm">{createError}</div>}
            <div className="flex gap-2 mt-2">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-semibold flex-1" disabled={creating}>
                {creating ? 'Creating...' : 'Create Project'}
              </button>
              <button type="button" className="bg-gray-200 text-gray-700 px-4 py-2 rounded font-semibold flex-1" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userProjects.length === 0 && <div className="text-gray-500 col-span-full">You are not a member of any projects.</div>}
          {userProjects.map((project) => {
            const prog = getProjectProgress(project._id);
            let status = 'Not started';
            if (prog) {
              if (prog.annotatedCount === 0) status = 'Not started';
              else if (prog.annotatedCount < prog.totalConversations) status = 'In progress';
              else if (prog.annotatedCount === prog.totalConversations && prog.totalConversations > 0) status = 'Completed';
            }
            return (
              <div key={project._id} className="bg-white rounded-xl shadow p-6 flex flex-col gap-2 border border-gray-100 hover:shadow-lg transition">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-lg text-blue-900 flex-1 truncate">{project.name}</span>
                  <span className={
                    status === 'Completed'
                      ? 'inline-block px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs font-semibold'
                      : status === 'In progress'
                      ? 'inline-block px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 text-xs font-semibold'
                      : 'inline-block px-2 py-0.5 rounded bg-gray-200 text-gray-600 text-xs font-semibold'
                  }>{status}</span>
                </div>
                <div className="text-gray-600 text-sm mb-1 truncate">{project.description}</div>
                {prog && (
                  <div className="text-xs text-gray-500 mb-2">{prog.annotatedCount} / {prog.totalConversations} annotated</div>
                )}
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded flex items-center gap-1 text-sm font-semibold shadow w-max mt-auto"
                  onClick={() => router.push(`/projects/${project._id}`)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  Show Conversations
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
} 