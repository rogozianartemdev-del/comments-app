import { AuthProvider } from './presentation/context/AuthContext';
import { CommentsPage } from './presentation/pages/CommentsPage';

export function App() {
  return (
    <AuthProvider>
      <CommentsPage />
    </AuthProvider>
  );
}