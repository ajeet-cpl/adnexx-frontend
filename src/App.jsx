import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import AppRoutes from '@/routes';
import useTheme from '@/hooks/useTheme';

function ThemedApp() {
  useTheme(); // applies data-theme to <html> on every page including login
  return <AppRoutes />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemedApp />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

