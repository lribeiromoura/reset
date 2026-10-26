import Link from "next/link";

export const metadata = { title: "Privacidade — Reset", description: "Como o Reset trata seus dados pessoais." };

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <Link href="/" className="brand"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span>reset<span className="brand-period">.</span></span></Link>
      <span className="auth-kicker">PRIVACIDADE</span>
      <h1>Seus dados, com cuidado.</h1>
      <p>Esta página descreve o tratamento previsto para a versão em desenvolvimento do Reset. Ela ainda não é um aviso jurídico final e precisa ser revisada e completada antes da abertura ao público.</p>
      <h2>O que guardamos</h2>
      <p>Para operar sua conta, o Reset guarda nome, e-mail, preferências de fuso, objetivo escolhido, hábitos e agendas, conclusões diárias e, se você optar por escrever, reflexões e notas de humor.</p>
      <h2>Para que usamos</h2>
      <p>Usamos esses dados para autenticar sua conta, mostrar sua jornada e calcular o progresso que você pediu. Reflexões são privadas e não são usadas para publicidade ou analytics. O MVP não inclui analytics de comportamento.</p>
      <h2>Serviços e armazenamento</h2>
      <p>A aplicação usa um banco PostgreSQL gerenciado no Supabase. A V1 não envia e-mails de autenticação. O prazo de retenção de backups e o contato responsável por privacidade ainda precisam ser definidos antes do lançamento.</p>
      <h2>Retenção, cópia e exclusão</h2>
      <p>Você pode baixar uma cópia em JSON e solicitar a exclusão da conta nas configurações. Os dados associados à conta são removidos pelo fluxo de exclusão. Prazo de retenção de backups e contato responsável por privacidade ainda precisam ser definidos antes do lançamento.</p>
      <h2>Cookies e segurança</h2>
      <p>O login usa cookies de sessão gerenciados pelo Better Auth. A aplicação não armazena tokens de autenticação no armazenamento local do navegador. O serviço worker guarda apenas a página offline e arquivos estáticos; não guarda páginas privadas nem respostas da API.</p>
      <h2>Contato e revisão</h2>
      <p>O canal de contato de privacidade e as informações completas do controlador ainda precisam ser publicados antes de disponibilizar o serviço ao público. Este texto é informativo, não substitui a revisão jurídica da operação real.</p>
      <p><Link href="/termos">Leia também os termos de uso.</Link></p>
    </main>
  );
}
