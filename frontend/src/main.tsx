import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/index.css'
import { initializeMockUsers } from './auth/auth'

// Инициализируем моковых пользователей при запуске приложения
// Делаем это асинхронно, чтобы не блокировать рендеринг
setTimeout(() => {
  try {
    initializeMockUsers()
  } catch (error) {
    console.error('Ошибка инициализации при запуске:', error)
  }
}, 100)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)
