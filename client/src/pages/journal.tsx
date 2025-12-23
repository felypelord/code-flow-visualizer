import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/use-user';

import { BookOpen, Plus, Edit, Trash2, Save, X, Code, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface JournalEntry {
  id: string;
  date: string;
  title?: string;
  content: string;
  tags?: string;
  exerciseId?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
}

export default function JournalPage() {
  const { user } = useUser();

  const { toast } = useToast();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    code: '',
  });

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/journal', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch (error) {
      console.error('Failed to load journal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = editingId ? `/api/journal/${editingId}` : '/api/journal';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to save entry');

      toast({
        title: editingId ? 'Entry updated!' : 'Entry created!',
        description: 'Your journal has been saved.',
      });

      setFormData({ title: '', content: '', tags: '', code: '' });
      setIsCreating(false);
      setEditingId(null);
      loadEntries();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save entry',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (entry: JournalEntry) => {
    setFormData({
      title: entry.title || '',
      content: entry.content,
      tags: entry.tags || '',
      code: entry.code || '',
    });
    setEditingId(entry.id);
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entry?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/journal/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to delete');

      toast({ title: 'Entry deleted', description: 'Journal entry removed.' });
      loadEntries();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete entry', variant: 'destructive' });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Please sign in to view journal</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold text-white flex items-center gap-3">
            <BookOpen className="w-10 h-10 text-purple-400" />
            Learning Journal
          </h1>
          <div className="flex gap-2">
            <a href="/profile" className="text-blue-400 hover:text-blue-300">
              ← Profile
            </a>
          </div>
        </div>

        {/* New Entry Button */}
        {!isCreating && (
          <Button
            onClick={() => {
              setIsCreating(true);
              setEditingId(null);
              setFormData({ title: '', content: '', tags: '', code: '' });
            }}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Entry
          </Button>
        )}

        {/* Entry Form */}
        {isCreating && (
          <Card className="p-6 bg-slate-900/90 border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                {editingId ? 'Edit Entry' : 'New Entry'}
              </h2>
              <button onClick={() => { setIsCreating(false); setEditingId(null); }}>
                <X className="w-6 h-6 text-gray-400 hover:text-white" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  placeholder="Today's Learning..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Content *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  placeholder="What did you learn today? Any insights or 'aha' moments?"
                  rows={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  placeholder="algorithms, recursion, debugging"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Code Snippet (optional)
                </label>
                <textarea
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm"
                  placeholder="// Paste code here..."
                  rows={8}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={!formData.content}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Entry
                </Button>
                <Button
                  onClick={() => { setIsCreating(false); setEditingId(null); }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Entries List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center text-gray-400 py-8">Loading journal...</div>
          ) : entries.length === 0 ? (
            <Card className="p-8 bg-slate-900/90 border-slate-700 text-center">
              <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">Your journal is empty</p>
              <p className="text-sm text-gray-500">
                Start documenting your coding journey! Reflect on what you learn, track your progress, and save useful snippets.
              </p>
            </Card>
          ) : (
            entries.map((entry) => (
              <Card key={entry.id} className="p-6 bg-slate-900/90 border-slate-700 hover:border-slate-600 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    {entry.title && (
                      <h3 className="text-xl font-bold text-white mb-2">{entry.title}</h3>
                    )}
                    <p className="text-sm text-gray-400">
                      {new Date(entry.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(entry)}
                      className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-gray-300 whitespace-pre-wrap mb-4">{entry.content}</div>

                {entry.tags && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {entry.tags.split(',').map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-purple-900/30 text-purple-300 text-xs rounded-full"
                      >
                        #{tag.trim()}
                      </span>
                    ))}
                  </div>
                )}

                {entry.code && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2 text-sm text-gray-400">
                      <Code className="w-4 h-4" />
                      <span>Code Snippet</span>
                    </div>
                    <pre className="bg-slate-950 border border-slate-700 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto">
                      <code>{entry.code}</code>
                    </pre>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
