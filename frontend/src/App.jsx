import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Board from './pages/Board';

const Login = () => <div className="p-8 text-center text-2xl text-slate-800 dark:text-white">Сторінка Логіну / Реєстрації</div>;
const Dashboard = () => <div className="p-8 text-center text-2xl text-slate-800 dark:text-white">Адмін-панель (Мої дошки)</div>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="board/:id" element={<Board />} />

          <Route path="admin" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;