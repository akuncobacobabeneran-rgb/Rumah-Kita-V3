import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useFamilyStore } from './stores/useFamilyStore';
import { AppLayout } from './components/layout/AppLayout';
import { AuthPage } from './pages/auth/AuthPage';
import { HomePage } from './pages/home/HomePage';
import { FinancePage } from './pages/finance/FinancePage';
import { BudgetCategoryPage } from './pages/finance/BudgetCategoryPage';
import { WalletTransferPage } from './pages/finance/WalletTransferPage';
import { DebtPage } from './pages/finance/DebtPage';
import { GoalPage } from './pages/finance/GoalPage';
import { AssetPage } from './pages/finance/AssetPage';
import { AllocationPage } from './pages/finance/AllocationPage';
import { RecurringPage } from './pages/finance/RecurringPage';
import { ReportPage } from './pages/finance/ReportPage';
import { CalendarPage } from './pages/calendar/CalendarPage';
import { MaintenancePage } from './pages/calendar/MaintenancePage';
import { CouplePage } from './pages/couple/CouplePage';
import { JournalPage } from './pages/journal/JournalPage';
import { MorePage } from './pages/settings/MorePage';
import { HelpFaqPage } from './pages/settings/HelpFaqPage';
import { DocumentVaultPage } from './pages/documents/DocumentVaultPage';
import { ShoppingMealPage } from './pages/calendar/ShoppingMealPage';
import { FamilyLoadingScreen } from './components/ui/FamilyLoadingScreen';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const profile = useFamilyStore((s) => s.profile);
  const family = useFamilyStore((s) => s.family);
  const isLoading = useFamilyStore((s) => s.isLoading);

  if (isLoading) {
    return (
      <FamilyLoadingScreen
        title={family?.name || (profile?.full_name ? `Keluarga ${profile.full_name}` : 'Ruang Keluarga RumahKita')}
        subtitle="Menyiapkan data keuangan, impian, dan agenda bersama..."
      />
    );
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const profile = useFamilyStore((s) => s.profile);
  const isLoading = useFamilyStore((s) => s.isLoading);
  const isLoginAnimating = useFamilyStore((s) => s.isLoginAnimating);

  if (isLoading && !isLoginAnimating) {
    return (
      <FamilyLoadingScreen
        title="RumahKita"
        subtitle="Memeriksa sesi ruang keluarga..."
      />
    );
  }

  if (profile && !isLoginAnimating) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const initializeSession = useFamilyStore((s) => s.initializeSession);

  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <AuthPage />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="keuangan" element={<FinancePage />} />
          <Route path="keuangan/anggaran" element={<BudgetCategoryPage />} />
          <Route path="keuangan/wallet" element={<WalletTransferPage />} />
          <Route path="keuangan/utang" element={<DebtPage />} />
          <Route path="keuangan/goal" element={<GoalPage />} />
          <Route path="keuangan/aset" element={<AssetPage />} />
          <Route path="keuangan/alokasi" element={<AllocationPage />} />
          <Route path="keuangan/rutin" element={<RecurringPage />} />
          <Route path="keuangan/laporan" element={<ReportPage />} />
          <Route path="kalender" element={<CalendarPage />} />
          <Route path="belanja" element={<ShoppingMealPage />} />
          <Route path="maintenance" element={<MaintenancePage />} />
          <Route path="berdua" element={<CouplePage />} />
          <Route path="jurnal" element={<JournalPage />} />
          <Route path="dokumen" element={<DocumentVaultPage />} />
          <Route path="lainnya" element={<MorePage />} />
          <Route path="lainnya/dokumen" element={<DocumentVaultPage />} />
          <Route path="bantuan" element={<HelpFaqPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
