import React from 'react';
import { Slot } from 'expo-router';
import AdminGuard from '../../../components/UI/AdminGuard';

/**
 * Layout for all /views/admin/* routes.
 * Wraps every admin page with AdminGuard — if the user is not
 * admin or super-admin, they see "Access Denied" screen.
 * This blocks direct URL navigation by regular users.
 */
export default function AdminLayout() {
  return (
    <AdminGuard>
      <Slot />
    </AdminGuard>
  );
}
