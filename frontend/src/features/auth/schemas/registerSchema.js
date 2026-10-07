import { z } from 'zod';
import normalizeName from '../../../utils/normalize/name';
import normalizeEmail from '../../../utils/normalize/email';
import normalizeCpf from '../../../utils/normalize/cpf';
import normalizeCnpj from '../../../utils/normalize/cnpj';
import validateCpf from '../../../utils/validate/cpf';
import validateCnpj from '../../../utils/validate/cnpj';

const registerSchema = z
  .object({
    name: z
      .string({ message: 'O campo nome é obrigatório.' })
      .transform((name) => normalizeName(name))
      .pipe(
        z.string().refine(
          (name) => {
            const parts = name.split(' ');

            if (parts.length < 2) {
              return false;
            }

            const firstName = parts[0];
            const lastName = parts[parts.length - 1];

            return firstName.length >= 2 && lastName.length >= 2;
          },
          { message: 'Informe seu nome completo.' },
        ),
      ),
    email: z
      .string({ message: 'O campo e-mail é obrigatório.' })
      .transform((email) => normalizeEmail(email))
      .pipe(z.email({ message: 'O e-mail digitado é inválido.' })),
    accountType: z.enum(['PERSON', 'COMPANY'], {
      message: 'Selecione entre Pessoa Física ou Empresa',
    }),
    cpf: z
      .string()
      .transform((cpf) => normalizeCpf(cpf))
      .refine((cpf) => !cpf || validateCpf(cpf), {
        message: 'O CPF digitado é inválido.',
      })
      .optional(),
    cnpj: z
      .string()
      .transform((cnpj) => normalizeCnpj(cnpj))
      .refine((cnpj) => !cnpj || validateCnpj(cnpj), {
        message: 'O CNPJ digitado é inválido.',
      })
      .optional(),
    password: z
      .string({ message: 'O campo senha é obrigatório.' })
      .min(6, { message: 'O campo senha deve ter no mínimo 6 caracteres' })
      .regex(/(?=.*[A-Z])/, {
        message: 'A senha deve conter pelo menos uma letra maiúscula.',
      })
      .regex(/(?=.*[a-z])/, {
        message: 'A senha deve conter pelo menos uma letra minúscula.',
      })
      .regex(/(?=.*\d)/, {
        message: 'A senha deve conter pelo menos um número.',
      }),
    confirmPassword: z.string({
      message: 'O campo confirmação de senha é obrigatório.',
    }),
    birthDate: z
      .string({ message: 'O campo data de nascimento é obrigatório.' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: 'Informe uma data com formato válido (AAAA-MM-DD).',
      })
      .refine(
        (birthDate) => {
          const date = new Date(`${birthDate}T00:00:00`);
          return !isNaN(date.getTime());
        },
        { message: 'Informe uma data de nascimento válida.' },
      )
      .refine(
        (birthDate) => {
          const date = new Date(`${birthDate}T00:00:00`);
          const now = new Date();

          return date < now;
        },
        { message: 'A data de nascimento deve ser uma data no passado.' },
      ),
    termsAccepted: z.literal(true, {
      message: 'Você deve aceitar os termos para continuar.',
    }),
  })
  .refine((dados) => dados.password === dados.confirmPassword, {
    message: 'A confirmação da senha não coincide com a senha informada.',
    path: ['confirmPassword'],
  })
  .superRefine((dados, ctx) => {
    if (dados.accountType === 'PERSON' && !dados.cpf) {
      ctx.addIssue({
        code: 'custom',
        message: 'O campo CPF é obrigatório.',
        path: ['cpf'],
      });
    }
    if (dados.accountType === 'COMPANY' && !dados.cnpj) {
      ctx.addIssue({
        code: 'custom',
        message: 'O campo CNPJ é obrigatório.',
        path: ['cnpj'],
      });
    }
  });

export default registerSchema;
