'use client';

import { useActionState } from 'react';

import { Field, Input, Select, SubmitButton, Textarea } from '@/components/ui/form';
import { Notice } from '@/components/ui/primitives';
import { createProductAction } from '@/server/actions/products';

/**
 * Formulário de produto.
 *
 * O upload de arquivo **não** está aqui: ele acontece depois, na tela de
 * gestão do produto, por URL assinada direto para o storage. Misturar as duas
 * coisas faria um formulário longo depender de uma integração que pode não
 * estar configurada no ambiente — e o criador perderia o texto todo se o
 * upload falhasse.
 */
export function ProductForm({ categories }: { categories: { id: string; name: string }[] }) {
  const [state, formAction] = useActionState(createProductAction, null);
  const errors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {state && !state.ok && !errors ? <Notice>{state.message}</Notice> : null}

      <Field label="Nome do produto" error={errors?.name} required>
        {(props) => (
          <Input {...props} name="name" required minLength={4} maxLength={120} placeholder="Agente de qualificação de leads no WhatsApp" />
        )}
      </Field>

      <Field
        label="Chamada"
        error={errors?.tagline}
        hint="Uma frase que diz o que ele faz. É o que aparece no card da vitrine."
        required
      >
        {(props) => (
          <Input {...props} name="tagline" required minLength={10} maxLength={160} placeholder="Conversa com o lead, qualifica e entrega no CRM já pontuado." />
        )}
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Tipo" error={errors?.kind} required>
          {(props) => (
            <Select {...props} name="kind" defaultValue="AUTOMATION" required>
              <option value="AI_AGENT">Agente de IA</option>
              <option value="AUTOMATION">Automação</option>
              <option value="WORKFLOW">Workflow</option>
              <option value="TEMPLATE">Template</option>
              <option value="PROMPT_PACK">Pack de prompts</option>
              <option value="DATASET">Dataset / modelo</option>
              <option value="INTEGRATION">Integração</option>
            </Select>
          )}
        </Field>

        <Field label="Categoria" error={errors?.categoryId} required>
          {(props) => (
            <Select {...props} name="categoryId" required defaultValue="">
              <option value="" disabled>Escolha…</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="Preço (R$)" error={errors?.priceCents} required>
          {(props) => <Input {...props} name="priceReais" type="number" min={0} step={10} required placeholder="1890" />}
        </Field>
      </div>

      <Field
        label="Descrição"
        error={errors?.description}
        hint="Comece pelo problema que ele resolve. Depois o que está incluído e como funciona."
        required
      >
        {(props) => (
          <Textarea {...props} name="description" required minLength={80} maxLength={20000} className="min-h-56" />
        )}
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Ferramentas necessárias" error={errors?.requiredTools} hint="Separadas por vírgula.">
          {(props) => <Input {...props} name="requiredTools" placeholder="n8n, OpenAI" />}
        </Field>

        <Field label="Integra com" error={errors?.integrations} hint="Separadas por vírgula.">
          {(props) => <Input {...props} name="integrations" placeholder="HubSpot, Pipedrive" />}
        </Field>
      </div>

      <Field label="Tags" error={errors?.tags} hint="Ajudam na busca. Separadas por vírgula, até 8.">
        {(props) => <Input {...props} name="tags" placeholder="whatsapp, leads, crm" />}
      </Field>

      <Field
        label="Requisitos"
        error={errors?.requirements}
        hint="O que o comprador precisa ter antes de começar."
      >
        {(props) => <Textarea {...props} name="requirements" maxLength={4000} className="min-h-24" />}
      </Field>

      <SubmitButton size="lg" pendingLabel="Salvando…">Salvar como rascunho</SubmitButton>
    </form>
  );
}
