jest.mock('../../src/config/mail', () => ({
  sendEmail: jest.fn(),
}));

const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/prisma');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../../src/config/mail');
const {
  generateVerificationToken,
  generateRefreshToken,
  generateAccessToken,
} = require('../../src/utils/generateToken');
const { VerificationType, AccountType } = require('@prisma/client');
const AUTH = require('../../src/constants/auth');

const userTest = (overrides = {}) => ({
  name: 'João Carlos',
  email: 'joao@carlos.com',
  password: 'senha123',
  confirmPassword: 'senha123',
  cpf: '12345678900',
  accountType: AccountType.PERSON,
  birthDate: '2005-06-15',
  termsAccepted: true,
  ...overrides,
});

describe('authRoutes - POST/register', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    await prisma.user.deleteMany();

    sendEmail.mockResolvedValue(true);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('deve registrar um usuário PERSON com sucesso.', async () => {
    const newUser = userTest();

    const response = await request(app)
      .post('/api/auth/register')
      .send(newUser);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      message: 'Usuário registrado. Verifique seu e-mail.',
    });
  });
  test('deve retornar 400 quando usuário não tiver idade para cadastro.', async () => {
    const newUser = userTest({
      birthDate: '2009-07-21',
    });

    const response = await request(app)
      .post('/api/auth/register')
      .send(newUser);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Você deve ter 18 anos ou mais para se cadastrar.',
    });
  });
  test('deve retornar 409 quando o e-mail já estiver cadastrado.', async () => {
    const firstUser = userTest();

    await request(app).post('/api/auth/register').send(firstUser);

    const secondUser = userTest({
      cpf: '45632178909',
    });

    const response = await request(app)
      .post('/api/auth/register')
      .send(secondUser);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ message: 'E-mail já cadastrado.' });
  });
  test('deve retornar 409 quando o CPF já estiver cadastrado.', async () => {
    const firstUser = userTest();

    await request(app).post('/api/auth/register').send(firstUser);

    const secondUser = userTest({
      email: 'outro@email.com',
    });

    const response = await request(app)
      .post('/api/auth/register')
      .send(secondUser);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ message: 'CPF já cadastrado.' });
  });
  test('deve retornar 409 quando o CNPJ já estiver cadastrado.', async () => {
    const firstUser = userTest({
      accountType: AccountType.COMPANY,
      cnpj: '12345678901234',
      cpf: undefined,
    });

    await request(app).post('/api/auth/register').send(firstUser);

    const secondUser = userTest({
      email: 'outro@email.com',
      accountType: AccountType.COMPANY,
      cnpj: '12345678901234',
      cpf: undefined,
    });

    const response = await request(app)
      .post('/api/auth/register')
      .send(secondUser);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ message: 'CNPJ já cadastrado.' });
  });
  test('deve retornar 400 quando COMPANY não informar CNPJ.', async () => {
    const newUser = userTest({
      accountType: AccountType.COMPANY,
      cnpj: undefined,
      cpf: undefined,
    });

    const response = await request(app)
      .post('/api/auth/register')
      .send(newUser);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      errors: ['CNPJ é obrigatório para empresas.'],
      message: 'Erro de validação nos dados enviados.',
      type: 'ValidationError',
    });
  });
  test('deve retornar 400 quando COMPANY informar CPF.', async () => {
    const newUser = userTest({
      accountType: AccountType.COMPANY,
    });

    const response = await request(app)
      .post('/api/auth/register')
      .send(newUser);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      errors: [
        'CPF não é permitido para empresas.',
        'CNPJ é obrigatório para empresas.',
      ],
      message: 'Erro de validação nos dados enviados.',
      type: 'ValidationError',
    });
  });
  test('deve retornar 400 quando PERSON informar CNPJ.', async () => {
    const newUser = userTest({
      cnpj: '12345678901234',
      cpf: undefined,
    });

    const response = await request(app)
      .post('/api/auth/register')
      .send(newUser);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      errors: [
        'CPF é obrigatório para pessoas físicas.',
        'CNPJ não é permitido para pessoas físicas.',
      ],
      message: 'Erro de validação nos dados enviados.',
      type: 'ValidationError',
    });
  });
  test('deve retornar 400 quando usuário informar senhas diferentes.', async () => {
    const newUser = userTest({
      confirmPassword: 'senha12',
    });

    const response = await request(app)
      .post('/api/auth/register')
      .send(newUser);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      errors: ['As senhas não coincidem.'],
      message: 'Erro de validação nos dados enviados.',
      type: 'ValidationError',
    });
  });
  test('deve retornar 400 quando a senha tiver menos de 6 caracteres.', async () => {
    const newUser = userTest({
      password: 'senha',
      confirmPassword: 'senha',
    });

    const response = await request(app)
      .post('/api/auth/register')
      .send(newUser);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      errors: ['A senha deve ter no mínimo 6 caracteres.'],
      message: 'Erro de validação nos dados enviados.',
      type: 'ValidationError',
    });
  });
  test('deve retornar 400 quando os termos não forem aceitos.', async () => {
    const newUser = userTest({
      termsAccepted: false,
    });

    const response = await request(app)
      .post('/api/auth/register')
      .send(newUser);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      errors: ['Você deve aceitar os termos para continuar.'],
      message: 'Erro de validação nos dados enviados.',
      type: 'ValidationError',
    });
  });
  test('deve retornar 400 quando accountType for inválido.', async () => {
    const newUser = userTest({
      accountType: 'CANDIDATO',
    });

    const response = await request(app)
      .post('/api/auth/register')
      .send(newUser);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      errors: [
        'O tipo da conta é inválido.',
        'CPF não é permitido para empresas.',
      ],
      message: 'Erro de validação nos dados enviados.',
      type: 'ValidationError',
    });
  });
});

describe('authRoutes - POST/verify-email', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    await prisma.user.deleteMany();

    sendEmail.mockResolvedValue(true);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('deve verificar e-mail e fazer login com sucesso', async () => {
    const newUser = await prisma.user.create({
      data: {
        name: 'João Carlos',
        email: 'joao@carlos.com',
        passwordHash: 'hash_fake',
        cpf: '12345678900',
        accountType: AccountType.PERSON,
        birthDate: new Date('2005-06-15'),
        termsAccepted: true,
        emailVerified: false,
      },
    });

    const verificationToken = generateVerificationToken({
      userId: newUser.id,
      type: VerificationType.EMAIL_VERIFICATION,
    });

    const response = await request(app)
      .post('/api/auth/verify-email')
      .send({ verificationToken });

    const updatedUser = await prisma.user.findUnique({
      where: { id: newUser.id },
    });

    const refreshToken = await prisma.refreshToken.findFirst({
      where: { userId: newUser.id },
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe(
      'E-mail verificado e login realizado com sucesso.',
    );
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.user).toMatchObject({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      accountType: newUser.accountType,
    });
    expect(response.headers['set-cookie']).toBeDefined();
    expect(response.headers['set-cookie'][0]).toContain('refreshToken=');
    expect(updatedUser.emailVerified).toBe(true);
    expect(refreshToken).not.toBeNull();
  });
  test('deve retornar 400 quando token não for informado.', async () => {
    const response = await request(app).post('/api/auth/verify-email').send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      errors: ['Token é obrigatório.'],
      message: 'Erro de validação nos dados enviados.',
      type: 'ValidationError',
    });
  });
  test('deve retornar 401 quando token for inválido.', async () => {
    const verificationToken = 'token_inválido';

    const response = await request(app)
      .post('/api/auth/verify-email')
      .send({ verificationToken });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Token inválido ou expirado.' });
  });
  test('deve retornar 400 quando tipo de token for inválido.', async () => {
    const newUser = await prisma.user.create({
      data: {
        name: 'João Carlos',
        email: 'joao@carlos.com',
        passwordHash: 'hash_fake',
        cpf: '12345678900',
        accountType: AccountType.PERSON,
        birthDate: new Date('2005-06-15'),
        termsAccepted: true,
        emailVerified: false,
      },
    });

    const verificationToken = generateVerificationToken({
      userId: newUser.id,
      type: VerificationType.PASSWORD_RESET,
    });

    const response = await request(app)
      .post('/api/auth/verify-email')
      .send({ verificationToken });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Tipo de verificação inválido.',
    });
  });
});

describe('authRoutes - POST/resend-code', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    await prisma.user.deleteMany();

    sendEmail.mockResolvedValue(true);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('deve reenviar o código com sucesso.', async () => {
    const newUser = await prisma.user.create({
      data: {
        name: 'João',
        email: 'joao@example.com',
        cpf: '12345678900',
        passwordHash: 'hash_fake',
        accountType: AccountType.PERSON,
        emailVerified: true,
        birthDate: new Date('2000-05-15'),
        termsAccepted: true,
      },
    });

    const response = await request(app)
      .post('/api/auth/resend-code')
      .send({ email: newUser.email, type: VerificationType.LOGIN });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: 'Código reenviado. Verifique seu e-mail.',
    });
  });
  test('deve retornar 400 quando algum parâmetro não for informado.', async () => {
    const response = await request(app)
      .post('/api/auth/resend-code')
      .send({ email: 'joao@example.com' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      errors: ['Tipo de verificação é obrigatório.'],
      message: 'Erro de validação nos dados enviados.',
      type: 'ValidationError',
    });
  });
  test('deve retornar 404 caso usuário não seja encontrado.', async () => {
    const response = await request(app)
      .post('/api/auth/resend-code')
      .send({ email: 'inexistente@email.com', type: VerificationType.LOGIN });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Usuário não encontrado.' });
  });
});

describe('authRoutes - POST/verify-code', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('deve verificar o código com sucesso.', async () => {
    const code = '123456';
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + AUTH.VERIFICATION_CODE_EXPIRES_MS,
    );

    const user = await prisma.user.create({
      data: {
        name: 'João Carlos',
        email: 'joao@carlos.com',
        passwordHash: 'hash_fake',
        cpf: '12345678900',
        accountType: AccountType.PERSON,
        birthDate: new Date('2005-06-15'),
        termsAccepted: true,
        emailVerified: false,
      },
    });

    await prisma.verificationCode.create({
      data: {
        userId: user.id,
        codeHash,
        type: VerificationType.LOGIN,
        expiresAt,
        attempts: 0,
        used: false,
      },
    });

    const response = await request(app)
      .post('/api/auth/verify-code')
      .send({ email: user.email, code, type: VerificationType.LOGIN });

    expect(response.status).toBe(200);
    expect(response.body.verificationToken).toBeDefined();
    expect(response.body.message).toEqual('Código validado com sucesso.');
  });
  test('deve retornar 400 quando algum parâmetro não for informado.', async () => {
    const response = await request(app)
      .post('/api/auth/verify-code')
      .send({ email: 'joao@example.com' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      errors: [
        'Código de verificação é obrigatório.',
        'Tipo de verificação é obrigatório.',
      ],
      message: 'Erro de validação nos dados enviados.',
      type: 'ValidationError',
    });
  });
  test('deve retornar 404 caso usuário não seja encontrado.', async () => {
    const code = '123456';
    const email = 'joao@carlos.com';
    const type = VerificationType.LOGIN;

    const response = await request(app)
      .post('/api/auth/verify-code')
      .send({ email, code, type });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Usuário não encontrado.' });
  });
});

describe('authRoutes - POST/start-login', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    await prisma.user.deleteMany();

    sendEmail.mockResolvedValue(true);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('deve realizar o início do login com sucesso.', async () => {
    const password = 'senha123';
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: 'João',
        email: 'joao@example.com',
        cpf: '12345678900',
        passwordHash,
        emailVerified: true,
        accountType: AccountType.PERSON,
        birthDate: new Date('2000-05-19'),
        isBlocked: false,
        loginAttempts: 0,
        blockExpires: null,
        termsAccepted: true,
      },
    });

    const response = await request(app)
      .post('/api/auth/start-login')
      .send({ email: user.email, password });

    expect(response.status).toBe(200);
    expect(response.body.message).toEqual(
      'Código enviado com sucesso, verifique seu e-mail.',
    );
  });
  test('deve retornar 400 quando algum parâmetro não for informado.', async () => {
    const response = await request(app)
      .post('/api/auth/start-login')
      .send({ email: 'joao@example.com' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      errors: ['A senha é obrigatória.'],
      message: 'Erro de validação nos dados enviados.',
      type: 'ValidationError',
    });
  });
  test('deve retornar 401 para usuário inexistente.', async () => {
    const response = await request(app)
      .post('/api/auth/start-login')
      .send({ email: 'joao@example.com', password: 'sanhaFake' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Credenciais inválidas.' });
  });
  test('deve retornar 403 quando e-mail não estiver verificado.', async () => {
    const user = await prisma.user.create({
      data: {
        name: 'João',
        email: 'joao@example.com',
        cpf: '12345678900',
        passwordHash: 'hash_fake',
        emailVerified: false,
        accountType: AccountType.PERSON,
        birthDate: new Date('2000-05-19'),
        isBlocked: false,
        loginAttempts: 0,
        blockExpires: null,
        termsAccepted: true,
      },
    });

    const response = await request(app)
      .post('/api/auth/start-login')
      .send({ email: user.email, password: 'senhaFake' });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      message: 'Verifique seu e-mail antes de realizar o login.',
    });
  });
});

describe('authRoutes - POST/finalize-login', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('deve finalizar o login com sucesso', async () => {
    const user = await prisma.user.create({
      data: {
        name: 'João',
        email: 'joao@example.com',
        cpf: '12345678900',
        passwordHash: 'hash_fake',
        emailVerified: true,
        accountType: AccountType.PERSON,
        birthDate: new Date('2000-05-19'),
        isBlocked: false,
        loginAttempts: 0,
        blockExpires: null,
        termsAccepted: true,
      },
    });

    const verificationToken = generateVerificationToken({
      userId: user.id,
      type: VerificationType.LOGIN,
    });

    const response = await request(app)
      .post('/api/auth/finalize-login')
      .send({ verificationToken });

    expect(response.status).toBe(200);
    expect(response.body.message).toEqual('Login realizado com sucesso.');
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.user.id).toBe(user.id);
    expect(response.body.user.name).toBe(user.name);
    expect(response.body.user.email).toBe(user.email);
    expect(response.body.user.accountType).toBe(user.accountType);
    expect(response.headers['set-cookie']).toBeDefined();
    expect(response.headers['set-cookie'][0]).toContain('refreshToken=');
  });
  test('deve retornar 400 quando token não for informado.', async () => {
    const response = await request(app)
      .post('/api/auth/finalize-login')
      .send({ verificationToken: undefined });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      errors: ['Token é obrigatório.'],
      message: 'Erro de validação nos dados enviados.',
      type: 'ValidationError',
    });
  });
  test('deve retornar 401 quando token for inválido.', async () => {
    const verificationToken = 'token_fake';

    const response = await request(app)
      .post('/api/auth/finalize-login')
      .send({ verificationToken });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Token inválido ou expirado.' });
  });
  test('deve retornar 404 caso usuário não for encontrado.', async () => {
    const verificationToken = generateVerificationToken({
      userId: 'usuario_inexistente',
      type: VerificationType.LOGIN,
    });

    const response = await request(app)
      .post('/api/auth/finalize-login')
      .send({ verificationToken });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Usuário não encontrado.' });
  });
});

describe('authRoutes - POST/logout', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
    await prisma.revokedToken.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('deve realizar logout com sucesso.', async () => {
    const password = 'senha123';
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: 'João',
        email: 'joao@example.com',
        cpf: '12345678900',
        passwordHash,
        emailVerified: true,
        accountType: AccountType.PERSON,
        birthDate: new Date('2000-05-19'),
        isBlocked: false,
        loginAttempts: 0,
        blockExpires: null,
        termsAccepted: true,
      },
    });

    const accessToken = generateAccessToken({
      id: user.id,
      accountType: user.accountType,
    });
    const refreshToken = generateRefreshToken({ id: user.id });
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + AUTH.REFRESH_TOKEN_EXPIRES_DAYS);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt,
      },
    });

    const response = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', [`refreshToken=${refreshToken}`]);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Logout realizado com sucesso.' });
    expect(response.headers['set-cookie'][0]).toContain('refreshToken=;');
  });
  test('deve retornar 401 quando token estiver mal formatado.', async () => {
    const accessToken = 'token_fake';
    const refreshToken = 'token_fake';

    const response = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `${accessToken}`)
      .set('Cookie', [`refreshToken=${refreshToken}`]);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: 'Token de autenticação ausente ou mal formatado.',
    });
  });
  test('deve retornar 401 quando token for inválido.', async () => {
    const accessToken = undefined;
    const refreshToken = 'token_fake';

    const response = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', [`refreshToken=${refreshToken}`]);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Token inválido.' });
  });
});

describe('authRoutes - POST/refresh-token', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('deve atualizar token com sucesso.', async () => {
    const password = 'senha123';
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: 'João',
        email: 'joao@example.com',
        accountType: AccountType.COMPANY,
        passwordHash,
        cnpj: '12345678901234',
        birthDate: new Date('2000-06-21'),
        emailVerified: true,
        isBlocked: false,
        blockExpires: null,
        loginAttempts: 0,
        termsAccepted: true,
      },
    });

    const refreshToken = generateRefreshToken({ id: user.id });
    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + AUTH.REFRESH_TOKEN_EXPIRES_DAYS);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const response = await request(app)
      .post('/api/auth/refresh-token')
      .set('Cookie', [`refreshToken=${refreshToken}`]);

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.headers['set-cookie']).toBeDefined();
    expect(response.headers['set-cookie'][0]).toContain('refreshToken=');
  });
  test('deve retornar 401 quando token estiver ausente.', async () => {
    const response = await request(app).post('/api/auth/refresh-token');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: 'Refresh token inválido ou não fornecido.',
    });
  });
  test('deve retornar 401 quando token for inválido.', async () => {
    const token = 'token_fake';

    const response = await request(app)
      .post('/api/auth/refresh-token')
      .set('Cookie', [`refreshToken=${token}`]);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: 'Token de atualização inválido ou expirado.',
    });
  });
  test('deve retornar 401 caso token esteja expirado.', async () => {
    const password = 'senha123';
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: 'João',
        email: 'joao@example.com',
        passwordHash,
        accountType: AccountType.PERSON,
        cpf: '12345678901',
        birthDate: new Date('2000-08-21'),
        emailVerified: true,
        isBlocked: false,
        blockExpires: null,
        loginAttempts: 0,
        termsAccepted: true,
      },
    });

    const refreshToken = generateRefreshToken({ id: user.id });
    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    const expiresAt = new Date();
    expiresAt.setTime(expiresAt.getTime() - 2 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const response = await request(app)
      .post('/api/auth/refresh-token')
      .set('Cookie', [`refreshToken=${refreshToken}`]);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: 'Token de atualização inválido ou expirado.',
    });
  });
});

describe('authRoutes - POST/forgot-password', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    await prisma.user.deleteMany();

    sendEmail.mockResolvedValue(true);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('deve solicitar nova senha com sucesso.', async () => {
    const password = 'senha123';
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: 'João',
        email: 'joao@example.com',
        passwordHash,
        accountType: AccountType.PERSON,
        cpf: '12345678901',
        birthDate: new Date('2001-02-25'),
        emailVerified: true,
        isBlocked: false,
        blockExpires: null,
        loginAttempts: 0,
        termsAccepted: true,
      },
    });

    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: user.email });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: 'Se o e-mail existir, um código foi enviado.',
    });
  });
  test('deve retornar 400 caso email não for enviado.', async () => {
    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: undefined });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      errors: ['O e-mail é obrigatório.'],
      message: 'Erro de validação nos dados enviados.',
      type: 'ValidationError',
    });
  });
  test('deve retornar sucesso mesmo quando o usuário não existir.', async () => {
    const email = 'email@fake.com';

    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: 'Se o e-mail existir, um código foi enviado.',
    });
  });
});

describe('authRoutes - POST/reset-password', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('deve alterar a senha com sucesso.', async () => {
    const password = 'senha123';
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: 'João',
        email: 'joao@example.com',
        passwordHash,
        accountType: AccountType.PERSON,
        cpf: '12345678901',
        birthDate: new Date('2000-09-12'),
        emailVerified: true,
        isBlocked: false,
        blockExpires: null,
        loginAttempts: 0,
        termsAccepted: true,
      },
    });

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: 'hash_fake',
        expiresAt: new Date('2026-06-18'),
      },
    });

    const verificationToken = generateVerificationToken({
      userId: user.id,
      type: VerificationType.PASSWORD_RESET,
    });

    const response = await request(app).post('/api/auth/reset-password').send({
      verificationToken,
      newPassword: 'fake123',
      confirmNewPassword: 'fake123',
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    const refreshTokens = await prisma.refreshToken.findMany({
      where: { userId: user.id },
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Senha redefinida com sucesso.' });
    expect(await bcrypt.compare('fake123', updatedUser.passwordHash)).toBe(
      true,
    );
    expect(refreshTokens).toHaveLength(0);
  });
  test('deve retornar 400 quando algum parâmetro não for informado.', async () => {
    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      errors: [
        'Token de redefinição é obrigatório.',
        'A nova senha é obrigatória.',
        'A confirmação da nova senha é obrigatória.',
      ],
      message: 'Erro de validação nos dados enviados.',
      type: 'ValidationError',
    });
  });
  test('deve retornar 400 quando tipo de token for inválido.', async () => {
    const password = 'senha123';
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: 'João',
        email: 'joao@example.com',
        passwordHash,
        accountType: AccountType.PERSON,
        cpf: '12345678901',
        birthDate: new Date('2000-09-12'),
        emailVerified: true,
        isBlocked: false,
        blockExpires: null,
        loginAttempts: 0,
        termsAccepted: true,
      },
    });

    const verificationToken = generateVerificationToken({
      userId: user.id,
      type: VerificationType.LOGIN,
    });

    const response = await request(app).post('/api/auth/reset-password').send({
      verificationToken,
      newPassword: 'fake123',
      confirmNewPassword: 'fake123',
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Tipo de verificação inválido.' });
  });
});

describe('authRoutes - PATCH/change-password', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('deve realizar a alteração da senha com sucesso.', async () => {
    const currentPassword = 'senha123';
    const passwordHash = await bcrypt.hash(currentPassword, 10);

    const user = await prisma.user.create({
      data: {
        name: 'João',
        email: 'jaoao@example.com',
        cpf: '12345678901',
        passwordHash,
        accountType: AccountType.PERSON,
        birthDate: new Date('2000-12-23'),
        emailVerified: true,
        isBlocked: false,
        blockExpires: null,
        loginAttempts: 0,
        termsAccepted: true,
      },
    });

    const accessToken = generateAccessToken({
      id: user.id,
      accountType: user.accountType,
    });
    const refreshToken = generateRefreshToken({ id: user.id });
    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    const now = new Date();

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(now.getTime() + AUTH.REFRESH_TOKEN_EXPIRES_DAYS),
      },
    });

    const response = await request(app)
      .patch('/api/auth/change-password')
      .set('authorization', `Bearer ${accessToken}`)
      .send({
        currentPassword,
        newPassword: 'fake123',
        confirmNewPassword: 'fake123',
      });

    const updated = await prisma.user.findUnique({
      where: { id: user.id },
    });

    const refreshTokens = await prisma.refreshToken.findMany({
      where: { userId: user.id },
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Senha alterada com sucesso.' });
    expect(await bcrypt.compare('fake123', updated.passwordHash)).toBe(true);
    expect(refreshTokens).toHaveLength(0);
  });
  test('deve retornar 401 quando token for inválido.', async () => {
    const currentPassword = 'senha123';
    const accessToken = 'token_fake';
    const response = await request(app)
      .patch('/api/auth/change-password')
      .set('authorization', `Bearer ${accessToken}`)
      .send({
        currentPassword,
        newPassword: 'fake123',
        confirmNewPassword: 'fake123',
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: 'Token inválido.',
    });
  });
  test('deve retornar 400 quando algum parâmetro não for informado.', async () => {
    const currentPassword = 'senha123';
    const passwordHash = await bcrypt.hash(currentPassword, 10);

    const user = await prisma.user.create({
      data: {
        name: 'João',
        email: 'jaoao@example.com',
        cpf: '12345678901',
        passwordHash,
        accountType: AccountType.PERSON,
        birthDate: new Date('2000-12-23'),
        emailVerified: true,
        isBlocked: false,
        blockExpires: null,
        loginAttempts: 0,
        termsAccepted: true,
      },
    });

    const accessToken = generateAccessToken({
      id: user.id,
      accountType: user.accountType,
    });
    const response = await request(app)
      .patch('/api/auth/change-password')
      .set('authorization', `Bearer ${accessToken}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      errors: [
        'A senha atual é obrigatória.',
        'A nova senha é obrigatória.',
        'A confirmação da nova senha é obrigatória.',
      ],
      message: 'Erro de validação nos dados enviados.',
      type: 'ValidationError',
    });
  });
  test('deve retornar 401 quando a senha atual estiver incorreta.', async () => {
    const currentPassword = 'senha123';
    const passwordHash = await bcrypt.hash(currentPassword, 10);

    const user = await prisma.user.create({
      data: {
        name: 'João',
        email: 'jaoao@example.com',
        cpf: '12345678901',
        passwordHash,
        accountType: AccountType.PERSON,
        birthDate: new Date('2000-12-23'),
        emailVerified: true,
        isBlocked: false,
        blockExpires: null,
        loginAttempts: 0,
        termsAccepted: true,
      },
    });

    const accessToken = generateAccessToken({
      id: user.id,
      accountType: user.accountType,
    });
    const response = await request(app)
      .patch('/api/auth/change-password')
      .set('authorization', `Bearer ${accessToken}`)
      .send({
        currentPassword: 'senha',
        newPassword: 'senhafake',
        confirmNewPassword: 'senhafake',
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: 'Senha atual incorreta.',
    });
  });
});

describe('authRoutes - GET/me', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('deve buscar usuário com sucesso.', async () => {
    const password = 'senha123';
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: 'João',
        email: 'joao@example.com',
        passwordHash,
        cpf: '12345678901',
        accountType: AccountType.PERSON,
        birthDate: new Date('2004-09-29'),
        emailVerified: true,
        isBlocked: false,
        blockExpires: null,
        loginAttempts: 0,
        termsAccepted: true,
      },
    });

    const accessToken = generateAccessToken({
      id: user.id,
      accountType: user.accountType,
    });

    const response = await request(app)
      .get('/api/auth/me')
      .set('authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: user.id,
      name: user.name,
      email: user.email,
      accountType: user.accountType,
      userAge: expect.any(Number),
    });
  });
  test('deve retornar 401 quando token for inválido.', async () => {
    const accessToken = 'token_fake';
    const response = await request(app)
      .get('/api/auth/me')
      .set('authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: 'Token inválido.',
    });
  });
  test('deve retornar 401 quando token estiver ausente.', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: 'Token de autenticação ausente ou mal formatado.',
    });
  });
});
