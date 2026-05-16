import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';

const Login = () => <div className="p-8 text-center text-2xl">Сторінка Логіну / Реєстрації</div>;
const Board = () => <div className="p-8 text-center text-2xl">Тут буде дошка з питаннями (WebSockets)</div>;
const Dashboard = () => <div className="p-8 text-center text-2xl">Адмін-панель (Мої дошки)</div>;

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