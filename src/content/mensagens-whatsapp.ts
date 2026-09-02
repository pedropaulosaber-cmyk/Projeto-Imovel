/**
 * A mensagem de WhatsApp de cada imóvel, indexada pelo slug.
 *
 * Mora num módulo próprio porque quem lê é componente de cliente — a barra de
 * ação do mobile e o cabeçalho descobrem o imóvel pela URL. Importar
 * `empreendimentos.ts` num componente de cliente mandaria as 22 fichas
 * inteiras para o navegador só para montar uma frase.
 *
 * A tabela é derivada do catálogo, e a invariante em `empreendimentos.ts`
 * recalcula cada linha na carga do módulo: renomeou um imóvel, mudou de região
 * ou publicou um novo sem passar por aqui, o build quebra.
 */
export const MENSAGENS_WHATSAPP: Record<string, string> = {
  'opus-ybate': 'Olá! Vim pelo site e quero falar sobre o Opus Ybaté, no Setor Serrinha.',
  'opus-nido': 'Olá! Vim pelo site e quero falar sobre o Opus Nido, no Setor Serrinha.',
  'opus-tellure': 'Olá! Vim pelo site e quero falar sobre o Opus Tellure, no Setor Serrinha.',
  'cidade-ybiti-home':
    'Olá! Vim pelo site e quero falar sobre o Cidade Ybiti Home, no Setor Serrinha.',
  'senda-by-palme': 'Olá! Vim pelo site e quero falar sobre o Senda By Palme, no Setor Serrinha.',
  'casamerica-parque-cascavel':
    'Olá! Vim pelo site e quero falar sobre o Casamérica Parque Cascavel, no Parque Amazônia.',
  'una-areiao': 'Olá! Vim pelo site e quero falar sobre o Una Areião, no Setor Pedro Ludovico.',
  'entreverdes-residencial':
    'Olá! Vim pelo site e quero falar sobre o EntreVerdes Residencial, no Setor Pedro Ludovico.',
  bliss: 'Olá! Vim pelo site e quero falar sobre o Bliss, no Setor Serrinha.',
  'opus-ayra': 'Olá! Vim pelo site e quero falar sobre o Opus Ayra, no Setor Serrinha.',
  'urbani-vista-home':
    'Olá! Vim pelo site e quero falar sobre o Urbani Vista Home, no Setor Pedro Ludovico.',
  serrano: 'Olá! Vim pelo site e quero falar sobre o Serrano, no Setor Serrinha.',
  'alameda-areiao':
    'Olá! Vim pelo site e quero falar sobre o Alameda Areião, no Setor Pedro Ludovico.',
  'soft-pedro-ludovico':
    'Olá! Vim pelo site e quero falar sobre o Soft Pedro Ludovico, no Setor Pedro Ludovico.',
  'residencial-viverde-areiao':
    'Olá! Vim pelo site e quero falar sobre o Residencial Viverde Areião, no Setor Pedro Ludovico.',
  'fr-jardim-areiao':
    'Olá! Vim pelo site e quero falar sobre o FR. Jardim Areião, no Setor Pedro Ludovico.',
  'smart-parque-areiao':
    'Olá! Vim pelo site e quero falar sobre o Smart Parque Areião, no Setor Pedro Ludovico.',
  paradizzo: 'Olá! Vim pelo site e quero falar sobre o Paradizzo, no Parque Amazônia.',
  'loc-serrinha': 'Olá! Vim pelo site e quero falar sobre o LOC Serrinha, no Setor Serrinha.',
  'residencial-lago-areiao':
    'Olá! Vim pelo site e quero falar sobre o Residencial Lago Areião, no Setor Pedro Ludovico.',
  'opus-gyro-o2': 'Olá! Vim pelo site e quero falar sobre o Opus Gyro O2, no Setor Serrinha.',
  blume: 'Olá! Vim pelo site e quero falar sobre o Blume, no Setor Serrinha.',
};
