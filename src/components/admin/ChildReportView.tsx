import type { ChildReport, Advisory } from '../../utils/childReport';
import { formatOperationLabel, formatGradeLabel } from '../../utils/operationLabels';

const advisoryStyles: Record<Advisory['kind'], { icon: string; classes: string }> = {
  reinforce: { icon: '⚠️', classes: 'bg-red-50 border-red-300 text-red-800' },
  strength: { icon: '🌟', classes: 'bg-green-50 border-green-300 text-green-800' },
  inactive: { icon: '💤', classes: 'bg-slate-100 border-slate-300 text-slate-700' },
};

export function ChildReportView({ report }: { report: ChildReport }) {
  return (
    <div className="space-y-6">
      {report.advisories.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-700">📌 Avisos</h3>
          <ul className="space-y-2">
            {report.advisories.map((advisory) => {
              const style = advisoryStyles[advisory.kind];
              return (
                <li
                  key={`${advisory.kind}-${advisory.operation ?? 'general'}`}
                  className={`border-l-4 rounded-lg px-4 py-3 text-sm font-medium ${style.classes}`}
                >
                  {style.icon} {advisory.message}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {report.byGrade.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-700">📚 Por curso y tipo de ejercicio</h3>
          {report.byGrade.map((grade) => (
            <div key={grade.grade} className="bg-white rounded-lg shadow p-4 space-y-2">
              <h4 className="font-semibold text-gray-800">{formatGradeLabel(grade.grade)}</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-500 border-b">
                      <th className="py-2 pr-4">Ejercicio</th>
                      <th className="py-2 pr-4">Intentos</th>
                      <th className="py-2 pr-4">Aciertos</th>
                      <th className="py-2 pr-4">Fallos</th>
                      <th className="py-2 pr-4">Precisión</th>
                      <th className="py-2">Tiempo medio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grade.operations.map((op) => (
                      <tr key={op.operation} className="border-b last:border-b-0">
                        <td className="py-2 pr-4 font-medium text-gray-700">
                          {formatOperationLabel(op.operation)}
                        </td>
                        <td className="py-2 pr-4">{op.total}</td>
                        <td className="py-2 pr-4 text-green-700">{op.correct}</td>
                        <td className="py-2 pr-4 text-red-700">{op.failed}</td>
                        <td className="py-2 pr-4">
                          <span
                            className={
                              op.accuracy < 60
                                ? 'text-red-700 font-semibold'
                                : op.accuracy >= 85
                                  ? 'text-green-700 font-semibold'
                                  : ''
                            }
                          >
                            {op.accuracy}%
                          </span>
                        </td>
                        <td className="py-2">{op.avgTime}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
