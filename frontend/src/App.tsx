import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import Landing       from './pages/Landing';
import Login         from './pages/Login';
import Register      from './pages/Register';
import Dashboard     from './pages/Dashboard';
import Upload        from './pages/Upload';
import Transactions  from './pages/Transactions';
import Recommendations from './pages/Recommendations';
import Rules          from './pages/Rules';
import ProtectedRoute from './components/layout/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/"               element={<Landing />} />
          <Route path="/login"          element={<Login />} />
          <Route path="/register"       element={<Register />} />
          <Route path="/dashboard"      element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/upload"         element={<ProtectedRoute><Upload /></ProtectedRoute>} />
          <Route path="/transactions"   element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
          <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
          <Route path="/rules"           element={<ProtectedRoute><Rules /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
