'use client'
import { useEffect, useRef, useState } from 'react'

const storageKey = 'zenatocell-privacy-v1'
export default function PrivacyControls() {
  const [showBanner, setShowBanner] = useState(false)
  const [rememberCart, setRememberCart] = useState(false)
  const [panel, setPanel] = useState<'privacy' | 'returns' | 'preferences'>('privacy')
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null')
      setShowBanner(typeof saved?.rememberCart !== 'boolean')
      setRememberCart(saved?.rememberCart === true)
    } catch { setShowBanner(true) }
  }, [])
  function save(value: boolean) {
    setRememberCart(value)
    try {
      localStorage.setItem(storageKey, JSON.stringify({ rememberCart: value }))
      if (!value) localStorage.removeItem('zenatocell-cart')
    } catch {}
    window.dispatchEvent(new CustomEvent('zenatocell-privacy', { detail: value }))
    setShowBanner(false)
    dialog.current?.close()
  }
  function open(value: typeof panel) { setPanel(value); dialog.current?.showModal() }
  const title = panel === 'privacy' ? 'Política de Privacidade' : panel === 'returns' ? 'Trocas e Devoluções' : 'Suas preferências'
  return <>
    <div className="privacy-links"><button onClick={() => open('privacy')}>Política de Privacidade</button><button onClick={() => open('returns')}>Trocas e Devoluções</button><button onClick={() => open('preferences')}>Preferências de cookies</button></div>
    {showBanner && <section className="cookie-banner" aria-label="Preferências de privacidade"><div><strong>Sua privacidade, sua escolha</strong><p>O carrinho funciona durante a visita. Você decide se quer mantê-lo salvo neste navegador para a próxima vez.</p><button className="privacy-text-link" onClick={() => open('privacy')}>Entenda como usamos seus dados</button></div><div className="cookie-actions"><button onClick={() => save(false)}>Rejeitar opcionais</button><button onClick={() => open('preferences')}>Configurar</button><button onClick={() => save(true)}>Aceitar opcionais</button></div></section>}
    <dialog ref={dialog} className="policy-dialog" aria-labelledby="policy-title" onClick={event => { if (event.target === event.currentTarget) dialog.current?.close() }}><div className="policy-head"><span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m12 3 8 3v6c0 4-4 7-8 9-4-2-8-5-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/></svg> Central de confiança</span><button aria-label="Fechar" onClick={() => dialog.current?.close()}>×</button></div><div className="policy-body"><h2 id="policy-title">{title}</h2>
      {panel === 'preferences' ? <><p>Recursos essenciais permitem montar o pedido durante a visita e guardar sua decisão de privacidade. Esta versão não utiliza ferramentas próprias de publicidade ou análise.</p><label className="privacy-option"><span><strong>Lembrar meu carrinho</strong><small>Salva os itens no armazenamento local deste navegador para futuras visitas.</small></span><input type="checkbox" checked={rememberCart} onChange={event => setRememberCart(event.target.checked)}/></label><button className="red" onClick={() => save(rememberCart)}>Salvar preferências</button></> : panel === 'privacy' ? <>
        <p>Ao navegar no catálogo, você escolhe produtos e quantidades. Quando abre o WhatsApp, os itens e o subtotal são incluídos na mensagem para você revisar antes de enviar.</p><h3>Armazenamento no navegador</h3><p>Sua preferência de privacidade é guardada localmente. Com sua autorização, os itens do carrinho também ficam salvos entre visitas. Você pode alterar essa escolha em Preferências de cookies no rodapé. Rejeitar a opção apaga o carrinho salvo, mantendo a seleção da visita atual.</p><h3>Serviços externos</h3><p>Fotos do catálogo e das avaliações e fontes são carregadas de Canva, Google e outros provedores indicados nos recursos da página. Esses acessos podem transmitir endereço IP e informações técnicas do navegador aos provedores. WhatsApp, Instagram e Google Maps aplicam suas próprias políticas quando você acessa seus links.</p><h3>Atendimento e direitos</h3><p>Para tratar de acesso, correção ou exclusão de dados fornecidos durante o atendimento, entre em contato com a ZenatoCell. Informações necessárias ao cumprimento de obrigações legais podem ser mantidas pelo prazo aplicável.</p>
      </> : <><p>Para solicitar uma troca ou devolução, informe à loja o produto, a data da compra e o motivo, com o comprovante do pedido. A equipe orientará o envio ou a entrega para avaliação.</p><h3>Compras fora da loja</h3><p>Nas contratações realizadas fora do estabelecimento, o Código de Defesa do Consumidor prevê direito de arrependimento em até sete dias da assinatura ou do recebimento. Entre em contato dentro desse prazo para organizar a devolução e a restituição dos valores aplicáveis.</p><h3>Defeitos e garantia</h3><p>Produtos com defeito seguem os direitos e prazos do Código de Defesa do Consumidor. A garantia anunciada no catálogo complementa os direitos legais aplicáveis. Guarde o comprovante e descreva o problema para receber orientação.</p><h3>Trocas por preferência</h3><p>Para compras presenciais, condições de troca por cor, modelo ou preferência devem ser combinadas com a loja no momento da compra. Consulte a disponibilidade antes de concluir o pedido.</p><a href="https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm" target="_blank" rel="noreferrer">Consultar o Código de Defesa do Consumidor ↗</a></>}
      {panel !== 'preferences' && <a className="policy-contact" href="https://wa.me/5547991597258?text=Ol%C3%A1!%20Gostaria%20de%20informa%C3%A7%C3%B5es%20sobre%20privacidade%20ou%20trocas." target="_blank" rel="noreferrer">Falar com o atendimento ↗</a>}
    </div></dialog>
  </>
}

