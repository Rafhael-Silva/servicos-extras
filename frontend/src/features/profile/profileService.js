import apiClient from '../../services/apiClient';

async function createProfilePerson({ profileData, addressData }) {
  const response = await apiClient.post('/api/user/person', {
    profileData,
    addressData,
  });

  return {
    address: {
      number: response.data.address.number,
      street: response.data.address.street,
      complement: response.data.address.complement,
      neighborhood: response.data.address.neighborhood,
      city: response.data.address.city,
      state: response.data.address.state,
      zipCode: response.data.address.zipCode,
      personId: response.data.address.personId,
    },
    authUserId: response.data.authUserId,
    phone: response.data.phone,
    bio: response.data.bio,
  };
}

async function uploadPhoto(formData) {
  const response = await apiClient.put('/api/user/person/photo', formData);

  return {
    authUserId: response.data.authUserId,
    photoKey: response.data.photoKey,
  };
}

async function updateProfilePerson({ profileData, addressData }) {
  const response = await apiClient.put('/api/user/person', {
    profileData,
    addressData,
  });

  return {
    address: {
      number: response.data.address.number,
      street: response.data.address.street,
      complement: response.data.address.complement,
      neighborhood: response.data.address.neighborhood,
      city: response.data.address.city,
      state: response.data.address.state,
      zipCode: response.data.address.zipCode,
    },
    authUserId: response.data.authUserId,
    phone: response.data.phone,
    bio: response.data.bio,
  };
}

async function myProfilePerson() {
  const response = await apiClient.get('/api/user/person/me');

  return {
    authUserId: response.data.authUserId,
    phone: response.data.phone,
    photoKey: response.data.photoKey,
    bio: response.data.bio,
    address: {
      number: response.data.address.number,
      street: response.data.address.street,
      complement: response.data.address.complement,
      neighborhood: response.data.address.neighborhood,
      city: response.data.address.city,
      state: response.data.address.state,
      zipCode: response.data.address.zipCode,
      personId: response.data.address.personId,
    },
    curriculum: {
      personId: response.data.curriculum.personId,
      type: response.data.curriculum.type,
      fileKey: response.data.curriculum.fileKey,
      professionalSummary: response.data.curriculum.professionalSummary,
      experiences: response.data.curriculum.experiences,
      educations: response.data.curriculum.educations,
      courses: response.data.curriculum.courses,
      skills: response.data.curriculum.skills,
      observations: response.data.curriculum.observations,
    },
  };
}

async function publicProfilePerson(personId) {
  const response = await apiClient.get(`/api/user/person/${personId}`);

  return {
    photoKey: response.data.photoKey,
    bio: response.data.bio,
    address: {
      neighborhood: response.data.address.neighborhood,
      city: response.data.address.city,
      state: response.data.address.state,
    },
    curriculum: {
      type: response.data.curriculum.type,
      fileKey: response.data.curriculum.fileKey,
      professionalSummary: response.data.curriculum.professionalSummary,
      experiences: response.data.curriculum.experiences,
      educations: response.data.curriculum.educations,
      courses: response.data.curriculum.courses,
      skills: response.data.curriculum.skills,
      observations: response.data.curriculum.observations,
    },
  };
}

async function createProfileCompany({ companyData, addressData }) {
  const response = await apiClient.post('/api/user/company', {
    companyData,
    addressData,
  });

  return {
    address: {
      number: response.data.address.number,
      street: response.data.address.street,
      complement: response.data.address.complement,
      neighborhood: response.data.address.neighborhood,
      city: response.data.address.city,
      state: response.data.address.state,
      zipCode: response.data.address.zipCode,
      companyId: response.data.address.companyId,
    },
    authUserId: response.data.authUserId,
    phone: response.data.phone,
    bio: response.data.bio,
    companyName: response.data.companyName,
  };
}

async function uploadLogo(formData) {
  const response = await apiClient.put('/api/user/company/logo', formData);

  return {
    authUserId: response.data.authUserId,
    logoKey: response.data.logoKey,
  };
}

async function updateProfileCompany({ companyData, addressData }) {
  const response = await apiClient.put('/api/user/company', {
    companyData,
    addressData,
  });

  return {
    address: {
      number: response.data.address.number,
      street: response.data.address.street,
      complement: response.data.address.complement,
      neighborhood: response.data.address.neighborhood,
      city: response.data.address.city,
      state: response.data.address.state,
      zipCode: response.data.address.zipCode,
    },
    phone: response.data.phone,
    bio: response.data.bio,
    companyName: response.data.companyName,
  };
}

async function myProfileCompany() {
  const response = await apiClient.get('/api/user/company/me');

  return {
    authUserId: response.data.authUserId,
    phone: response.data.phone,
    logoKey: response.data.logoKey,
    bio: response.data.bio,
    companyName: response.data.companyName,
    address: {
      number: response.data.address.number,
      street: response.data.address.street,
      complement: response.data.address.complement,
      neighborhood: response.data.address.neighborhood,
      city: response.data.address.city,
      state: response.data.address.state,
      zipCode: response.data.address.zipCode,
      companyId: response.data.address.companyId,
    },
  };
}

async function publicProfileCompany(companyId) {
  const response = await apiClient.get(`/api/user/company/${companyId}`);

  return {
    logoKey: response.data.logoKey,
    bio: response.data.bio,
    companyName: response.data.companyName,
    address: {
      neighborhood: response.data.address.neighborhood,
      city: response.data.address.city,
      state: response.data.address.state,
    },
  };
}

export {
  createProfilePerson,
  uploadPhoto,
  updateProfilePerson,
  myProfilePerson,
  publicProfilePerson,
  createProfileCompany,
  uploadLogo,
  updateProfileCompany,
  myProfileCompany,
  publicProfileCompany,
};
