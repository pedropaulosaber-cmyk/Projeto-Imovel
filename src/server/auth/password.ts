import 'server-only';

import { hash, verify } from '@node-rs/argon2';

/**
 * Hash de senha
 * =============
 *
 * ## Por que argon2id e não bcrypt
 *
 * bcrypt custa CPU. argon2id custa CPU **e memória**, e é a memória que
 * quebra o ataque moderno: uma GPU tem milhares de núcleos e pouca memória por
 * núcleo, então exigir 19 MiB por tentativa derruba a vantagem do atacante em
 * ordens de grandeza. bcrypt também trunca em 72 bytes, silenciosamente — uma
 * senha longa e uma senha longa com sufixo diferente podem colidir.
 *
 * Os parâmetros abaixo são os do RFC 9106 (perfil de segunda escolha), que é
 * o consenso atual do OWASP para uso interativo: forte o bastante para
 * inviabilizar força bruta offline, rápido o bastante (~50ms) para não virar
 * vetor de negação de serviço no próprio login.
 */
const PARAMS = {
  memoryCost: 19_456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
} as const;

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, PARAMS);
}

/**
 * Confere a senha.
 *
 * Devolve `false` em vez de propagar quando o hash é inválido ou corrompido.
 * Um hash malformado no banco não deve derrubar o login com erro 500 — deve
 * negar acesso, que é o resultado seguro.
 */
export async function verifyPassword(hashed: string, plain: string): Promise<boolean> {
  try {
    return await verify(hashed, plain);
  } catch {
    return false;
  }
}

/**
 * Trabalho equivalente ao de uma verificação real.
 *
 * Chamado quando o e-mail não existe. Sem isto, "e-mail inexistente" responde
 * em 2ms e "senha errada" em 50ms — e essa diferença é um oráculo que permite
 * enumerar quem tem conta na plataforma sem nunca acertar uma senha.
 *
 * O hash é de uma senha aleatória gerada no boot: não corresponde a nada e
 * nunca precisa corresponder.
 */
const DUMMY_HASH = hash('senha-que-nao-existe-em-lugar-nenhum', PARAMS);

export async function equalizeTiming(): Promise<void> {
  try {
    await verify(await DUMMY_HASH, 'tentativa');
  } catch {
    // O resultado não importa: o que se quer é o tempo gasto.
  }
}
