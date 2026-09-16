import apiClient from '../../services/apiClient';

async function curriculumUpload(formData) {
  const response = await apiClient.put('/api/user/curriculum/upload', formData);

  return {
    personId: response.data.curriculum.personId,
    type: response.data.curriculum.type,
    fileKey: response.data.curriculum.fileKey,
    professionalSummary: response.data.curriculum.professionalSummary,
    experiences: response.data.curriculum.experiences,
    educations: response.data.curriculum.educations,
    courses: response.data.curriculum.courses,
    skills: response.data.curriculum.skills,
    observations: response.data.curriculum.observations,
  };
}

async function createCurriculum(curriculumData) {
  const response = await apiClient.post('/api/user/curriculum', curriculumData);

  return {
    personId: response.data.curriculum.personId,
    type: response.data.curriculum.type,
    fileKey: response.data.curriculum.fileKey,
    professionalSummary: response.data.curriculum.professionalSummary,
    experiences: response.data.curriculum.experiences,
    educations: response.data.curriculum.educations,
    courses: response.data.curriculum.courses,
    skills: response.data.curriculum.skills,
    observations: response.data.curriculum.observations,
  };
}

async function updateCurriculum(curriculumData) {
  const response = await apiClient.put('/api/user/curriculum', curriculumData);

  return {
    professionalSummary: response.data.curriculum.professionalSummary,
    experiences: response.data.curriculum.experiences,
    educations: response.data.curriculum.educations,
    courses: response.data.curriculum.courses,
    skills: response.data.curriculum.skills,
    observations: response.data.curriculum.observations,
  };
}

export { curriculumUpload, createCurriculum, updateCurriculum };
