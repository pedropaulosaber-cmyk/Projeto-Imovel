'use client';

import Link from 'next/link';
import { useId, useRef, useState } from 'react';

import { linkWhatsApp } from '@/config/site';
import { rotas } from '@/lib/rotas';

type Variante = 'escuro' | 'claro';

interface Props {
  variante?: Variante;
  /** Slug do empreendimento, quando o formulário está na página de um imóvel. */
  empreendimentoSlug?: string;
  /** Tipologias oferecidas no select — só na página de imóvel. */
  tipologias?: string[];
  /** O formulário claro (página de imóvel) também pede e-mail. */
  pedirEmail?: boolean;
  rotuloBotao?: string;
}

/** Lê os UTMs e os cookies do Meta no cliente, para atribuição da CAPI. */
function contextoDeOrigem() {
  if (typeof window === 'undefined') return {};

  const params = new URLSearchParams(window.location.search);
  const cookie = (nome: string) =>
    document.cookie
      .split('; ')
      .find((c) => c.startsWith(`${nome}=`))
      ?.split('=')[1];

  const utmSource = params.get('utm_source') ?? undefined;
  const veioDeAnuncio = Boolean(params.get('fbclid') ?? cookie('_fbc')) || utmSource === 'meta';

  return {
    origem: veioDeAnuncio ? ('meta_ads' as const) : ('direto' as const),
    utmSource,
    utmCampaign: params.get('utm_campaign') ?? undefined,
    utmContent: params.get('utm_content') ?? undefined,
    fbp: cookie('_fbp'),
    fbc: cookie('_fbc'),
  };
}

export function FormularioLead({
  variante = 'escuro',
  empreendimentoSlug,
  tipologias,
  pedirEmail = false,
  rotuloBotao = 'Chamar no WhatsApp',
}: Props) {
  const claro = variante === 'claro';
  const [estado, setEstado] = useState<'ocioso' | 'enviando' | 'ok' | 'erro'>('ocioso');
  const [erro, setErro] = useState<string | null>(null);
  const idBase = useId();
  const refFormulario = useRef<HTMLFormElement>(null);

  /* `eventId` precisa ser o mesmo no Pixel e na CAPI para o Meta deduplicar o
     evento. Gerado no envio — antes disso não existe evento para identificar. */
  const refEventId = useRef<string | null>(null);

  const campo = claro
    ? 'min-h-[50px] rounded-lg border border-[rgba(20,19,15,0.22)] bg-white px-[14px] py-[14px] text-[15px] text-tinta outline-none focus:border-ouro md:rounded'
    : 'min-h-[52px] rounded-lg border border-creme/[0.18] bg-creme/[0.06] px-4 py-[15px] text-[15px] text-creme outline-none focus:border-ouro md:rounded';

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (estado === 'enviando') return;

    setEstado('enviando');
    setErro(null);
    refEventId.current ??= crypto.randomUUID();

    const dados = new FormData(evento.currentTarget);
    const corpo = {
      nome: String(dados.get('nome') ?? ''),
      telefone: String(dados.get('telefone') ?? ''),
      email: String(dados.get('email') ?? ''),
      interesse: (dados.get('interesse') as string) || undefined,
      tipologia: (dados.get('tipologia') as string) || undefined,
      empreendimentoSlug,
      consentimentoLgpd: dados.get('consentimento') === 'on',
      website: String(dados.get('website') ?? ''),
      eventId: refEventId.current ?? undefined,
      ...contextoDeOrigem(),
    };

    try {
      const resposta = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      });

      const json: { erro?: string } = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        setErro(json.erro ?? 'Não conseguimos enviar agora. Tente de novo em instantes.');
        setEstado('erro');
        return;
      }

      /* Pixel no navegador, com o mesmo event_id que o servidor manda pela CAPI. */
      const fbq = (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq;
      fbq?.('track', 'Lead', {}, { eventID: refEventId.current });

      setEstado('ok');
      refFormulario.current?.reset();
    } catch {
      setErro('Sem conexão. Tente de novo em instantes.');
      setEstado('erro');
    }
  }

  if (estado === 'ok') {
    return (
      <div
        role="status"
        className={`grid gap-4 rounded-lg p-6 ${
          claro ? 'bg-white text-tinta' : 'border border-creme/[0.18] text-creme'
        }`}
      >
        <p className="text-xl font-semibold tracking-[-0.02em]">Recebemos seus dados.</p>
        <p className={`text-sm leading-relaxed ${claro ? 'text-grafite' : 'text-creme/70'}`}>
          Um corretor responde no seu WhatsApp em até 15 minutos, no horário comercial. Se
          preferir adiantar, chame agora.
        </p>
        <a
          href={linkWhatsApp()}
          target="_blank"
          rel="noopener noreferrer"
          className={`min-h-[54px] rounded-lg p-4 text-center text-[15px] font-semibold ${
            claro ? 'bg-tinta text-creme' : 'bg-ouro text-tinta'
          }`}
        >
          Abrir o WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form ref={refFormulario} onSubmit={enviar} noValidate className="grid gap-[10px] md:gap-3">
      <label className="sr-only" htmlFor={`${idBase}-nome`}>
        Nome completo
      </label>
      <input
        id={`${idBase}-nome`}
        name="nome"
        autoComplete="name"
        required
        placeholder="Nome completo"
        className={campo}
      />

      <label className="sr-only" htmlFor={`${idBase}-telefone`}>
        WhatsApp com DDD
      </label>
      <input
        id={`${idBase}-telefone`}
        name="telefone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        required
        placeholder="WhatsApp com DDD"
        className={campo}
      />

      {pedirEmail ? (
        <>
          <label className="sr-only" htmlFor={`${idBase}-email`}>
            E-mail
          </label>
          <input
            id={`${idBase}-email`}
            name="email"
            type="email"
            autoComplete="email"
            placeholder="E-mail"
            className={`${campo} ${claro ? 'hidden md:block' : ''}`}
          />
        </>
      ) : null}

      {tipologias?.length ? (
        <>
          <label className="sr-only" htmlFor={`${idBase}-tipologia`}>
            Tipologia de interesse
          </label>
          <select id={`${idBase}-tipologia`} name="tipologia" className={campo} defaultValue="">
            <option value="">Tipologia de interesse</option>
            {tipologias.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </>
      ) : (
        <>
          <label className="sr-only" htmlFor={`${idBase}-interesse`}>
            Interesse
          </label>
          <select id={`${idBase}-interesse`} name="interesse" className={campo} defaultValue="">
            <option value="">Interesse — selecione</option>
            <option value="lancamento">Lançamento</option>
            <option value="na_planta">Na Planta</option>
            <option value="remanescente">Remanescente</option>
          </select>
        </>
      )}

      {/* Honeypot: fora da ordem de tabulação e invisível a quem enxerga. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute h-0 w-0 overflow-hidden opacity-0"
      />

      <label
        className={`flex items-start gap-[10px] text-xs leading-[1.5] md:text-[13px] ${
          claro ? 'text-pedra' : 'text-creme/65'
        }`}
      >
        <input
          type="checkbox"
          name="consentimento"
          required
          className={`mt-[3px] h-4 w-4 shrink-0 ${claro ? 'accent-tinta' : 'accent-ouro'}`}
        />
        <span>
          Autorizo o contato e o tratamento dos meus dados conforme a LGPD e a{' '}
          <Link href={rotas.privacidade} className="underline underline-offset-2">
            Política de Privacidade
          </Link>
          .
        </span>
      </label>

      {erro ? (
        <p role="alert" className={`text-[13px] ${claro ? 'text-tinta' : 'text-ouro'}`}>
          {erro}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={estado === 'enviando'}
        className={`min-h-[54px] rounded-lg p-[17px] text-[15px] font-semibold transition-opacity disabled:opacity-60 md:min-h-[56px] md:rounded md:p-[18px] ${
          claro ? 'bg-tinta text-creme' : 'bg-ouro text-tinta'
        } hover:opacity-[0.88]`}
      >
        {estado === 'enviando' ? 'Enviando…' : rotuloBotao}
      </button>
    </form>
  );
}
