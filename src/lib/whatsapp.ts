import { linkWhatsApp } from '@/config/site';
import { MENSAGENS_WHATSAPP } from '@/content/mensagens-whatsapp';

/**
 * O texto que já vai escrito quando o visitante abre o WhatsApp.
 *
 * Antes era sempre o mesmo — "quero falar sobre um imóvel" — e chegava assim
 * para o corretor: vinte e duas páginas de imóvel, uma mensagem só, e a
 * primeira pergunta do atendimento tinha que ser "qual deles?". Agora a
 * mensagem nasce com o nome do empreendimento, e quem converteu no Tellure
 * chega dizendo Tellure.
 *
 * O texto sai da voz do cliente, não da nossa: é ele que aperta enviar.
 */

/** Página de imóvel, antes de preencher o formulário. */
export function mensagemDoImovel(nome: string, regiao: string): string {
  return `Olá! Vim pelo site e quero falar sobre o ${nome}, no ${regiao}.`;
}

/**
 * Depois do lead: o primeiro nome economiza a apresentação e casa a conversa
 * com o registro que acabou de entrar no CRM.
 *
 * "Meu nome é Maria", e não "aqui é a Maria": não dá para deduzir o artigo a
 * partir do nome, e errar o gênero de quem acabou de deixar o telefone é um
 * jeito ruim de começar o atendimento.
 */
export function mensagemAposLead({
  nome,
  imovel,
  comBook,
}: {
  nome?: string;
  imovel?: string;
  comBook?: boolean;
}): string {
  const eu = nome?.trim().split(/\s+/)[0];
  const abertura = eu ? `Olá! Meu nome é ${eu}.` : 'Olá!';

  if (comBook && imovel) {
    return `${abertura} Acabei de baixar o book do ${imovel} pelo site e quero falar sobre o imóvel.`;
  }
  const alvo = imovel ? `o ${imovel}` : 'os imóveis';
  return `${abertura} Acabei de deixar meus dados no site e quero falar sobre ${alvo}.`;
}

/**
 * Descobre o imóvel pela URL.
 *
 * A barra de ação do mobile e o cabeçalho vivem no layout, que no App Router
 * não enxerga os parâmetros da rota filha. Ler o caminho é o que permite que o
 * botão de WhatsApp deles saiba em que imóvel o visitante está — sem carregar
 * o catálogo inteiro para o navegador, que é o que aconteceria se eles
 * importassem `empreendimentos.ts`.
 */
export function linkWhatsAppDoCaminho(caminho: string): string {
  const partes = caminho.split('/').filter(Boolean);
  const mensagem = partes.length === 3 ? MENSAGENS_WHATSAPP[partes[2]!] : undefined;
  return linkWhatsApp(mensagem);
}
