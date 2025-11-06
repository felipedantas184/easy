"use client"

import { motion } from 'framer-motion'
import { 
  ArrowRight, 
  Play, 
  CreditCard, 
  ShoppingCart, 
  BarChart3, 
  Smartphone, 
  Zap, 
  Shield,
  Check,
  Star,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'

const features = [
  {
    icon: CreditCard,
    title: 'Checkout Integrado',
    description: 'Processe pagamentos com segurança sem sair da plataforma.'
  },
  {
    icon: ShoppingCart,
    title: 'Gestão de Pedidos',
    description: 'Controle todos os pedidos em um painel centralizado.'
  },
  {
    icon: BarChart3,
    title: 'Analytics Avançado',
    description: 'Métricas detalhadas para impulsionar suas vendas.'
  },
  {
    icon: Smartphone,
    title: '100% Responsivo',
    description: 'Lojas que funcionam perfeitamente em qualquer dispositivo.'
  },
  {
    icon: Zap,
    title: 'Performance Máxima',
    description: 'Carregamento ultrarrápido com tecnologia de ponta.'
  },
  {
    icon: Shield,
    title: 'Segurança Total',
    description: 'Seus dados e transações protegidos com criptografia.'
  }
]

const testimonials = [
  {
    name: 'Ana Silva',
    role: 'Proprietária da Boutique Moda & Estilo',
    content: 'A Easy Platform transformou meu negócio. Em uma semana já estava vendendo online com profissionalismo.',
    avatar: '/images/avatar-1.jpg',
    rating: 5
  },
  {
    name: 'Carlos Santos',
    role: 'Fundador da TechGadgets',
    content: 'O painel é tão intuitivo que não precisei de treinamento. As vendas cresceram 300% em 2 meses.',
    avatar: '/images/avatar-2.jpg',
    rating: 5
  },
  {
    name: 'Marina Oliveira',
    role: 'CEO da Cosméticos Natural',
    content: 'Finalmente uma plataforma que entende as necessidades do empreendedor brasileiro. Recomendo!',
    avatar: '/images/avatar-3.jpg',
    rating: 5
  }
]

const pricingPlans = [
  {
    name: 'Iniciante',
    price: 'R$ 0',
    period: 'para sempre',
    description: 'Perfeito para quem está começando',
    features: [
      'Até 10 produtos',
      'Checkout básico',
      '1GB de armazenamento',
      'Suporte por email',
      'Template gratuito'
    ],
    cta: 'Começar grátis',
    popular: false
  },
  {
    name: 'Profissional',
    price: 'R$ 97',
    period: 'por mês',
    description: 'Ideal para negócios em crescimento',
    features: [
      'Produtos ilimitados',
      'Checkout avançado',
      '10GB de armazenamento',
      'Suporte prioritário',
      'Templates premium',
      'Analytics completo',
      'Cupons de desconto'
    ],
    cta: 'Testar 7 dias grátis',
    popular: true
  },
  {
    name: 'Empresa',
    price: 'R$ 197',
    period: 'por mês',
    description: 'Para lojas de alto volume',
    features: [
      'Todos os recursos Pro',
      'Armazenamento ilimitado',
      'Suporte dedicado 24/7',
      'API personalizada',
      'Migração gratuita',
      'Relatórios avançados',
      'Multi-usuários'
    ],
    cta: 'Falar com vendas',
    popular: false
  }
]

const metrics = [
  { number: '1.200+', label: 'Lojas Criadas' },
  { number: '15.000+', label: 'Pedidos Processados' },
  { number: 'R$ 5M+', label: 'Em Vendas' },
  { number: '98%', label: 'Satisfação dos Clientes' }
]

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">Easy Platform</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
                Funcionalidades
              </a>
              <a href="#showcase" className="text-gray-600 hover:text-gray-900 transition-colors">
                Demonstração
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
                Preços
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                Entrar
              </a>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Criar Loja
              </motion.button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-gray-100 py-4">
              <div className="flex flex-col space-y-4 px-4">
                <a href="#features" className="text-gray-600 hover:text-gray-900 py-2" onClick={() => setIsMenuOpen(false)}>
                  Funcionalidades
                </a>
                <a href="#showcase" className="text-gray-600 hover:text-gray-900 py-2" onClick={() => setIsMenuOpen(false)}>
                  Demonstração
                </a>
                <a href="#pricing" className="text-gray-600 hover:text-gray-900 py-2" onClick={() => setIsMenuOpen(false)}>
                  Preços
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-900 py-2" onClick={() => setIsMenuOpen(false)}>
                  Entrar
                </a>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Criar Loja
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 md:pt-32 md:pb-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Crie sua loja virtual em minutos com a{' '}
                <span className="text-blue-600">Easy Platform</span>
              </h1>

              <p className="mt-6 text-xl text-gray-600 leading-relaxed">
                Tenha uma loja virtual completa com checkout integrado, painel intuitivo
                e tudo que você precisa para vender online. Sem complicação, sem mensalidades altas.
              </p>

              {/* CTA Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg flex items-center justify-center gap-2"
                >
                  Criar minha loja
                  <ArrowRight size={20} />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg hover:border-gray-400 transition-colors font-medium text-lg flex items-center justify-center gap-2"
                >
                  <Play size={20} />
                  Ver demonstração
                </motion.button>
              </div>

              {/* Social Proof */}
              <div className="mt-12 flex items-center gap-6 text-sm text-gray-500">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 bg-gray-300 rounded-full border-2 border-white"
                    />
                  ))}
                </div>
                <div>
                  <span className="font-semibold text-gray-900">+1200 lojas</span> criadas este mês
                </div>
              </div>
            </motion.div>

            {/* Hero Image/Mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-2xl bg-white p-8 shadow-2xl shadow-blue-500/10 border border-gray-100">
                {/* Mockup Dashboard */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6">
                  {/* Mockup Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="text-sm font-medium text-gray-600">Painel Easy Platform</div>
                    <div className="w-6"></div>
                  </div>

                  {/* Mockup Content */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="h-2 bg-gray-200 rounded mb-2"></div>
                        <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex gap-4 mb-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-2 bg-gray-200 rounded flex-1"></div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-4">
                          <div className="h-2 bg-gray-200 rounded flex-1"></div>
                          <div className="h-2 bg-gray-200 rounded w-8"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-purple-500/10 rounded-full blur-xl"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-500/10 rounded-full blur-xl"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tudo que você precisa para vender online
            </h2>
            <p className="text-xl text-gray-600">
              Ferramentas poderosas e intuitivas para criar e gerenciar sua loja virtual
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow group"
              >
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      <section id="showcase" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Dashboard intuitivo para gerenciar suas vendas
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Controle total do seu negócio em um painel simples e poderoso. 
                Acompanhe vendas, gerencie produtos e analise o desempenho da sua loja em tempo real.
              </p>
              <ul className="space-y-4">
                {[
                  'Visualização em tempo real das vendas',
                  'Gestão de estoque automatizada',
                  'Relatórios de desempenho detalhados',
                  'Controle de múltiplos vendedores'
                ].map((item, index) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex items-center gap-3 text-gray-700"
                  >
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Check size={14} className="text-white" />
                    </div>
                    {item}
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="relative rounded-2xl bg-white p-8 shadow-2xl shadow-blue-500/10 border border-gray-100">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="text-sm font-medium text-gray-600">Dashboard Easy Platform</div>
                    <div className="w-6"></div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="h-3 bg-gray-200 rounded mb-2 w-1/2"></div>
                          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="h-4 bg-gray-200 rounded mb-3 w-2/3"></div>
                      <div className="space-y-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                            <div className="flex-1">
                              <div className="h-2 bg-gray-200 rounded mb-1"></div>
                              <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {metrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center text-white"
              >
                <div className="text-3xl md:text-4xl font-bold mb-2">{metric.number}</div>
                <div className="text-blue-100">{metric.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              O que nossos clientes dizem
            </h2>
            <p className="text-xl text-gray-600">
              Mais de 1.200 empreendedores já transformaram seus negócios com a Easy Platform
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">"{testimonial.content}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Planos que cabem no seu bolso
            </h2>
            <p className="text-xl text-gray-600">
              Comece grátis e cresça conforme seu negócio evolui
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative rounded-2xl p-8 ${
                  plan.popular 
                    ? 'bg-white shadow-2xl border-2 border-blue-500' 
                    : 'bg-white shadow-lg border border-gray-100'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Mais Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1 mb-2">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-500">/{plan.period}</span>
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-gray-700">
                      <Check size={18} className="text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-4 rounded-lg font-medium transition-colors ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Pronto para começar a vender online?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Junte-se a mais de 1.200 empreendedores que já transformaram seus negócios
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors font-medium text-lg flex items-center justify-center gap-2"
              >
                Criar minha loja agora
                <ArrowRight size={20} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="border border-white text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
              >
                Falar com consultor
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">E</span>
                </div>
                <span className="ml-2 text-xl font-bold">Easy Platform</span>
              </div>
              <p className="text-gray-400">
                A plataforma mais simples e completa para criar sua loja virtual.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Produto</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Funcionalidades</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Preços</a></li>
                <li><a href="#showcase" className="hover:text-white transition-colors">Demonstração</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Suporte</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacidade</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Termos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Easy Platform. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}