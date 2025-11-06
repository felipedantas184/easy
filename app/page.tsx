'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShoppingCart,
  Rocket,
  Server,
  Users,
  Star,
  CheckCircle,
  Menu,
  X,
} from 'lucide-react';

// This single-file landing page is a ready-to-slice implementation meant to be
// used as app/page.tsx in a Next.js (App Router) project with Tailwind CSS v4.
// It uses Framer Motion for subtle animations and lucide-react for icons.
// ---
// How to use:
// - Place mock images in /public/images (hero-mockup.png, dashboard-preview.png)
// - Split components into files under components/ when you want to organize

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <Header />

      <main className="relative overflow-hidden">
        <section className="pt-20 pb-16">
          <div className="mx-auto max-w-7xl px-6">
            <Hero />
          </div>
        </section>

        <section className="py-12">
          <div className="mx-auto max-w-7xl px-6">
            <Features />
          </div>
        </section>

        <section className="py-12 bg-white">
          <div className="mx-auto max-w-7xl px-6">
            <Showcase />
          </div>
        </section>

        <section className="py-12">
          <div className="mx-auto max-w-7xl px-6">
            <Metrics />
          </div>
        </section>

        <section className="py-12 bg-white">
          <div className="mx-auto max-w-7xl px-6">
            <Testimonials />
          </div>
        </section>

        <section className="py-12">
          <div className="mx-auto max-w-7xl px-6">
            <Pricing />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

/* ----------------------------- Shared UI ----------------------------- */
function Container({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-7xl">{children}</div>;
}

function Button({ children, variant = 'primary', href }: { children: React.ReactNode; variant?: 'primary' | 'outline'; href?: string }) {
  if (href) {
    return (
      <Link href={href} className={buttonClass(variant)}>
        {children}
      </Link>
    );
  }

  return <button className={buttonClass(variant)}>{children}</button>;
}

function buttonClass(variant: 'primary' | 'outline') {
  if (variant === 'primary')
    return 'inline-flex items-center gap-3 rounded-2xl bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300';
  return 'inline-flex items-center gap-3 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50';
}

/* ----------------------------- Header ----------------------------- */
function Header() {
  const [open, setOpen] = React.useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-40 bg-white/70 backdrop-blur-sm border-b border-slate-100">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">E</div>
              <span className="font-semibold text-slate-900">Easy Platform</span>
            </Link>
          </div>

          <nav className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900">Funcionalidades</a>
            <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900">Preços</a>
            <a href="#testimonials" className="text-sm font-medium text-slate-600 hover:text-slate-900">Depoimentos</a>
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">Entrar</Link>
            <Button href="/signup">Criar Loja</Button>
          </nav>

          <div className="md:hidden">
            <button
              className="-mr-2 inline-flex items-center justify-center rounded-md p-2 text-slate-700"
              onClick={() => setOpen((s) => !s)}
              aria-label="menu"
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="md:hidden border-t border-slate-100 bg-white">
          <div className="px-6 py-4 space-y-3">
            <a href="#features" className="block rounded-md px-3 py-2 text-base font-medium text-slate-700">Funcionalidades</a>
            <a href="#pricing" className="block rounded-md px-3 py-2 text-base font-medium text-slate-700">Preços</a>
            <a href="#testimonials" className="block rounded-md px-3 py-2 text-base font-medium text-slate-700">Depoimentos</a>
            <Link href="/login" className="block rounded-md px-3 py-2 text-base font-medium text-slate-700">Entrar</Link>
            <Link href="/signup" className="block rounded-md px-3 py-2"><span className="inline-flex w-full justify-center rounded-2xl bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white">Criar Loja</span></Link>
          </div>
        </motion.div>
      )}
    </header>
  );
}

/* ----------------------------- Hero ----------------------------- */
function Hero() {
  return (
    <div className="relative pt-8">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
        <motion.div
          className="lg:col-span-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
            Crie sua loja virtual em minutos — sem complicação.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-slate-600">
            Plataforma completa para montar, gerenciar e vender. Checkout integrado, painel intuitivo e todas as ferramentas para crescer online.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/signup">Começar agora</Button>
            <Button variant="outline" href="#showcase">Ver demonstração</Button>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-slate-700">Teste grátis por 7 dias • Sem cartão</span>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-2"> 
              <Star className="h-4 w-4 text-amber-400" />
              <span>Suporte 24/7</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-sky-500" />
              <span>Escalável para lojas de todos os tamanhos</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="lg:col-span-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="pointer-events-none hidden lg:block">
              {/* Decorative background */}
              <div className="absolute -left-8 -top-8 h-[420px] w-[420px] -rotate-12 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 opacity-80 blur-3xl" />
            </div>

            {/* Mockup card */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-lg">
              <img src="/images/dashboard-preview.png" alt="dashboard preview" className="w-full object-cover" />
              <div className="absolute left-4 top-4 hidden flex-col gap-2 rounded-lg p-3 md:flex">
                <div className="h-2 w-20 rounded-full bg-white/60" />
                <div className="h-2 w-10 rounded-full bg-white/50" />
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-500">Mockup representativo do painel da Easy Platform</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ----------------------------- Features ----------------------------- */
function Features() {
  const features = [
    { icon: <ShoppingCart className="h-6 w-6" />, title: 'Checkout integrado', desc: 'Aceite cartão, PIX e boleto com configuração simples.' },
    { icon: <Rocket className="h-6 w-6" />, title: 'Deploy rápido', desc: 'Publique sua loja e comece a vender em minutos.' },
    { icon: <Server className="h-6 w-6" />, title: 'Escalabilidade', desc: 'Infra confiável para crescer sem dor de cabeça.' },
    { icon: <Users className="h-6 w-6" />, title: 'Painel intuitivo', desc: 'Gerencie produtos, pedidos e clientes com facilidade.' },
  ];

  return (
    <section id="features">
      <div className="mx-auto max-w-4xl text-center">
        <h3 className="text-sm font-semibold text-blue-600">Funcionalidades</h3>
        <h2 className="mt-2 text-3xl font-bold text-slate-900">Tudo que você precisa para vender online</h2>
        <p className="mt-3 text-slate-600">Ferramentas pensadas para lojistas — da primeira venda ao crescimento contínuo.</p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <motion.div key={f.title} whileHover={{ y: -6 }} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-blue-50 p-3 text-blue-600">{f.icon}</div>
              <div>
                <h4 className="font-semibold text-slate-900">{f.title}</h4>
                <p className="mt-1 text-sm text-slate-600">{f.desc}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------- Showcase ----------------------------- */
function Showcase() {
  return (
    <section id="showcase">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-7">
          <h3 className="text-sm font-semibold text-blue-600">Demonstração</h3>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Interface limpa. Fluxos focados em vender.</h2>
          <p className="mt-3 text-slate-600">Veja como o painel centraliza operações importantes: pedidos, estoques, cupons e relatórios comerciais — tudo em um único lugar.</p>

          <ul className="mt-6 space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
              <span className="text-slate-700">Configuração do checkout em 3 passos</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
              <span className="text-slate-700">Integração com meios de pagamento populares</span>
            </li>
          </ul>

          <div className="mt-6">
            <Button href="/signup">Teste grátis</Button>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-b from-white to-slate-50 p-4 shadow">
            <img src="/images/hero-mockup.png" alt="product mockup" className="w-full object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- Metrics ----------------------------- */
function Metrics() {
  const metrics = [
    { label: 'Lojas Ativas', value: '+1.2k' },
    { label: 'Pedidos Processados', value: '+15k' },
    { label: 'Tempo médio para criar loja', value: '10 minutos' },
  ];

  return (
    <section>
      <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 p-8 shadow-sm">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {metrics.map((m) => (
            <div key={m.label} className="text-center">
              <div className="text-2xl font-semibold text-slate-900">{m.value}</div>
              <div className="mt-1 text-sm text-slate-600">{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- Testimonials ----------------------------- */
function Testimonials() {
  const people = [
    { name: 'Mariana', role: 'Proprietária - Loja de Moda', text: 'A Easy Platform me permitiu abrir minha loja em poucas horas — vendas dispararam no primeiro mês.' },
    { name: 'Carlos', role: 'Empreendedor', text: 'Painel muito intuitivo. Atendimento rápido e pagamentos funcionando perfeitamente.' },
  ];

  return (
    <section id="testimonials">
      <div className="mx-auto max-w-4xl text-center">
        <h3 className="text-sm font-semibold text-blue-600">Depoimentos</h3>
        <h2 className="mt-2 text-3xl font-bold text-slate-900">O que nossos clientes dizem</h2>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {people.map((p) => (
          <motion.blockquote key={p.name} whileHover={{ scale: 1.02 }} className="rounded-2xl border border-slate-100 bg-white p-6 shadow">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-slate-200" />
              <div>
                <div className="font-semibold text-slate-900">{p.name}</div>
                <div className="text-xs text-slate-500">{p.role}</div>
              </div>
            </div>
            <p className="mt-4 text-slate-700">"{p.text}"</p>
          </motion.blockquote>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------- Pricing ----------------------------- */
function Pricing() {
  const plans = [
    { name: 'Starter', price: 'Grátis', bullets: ['Loja básica', 'Suporte via e-mail', 'Vendas ilimitadas'] },
    { name: 'Pro', price: 'R$49/m', bullets: ['Domínio personalizado', 'Checkout avançado', 'Prioridade no suporte'], featured: true },
    { name: 'Scale', price: 'R$199/m', bullets: ['Soluções enterprise', 'SLA 99.9%', 'Consultoria inicial'] },
  ];

  return (
    <section id="pricing">
      <div className="mx-auto max-w-4xl text-center">
        <h3 className="text-sm font-semibold text-blue-600">Preços</h3>
        <h2 className="mt-2 text-3xl font-bold text-slate-900">Planos para todos os tamanhos</h2>
        <p className="mt-3 text-slate-600">Comece grátis e escale conforme suas necessidades.</p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {plans.map((p) => (
          <div key={p.name} className={`rounded-2xl border p-6 shadow-sm ${p.featured ? 'border-blue-200 bg-gradient-to-b from-white to-blue-50' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold text-slate-900">{p.name}</h4>
                <div className="mt-1 text-sm text-slate-500">{p.price}</div>
              </div>
              {p.featured && <div className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">Mais Popular</div>}
            </div>

            <ul className="mt-6 space-y-2 text-sm text-slate-600">
              {p.bullets.map((b) => (
                <li key={b} className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" />{b}</li>
              ))}
            </ul>

            <div className="mt-6">
              <Button href="/signup">Escolher o plano</Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------- Footer ----------------------------- */
function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-100 bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">E</div>
              <div>
                <div className="font-semibold text-slate-900">Easy Platform</div>
                <div className="text-sm text-slate-500">A maneira mais simples de vender online.</div>
              </div>
            </div>

            <div className="mt-6 text-sm text-slate-500">© {new Date().getFullYear()} Easy Platform. Todos os direitos reservados.</div>
          </div>

          <div className="flex flex-wrap gap-6">
            <a href="#" className="text-sm text-slate-600 hover:text-slate-900">Ajuda</a>
            <a href="#" className="text-sm text-slate-600 hover:text-slate-900">Termos</a>
            <a href="#" className="text-sm text-slate-600 hover:text-slate-900">Política de Privacidade</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
