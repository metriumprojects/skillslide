import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import App from './App.jsx'
import { Provider } from 'react-redux'
import { store } from './redux/store.js'
import "react-toastify/dist/ReactToastify.css";
import { CurrencyProvider } from './currency/CurrencyContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <CurrencyProvider>
          <App />
        </CurrencyProvider>
      </Provider>
    </ErrorBoundary>
  </StrictMode>,
)


