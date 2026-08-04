const { age } = require('../../../src/utils');

//Teste que verifica se usuário é de maior ou de menor.
describe('age - isUserUnderAge', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-30'));
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  test('deve retornar true para usuário menor de 18 anos.', () => {
    const birth = '2009-07-30';
    const birthDate = new Date(birth);

    expect(age.isUserUnderage(birthDate)).toBe(true);
  });
  test('deve retornar false para usuário com 18 anos ou mais.', () => {
    const birth = '2008-07-30';
    const birthDate = new Date(birth);

    expect(age.isUserUnderage(birthDate)).toBe(false);
  });
  test('deve gerar erro caso o parâmetro recebido não seja uma data valida.', () => {
    const birth = 'aaaa-mm-dd';
    const birthDate = new Date(birth);

    expect(() => age.isUserUnderage(birthDate)).toThrow('Data inválida.');
  });
});

//Teste que devolve a idade do usuário.
describe('age - calculateAge', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-30'));
  });
  afterEach(() => {
    jest.useRealTimers();
  });
  test('deve retornar 18 para alguém que completou 18 anos este ano.', () => {
    const birth = new Date('2008-07-30');
    const birthDate = new Date(birth);

    expect(age.calculateAge(birthDate)).toBe(18);
  });
  test('deve retornar 17 para alguém que ainda não completou 18 anos este ano.', () => {
    const birth = new Date('2008-08-30');
    const birthDate = new Date(birth);

    expect(age.calculateAge(birthDate)).toBe(17);
  });
  test('deve gerar erro caso o parâmetro recebido não seja uma data valida.', () => {
    const birth = new Date('aaaa-mm-dd');
    const birthDate = new Date(birth);

    expect(() => age.calculateAge(birthDate)).toThrow('Data inválida.');
  });
  test('deve calcular a idade corretamente para nascidos em ano bissexto.', () => {
    jest.setSystemTime(new Date('2026-03-01'));

    const birth = new Date('2008-02-29');
    const birthDate = new Date(birth);

    expect(age.calculateAge(birthDate)).toBe(18);
  });
});
