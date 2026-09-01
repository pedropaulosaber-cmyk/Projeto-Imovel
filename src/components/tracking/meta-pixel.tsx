import Script from 'next/script';

/**
 * Meta Pixel.
 *
 * Só entra quando `NEXT_PUBLIC_META_PIXEL_ID` existe — sem a variável, nenhum
 * script de terceiro é carregado, o que mantém a home leve em desenvolvimento
 * e evita disparar evento de teste para o pixel de produção.
 *
 * O evento `Lead` **não** é disparado aqui: ele sai do formulário, com o mesmo
 * `event_id` que o servidor manda pela CAPI, para o Meta deduplicar. Ver
 * `components/lead/formulario-lead.tsx` e `lib/lead/meta-capi.ts`.
 */
export function MetaPixel() {
  const id = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  if (!id) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${id}');fbq('track','PageView');`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element -- pixel 1x1 do Meta; next/image não serve aqui. */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          alt=""
          src={`https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
