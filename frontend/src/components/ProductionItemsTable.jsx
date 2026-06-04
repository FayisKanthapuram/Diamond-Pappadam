export default function ProductionItemsTable({ items, compact = false }) {
  if (!items?.length) {
    return <p className="text-sm text-stone-500">No production rows.</p>;
  }

  if (compact) {
    return (
      <ul className="space-y-1 text-sm text-stone-700">
        {items.map((item, i) => (
          <li key={item.id || i}>
            {item.type === 'special' ? (
              <>
                <span className="font-medium">{item.specialType}</span>
                {' · '}
                {item.methodLabel} · {item.kg} kg
              </>
            ) : (
              <>
                {item.gramLabel} · {item.qualityLabel} · {item.methodLabel} · {item.kg} kg
              </>
            )}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-stone-200 text-stone-500">
            <th className="pb-2 pr-2 font-medium">Type</th>
            <th className="pb-2 pr-2 font-medium">Gram</th>
            <th className="pb-2 pr-2 font-medium">Quality</th>
            <th className="pb-2 pr-2 font-medium">Special</th>
            <th className="pb-2 pr-2 font-medium">Method</th>
            <th className="pb-2 font-medium">KG</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={item.id || i} className="border-b border-stone-100">
              <td className="py-2 pr-2">{item.typeLabel || (item.type === 'special' ? 'Special' : 'Normal')}</td>
              <td className="py-2 pr-2">{item.type === 'special' ? '—' : item.gramLabel}</td>
              <td className="py-2 pr-2">{item.type === 'special' ? '—' : item.qualityLabel}</td>
              <td className="py-2 pr-2">{item.specialType || '—'}</td>
              <td className="py-2 pr-2">{item.methodLabel}</td>
              <td className="py-2">{item.kg}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
