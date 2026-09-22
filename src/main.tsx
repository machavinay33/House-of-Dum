import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App';
import { AuthProvider } from '@/hooks/useAuth';
import { CartProvider } from '@/hooks/useCart';
import { SettingsProvider } from '@/hooks/useSettings';
import { ToastProvider } from '@/hooks/useToast';
import './index.css';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <BrowserRouter>
      <SettingsProvider>
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </SettingsProvider>
    </BrowserRouter>
  </StrictMode>,
);
