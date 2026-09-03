import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { I18nProvider } from "@/components/i18n/i18n-provider"
import { AuthProvider } from "@/hooks/use-auth"
import { AppLayout } from "@/components/layout/AppLayout"
import { ProtectedRoute } from "@/components/layout/ProtectedRoute"

import { CanchasPage } from "@/pages/CanchasPage"
import { CanchaDetailPage } from "@/pages/CanchaDetailPage"
import { MisReservasPage } from "@/pages/MisReservasPage"
import { LoginPage } from "@/pages/LoginPage"
import { RegistroPage } from "@/pages/RegistroPage"
import { ConfiguracionPage } from "@/pages/ConfiguracionPage"
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage"
import { AdminCanchasPage } from "@/pages/admin/AdminCanchasPage"
import { AdminReservasPage } from "@/pages/admin/AdminReservasPage"

export function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              {/* Rutas Públicas */}
              <Route path="/" element={<Navigate to="/canchas" replace />} />
              <Route path="/canchas" element={<CanchasPage />} />
              <Route path="/canchas/:id" element={<CanchaDetailPage />} />

              {/* Rutas de Autenticación */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/registro" element={<RegistroPage />} />

              {/* Ruta Cliente (Protegida por sesión activa) */}
              <Route
                path="/mis-reservas"
                element={
                  <ProtectedRoute requiredRole="cliente">
                    <MisReservasPage />
                  </ProtectedRoute>
                }
              />

              {/* Rutas Administrador (Protegidas por rol admin) */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/canchas"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminCanchasPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/reservas"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminReservasPage />
                  </ProtectedRoute>
                }
              />

              {/* Configuración */}
              <Route path="/configuracion" element={<ConfiguracionPage />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/canchas" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  )
}

export default App
