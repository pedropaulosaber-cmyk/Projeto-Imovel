'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import { site } from '@/config/site';
import { rotas } from '@/lib/rotas';

const campo =
  'min-h-[54px] rounded-lg border border-creme/[0.2] bg-creme/[0.07] p-4 text-[15px] text-creme outline-none focus:border-ouro md:rounded';

/**
 * Tela de entrada do corretor.
 *
 * A autenticação em si ainda não existe: ela depende do Supabase Auth, que
 * entra junto com a migração do catálogo (ver `supabase/migrations/`). Até lá,
 * o formulário diz isso em vez de fingir que autenticou — um login de mentira
 * que deixa qualquer um entrar é pior que nenhum.
 */
export function FormularioLogin() {
  const [aviso, setAviso] = useState(false);

  return (
    <div className="relative grid min-h-[82svh] place-items-center px-[18px] py-[30px] md:min-h-svh md:px-5 md:py-[clamp(28px,5vw,72px)]">
      <Image
        src="/imagens/escritorio-goiania.jpg"
        alt=""
        aria-hidden
        fill
        sizes="100vw"
        className="object-cover opacity-[0.32] md:opacity-40"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(14,14,12,0.62),rgba(14,14,12,0.96))]"
      />

      <div className="relative w-full max-w-[400px]">
        <Link
          href={rotas.home}
          className="mb-10 hidden text-center text-[17px] font-bold tracking-[0.18em] md:block"
        >
          {site.nome}
        </Link>

        <p className="mb-3 text-center font-mono text-[10px] tracking-[0.16em] text-ouro md:text-[11px]">
          ÁREA DO CORRETOR
        </p>
        <h1 className="mb-7 text-center text-[34px] leading-none font-bold tracking-[-0.04em] md:mb-[34px] md:text-[clamp(30px,3.4vw,44px)]">
          Entrar
        </h1>

        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setAviso(true);
          }}
        >
          <label className="sr-only" htmlFor="login-email">
            E-mail
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="username"
            required
            placeholder="E-mail"
            className={campo}
          />

          <label className="sr-only" htmlFor="login-senha">
            Senha
          </label>
          <input
            id="login-senha"
            name="senha"
            type="password"
            autoComplete="current-password"
            required
            placeholder="Senha"
            className={campo}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 py-1 md:py-[6px]">
            <label className="flex items-center gap-[9px] text-[13px] text-creme/70">
              <input type="checkbox" name="lembrar" className="h-[15px] w-[15px] accent-ouro" />
              Manter conectado
            </label>
            <Link
              href={rotas.home}
              className="border-b border-creme/30 text-[13px] text-creme/70"
            >
              Esqueci <span className="hidden md:inline">minha </span>a senha
            </Link>
          </div>

          <button
            type="submit"
            className="min-h-[56px] rounded-lg bg-ouro p-[19px] text-[15px] font-semibold text-tinta transition-opacity hover:opacity-[0.88] md:rounded"
          >
            Acessar painel
          </button>
        </form>

        {aviso ? (
          <div
            role="status"
            className="mt-4 rounded-lg border border-ouro/40 bg-ouro/10 p-4 text-[13px] leading-[1.6] text-creme/85"
          >
            A autenticação entra junto com o Supabase — ainda não há conta para validar. Enquanto
            isso,{' '}
            <Link href={rotas.painel} className="underline underline-offset-2">
              veja a prévia do painel
            </Link>
            .
          </div>
        ) : null}

        <p className="mt-6 text-center text-xs text-creme/50 md:mt-[26px]">
          Acesso exclusivo para corretores credenciados · {site.creci}
        </p>
      </div>
    </div>
  );
}
