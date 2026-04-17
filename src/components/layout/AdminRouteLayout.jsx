import { Outlet } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';

export default function AdminRouteLayout() {
  return <AdminLayout><Outlet /></AdminLayout>;
}

