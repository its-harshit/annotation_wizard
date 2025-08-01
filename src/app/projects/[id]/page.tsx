"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function ProjectDetailPage() {
  const { id: projectId } = useParams();
  const { data: session } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<Array<{ _id: string; conversation: Array<{ role: string; content: string }> }>>([]);
  const [annotations, setAnnotations] = useState<Array<{ conversationId: string; status: string }>>([]);
  const [project, setProject] = useState<{ _id: string; name: string; description: string; members: string[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [newMember, setNewMember] = useState('');
  const [memberError, setMemberError] = useState('');
  const [memberSuccess, setMemberSuccess] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');
  const [deletingConversation, setDeletingConversation] = useState<string | null>(null);
  const userId = session?.user?.email;
  const isAdmin = session?.user ? ((session.user as { role?: string }).role) === 'admin' : false;

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    setError('');
    Promise.all([
      fetch(`/api/projects`).then(res => res.json()),
      fetch(`/api/conversations/list?projectId=${projectId}`).then(res => res.json()),
      fetch(`/api/annotations/list?projectId=${projectId}&userId=${encodeURIComponent(userId || '')}`).then(res => res.json()),
    ])
      .then(([projects, convos, annots]) => {
        const proj = projects.find((p: { _id: string }) => p._id === projectId || p._id?.toString() === projectId?.toString());
        setProject(proj);
        setMembers(proj?.members || []);
        setConversations(convos);
        setAnnotations(annots);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load project details');
        setLoading(false);
      });
  }, [projectId, userId, importing]);

  function getStatus(convoId: string) {
    const annot = annotations.find((a: { conversationId: string }) => a.conversationId === convoId || a.conversationId?.toString() === convoId?.toString());
    if (!annot) return 'Not started';
    if (annot.status === 'completed') return 'Completed';
    if (annot.status === 'in_progress') return 'In Progress';
    return 'Not started';
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    setImportError('');
    setImportSuccess('');
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const conversations = JSON.parse(text);
      if (!Array.isArray(conversations)) throw new Error('File must be a JSON array');
      setImporting(true);
      const res = await fetch('/api/conversations/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, conversations }),
      });
      if (res.ok) {
        const data = await res.json();
        setImportSuccess(`Imported ${data.insertedCount} conversations!`);
        setImporting(false);
        // Refresh conversation list
        fetch(`/api/conversations/list?projectId=${projectId}`)
          .then(res => res.json())
          .then(data => setConversations(data));
      } else {
        const data = await res.json();
        setImportError(data.error || 'Import failed');
        setImporting(false);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Import failed';
      setImportError(errorMessage);
      setImporting(false);
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setMemberError('');
    setMemberSuccess('');
    if (!newMember) return;
    const res = await fetch('/api/projects/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, email: newMember }),
    });
    if (res.ok) {
      setMemberSuccess('Member added!');
      setNewMember('');
      // Refresh members
      fetch(`/api/projects`).then(res => res.json()).then(projects => {
        const proj = projects.find((p: { _id: string }) => p._id === projectId || p._id?.toString() === projectId?.toString());
        setMembers(proj?.members || []);
      });
    } else {
      const data = await res.json();
      setMemberError(data.error || 'Failed to add member');
    }
  }

  async function handleRemoveMember(email: string) {
    setMemberError('');
    setMemberSuccess('');
    const res = await fetch('/api/projects/members', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, email }),
    });
    if (res.ok) {
      setMemberSuccess('Member removed!');
      // Refresh members
      fetch(`/api/projects`).then(res => res.json()).then(projects => {
        const proj = projects.find((p: { _id: string }) => p._id === projectId || p._id?.toString() === projectId?.toString());
        setMembers(proj?.members || []);
      });
    } else {
      const data = await res.json();
      setMemberError(data.error || 'Failed to remove member');
    }
  }

  // Export annotations as JSON
  async function handleExport() {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/projects/export?projectId=${projectId}`);
      if (!res.ok) throw new Error('Failed to export');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `annotations_export_project_${projectId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Export failed';
      alert('Export failed: ' + errorMessage);
    }
  }

  // Delete conversation
  async function handleDeleteConversation(conversationId: string) {
    if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone and will also delete any associated annotations.')) {
      return;
    }

    setDeleteError('');
    setDeleteSuccess('');
    setDeletingConversation(conversationId);

    try {
      const res = await fetch('/api/conversations/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          projectId,
          userId
        }),
      });

      if (res.ok) {
        setDeleteSuccess('Conversation deleted successfully');
        // Remove from local state
        setConversations(prev => prev.filter(conv => conv._id !== conversationId));
        // Also remove from annotations
        setAnnotations(prev => prev.filter(ann => ann.conversationId !== conversationId));
      } else {
        const data = await res.json();
        setDeleteError(data.error || 'Failed to delete conversation');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete conversation';
      setDeleteError(errorMessage);
    } finally {
      setDeletingConversation(null);
    }
  }

  if (loading) return <main className="min-h-screen flex items-center justify-center">Loading project...</main>;
  if (error) return <main className="min-h-screen flex items-center justify-center text-red-600">{error}</main>;

  return (
    <main className="max-w-5xl mx-auto py-10 px-4">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1 text-blue-900 flex items-center gap-2">
            <span className="inline-block align-middle">{project?.name || 'Project'}</span>
            {isAdmin && <span className="ml-2 px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-semibold">Admin</span>}
          </h1>
          <div className="text-gray-600 mb-1 max-w-2xl">{project?.description}</div>
        </div>
        <div className="flex flex-col items-end">
          <button className="mt-2 md:mt-0 text-blue-600 hover:underline text-sm bg-white border border-blue-200 rounded-lg px-4 py-2 shadow-sm font-semibold transition hover:bg-blue-50" onClick={() => router.push('/projects')}>
            &larr; Back to Projects
          </button>
        </div>
      </div>
      {/* Success/Error Messages */}
      {deleteSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-700">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{deleteSuccess}</span>
          </div>
        </div>
      )}
      {deleteError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="font-medium">{deleteError}</span>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="flex justify-center items-start mb-8">
          <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-blue-800 flex items-center gap-2">
                Project Admin Actions
              </h3>
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full font-semibold flex items-center gap-2 shadow" onClick={handleExport}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" /></svg>
                Export
              </button>
            </div>
            <div className="mb-6">
              <label className="font-semibold block mb-2">Import Conversations (JSON array):</label>
              <input type="file" accept="application/json" onChange={handleImportFile} disabled={importing} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              {importError && <div className="text-red-600 text-xs mt-1">{importError}</div>}
              {importSuccess && <div className="text-green-600 text-xs mt-1">{importSuccess}</div>}
            </div>
            <div>
              <h4 className="font-semibold mb-2">Members</h4>
              <ul className="mb-3 space-y-2">
                {members.map(email => (
                  <li key={email} className="flex items-center gap-3 text-sm">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold">{email[0].toUpperCase()}</span>
                    <span className="flex-1">{email}</span>
                    <button className="text-red-600 hover:bg-red-50 px-2 py-1 rounded transition" onClick={() => handleRemoveMember(email)}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              <form onSubmit={handleAddMember} className="flex gap-2">
                <input
                  type="email"
                  className="border rounded-full p-2 text-sm flex-1"
                  placeholder="Add member by email"
                  value={newMember}
                  onChange={e => setNewMember(e.target.value)}
                  required
                />
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-semibold">Add</button>
              </form>
              {memberError && <div className="mt-2 bg-red-50 text-red-700 px-3 py-1 rounded text-xs">{memberError}</div>}
              {memberSuccess && <div className="mt-2 bg-green-50 text-green-700 px-3 py-1 rounded text-xs">{memberSuccess}</div>}
            </div>
          </div>
        </div>
      )}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-blue-900 flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
          Conversations
        </h2>
        <div className="overflow-x-auto rounded-xl shadow bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Snippet</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                {isAdmin && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Admin</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {conversations.length === 0 && (
                <tr><td colSpan={isAdmin ? 5 : 4} className="text-gray-500 px-4 py-6 text-center">No conversations in this project.</td></tr>
              )}
              {conversations.map((convo) => {
                const status = getStatus(convo._id);
                return (
                  <tr key={convo._id}>
                    <td className="px-4 py-2 font-mono text-xs text-gray-500">{convo._id}</td>
                    <td className="px-4 py-2 text-gray-800 max-w-xs truncate">{convo.conversation?.[0]?.content?.slice(0, 60) || '[No content]'}</td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          status === 'Completed'
                            ? 'inline-block px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs font-semibold'
                            : status === 'In Progress'
                            ? 'inline-block px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 text-xs font-semibold'
                            : 'inline-block px-2 py-0.5 rounded bg-gray-200 text-gray-600 text-xs font-semibold'
                        }
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded flex items-center gap-1 text-sm font-semibold shadow"
                        onClick={() => router.push(`/annotate?conversationId=${convo._id}&projectId=${projectId}`)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                        Annotate
                      </button>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-2">
                        <button
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded flex items-center gap-1 text-sm font-semibold shadow disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleDeleteConversation(convo._id)}
                          disabled={deletingConversation === convo._id}
                        >
                          {deletingConversation === convo._id ? (
                            <>
                              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Deleting...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </>
                          )}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
} 