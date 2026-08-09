import { Button } from '@/components/ui/button';
import { logoutAction } from '@/server/actions/auth';

/**
 * Sair.
 *
 * `<form>` com POST, não um link. Sair é uma ação que muda estado do servidor:
 * como link `GET`, um `<img src="/logout">` numa página qualquer deslogaria o
 * usuário sem que ele clicasse em nada — CSRF de baixo impacto, mas real.
 */
export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="secondary">Sair da conta</Button>
    </form>
  );
}
