const request = require('supertest');
const app = require('../../src/app');

describe('gateway - integração', () => {
  test('deve encaminhar a requisição para AUTH e registrar um usuário com sucesso.', async () => {
    const newUser = {
      name: 'João Carlos',
      email: 'joao@carlos.com',
      password: 'senha123',
      confirmPassword: 'senha123',
      cpf: '12345678900',
      accountType: 'PERSON',
      birthDate: '2005-06-15',
      termsAccepted: true,
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(newUser);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      message: 'Usuário registrado. Verifique seu e-mail.',
    });
  });
  test('deve encaminhar a requisição para AUTH e retornar a resposta de erro no login.', async () => {
    const response = await request(app)
      .post('/api/auth/start-login')
      .send({ email: 'joao@carlos.com', password: 'senha123' });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      message: 'Verifique seu e-mail antes de realizar o login.',
    });
  });
  test('deve rejeitar acesso à rota protegida sem token.', async () => {
    const response = await request(app).post('/api/user/person/me');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: 'Token de autenticação ausente ou mal formatado.',
    });
  });
});
