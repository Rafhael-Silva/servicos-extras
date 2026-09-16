import { useEffect, useState } from 'react';
import { me } from '../../features/auth/services/authService';
import {
  myProfilePerson,
  myProfileCompany,
} from '../../features/profile/profileService';
import PageSelector from '../../app/router/PageSelector';

function ProfilePage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    async function loadProfile() {
      const userData = await me();

      if (userData.accountType === 'PERSON') {
        const profilePerson = await myProfilePerson();

        setData({
          accountType: userData.accountType,
          personData: {
            ...userData,
            ...profilePerson,
          },
          companyData: null,
        });
      } else if (userData.accountType === 'COMPANY') {
        const profileCompany = await myProfileCompany();
        setData({
          accountType: userData.accountType,
          companyData: {
            ...userData,
            ...profileCompany,
          },
          personData: null,
        });
      } else {
        throw new Error('Tipo de conta inválido.');
      }
    }

    loadProfile();
  }, []);

  if (!data) {
    return null;
  }

  const { accountType, personData, companyData } = data;

  return (
    <PageSelector
      mobilePage={
        <MyProfileMobile
          accountType={accountType}
          personData={personData}
          companyData={companyData}
        />
      }
      desktopPage={
        <MyProfileDesktop
          accountType={accountType}
          personData={personData}
          companyData={companyData}
        />
      }
    />
  );
}

export default ProfilePage;
