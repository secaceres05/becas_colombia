import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAdminAdmissionProcesses, AdminAuthError } from '@/lib/adminApi';
import AdmissionsManager from '@/components/admin/AdmissionsManager';

export default async function AdminAdmisionesPage() {
  const token = (await cookies()).get('admin_token')?.value;
  if (!token) redirect('/admin/login');

  let processes: any[] = [];
  try {
    processes = await getAdminAdmissionProcesses(token);
  } catch (err) {
    if (err instanceof AdminAuthError) redirect('/admin/login');
    throw err;
  }

  return (
    <div>
      <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.8rem', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
        Admisiones
      </h1>
      <p style={{ fontSize: '0.86rem', color: 'var(--muted)', marginBottom: '26px' }}>
        {processes.length} proceso{processes.length !== 1 ? 's' : ''} de admisión registrado{processes.length !== 1 ? 's' : ''}.
      </p>

      <AdmissionsManager processes={processes} />
    </div>
  );
}
