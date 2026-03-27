import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import OfertaEducativa from './pages/OfertaEducativa';
import InstitutionDetail from './pages/InstitutionDetail';
import InstitutionsList from './pages/InstitutionsList';
import VocationalTest from './pages/VocationalTest';
import Comparator from './pages/Comparator';
import AdminImport from './pages/AdminImport';
import InstitutionDashboard from './pages/InstitutionDashboard';
import StudentProfile from './pages/StudentProfile';
import Observatorio from './pages/Observatorio';
import { AuthProvider } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';
import ScrollToTop from './components/ScrollToTop';
import { UIProvider } from './context/UIContext';

const App = () => {
  return (
    <UIProvider>
      <AuthProvider>
        <FavoritesProvider>
          <HashRouter>
            <ScrollToTop />
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/oferta" element={<OfertaEducativa />} />
                <Route path="/instituciones" element={<InstitutionsList />} />
                <Route path="/instituciones/:id" element={<InstitutionDetail />} />
                <Route path="/test" element={<VocationalTest />} />
                <Route path="/comparador" element={<Comparator />} />
                <Route path="/perfil" element={<StudentProfile />} />
                <Route path="/admin" element={<AdminImport />} />
                <Route path="/dashboard" element={<InstitutionDashboard />} />
                <Route path="/observatorio" element={<Observatorio />} />
              </Routes>
            </Layout>
          </HashRouter>
        </FavoritesProvider>
      </AuthProvider>
    </UIProvider>
  );
};

export default App;
