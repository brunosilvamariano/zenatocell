'use client'

import { flushSync } from 'react-dom'
import { useEffect, useRef, useState } from 'react'

import PrivacyControls from './PrivacyControls'
import { products } from './catalog'
const reviews = [
  { name: 'Helena Corrêa', initials: 'HC', photo: 'https://lh3.googleusercontent.com/a-/ALV-UjXsaHoPZJi9UdHBY2Pn7MxFwhmf4xrQKKXzZJjIgWD0T-dtWvVo=s120-c-rp-mo-ba2-br100', summary: 'Trocou dois celulares na loja e elogiou a ajuda com a configuração, a atenção da equipe e o cumprimento do prazo.' },
  { name: 'Lara Cavalcante', initials: 'LC', photo: 'https://lh3.googleusercontent.com/a/ACg8ocJYzPr2qOJWMrRPq9nywgzZXySdlApikDiNUbkrHnQzDFBqLQ=s120-c-rp-mo-br100', summary: 'Destacou a atenção e o profissionalismo de Jéssica e Diogo durante a visita à loja.' },
  { name: 'Lucas Alexandre', initials: 'LA', photo: 'https://lh3.googleusercontent.com/a-/ALV-UjWxK5FMiYkhX7GfKzwc_Y4pGW4znfHtlz2PnZT9OFq58wg7yvSV=s120-c-rp-mo-br100', summary: 'Comprou um iPhone na ZenatoCell e recomendou a loja pelo atendimento e pela qualidade dos produtos.' },
]
const directions = 'https://www.google.com/maps/dir//Zenato+Cell,+Rua+Blumenau+1934,+Joinville,+SC/@-26.2839937,-48.8498608,17z/data=!4m2!4m1!3e0'
const googleReviews = 'https://www.google.com/maps/place/data=!4m4!3m3!1s0x94deb027de7467d9:0x4e68f6e1f3e938af!9m1!1b1'

const categories = ['Todos', 'Lacrado', 'Seminovo', 'Apple Watch']
const heroPhotos = [...new Set([
  products.find(product => product.category === 'Lacrado')?.photos[0],
  products.find(product => product.category === 'Seminovo')?.photos[0],
  products.find(product => product.category === 'Apple Watch')?.photos[0],
].filter((photo): photo is string => Boolean(photo)))]
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const phone = '5547991597258'
const instagram = 'https://www.instagram.com/zenatocell/'

const money = (cents: number) => (cents / 100).toLocaleString('pt-BR', {style:'currency', currency:'BRL'})

function GoogleIcon() {
  return <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285F4" d="M46 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.4a10.6 10.6 0 0 1-4.6 7v5.7h7.4C43.5 37.2 46 31.4 46 24.5Z"/><path fill="#34A853" d="M24 47c6.2 0 11.4-2 15.2-5.8l-7.4-5.7a14 14 0 0 1-21-7.4H3.2v5.9A23 23 0 0 0 24 47Z"/><path fill="#FBBC05" d="M10.8 28.1a14 14 0 0 1 0-8.2V14H3.2a23 23 0 0 0 0 20Z"/><path fill="#EA4335" d="M24 10.1c3.4 0 6.4 1.1 8.8 3.4l6.6-6.6A23 23 0 0 0 3.2 14l7.6 5.9A14 14 0 0 1 24 10.1Z"/></svg>
}

function InstagramIcon() {
  return <img className="instagram-icon" src="/zenatocell/instagram.svg" width="20" height="20" alt=""/>
}

function Icon({ kind }: { kind: 'bag' | 'search' | 'grid' }) {
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === 'bag' && <><path d="M5 8h14l2 13H3L5 8Z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/></>}
    {kind === 'search' && <><circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 5 5"/></>}
    {kind === 'grid' && <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/>}
  </svg>
}

type Product = (typeof products)[number]

function ProductPhotos({ product }: { product: Product }) {
  const [index, setIndex] = useState(0)
  const gesture = useRef<{ x: number; y: number; id: number } | null>(null)
  const length = product.photos.length
  function move(step: number) { setIndex(previous => (previous + step + length) % length) }

  return <div className="product-thumbnail"
    onPointerDown={event => {
      if (length < 2 || !event.isPrimary || event.button !== 0 || (event.target as HTMLElement).closest('button')) return
      gesture.current = { x: event.clientX, y: event.clientY, id: event.pointerId }
      event.currentTarget.setPointerCapture(event.pointerId)
    }}
    onPointerUp={event => {
      const start = gesture.current
      gesture.current = null
      if (!start || start.id !== event.pointerId) return
      const dx = event.clientX - start.x
      const dy = event.clientY - start.y
      if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy) * 1.25) move(dx < 0 ? 1 : -1)
    }}
    onPointerCancel={() => { gesture.current = null }}
    onLostPointerCapture={() => { gesture.current = null }}>
    <img key={index} src={product.photos[index]} alt={product.name} width="704" height="704" loading="lazy" draggable={false}/>
    {length > 1 && <>
      <button className="hero-arrow hero-arrow-prev product-photo-arrow" type="button" onClick={() => move(-1)} aria-label={'Foto anterior de ' + product.name}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg>
      </button>
      <button className="hero-arrow hero-arrow-next product-photo-arrow" type="button" onClick={() => move(1)} aria-label={'Próxima foto de ' + product.name}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="m10 6 6 6-6 6"/></svg>
      </button>
    </>}
  </div>
}
export default function Home() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todos')
  const [slide, setSlide] = useState(0)
  const [heroPaused, setHeroPaused] = useState(false)
  const heroGesture = useRef<{ x: number; y: number; pointerId: number } | null>(null)

  function moveHero(step: number) {
    setSlide(index => (index + step + heroPhotos.length) % heroPhotos.length)
  }

  useEffect(() => {
    if (heroPaused || heroPhotos.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => setSlide(index => (index + 1) % heroPhotos.length), 5600)
    return () => window.clearInterval(timer)
  }, [heroPaused])
  const [tip, setTip] = useState(0)
  const [notice, setNotice] = useState<{name: string} | null>(null)
  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(null), 4500)
    return () => window.clearTimeout(timeout)
  }, [notice])
  const [cart, setCart] = useState<Record<string, number>>({})
  const [rememberCart, setRememberCart] = useState(false)
  useEffect(() => {
    const handler = (event: Event) => setRememberCart((event as CustomEvent<boolean>).detail)
    window.addEventListener('zenatocell-privacy', handler)
    return () => window.removeEventListener('zenatocell-privacy', handler)
  }, [])
  const [loaded, setLoaded] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const categoryMenu = useRef<HTMLDetailsElement>(null)
  const catalog = useRef<HTMLElement>(null)

  useEffect(() => {
    try {
      const allowed = JSON.parse(localStorage.getItem('zenatocell-privacy-v1') || 'null')?.rememberCart === true
      setRememberCart(allowed)
      const saved = allowed ? JSON.parse(localStorage.getItem('zenatocell-cart') || '{}') : {}
      setCart(Object.fromEntries(products.flatMap(({ id }) => Number.isInteger(saved?.[id]) && saved[id] > 0 ? [[id, Math.min(99, saved[id])]] : [])))
    } catch {}
    setLoaded(true)
  }, [])
  useEffect(() => {
    if (loaded && rememberCart) {
      try {
        localStorage.setItem('zenatocell-cart', JSON.stringify(cart))
      } catch {}
    }
  }, [cart, loaded, rememberCart])

  const visible = products.filter(product => (category === 'Todos' || product.category === category) && normalize(product.name + ' ' + product.category).includes(normalize(query.trim())))
  const lines = products.filter(product => cart[product.id] > 0)
  const count = lines.reduce((sum, product) => sum + cart[product.id], 0)
  const offerItems = products.filter(product => product.category === 'Lacrado').slice(0, 4)
  const catalogItems = visible

  function filter(value: string, scroll = true) {
    const update = () => { setCategory(value); setQuery('') }
    if (document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.startViewTransition(() => flushSync(update))
    } else update()
    if (categoryMenu.current) categoryMenu.current.open = false
    if (scroll) catalog.current?.scrollIntoView()
  }
  function changeQuantity(id: string, delta: number) {
    setCart(previous => ({ ...previous, [id]: Math.min(99, Math.max(0, (previous[id] || 0) + delta)) }))
  }
  function productCard(product: Product, animate = false) {
    return <article key={product.id} style={animate ? { viewTransitionName: "catalog-" + product.id.replace(/[^a-z0-9-]/g, "") } : undefined}>
      <ProductPhotos product={product}/>
      <div className="product-info"><div className="product-identity"><span className="product-condition" data-condition={product.category}>{product.category}</span><h3>{product.name}</h3></div><div className="product-payment"><div className="product-prices"><strong>{product.price === null ? 'Sob consulta' : money(product.price)}</strong>{product.price !== null && <small>{product.category === 'Apple Watch' ? 'no catálogo' : 'à vista'}</small>}</div>
      {product.installment !== null && <p className="installments"><strong>{product.months}× de {money(product.installment)}</strong><span>{product.category === 'Apple Watch' ? 'sem juros' : 'no cartão'}</span></p>}
      </div>{product.warranty && <span className="product-warranty"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M12 3 5 6v5c0 4.5 2.8 7.9 7 10 4.2-2.1 7-5.5 7-10V6l-7-3Z"/><path d="m9 11 2 2 4-4"/></svg>{product.warranty}</span>}
      <small className="product-availability">Consulte cor e estoque</small>
      {product.price === null ? <a className="red" href={'https://wa.me/' + phone + '?text=' + encodeURIComponent('Olá, gostaria de confirmar o valor de ' + product.name)} target="_blank" rel="noreferrer">Consultar valor</a> : null}
      {product.price === null ? null : cart[product.id] > 0 ? <div className="card-quantity" role="group" aria-label={'Quantidade de ' + product.name + ' no carrinho'}><button aria-label={'Diminuir quantidade de ' + product.name} onClick={() => changeQuantity(product.id, -1)}>−</button><span><small>No carrinho</small><strong>{cart[product.id]}</strong></span><button aria-label={'Aumentar quantidade de ' + product.name} disabled={cart[product.id] >= 99} onClick={() => changeQuantity(product.id, 1)}>+</button></div> : <button className="red product-add" aria-label={'Adicionar ' + product.name + ' ao carrinho'} onClick={() => { changeQuantity(product.id, 1); setNotice({ name: product.name }) }}><Icon kind="bag"/><span>Adicionar<span className="add-label-extra"> ao carrinho</span></span></button>}</div>
    </article>
  }
  const subtotal = lines.reduce((sum, product) => sum + (product.price ?? 0) * cart[product.id], 0)
  const message = ['Olá, ZenatoCell! Gostaria de confirmar a disponibilidade deste pedido:', '', ...lines.map(product => cart[product.id] + ' × ' + product.name + ' (' + product.category + ') — ' + money((product.price ?? 0) * cart[product.id])), '', 'Subtotal estimado: ' + money(subtotal)].join('\n')
  const checkout = phone && count ? 'https://wa.me/' + phone + '?text=' + encodeURIComponent(message) : undefined

  return <>
    <a className="skip" href="#catalogo">Ir para o catálogo</a>
<div className="top"><div className="wrap"><span className="top-label"><Icon kind="bag"/> Loja em Joinville, SC</span><span className="top-catalog">iPhones e acessórios <a href="#catalogo">Ver catálogo <span aria-hidden="true">↗</span></a></span><a href={instagram} target="_blank" rel="noreferrer" className="instagram-link"><InstagramIcon/> Instagram</a></div></div>
    <header className="wrap masthead" id="inicio">
      <a className="brand" href="#inicio"><img src="/zenatocell/zenatocell.svg" alt="Zenato Cell" width="76" height="76"/></a>
      <form className="search" role="search" onSubmit={event => { event.preventDefault(); catalog.current?.scrollIntoView() }}>
        <input aria-label="Buscar produtos" placeholder="Busque por produtos ou categorias" value={query} onChange={event => { setQuery(event.target.value); setCategory('Todos') }}/>
        <button aria-label="Buscar"><Icon kind="search"/></button>
      </form>
      <button className="cart-button" aria-label={"Seu carrinho, " + count + " itens"} onClick={() => dialog.current?.showModal()}><span><Icon kind="bag"/><b>{count}</b></span> Seu carrinho</button>
    </header>
    <nav className="nav" aria-label="Menu principal"><div className="wrap nav-inner">
      <details ref={categoryMenu}><summary><Icon kind="grid"/> Todas as categorias</summary><div className="category-menu">{categories.map(item => <button key={item} onClick={() => filter(item)}>{item}</button>)}</div></details>
      <details className="mobile-menu"><summary aria-label="Abrir menu"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg></summary><div className="category-menu" onClick={event => { const menu = event.currentTarget.closest("details"); if (menu) menu.open = false }}><a href="#inicio">Início</a><button aria-pressed={category === 'Lacrado'} onClick={() => filter('Lacrado')}>Lacrados</button><button aria-pressed={category === 'Seminovo'} onClick={() => filter('Seminovo')}>Seminovos</button><button aria-pressed={category === 'Apple Watch'} onClick={() => filter('Apple Watch')}>Apple Watch</button></div></details><div className="nav-links"><a href="#inicio" aria-current={category === 'Todos' ? 'page' : undefined}>Início</a><button aria-pressed={category === 'Lacrado'} onClick={() => filter('Lacrado')}>Lacrados</button><button aria-pressed={category === 'Seminovo'} onClick={() => filter('Seminovo')}>Seminovos</button><button aria-pressed={category === 'Apple Watch'} onClick={() => filter('Apple Watch')}>Apple Watch</button></div>
      <a className="contact-link nav-phone" href="tel:+5547991597258" aria-label="Ligar para a ZenatoCell no (47) 99159-7258"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 18 18 0 0 1-7.9-2.8 18 18 0 0 1-5.5-5.5 18 18 0 0 1-2.8-7.9A2 2 0 0 1 5.6 3h3a2 2 0 0 1 2 1.7l.5 3a2 2 0 0 1-.6 2L9.2 11a14 14 0 0 0 5.5 5.5l1.3-1.3a2 2 0 0 1 2-.6l2.3.4a2 2 0 0 1 1.7 1.9Z"/></svg><span>(47) 99159-7258</span></a>
    </div></nav>
    <main>
      <div className="showcase"><div className="wrap">
        <section className="hero" aria-label="Destaques">
          <div className="hero-media" onMouseEnter={() => setHeroPaused(true)} onMouseLeave={() => setHeroPaused(false)}
            onPointerDown={event => {
              if (!event.isPrimary || event.button !== 0 || (event.target as HTMLElement).closest("button")) return
              heroGesture.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId }
              event.currentTarget.setPointerCapture(event.pointerId)
            }}
            onPointerUp={event => {
              const start = heroGesture.current
              heroGesture.current = null
              if (!start || start.pointerId !== event.pointerId) return
              const dx = event.clientX - start.x
              const dy = event.clientY - start.y
              if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.25) moveHero(dx < 0 ? 1 : -1)
            }}
            onPointerCancel={() => { heroGesture.current = null }}
            onLostPointerCapture={() => { heroGesture.current = null }}>
            {heroPhotos.map((photo, index) => <img key={photo} draggable={false} className={slide === index ? 'is-current' : ''} src={photo} alt="" fetchPriority={index === 0 ? 'high' : 'auto'}/>)}
            {heroPhotos.length > 1 && <><button className="hero-arrow hero-arrow-prev" type="button" aria-label="Produto anterior" onClick={() => moveHero(-1)}><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg></button><button className="hero-arrow hero-arrow-next" type="button" aria-label="Próximo produto" onClick={() => moveHero(1)}><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="m10 6 6 6-6 6"/></svg></button></>}
          </div>
          <div className="hero-copy"><h1>Celulares para o seu dia a dia</h1><p>Escolha seu produto, monte o carrinho e envie o pedido pelo WhatsApp.</p><button className="red" onClick={() => filter('Todos')}>Ver produtos <span aria-hidden="true">→</span></button></div>
        </section>
        <div className="benefits"><div><Icon kind="bag"/><span><strong>Monte seu pedido</strong>Escolha os itens e as quantidades.</span></div><div><Icon kind="search"/><span><strong>Confirme a disponibilidade</strong>Consulte a loja antes de comprar.</span></div><div><Icon kind="grid"/><span><strong>Combine pelo WhatsApp</strong>Acerte pagamento e retirada com a loja.</span></div></div>
      </div></div>
      <section className="wrap catalog offers" id="ofertas">
        <div className="section-heading"><div><h2>iPhones lacrados</h2></div><button className="red" onClick={() => filter('Todos')}>Ver catálogo →</button></div>
        <div className="products">{offerItems.map(product => productCard(product))}</div>
      </section>
      <section className="wrap promos" aria-label="Categorias em destaque">
        <article><img src="/zenatocell/celular.webp" alt="" loading="lazy"/><div><h2>Encontre seu próximo celular</h2><p>Compare modelos e opções de armazenamento.</p><button className="red" onClick={() => filter('Lacrado')}>Ver celulares →</button></div></article>
        <article><img src={products.find(product => product.category === 'Apple Watch')?.photos[0]} alt="Apple Watch do catálogo" loading="lazy"/><div><h2>Apple Watch</h2><p>Compare tamanhos e versões do catálogo.</p><button className="red" onClick={() => filter('Apple Watch')}>Ver Apple Watch →</button></div></article>
      </section>
      <section className="wrap catalog" ref={catalog} id="catalogo">
        {(query.trim() || category !== 'Todos') && <div className="catalog-heading"><h2>{query.trim() ? 'Resultados da busca' : category}</h2></div>}
        <div className="filters collection-tabs" aria-label="Categorias do catálogo">{categories.map(item => <button key={item} aria-pressed={category === item} onClick={() => filter(item, false)}>{item === 'Seminovo' ? 'Seminovos' : item === 'Lacrado' ? 'Lacrados' : item}</button>)}</div>
        {category === 'Seminovo' && <p>Até 18× no cartão. Consulte as condições.</p>}
        {category === 'Lacrado' && <p>Até 21× no cartão com taxas. Consulte as condições.</p>}
        <div className="products">{catalogItems.map(product => productCard(product, true))}</div>
        {!catalogItems.length && <p>Nenhum produto encontrado.</p>}
      </section>
      <section className="help" aria-labelledby="help-title"><div className="wrap">
        <div className="review-reputation"><span className="google-badge"><GoogleIcon/> Google</span><h2 id="help-title">A confiança de quem já escolheu a ZenatoCell</h2><div className="review-rating"><strong>4,7<span>/5</span></strong><span className="rating-stars" aria-label="Nota 4,7 de 5"><span>★★★★★</span><span className="rating-fill" aria-hidden="true">★★★★★</span></span></div><p className="review-count">Mais de <strong>129 avaliações</strong></p><a href={googleReviews} target="_blank" rel="noreferrer">Conheça as experiências no Google ↗</a></div><div className="review-feature">
        <div className="review-slide" aria-live="polite">
          <p className="review-story" key={'story-' + reviews[tip].name}>{reviews[tip].summary}</p>
          <div className="review-author">
            <span className="review-avatar" key={reviews[tip].name}><span>{reviews[tip].initials}</span><img src={reviews[tip].photo} alt="" loading="lazy" onError={event => { event.currentTarget.hidden = true }}/></span>
            <div><strong>{reviews[tip].name}</strong><span className="review-stars" aria-label="5 de 5 estrelas">★★★★★</span></div>
          </div>
        </div>
        <div className="review-navigation"><a href={googleReviews} target="_blank" rel="noreferrer" className="google-review-link"><GoogleIcon/> Ler avaliações no Google <span aria-hidden="true">↗</span></a><div className="carousel-controls"><button aria-label="Avaliação anterior" onClick={() => setTip((tip + reviews.length - 1) % reviews.length)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg></button><button aria-label="Próxima avaliação" onClick={() => setTip((tip + 1) % reviews.length)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m10 6 6 6-6 6"/></svg></button></div></div></div></div></section>    </main>
    <footer id="contato"><div className="wrap footer-banner"><div><h2>Visite a ZenatoCell</h2><p>Rua Blumenau, 1934 · América, Joinville–SC</p></div><div className="footer-banner-actions"><a className="red" href={directions} target="_blank" rel="noreferrer"><GoogleIcon/> Como chegar ↗</a><a className="instagram-link" href={instagram} target="_blank" rel="noreferrer"><InstagramIcon/> Instagram</a></div></div><div className="wrap footer-grid">
      <section className="footer-brand"><img src="/zenatocell/zenatocell.svg" alt="Zenato Cell" width="100" height="100"/><p>iPhones lacrados, seminovos e Apple Watch em Joinville.</p></section>
      <section><h2>Loja</h2><a href="#inicio">Início</a><button aria-pressed={category === 'Lacrado'} onClick={() => filter('Lacrado')}>iPhones lacrados</button><button aria-pressed={category === 'Seminovo'} onClick={() => filter('Seminovo')}>iPhones seminovos</button><button aria-pressed={category === 'Apple Watch'} onClick={() => filter('Apple Watch')}>Apple Watch</button></section>
      <section><h2>Atendimento</h2><a href="#help-title">Avaliações</a><a href={instagram} target="_blank" rel="noreferrer" className="instagram-link"><InstagramIcon/> Instagram</a>{phone && <a href={'https://wa.me/' + phone} target="_blank" rel="noreferrer">WhatsApp ↗</a>}</section>
      <section><h2>Contato</h2><p>Consulte estoque, pagamento e retirada com a loja.</p><a href={phone ? 'https://wa.me/' + phone : instagram} target="_blank" rel="noreferrer">Fale com a ZenatoCell ↗</a></section>
    </div><PrivacyControls/><div className="footer-bottom"><div className="wrap"><span>© ZenatoCell. Todos os direitos reservados.</span><a className="developer-credit" href="https://brunomarianosilva.com.br/" target="_blank" rel="noopener noreferrer"><svg width="34" height="38" viewBox="0 0 38 40" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M3 2h8v14a11 11 0 1 1-8 10.6V2Zm11 21a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/><path d="m30 1 1.8 5.2L37 8l-5.2 1.8L30 15l-1.8-5.2L23 8l5.2-1.8L30 1Z"/></svg><span><small>Desenvolvido com ❤️ por</small><strong>Bruno Mariano</strong></span></a></div></div></footer>
    <div className="cart-notice" role="status">{notice && <><span>✓ {notice.name} adicionado ao carrinho</span><button onClick={() => { setNotice(null); dialog.current?.showModal() }}>Ver carrinho</button><button aria-label="Dispensar aviso" onClick={() => setNotice(null)}>×</button></>}</div>
    <dialog ref={dialog} className="drawer" aria-labelledby="cart-title" onClick={event => { if (event.target === event.currentTarget) dialog.current?.close() }}>
      <div className="drawer-content">
        <div className="drawer-heading"><div><small className="drawer-brand"><Icon kind="bag"/> ZenatoCell</small><h2 id="cart-title">Seu carrinho</h2></div><button aria-label="Fechar carrinho" onClick={() => dialog.current?.close()}>×</button></div>
        <p className="drawer-intro">Confira os produtos antes de enviar o pedido pelo WhatsApp.</p>
        <div className="drawer-summary"><div><small>Total de itens</small><strong>{count}</strong></div><div><small>Subtotal estimado</small><strong>{money(subtotal)}</strong></div></div>
        <div className="drawer-items">
        {lines.length ? <ul>{lines.map(product => <li key={product.id}><img src={product.photos[0]} alt="" width="68" height="68"/><div><strong>{product.name}</strong><p>{money((product.price ?? 0) * cart[product.id])}</p><div className="quantity"><button aria-label={'Diminuir quantidade de ' + product.name} onClick={() => changeQuantity(product.id, -1)}>−</button>{cart[product.id]}<button disabled={cart[product.id] >= 99} aria-label={'Aumentar quantidade de ' + product.name} onClick={() => changeQuantity(product.id, 1)}>+</button><button onClick={() => setCart(previous => ({ ...previous, [product.id]: 0 }))}>Remover</button></div></div></li>)}</ul> : <p>Seu carrinho está vazio.</p>}
        </div><div className="drawer-actions">
        <p>Valores do catálogo. Confirme disponibilidade, cores e condições com a loja.</p>
        {checkout ? <a className="red" href={checkout} target="_blank" rel="noopener noreferrer">Finalizar pelo WhatsApp</a> : <button className="red" disabled>Finalizar pelo WhatsApp</button>}
        <button className="continue-shopping" onClick={() => dialog.current?.close()}>Continuar comprando</button>
        {count > 0 && !phone && <p>WhatsApp da loja ainda não configurado.</p>}
        </div>
      </div>
    </dialog>
  </>
}






