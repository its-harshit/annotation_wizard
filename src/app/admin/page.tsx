"use client";
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [projectActionLoading, setProjectActionLoading] = useState<string | null>(null);
  const [projectActionError, setProjectActionError] = useState<string | null>(null);
  const currentUserEmail = session?.user?.email;

  useEffect(() => {
    if (status === 'loading') return;
    if ((session?.user as any)?.role !== 'admin') {
      router.replace('/projects');
      return;
    }
    Promise.all([
      fetch('/api/users').then(res => res.json()),
      fetch('/api/projects').then(res => res.json()),
      fetch('/api/projects/progress').then(res => res.json()),
    ])
      .then(([users, projects, progress]) => {
        setUsers(users);
        setProjects(projects);
        setProgress(progress);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load admin data');
        setLoading(false);
      });
  }, [session, status, router]);

  async function handlePromoteDemote(email: string, newRole: string) {
    setActionLoading(email + newRole);
    setActionError(null);
    try {
      const res = await fetch('/api/users/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: newRole }),
      });
      if (!res.ok) {
        const data = await res.json();
        setActionError(data.error || 'Failed to update role');
      } else {
        // Refresh users
        const users = await fetch('/api/users').then(r => r.json());
        setUsers(users);
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to update role');
    }
    setActionLoading(null);
  }

  async function handleRemoveFromProject(email: string, projectId: string) {
    setActionLoading(email + projectId);
    setActionError(null);
    try {
      const res = await fetch('/api/projects/members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, email }),
      });
      if (!res.ok) {
        const data = await res.json();
        setActionError(data.error || 'Failed to remove from project');
      } else {
        // Refresh projects and progress
        const [projects, progress] = await Promise.all([
          fetch('/api/projects').then(r => r.json()),
          fetch('/api/projects/progress').then(r => r.json()),
        ]);
        setProjects(projects);
        setProgress(progress);
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to remove from project');
    }
    setActionLoading(null);
  }

  async function handleDeleteProject(projectId: string) {
    setProjectActionLoading(projectId);
    setProjectActionError(null);
    try {
      const res = await fetch('/api/projects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setProjectActionError(data.error || 'Failed to delete project');
      } else {
        // Refresh projects and progress
        const [projects, progress] = await Promise.all([
          fetch('/api/projects').then(r => r.json()),
          fetch('/api/projects/progress').then(r => r.json()),
        ]);
        setProjects(projects);
        setProgress(progress);
      }
    } catch (err: any) {
      setProjectActionError(err.message || 'Failed to delete project');
    }
    setProjectActionLoading(null);
  }

  if (status === 'loading' || loading) return <main className="min-h-screen flex items-center justify-center">Loading admin dashboard...</main>;
  if (error) return <main className="min-h-screen flex items-center justify-center text-red-600">{error}</main>;

  return (
    <main className="max-w-6xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8 text-blue-900 flex items-center gap-2">
        <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 01-8 0M12 3v4m0 0a4 4 0 01-4 4H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2v-6a2 2 0 00-2-2h-4a4 4 0 01-4-4z" /></svg>
        Admin Management
      </h1>
      <div className="overflow-x-auto rounded-xl shadow bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Projects</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {users.map(user => {
              const userProjects = projects.filter((p: any) => p.members?.includes(user.email));
              return (
                <tr key={user._id}>
                  <td className="px-4 py-2 text-blue-900 font-semibold">{user.email}</td>
                  <td className="px-4 py-2 text-xs">
                    <span className={
                      user.role === 'admin'
                        ? 'inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold'
                        : 'inline-block px-2 py-0.5 rounded bg-gray-200 text-gray-600 font-semibold'
                    }>{user.role}</span>
                  </td>
                  <td className="px-4 py-2">
                    {userProjects.length === 0 && <span className="text-gray-400 text-xs">None</span>}
                    <ul className="space-y-1">
                      {userProjects.map((proj: any) => {
                        const prog = progress.find((p: any) => p.userId === user.email && (p.projectId === proj._id || p.projectId?.toString() === proj._id?.toString()));
                        const completed = prog?.annotatedCount || 0;
                        const total = prog?.totalConversations || 0;
                        return (
                          <li key={proj._id} className="flex items-center gap-2 text-xs">
                            <span className="font-semibold text-blue-700">{proj.name}</span>
                            <span className="text-gray-500">{completed} / {total}</span>
                            <div className="w-24 h-2 bg-gray-200 rounded overflow-hidden">
                              <div className="h-2 bg-green-400" style={{ width: total ? `${(completed/total)*100}%` : '0%' }} />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-col gap-1">
                      <button
                        className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                        disabled={user.email === currentUserEmail || actionLoading === user.email + (user.role === 'admin' ? 'annotator' : 'admin')}
                        style={user.email === currentUserEmail ? { display: 'none' } : {}}
                        onClick={() => handlePromoteDemote(user.email, user.role === 'admin' ? 'annotator' : 'admin')}
                      >
                        {user.role === 'admin' ? 'Demote to Annotator' : 'Promote to Admin'}
                      </button>
                      {userProjects.map((proj: any) => (
                        <button
                          key={proj._id}
                          className="text-xs text-red-600 hover:underline disabled:opacity-50"
                          disabled={actionLoading === user.email + proj._id}
                          onClick={() => handleRemoveFromProject(user.email, proj._id)}
                        >
                          Remove from {proj.name}
                        </button>
                      ))}
                      {actionError && <div className="text-xs text-red-600 mt-1">{actionError}</div>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <h2 className="text-2xl font-bold mt-12 mb-6 text-blue-900 flex items-center gap-2">
        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M16 3v4M8 3v4M4 11h16" /></svg>
        Projects Management
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {projects.map((project: any) => (
          <div key={project._id} className="bg-white rounded-xl shadow p-6 flex flex-col gap-3 border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-lg text-blue-900 flex-1 truncate">{project.name}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-600 font-semibold">{project.members?.length || 0} members</span>
            </div>
            <div className="text-gray-600 text-sm mb-1 truncate">{project.description}</div>
            <div className="flex gap-2 flex-wrap mt-2">
              <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded font-semibold flex items-center gap-1 text-sm" onClick={() => window.location.href = `/projects/${project._id}`}>Admin Actions</button>
              <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded font-semibold flex items-center gap-1 text-sm disabled:opacity-50" disabled={projectActionLoading === project._id} onClick={() => handleDeleteProject(project._id)}>
                Delete
              </button>
            </div>
            {projectActionError && <div className="text-xs text-red-600 mt-1">{projectActionError}</div>}
          </div>
        ))}
      </div>
    </main>
  );
} 