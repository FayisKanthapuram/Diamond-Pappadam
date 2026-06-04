import { useState } from 'react';
import toast from 'react-hot-toast';
import Button from './ui/Button.jsx';
import Input from './ui/Input.jsx';
import Card from './ui/Card.jsx';

export default function LookupTypeManager({ title, types, onCreate, onUpdate, loading }) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onCreate(name.trim());
      setName('');
      toast.success(`${title} added`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(type) {
    try {
      await onUpdate(type.id, { active: !type.active });
      toast.success(type.active ? 'Disabled' : 'Enabled');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  }

  async function handleEdit(type) {
    const next = window.prompt(`Rename ${title.slice(0, -1)}`, type.name);
    if (!next || next.trim() === type.name) return;
    try {
      await onUpdate(type.id, { name: next.trim() });
      toast.success('Updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  }

  return (
    <Card title={title}>
      <form onSubmit={handleAdd} className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <Input
          label={`New ${title.slice(0, -1)}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. 3g or 1st"
          className="flex-1"
        />
        <Button type="submit" disabled={saving}>
          {saving ? 'Adding...' : 'Add'}
        </Button>
      </form>

      {loading ? (
        <p className="text-stone-500">Loading...</p>
      ) : types.length === 0 ? (
        <p className="text-stone-500">No types yet.</p>
      ) : (
        <ul className="divide-y divide-stone-100">
          {types.map((type) => (
            <li key={type.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium text-stone-900">{type.name}</p>
                <p className="text-xs text-stone-500">{type.active ? 'Active' : 'Disabled'}</p>
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="ghost" onClick={() => handleEdit(type)}>
                  Edit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={type.active ? 'ghost' : 'secondary'}
                  onClick={() => toggleActive(type)}
                >
                  {type.active ? 'Disable' : 'Enable'}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
