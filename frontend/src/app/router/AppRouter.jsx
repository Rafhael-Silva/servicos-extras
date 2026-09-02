import { BrowserRouter, Routes, Route } from 'react-router';
import PageSelector from './PageSelector';
import HomePage from '../../pages/Home/HomePage';
import AboutPage from '../../pages/About/AboutPage';

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <PageSelector
              mobilePage={<HomePage />}
              desktopPage={<AboutPage />}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
