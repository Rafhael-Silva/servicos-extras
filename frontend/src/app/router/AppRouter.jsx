import { BrowserRouter, Routes, Route } from 'react-router';
import PageSelector from './PageSelector';
import HomeMobile from '../../pages/Home/HomeMobile';
import HomeDesktop from '../../pages/Home/HomeDesktop';
import AboutMobile from '../../pages/About/AboutMobile';
import ProtectedRoute from './ProtectedRoute';
import ProfilePage from '../../pages/Profile/ProfilePage';

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/*<Route
          path="/register"
          element={
            <PageSelector
              mobilePage={<RegisterMobile />}
              desktopPage={<RegisterDesktop />}
            />
          }
        />
        <Route
          path="/verify-code"
          element={
            <PageSelector
              mobilePage={<VerifyCodeMobile />}
              desktopPage={<VerifyCodeDesktop />}
            />
          }
        />*/}
        <Route
          path="/home"
          element={
            <PageSelector
              mobilePage={<HomeMobile />}
              desktopPage={<HomeDesktop />}
            />
          }
        />
        <Route
          path="/about"
          element={<PageSelector mobilePage={<AboutMobile />} />}
        />
        {/* <Route
          path="/forgot-password"
          element={
            <PageSelector
              mobilePage={<ForgotPasswordMobile />}
              desktopPage={<ForgotPasswordDesktop />}
            />
          }
        />
        <Route
          path="/reset-password"
          element={
            <PageSelector
              mobilePage={<ResetPasswordMobile />}
              desktopPage={<ResetPasswordDesktop />}
            />
          }
        />
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <PageSelector
                mobilePage={<ChangePasswordMobile />}
                desktopPage={<ChangePasswordDesktop />}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/create"
          element={
            <ProtectedRoute>
              <PageSelector
                mobilePage={<CreateProfileMobile />}
                desktopPage={<CreateProfileDesktop />}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <ProtectedRoute>
              <PageSelector
                mobilePage={<UpdateProfileMobile />}
                desktopPage={<UpdateProfileDesktop />}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:id"
          element={
            <ProtectedRoute>
              <PageSelector
                mobilePage={<PublicProfileMobile />}
                desktopPage={<PublicProfileDesktop />}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/curriculum/create"
          element={
            <ProtectedRoute>
              <PageSelector
                mobilePage={<CreateCurriculumMobile />}
                desktopPage={<CreateCurriculumDesktop />}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/curriculum/edit"
          element={
            <ProtectedRoute>
              <PageSelector
                mobilePage={<UpdateCurriculumMobile />}
                desktopPage={<UpdateCurriculumDesktop />}
              />
            </ProtectedRoute>
          }
        />*/}
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
