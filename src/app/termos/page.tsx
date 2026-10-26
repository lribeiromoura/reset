import Link from "next/link";

export const metadata = { title: "Termos de uso — Reset", description: "Condições de uso do Reset." };

export default function TermsPage() {
  return (
    <main className="legal-page">
      <Link href="/" className="brand"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span>reset<span className="brand-period">.</span></span></Link>
      <span className="auth-kicker">TERMOS DE USO</span>
      <h1>Um espaço para acompanhar seus hábitos.</h1>
      <p>Estes termos são uma versão inicial para revisão. Identificação do responsável, contato, vigência e condições legais finais ainda precisam ser preenchidos antes do lançamento público.</p>
      <h2>O que o serviço oferece</h2>
      <p>O Reset ajuda você a registrar hábitos, acompanhar uma jornada pessoal e, se quiser, manter reflexões privadas. A jornada de 66 dias é uma estrutura de acompanhamento, sem promessa de mudança de comportamento.</p>
      <h2>Uso responsável</h2>
      <p>Mantenha suas credenciais em segurança e informe dados que você tem autorização para usar. O Reset não é tratamento médico, psicoterapia ou substituto de aconselhamento profissional.</p>
      <h2>Seus dados</h2>
      <p>Você pode exportar os dados associados à sua conta e solicitar a exclusão nas configurações. Consulte a <Link href="/privacidade">política de privacidade</Link> para conhecer os dados tratados e as pendências de retenção e contato.</p>
      <h2>Disponibilidade</h2>
      <p>Esta versão está em desenvolvimento. A aplicação pode mudar enquanto é preparada para lançamento; não use o serviço para armazenar informações urgentes ou como único registro de informações importantes.</p>
      <p><Link href="/">Voltar ao Reset.</Link></p>
    </main>
  );
}
