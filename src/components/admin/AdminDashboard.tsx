import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchAllAttempts, listChildren, type AttemptRecord, type ChildOverview } from '../../services/adminService';
import { fetchUserStats } from '../../services/statsService';
import type { DetailedStats } from '../../types';
import { buildChildReport, type ChildReport } from '../../utils/childReport';
import { StatsView } from '../StatsView';
import { PinResetDialog } from './PinResetDialog';
import { ChangePasswordForm } from './ChangePasswordForm';
import { ChildReportView } from './ChildReportView';

function formatDate(iso: string | null): string {
  if (!iso) return 'Sin actividad';
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function accuracy(child: ChildOverview): number {
  return child.totalAttempts > 0 ? Math.round((child.correctAttempts / child.totalAttempts) * 100) : 0;
}

function advisoryBadges(report: ChildReport | undefined): string {
  if (!report) return '';
  const reinforce = report.advisories.filter((a) => a.kind === 'reinforce').length;
  const strength = report.advisories.filter((a) => a.kind === 'strength').length;
  const inactive = report.advisories.some((a) => a.kind === 'inactive');
  const parts: string[] = [];
  if (reinforce > 0) parts.push(`⚠️ ${reinforce}`);
  if (strength > 0) parts.push(`🌟 ${strength}`);
  if (inactive) parts.push('💤');
  return parts.join(' ');
}

export function AdminDashboard() {
  const { signOut } = useAuth();
  const [children, setChildren] = useState<ChildOverview[] | null>(null);
  const [attempts, setAttempts] = useState<AttemptRecord[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [selected, setSelected] = useState<ChildOverview | null>(null);
  const [selectedStats, setSelectedStats] = useState<DetailedStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [pinResetUsername, setPinResetUsername] = useState<string | null>(null);

  const loadChildren = useCallback(async () => {
    setLoadError(false);
    const [result, allAttempts] = await Promise.all([listChildren(), fetchAllAttempts()]);
    if (result === null) {
      setLoadError(true);
    } else {
      setChildren(result);
    }
    setAttempts(allAttempts);
  }, []);

  useEffect(() => {
    void loadChildren();
  }, [loadChildren]);

  const reports = useMemo(() => {
    const map = new Map<string, ChildReport>();
    if (!attempts) return map;
    const byChild = new Map<string, AttemptRecord[]>();
    for (const attempt of attempts) {
      const list = byChild.get(attempt.userId) ?? [];
      list.push(attempt);
      byChild.set(attempt.userId, list);
    }
    for (const [childId, childAttempts] of byChild) {
      map.set(childId, buildChildReport(childAttempts));
    }
    return map;
  }, [attempts]);

  const openChild = async (child: ChildOverview) => {
    setSelected(child);
    setSelectedStats(null);
    setLoadingStats(true);
    const stats = await fetchUserStats(child.id);
    setSelectedStats(stats);
    setLoadingStats(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">🛠️ Panel de administración</h1>
          <button
            type="button"
            className="bg-gray-800 text-white font-semibold px-4 py-2 rounded-lg hover:bg-gray-900 transition"
            onClick={() => void signOut()}
          >
            Cerrar sesión
          </button>
        </header>

        {selected ? (
          <section className="space-y-4">
            <button
              type="button"
              className="text-blue-600 font-semibold"
              onClick={() => {
                setSelected(null);
                setSelectedStats(null);
              }}
            >
              ← Volver a la lista
            </button>
            <h2 className="text-2xl font-bold text-gray-800">
              {selected.avatar ?? '🙂'} {selected.username}
            </h2>
            {reports.has(selected.id) && <ChildReportView report={reports.get(selected.id)!} />}
            {loadingStats && <p className="text-gray-600">Cargando estadísticas...</p>}
            {!loadingStats && selectedStats && (
              <StatsView
                stats={selectedStats}
                correctExercises={selected.correctAttempts}
                totalExercises={selected.totalAttempts}
              />
            )}
            {!loadingStats && !selectedStats && (
              <p className="text-gray-600">No pudimos cargar las estadísticas de este niño.</p>
            )}
          </section>
        ) : (
          <section className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">👧👦 Avance de los niños</h2>

            {loadError && (
              <div className="text-sm text-red-600">
                No pudimos cargar la lista de niños.{' '}
                <button type="button" className="font-semibold underline" onClick={() => void loadChildren()}>
                  Reintentar
                </button>
              </div>
            )}

            {!loadError && children === null && <p className="text-gray-600">Cargando...</p>}

            {children !== null && children.length === 0 && (
              <p className="text-gray-600">Todavía no hay niños registrados.</p>
            )}

            {children !== null && children.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-sm text-gray-500 border-b">
                      <th className="py-2 pr-4">Niño</th>
                      <th className="py-2 pr-4">Intentos</th>
                      <th className="py-2 pr-4">Aciertos</th>
                      <th className="py-2 pr-4">Última actividad</th>
                      <th className="py-2 pr-4">Avisos</th>
                      <th className="py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {children.map((child) => (
                      <tr key={child.id} className="border-b last:border-b-0 hover:bg-slate-50">
                        <td className="py-3 pr-4">
                          <button
                            type="button"
                            className="flex items-center gap-2 font-semibold text-blue-600"
                            onClick={() => void openChild(child)}
                          >
                            <span className="text-2xl">{child.avatar ?? '🙂'}</span>
                            {child.username}
                          </button>
                        </td>
                        <td className="py-3 pr-4">{child.totalAttempts}</td>
                        <td className="py-3 pr-4">{accuracy(child)}%</td>
                        <td className="py-3 pr-4">{formatDate(child.lastActivity)}</td>
                        <td className="py-3 pr-4 whitespace-nowrap" title="⚠️ reforzar · 🌟 va muy bien · 💤 inactivo">
                          {advisoryBadges(reports.get(child.id))}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            className="bg-amber-500 text-white text-sm font-semibold px-3 py-2 rounded-lg hover:bg-amber-600 transition"
                            onClick={() => setPinResetUsername(child.username)}
                          >
                            🔑 Nuevo PIN
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        <section className="bg-white rounded-2xl shadow-lg p-6 space-y-4 max-w-md">
          <h2 className="text-xl font-semibold text-gray-700">🔒 Cambiar mi contraseña</h2>
          <ChangePasswordForm />
        </section>
      </div>

      {pinResetUsername && (
        <PinResetDialog username={pinResetUsername} onClose={() => setPinResetUsername(null)} />
      )}
    </div>
  );
}
