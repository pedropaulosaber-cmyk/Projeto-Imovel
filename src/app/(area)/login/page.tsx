import type { Metadata } from 'next';

import { FormularioLogin } from './formulario-login';

export const metadata: Metadata = {
  title: 'Área do corretor',
  robots: { index: false, follow: false },
};

export default function PaginaLogin() {
  return <FormularioLogin />;
}
