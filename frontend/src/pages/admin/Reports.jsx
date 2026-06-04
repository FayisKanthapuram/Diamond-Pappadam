import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { reportsApi, employeesApi, gramTypesApi, qualityTypesApi } from '../../api/index.js';
import Card from '../../components/ui/Card.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { FilterSelect, FilterDate, FilterActions } from '../../components/FilterBar.jsx';
import { formatDate } from '../../utils/format.js';

export default function Reports() {
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [gramTypes, setGramTypes] = useState([]);
  const [qualityTypes, setQualityTypes] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [gramTypeId, setGramTypeId] = useState('');
  const [qualityTypeId, setQualityTypeId] = useState('');
  const [method, setMethod] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([employeesApi.list(), gramTypesApi.list(), qualityTypesApi.list()])
      .then(([empRes, gramRes, qualityRes]) => {
        setEmployees(empRes.data.employees);
        setGramTypes(gramRes.data.gramTypes);
        setQualityTypes(qualityRes.data.qualityTypes);
      })
      .catch(() => {});
  }, []);

  function load() {
    setLoading(true);
    const params = {};
    if (employeeId) params.employeeId = employeeId;
    if (gramTypeId) params.gramTypeId = gramTypeId;
    if (qualityTypeId) params.qualityTypeId = qualityTypeId;
    if (method) params.method = method;
    if (from) params.from = from;
    if (to) params.to = to;
    reportsApi
      .production(params)
      .then((res) => setRows(res.data.rows || []))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load report'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <PageHeader
        title="Production Reports"
        subtitle="One row per production line item (approved entries only)."
      />

      <Card className="mb-4 sm:mb-6">
        <div className="filter-stack">
          <FilterSelect
            label="Employee"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="sm:min-w-[160px]"
          >
            <option value="">All Employees</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            label="Gram"
            value={gramTypeId}
            onChange={(e) => setGramTypeId(e.target.value)}
            className="sm:min-w-[120px]"
          >
            <option value="">All Grams</option>
            {gramTypes.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            label="Quality"
            value={qualityTypeId}
            onChange={(e) => setQualityTypeId(e.target.value)}
            className="sm:min-w-[120px]"
          >
            <option value="">All Qualities</option>
            {qualityTypes.map((q) => (
              <option key={q.id} value={q.id}>
                {q.name}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            label="Method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="sm:min-w-[140px]"
          >
            <option value="">All Methods</option>
            <option value="dry">Dry Machine</option>
            <option value="non">Non-Machine</option>
          </FilterSelect>
          <FilterDate label="From" value={from} onChange={(e) => setFrom(e.target.value)} />
          <FilterDate label="To" value={to} onChange={(e) => setTo(e.target.value)} />
          <FilterActions onApply={load} loading={loading} />
        </div>
      </Card>

      <Card>
        {loading ? (
          <p className="text-stone-500">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-stone-500">No records found.</p>
        ) : (
          <>
            <div className="data-card-list">
              {rows.map((r, i) => (
                <div key={`${r.productionId}-${r.itemId || i}`} className="data-card text-sm">
                  <p className="font-semibold text-stone-900">{r.employeeName}</p>
                  <p className="text-stone-500">{formatDate(r.date)}</p>
                  <dl className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <dt className="text-stone-400">Type</dt>
                      <dd>{r.productionType}</dd>
                    </div>
                    <div>
                      <dt className="text-stone-400">Method</dt>
                      <dd>{r.method}</dd>
                    </div>
                    <div>
                      <dt className="text-stone-400">Gram</dt>
                      <dd>{r.gram}</dd>
                    </div>
                    <div>
                      <dt className="text-stone-400">Quality</dt>
                      <dd>{r.quality}</dd>
                    </div>
                    {r.specialType && r.specialType !== '—' && (
                      <div className="col-span-2">
                        <dt className="text-stone-400">Special Type</dt>
                        <dd>{r.specialType}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-stone-400">KG</dt>
                      <dd className="font-medium">{r.kg}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>

            <div className="data-table-wrap">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500">
                    <th className="pb-3 pr-3 font-medium">Date</th>
                    <th className="pb-3 pr-3 font-medium">Employee</th>
                    <th className="pb-3 pr-3 font-medium">Production Type</th>
                    <th className="pb-3 pr-3 font-medium">Gram</th>
                    <th className="pb-3 pr-3 font-medium">Quality</th>
                    <th className="pb-3 pr-3 font-medium">Special Type</th>
                    <th className="pb-3 pr-3 font-medium">Method</th>
                    <th className="pb-3 font-medium">KG</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={`${r.productionId}-${r.itemId || i}`} className="border-b border-stone-100">
                      <td className="py-3 pr-3">{formatDate(r.date)}</td>
                      <td className="py-3 pr-3">{r.employeeName}</td>
                      <td className="py-3 pr-3">{r.productionType}</td>
                      <td className="py-3 pr-3">{r.gram}</td>
                      <td className="py-3 pr-3">{r.quality}</td>
                      <td className="py-3 pr-3">{r.specialType}</td>
                      <td className="py-3 pr-3">{r.method}</td>
                      <td className="py-3">{r.kg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
