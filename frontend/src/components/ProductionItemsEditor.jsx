import Button from './ui/Button.jsx';
import Input from './ui/Input.jsx';
import { FilterField } from './FilterBar.jsx';

const emptyRow = () => ({
  type: 'normal',
  method: 'dry',
  gramTypeId: '',
  qualityTypeId: '',
  specialType: '',
  kg: '',
});

export function productionToRows(production) {
  if (!production?.items?.length) {
    return [emptyRow()];
  }
  return production.items.map((item) => ({
    type: item.type || 'normal',
    method: item.method || 'dry',
    gramTypeId: item.gramTypeId || '',
    qualityTypeId: item.qualityTypeId || '',
    specialType: item.specialType || '',
    kg: String(item.kg ?? ''),
  }));
}

export default function ProductionItemsEditor({ rows, onChange, gramTypes, qualityTypes }) {
  function updateRow(index, field, value) {
    const next = rows.map((row, i) => {
      if (i !== index) return row;
      const updated = { ...row, [field]: value };
      if (field === 'type') {
        if (value === 'special') {
          updated.gramTypeId = '';
          updated.qualityTypeId = '';
        } else {
          updated.specialType = '';
        }
      }
      return updated;
    });
    onChange(next);
  }

  function addRow() {
    onChange([...rows, emptyRow()]);
  }

  function removeRow(index) {
    if (rows.length <= 1) return;
    onChange(rows.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      {rows.map((row, index) => (
        <div
          key={index}
          className="rounded-xl border border-stone-200 bg-stone-50/80 p-4 space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-stone-700">Row {index + 1}</p>
            {rows.length > 1 && (
              <Button type="button" size="sm" variant="ghost" onClick={() => removeRow(index)}>
                Remove
              </Button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <FilterField label="Production Method">
              <select
                className="w-full min-h-11 rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base sm:text-sm"
                value={row.method}
                onChange={(e) => updateRow(index, 'method', e.target.value)}
              >
                <option value="dry">Dry Machine</option>
                <option value="non">Non-Machine</option>
              </select>
            </FilterField>
            <FilterField label="Type">
              <select
                className="w-full min-h-11 rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base sm:text-sm"
                value={row.type}
                onChange={(e) => updateRow(index, 'type', e.target.value)}
              >
                <option value="normal">Normal</option>
                <option value="special">Special</option>
              </select>
            </FilterField>
          </div>

          {row.type === 'normal' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <FilterField label="Gram">
                <select
                  className="w-full min-h-11 rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base sm:text-sm"
                  value={row.gramTypeId}
                  onChange={(e) => updateRow(index, 'gramTypeId', e.target.value)}
                  required
                >
                  <option value="">Select gram</option>
                  {gramTypes.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </FilterField>
              <FilterField label="Quality">
                <select
                  className="w-full min-h-11 rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base sm:text-sm"
                  value={row.qualityTypeId}
                  onChange={(e) => updateRow(index, 'qualityTypeId', e.target.value)}
                  required
                >
                  <option value="">Select quality</option>
                  {qualityTypes.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.name}
                    </option>
                  ))}
                </select>
              </FilterField>
            </div>
          ) : (
            <Input
              label="Special Type"
              value={row.specialType}
              onChange={(e) => updateRow(index, 'specialType', e.target.value)}
              placeholder="e.g. Extra Thin 4g"
              required
            />
          )}

          <Input
            label="KG"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={row.kg}
            onChange={(e) => updateRow(index, 'kg', e.target.value)}
            required
          />
        </div>
      ))}

      <Button type="button" variant="secondary" className="!w-full sm:!w-auto" onClick={addRow}>
        + Add Row
      </Button>
    </div>
  );
}

export function rowsToPayload(rows) {
  return rows.map((row) => ({
    type: row.type,
    method: row.method,
    kg: parseFloat(row.kg) || 0,
    gramTypeId: row.type === 'normal' ? row.gramTypeId : undefined,
    qualityTypeId: row.type === 'normal' ? row.qualityTypeId : undefined,
    specialType: row.type === 'special' ? row.specialType : undefined,
  }));
}

export function sumRowsForPreview(rows) {
  let dry = 0;
  let non = 0;
  for (const row of rows) {
    const kg = parseFloat(row.kg) || 0;
    if (row.method === 'dry') dry += kg;
    else non += kg;
  }
  return { dryMachineKg: dry, nonMachineKg: non };
}
