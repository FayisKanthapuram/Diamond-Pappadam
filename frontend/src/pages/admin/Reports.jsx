import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { reportsApi, employeesApi, gramTypesApi, qualityTypesApi } from '../../api/index.js';
import Card from '../../components/ui/Card.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Button from '../../components/ui/Button.jsx';
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
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

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

  function exportToExcel() {
    const headers = [
      'Date',
      'Employee',
      'Production Type',
      'Gram',
      'Quality',
      'Special Type',
      'Method',
      'KG',
      'Rate (INR)',
      'Item Amount (INR)',
      'Bonus (INR)',
      'Deduction (INR)',
      'Net Amount (INR)'
    ];
    const csvRows = [headers.join(',')];

    for (const r of rows) {
      const values = [
        formatDate(r.date),
        `"${(r.employeeName || '').replace(/"/g, '""')}"`,
        `"${(r.productionType || '').replace(/"/g, '""')}"`,
        `"${(r.gram || '').replace(/"/g, '""')}"`,
        `"${(r.quality || '').replace(/"/g, '""')}"`,
        `"${(r.specialType || '').replace(/"/g, '""')}"`,
        `"${(r.method || '').replace(/"/g, '""')}"`,
        r.kg,
        r.rate || 0,
        (r.amount || 0).toFixed(2),
        r.bonusAmount || 0,
        r.deductionAmount || 0,
        (r.netAmount || 0).toFixed(2)
      ];
      csvRows.push(values.join(','));
    }

    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `production-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('Excel/CSV report exported successfully');
  }


  function exportToPDF() {
    setIsGeneratingPDF(true);
    const toastId = toast.loading('Generating PDF report...');

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const totalPagesExp = '{total_pages_count_string}';

      // 1. Company Branding Header (Vector logo & formatted typography)
      doc.setFillColor(79, 70, 229); // Brand Indigo (#4F46E5)
      doc.rect(15, 15, 12, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('D', 19, 23.5);

      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('DIAMOND PAPPADAM', 31, 21);

      doc.setTextColor(79, 70, 229); // brand indigo
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('PRODUCTION & ACCOUNTING UNIT', 31, 25.5);

      // Document Title & Date (Right-aligned)
      doc.setTextColor(30, 41, 59); // slate-800
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Production Ledger Statement', 195, 21, { align: 'right' });
      
      doc.setTextColor(100, 116, 139); // slate-500
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 195, 25.5, { align: 'right' });

      // Dividing line
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.line(15, 32, 195, 32);

      // 2. Scope Summary Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.rect(15, 37, 180, 22, 'FD');

      // Box Header & Content
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text('SCOPE PARAMETERS', 20, 42);
      
      doc.setTextColor(51, 65, 85);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(`Employee:  ${filterSummary.employee}`, 20, 47.5);
      doc.text(`Date Range: ${filterSummary.range}`, 20, 52.5);
      
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text('PRODUCT SPECIFICATIONS', 110, 42);
      
      doc.setTextColor(51, 65, 85);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(`Method:       ${filterSummary.method}`, 110, 47.5);
      doc.text(`Specs:         ${filterSummary.gram} - ${filterSummary.quality}`, 110, 52.5);

      // 3. Table Data Setup
      const headers = [
        ['Date', 'Employee', 'Product Details', 'Method', 'Weight', 'Rate', 'Amount', 'Bonus', 'Deduction', 'Net Amount']
      ];

      const bodyData = rows.map(r => [
        formatDate(r.date),
        r.employeeName || '',
        r.productionType === 'Special' ? `Special (${r.specialType || ''})` : `${r.gram || ''} - ${r.quality || ''}`,
        r.method || '',
        `${r.kg} kg`,
        `Rs. ${r.rate || 0}`,
        `Rs. ${(r.amount || 0).toFixed(2)}`,
        `Rs. ${r.bonusAmount || 0}`,
        `Rs. ${r.deductionAmount || 0}`,
        `Rs. ${(r.netAmount || 0).toFixed(2)}`
      ]);

      // Push total row
      bodyData.push([
        { content: 'Total Summary', colSpan: 4, styles: { halign: 'left', fontStyle: 'bold', fillColor: [241, 245, 249] } },
        { content: `${totalKg.toFixed(2)} kg`, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
        { content: '—', styles: { fontStyle: 'bold', halign: 'center', fillColor: [241, 245, 249] } },
        { content: `Rs. ${totalAmount.toFixed(2)}`, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
        { content: `Rs. ${totalBonus.toFixed(2)}`, styles: { fontStyle: 'bold', textColor: [21, 128, 61], fillColor: [241, 245, 249] } },
        { content: `Rs. ${totalDeduction.toFixed(2)}`, styles: { fontStyle: 'bold', textColor: [185, 28, 28], fillColor: [241, 245, 249] } },
        { content: `Rs. ${totalNetAmount.toFixed(2)}`, styles: { fontStyle: 'bold', textColor: [79, 70, 229], fillColor: [241, 245, 249] } }
      ]);

      // 4. Render Table using autoTable
      autoTable(doc, {
        startY: 65,
        head: headers,
        body: bodyData,
        theme: 'striped',
        headStyles: {
          fillColor: [79, 70, 229], // Brand Indigo
          textColor: 255,
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'left'
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [51, 65, 85]
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250]
        },
        columnStyles: {
          4: { halign: 'right' }, // Weight
          5: { halign: 'right' }, // Rate
          6: { halign: 'right' }, // Amount
          7: { halign: 'right' }, // Bonus
          8: { halign: 'right' }, // Deduction
          9: { halign: 'right' }  // Net Amount
        },
        margin: { left: 15, right: 15, top: 20, bottom: 20 },
        didDrawPage: (data) => {
          // Footer page number
          let str = 'Page ' + doc.internal.getNumberOfPages();
          if (typeof doc.putTotalPages === 'function') {
            str = str + ' of ' + totalPagesExp;
          }
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(148, 163, 184);
          doc.text(str, 195, 285, { align: 'right' });
          
          // Header on subsequent pages
          if (data.pageNumber > 1) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text('DIAMOND PAPPADAM - Production Ledger Statement', 15, 12);
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.3);
            doc.line(15, 14, 195, 14);
          }
        }
      });

      // 5. Draw Prepared / Approved by Signature block
      let currentY = doc.lastAutoTable.finalY + 15;

      if (currentY + 40 > 297) {
        doc.addPage();
        currentY = 25;
      }

      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.3);

      // Prepared By (Left)
      doc.line(15, currentY + 12, 65, currentY + 12);
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('Prepared By', 40, currentY + 17, { align: 'center' });
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text('Operator/Clerk Signature', 40, currentY + 21, { align: 'center' });

      // Approved By (Right)
      doc.line(145, currentY + 12, 195, currentY + 12);
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('Approved By', 170, currentY + 17, { align: 'center' });
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text('Manager Signature', 170, currentY + 21, { align: 'center' });

      // Document Footer Note
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text('This is an official system generated production ledger statement for Diamond Pappadam.', 105, currentY + 32, { align: 'center' });

      // Replace total page count placeholder
      if (typeof doc.putTotalPages === 'function') {
        doc.putTotalPages(totalPagesExp);
      }

      // Save PDF
      doc.save(`production-report-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('PDF report downloaded successfully', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF report', { id: toastId });
    } finally {
      setIsGeneratingPDF(false);
    }
  }

  // Calculations for report totals
  const totalKg = rows.reduce((sum, r) => sum + (Number(r.kg) || 0), 0);
  const totalAmount = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const totalBonus = rows.reduce((sum, r) => sum + (Number(r.bonusAmount) || 0), 0);
  const totalDeduction = rows.reduce((sum, r) => sum + (Number(r.deductionAmount) || 0), 0);
  const totalNetAmount = rows.reduce((sum, r) => sum + (Number(r.netAmount) || 0), 0);

  const filterSummary = {
    employee: employeeId ? employees.find((e) => e.id === employeeId)?.name : 'All Employees',
    gram: gramTypeId ? gramTypes.find((g) => g.id === gramTypeId)?.name : 'All Grams',
    quality: qualityTypeId ? qualityTypes.find((q) => q.id === qualityTypeId)?.name : 'All Qualities',
    method: method ? (method === 'dry' ? 'Dry Machine' : 'Non-Machine') : 'All Methods',
    range: from || to ? `${from || 'Beginning'} to ${to || 'Present'}` : 'All Dates',
  };

  return (
    <>
      {/* SCREEN VIEW (Hidden when printing) */}
      <div className="print:hidden">
        <PageHeader
          title="Production Reports"
          subtitle="One row per production line item (approved entries only)."
          action={
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={exportToExcel}
                disabled={rows.length === 0 || isGeneratingPDF}
                className="text-xs sm:text-sm"
              >
                📊 Export Excel
              </Button>
              <Button
                variant="secondary"
                onClick={exportToPDF}
                disabled={rows.length === 0 || isGeneratingPDF}
                className="text-xs sm:text-sm"
              >
                📄 Export PDF
              </Button>
            </div>
          }
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
                        <dd className="font-medium">{r.kg} kg</dd>
                      </div>
                      <div>
                        <dt className="text-stone-400">Rate</dt>
                        <dd className="font-medium">₹{r.rate || 0}</dd>
                      </div>
                      <div>
                        <dt className="text-stone-400">Amount</dt>
                        <dd className="font-semibold text-slate-800">₹{(r.amount || 0).toFixed(2)}</dd>
                      </div>
                      <div>
                        <dt className="text-stone-400">Bonus</dt>
                        <dd className="text-emerald-600 font-medium">₹{r.bonusAmount || 0}</dd>
                      </div>
                      <div>
                        <dt className="text-stone-400">Deduction</dt>
                        <dd className="text-rose-600 font-medium">₹{r.deductionAmount || 0}</dd>
                      </div>
                      <div className="col-span-2 border-t border-slate-100 pt-2 mt-1">
                        <dt className="text-stone-400">Net Amount</dt>
                        <dd className="text-brand-600 font-extrabold text-base">₹{(r.netAmount || 0).toFixed(2)}</dd>
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
                      <th className="pb-3 pr-3 font-medium">KG</th>
                      <th className="pb-3 pr-3 font-medium">Rate</th>
                      <th className="pb-3 pr-3 font-medium">Amount</th>
                      <th className="pb-3 pr-3 font-medium">Bonus</th>
                      <th className="pb-3 pr-3 font-medium">Deduction</th>
                      <th className="pb-3 font-medium">Net Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={`${r.productionId}-${r.itemId || i}`} className="border-b border-stone-100">
                        <td className="py-3 pr-3 whitespace-nowrap">{formatDate(r.date)}</td>
                        <td className="py-3 pr-3 font-semibold text-slate-800">{r.employeeName}</td>
                        <td className="py-3 pr-3">{r.productionType}</td>
                        <td className="py-3 pr-3">{r.gram}</td>
                        <td className="py-3 pr-3">{r.quality}</td>
                        <td className="py-3 pr-3">{r.specialType}</td>
                        <td className="py-3 pr-3">{r.method}</td>
                        <td className="py-3 pr-3 font-medium">{r.kg} kg</td>
                        <td className="py-3 pr-3 text-slate-600">₹{r.rate || 0}</td>
                        <td className="py-3 pr-3 text-slate-700 font-semibold">₹{(r.amount || 0).toFixed(2)}</td>
                        <td className="py-3 pr-3 text-emerald-600 font-medium">₹{r.bonusAmount || 0}</td>
                        <td className="py-3 pr-3 text-rose-600 font-medium">₹{r.deductionAmount || 0}</td>
                        <td className="py-3 text-brand-600 font-extrabold">₹{(r.netAmount || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>
      </div>
    </>
  );
}
