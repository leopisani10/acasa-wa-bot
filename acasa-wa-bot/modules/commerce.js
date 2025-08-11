import { createClient } from '@supabase/supabase-js';

// Commerce Module for WhatsApp Bot
export class CommerceModule {
  constructor(supabaseUrl, supabaseServiceRole) {
    this.supabase = createClient(supabaseUrl, supabaseServiceRole);
    this.activeOrders = new Map(); // In-memory order tracking
    this.userSessions = new Map(); // Track user conversation state
  }

  // Initialize commerce tables if they don't exist
  async initialize() {
    try {
      console.log('🛍️ Initializing Commerce Module...');
      
      // Check if tables exist, create if needed
      await this.createTablesIfNeeded();
      
      console.log('✅ Commerce Module initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Commerce Module:', error);
    }
  }

  async createTablesIfNeeded() {
    // Products table
    const { error: productsError } = await this.supabase
      .from('products')
      .select('id')
      .limit(1);

    if (productsError && productsError.code === 'PGRST116') {
      console.log('Creating products table...');
      // Table doesn't exist, will be created via migration
    }

    // Orders table check
    const { error: ordersError } = await this.supabase
      .from('orders')
      .select('id')
      .limit(1);

    if (ordersError && ordersError.code === 'PGRST116') {
      console.log('Creating orders table...');
      // Table doesn't exist, will be created via migration
    }
  }

  // Handle commerce-related messages
  async handleMessage(message, from, client) {
    const normalizedFrom = from.replace(/\D/g, '');
    const messageText = message.toLowerCase().trim();

    // Commerce keywords
    if (this.isCommerceKeyword(messageText)) {
      return await this.processCommerceCommand(messageText, normalizedFrom, client);
    }

    return false; // Not a commerce message
  }

  isCommerceKeyword(text) {
    const keywords = [
      'catálogo', 'catalogo', 'produtos', 'comprar', 'preço', 'precos',
      'pedido', 'carrinho', 'finalizar', 'pagamento', 'pagar',
      'cardápio', 'cardapio', 'menu', 'loja', 'disponível', 'disponivel',
      'encomendar', 'solicitar', 'orçar', 'orcamento'
    ];
    
    return keywords.some(keyword => text.includes(keyword));
  }

  async processCommerceCommand(command, from, client) {
    try {
      const chatId = `${from}@c.us`;
      
      // Main commerce menu
      if (command.includes('catálogo') || command.includes('catalogo') || command.includes('produtos')) {
        await this.sendCatalog(chatId, client);
        return true;
      }

      if (command.includes('cardápio') || command.includes('cardapio') || command.includes('menu')) {
        await this.sendMenuOptions(chatId, client);
        return true;
      }

      if (command.includes('pedido') || command.includes('carrinho')) {
        await this.showCart(chatId, from, client);
        return true;
      }

      if (command.includes('finalizar') || command.includes('pagamento')) {
        await this.processCheckout(chatId, from, client);
        return true;
      }

      if (command.includes('preço') || command.includes('precos')) {
        await this.sendPricing(chatId, client);
        return true;
      }

      // Default commerce welcome
      await this.sendCommerceWelcome(chatId, client);
      return true;

    } catch (error) {
      console.error('Error processing commerce command:', error);
      await client.sendMessage(`${from}@c.us`, 
        '❌ Desculpe, houve um erro ao processar sua solicitação. Tente novamente em alguns minutos.'
      );
      return true;
    }
  }

  async sendCommerceWelcome(chatId, client) {
    const welcomeMessage = `
🛍️ *ACASA Residencial Sênior - Loja Virtual*

Bem-vindo ao nosso atendimento comercial! 

*📋 Opções disponíveis:*

*1.* Digite *catálogo* - Ver produtos e serviços
*2.* Digite *cardápio* - Cardápios e alimentação
*3.* Digite *preços* - Consultar valores
*4.* Digite *pedido* - Fazer um pedido
*5.* Digite *pagamento* - Formas de pagamento

*📞 Atendimento Personalizado:*
Para orçamentos e informações detalhadas, fale com nossa equipe!

*🏠 Unidades:*
• Botafogo: (21) 2543-2880
• Tijuca: (21) 2234-5670

Como posso ajudá-lo hoje?
    `.trim();

    await client.sendMessage(chatId, welcomeMessage);
  }

  async sendCatalog(chatId, client) {
    try {
      // Fetch products from database
      const { data: products, error } = await this.supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('category', { ascending: true });

      if (error) {
        console.error('Error fetching products:', error);
        await this.sendDefaultCatalog(chatId, client);
        return;
      }

      if (!products || products.length === 0) {
        await this.sendDefaultCatalog(chatId, client);
        return;
      }

      // Group products by category
      const productsByCategory = products.reduce((acc, product) => {
        if (!acc[product.category]) {
          acc[product.category] = [];
        }
        acc[product.category].push(product);
        return acc;
      }, {});

      let catalogMessage = '🛍️ *CATÁLOGO ACASA RESIDENCIAL SÊNIOR*\n\n';

      Object.entries(productsByCategory).forEach(([category, categoryProducts]) => {
        catalogMessage += `*📁 ${category.toUpperCase()}*\n`;
        categoryProducts.forEach(product => {
          catalogMessage += `\n*${product.name}*\n`;
          catalogMessage += `💰 ${this.formatPrice(product.price)}\n`;
          if (product.description) {
            catalogMessage += `📝 ${product.description}\n`;
          }
          catalogMessage += `📦 Estoque: ${product.stock > 0 ? `${product.stock} unidades` : 'Consultar'}\n`;
          catalogMessage += `---\n`;
        });
        catalogMessage += '\n';
      });

      catalogMessage += `\n*💡 Como fazer pedido:*\n`;
      catalogMessage += `Digite: *pedido [nome do produto] [quantidade]*\n`;
      catalogMessage += `Exemplo: *pedido Fraldas Geriátricas 5*\n\n`;
      catalogMessage += `*📞 Dúvidas?* Entre em contato conosco!`;

      await client.sendMessage(chatId, catalogMessage);

    } catch (error) {
      console.error('Error sending catalog:', error);
      await this.sendDefaultCatalog(chatId, client);
    }
  }

  async sendDefaultCatalog(chatId, client) {
    const catalogMessage = `
🛍️ *CATÁLOGO ACASA RESIDENCIAL SÊNIOR*

*🏥 SERVIÇOS DE CUIDADOS*
• Cuidado 24h especializado
• Fisioterapia e reabilitação
• Acompanhamento médico
• Nutrição personalizada
💰 A partir de R$ 3.500/mês

*🍽️ ALIMENTAÇÃO E NUTRIÇÃO*
• Cardápios balanceados
• Dietas especiais (diabéticos, hipertensos)
• Acompanhamento nutricional
• Suplementação quando necessário
💰 Incluso nos planos residenciais

*🧴 PRODUTOS DE HIGIENE*
• Fraldas geriátricas premium
• Produtos de higiene pessoal
• Materiais de enfermagem
• Equipamentos de mobilidade
💰 Consultar valores

*🏠 SERVIÇOS DE RESIDÊNCIA*
• Quartos individuais e duplos
• Limpeza e manutenção
• Lavanderia especializada
• Segurança 24h
💰 Valores sob consulta

*📞 SOLICITAR ORÇAMENTO*
Digite *orçamento* + sua necessidade
Exemplo: *orçamento quarto individual*

*🛒 FAZER PEDIDO*
Digite *pedido* + produto + quantidade
Exemplo: *pedido fraldas 30*
    `.trim();

    await client.sendMessage(chatId, catalogMessage);
  }

  async sendMenuOptions(chatId, client) {
    const menuMessage = `
🍽️ *CARDÁPIOS ACASA RESIDENCIAL SÊNIOR*

*📋 Tipos de Dieta Disponíveis:*

*🥘 Dieta Branda*
• Alimentos bem cozidos e temperados
• Textura macia e fácil digestão
• Cardápio variado e nutritivo

*🍲 Dieta Pastosa*
• Alimentos batidos/amassados
• Consistência homogênea
• Ideal para dificuldades de deglutição

*🩺 Dieta para Diabéticos*
• Sem açúcar refinado
• Controle de carboidratos
• Adoçantes naturais

*❤️ Dieta para Hipertensos*
• Baixo teor de sódio
• Temperos naturais
• Rica em frutas e verduras

*📅 Cardápio Semanal:*
• Café da manhã, almoço e jantar
• Lanches e colações
• Sucos naturais da estação
• Sobremesas adequadas à dieta

*💡 Solicitar Cardápio Personalizado:*
Digite *cardápio personalizado* + necessidades específicas

*📞 Nutricionista:*
Para orientações especializadas, agende uma consulta!
    `.trim();

    await client.sendMessage(chatId, menuMessage);
  }

  async sendPricing(chatId, client) {
    const pricingMessage = `
💰 *TABELA DE PREÇOS - ACASA RESIDENCIAL SÊNIOR*

*🏠 RESIDÊNCIA (Mensalidade):*

*🛏️ Quarto Individual*
• Grau I: R$ 3.500 - R$ 4.200
• Grau II: R$ 4.200 - R$ 5.000  
• Grau III: R$ 5.000 - R$ 6.500

*🛏️🛏️ Quarto Duplo*
• Grau I: R$ 2.800 - R$ 3.500
• Grau II: R$ 3.500 - R$ 4.200
• Grau III: R$ 4.200 - R$ 5.500

*🏨 Apartamento/Suíte*
• Valores sob consulta
• Configurações personalizadas

*💊 SERVIÇOS ADICIONAIS:*
• Fisioterapia: R$ 80/sessão
• Acompanhante particular: R$ 200/dia
• Fraldas (30 unidades): R$ 120
• Taxa climatização: R$ 150/mês (verão)

*💳 FORMAS DE PAGAMENTO:*
• PIX (5% desconto)
• Cartão de crédito (até 12x)
• Boleto bancário
• Débito automático

*📋 INCLUSOS NO VALOR:*
✅ Alimentação completa (5 refeições)
✅ Medicação supervisionada
✅ Roupas de cama e banho
✅ Atividades de lazer
✅ Acompanhamento médico

*📞 Orçamento Personalizado:*
Digite *orçamento* + suas necessidades
Ou ligue: (21) 2543-2880

*Os valores podem variar conforme avaliação individual*
    `.trim();

    await client.sendMessage(chatId, pricingMessage);
  }

  async showCart(chatId, from, client) {
    const userCart = this.getUserCart(from);
    
    if (!userCart || userCart.items.length === 0) {
      const emptyCartMessage = `
🛒 *SEU CARRINHO ESTÁ VAZIO*

Para adicionar itens ao carrinho:
*pedido [produto] [quantidade]*

Exemplos:
• *pedido fraldas 30*
• *pedido fisioterapia 8 sessões*
• *pedido acompanhante 3 dias*

📋 Digite *catálogo* para ver produtos disponíveis
      `.trim();

      await client.sendMessage(chatId, emptyCartMessage);
      return;
    }

    let cartMessage = '🛒 *SEU CARRINHO*\n\n';
    let total = 0;

    userCart.items.forEach((item, index) => {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;
      
      cartMessage += `*${index + 1}.* ${item.name}\n`;
      cartMessage += `   Qtd: ${item.quantity}\n`;
      cartMessage += `   Preço unit: ${this.formatPrice(item.price)}\n`;
      cartMessage += `   Subtotal: ${this.formatPrice(itemTotal)}\n\n`;
    });

    cartMessage += `*💰 TOTAL: ${this.formatPrice(total)}*\n\n`;
    cartMessage += `*🔄 Opções:*\n`;
    cartMessage += `• *finalizar* - Finalizar pedido\n`;
    cartMessage += `• *limpar* - Limpar carrinho\n`;
    cartMessage += `• *remover [número]* - Remover item\n\n`;
    cartMessage += `📞 Dúvidas? Ligue (21) 2543-2880`;

    await client.sendMessage(chatId, cartMessage);
  }

  async processCheckout(chatId, from, client) {
    const userCart = this.getUserCart(from);
    
    if (!userCart || userCart.items.length === 0) {
      await client.sendMessage(chatId, 
        '🛒 Seu carrinho está vazio. Digite *catálogo* para ver nossos produtos.'
      );
      return;
    }

    const total = userCart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const orderId = `ACE${Date.now()}`;

    // Save order to database
    try {
      await this.saveOrder(orderId, from, userCart, total);
      
      const checkoutMessage = `
✅ *PEDIDO CONFIRMADO*

*🧾 Número do Pedido:* ${orderId}
*💰 Valor Total:* ${this.formatPrice(total)}

*📋 Itens do Pedido:*
${userCart.items.map((item, i) => 
  `${i + 1}. ${item.name} (${item.quantity}x) - ${this.formatPrice(item.price * item.quantity)}`
).join('\n')}

*💳 FORMAS DE PAGAMENTO:*

*1. PIX (5% desconto)*
• Chave: comercial@acasaresidencial.com.br
• Valor com desconto: ${this.formatPrice(total * 0.95)}

*2. Cartão de Crédito*
• Link de pagamento será enviado
• Parcelamento até 12x

*3. Boleto Bancário*
• Vencimento em 3 dias úteis

*📞 Confirmar Pagamento:*
Digite *pagar pix*, *pagar cartão* ou *pagar boleto*

*⏰ Este pedido é válido por 24 horas*

Obrigado por escolher a ACASA! 🏠
      `.trim();

      await client.sendMessage(chatId, checkoutMessage);
      
      // Clear cart after checkout
      this.clearUserCart(from);
      
    } catch (error) {
      console.error('Error processing checkout:', error);
      await client.sendMessage(chatId, 
        '❌ Erro ao processar seu pedido. Nossa equipe foi notificada. Entre em contato: (21) 2543-2880'
      );
    }
  }

  async saveOrder(orderId, customerPhone, cart, total) {
    const orderData = {
      id: orderId,
      customer_phone: customerPhone,
      items: JSON.stringify(cart.items),
      total_amount: total,
      status: 'pending',
      created_at: new Date().toISOString(),
      payment_method: null,
      notes: 'Pedido via WhatsApp'
    };

    const { error } = await this.supabase
      .from('orders')
      .insert([orderData]);

    if (error) throw error;

    console.log(`💾 Order ${orderId} saved for ${customerPhone}`);
  }

  async handleProductInquiry(productName, chatId, client) {
    // Search for product in database
    const { data: products } = await this.supabase
      .from('products')
      .select('*')
      .ilike('name', `%${productName}%`)
      .eq('active', true)
      .limit(5);

    if (!products || products.length === 0) {
      const notFoundMessage = `
❌ Produto "${productName}" não encontrado.

🔍 *Sugestões:*
• Digite *catálogo* para ver todos os produtos
• Tente palavras-chave diferentes
• Fale com nossa equipe: (21) 2543-2880
      `.trim();

      await client.sendMessage(chatId, notFoundMessage);
      return;
    }

    let productMessage = `🔍 *PRODUTOS ENCONTRADOS:*\n\n`;
    
    products.forEach((product, index) => {
      productMessage += `*${index + 1}. ${product.name}*\n`;
      productMessage += `💰 ${this.formatPrice(product.price)}\n`;
      productMessage += `📝 ${product.description}\n`;
      productMessage += `📦 ${product.stock > 0 ? `${product.stock} disponível` : 'Consultar estoque'}\n`;
      productMessage += `---\n`;
    });

    productMessage += `\n*🛒 Para adicionar ao carrinho:*\n`;
    productMessage += `Digite: *pedido [nome do produto] [quantidade]*`;

    await client.sendMessage(chatId, productMessage);
  }

  // Cart management
  getUserCart(phone) {
    const normalized = phone.replace(/\D/g, '');
    if (!this.activeOrders.has(normalized)) {
      this.activeOrders.set(normalized, {
        items: [],
        createdAt: new Date(),
        lastUpdate: new Date()
      });
    }
    return this.activeOrders.get(normalized);
  }

  addToCart(phone, productName, quantity, price = 0) {
    const cart = this.getUserCart(phone);
    
    // Check if product already in cart
    const existingItem = cart.items.find(item => 
      item.name.toLowerCase() === productName.toLowerCase()
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        name: productName,
        quantity: quantity,
        price: price || this.getDefaultPrice(productName),
        addedAt: new Date()
      });
    }

    cart.lastUpdate = new Date();
    return cart;
  }

  clearUserCart(phone) {
    const normalized = phone.replace(/\D/g, '');
    this.activeOrders.delete(normalized);
  }

  getDefaultPrice(productName) {
    const defaultPrices = {
      'fraldas': 120,
      'fisioterapia': 80,
      'acompanhante': 200,
      'consulta médica': 150,
      'medicamentos': 50,
      'suplementos': 80,
      'equipamentos': 300
    };

    const product = productName.toLowerCase();
    for (const [key, price] of Object.entries(defaultPrices)) {
      if (product.includes(key)) {
        return price;
      }
    }
    
    return 100; // Default price
  }

  formatPrice(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  // Payment processing
  async processPayment(method, orderId, chatId, client) {
    const paymentMethods = {
      'pix': this.generatePixPayment,
      'cartao': this.generateCardPayment,
      'boleto': this.generateBoletoPayment
    };

    const methodFunction = paymentMethods[method];
    if (!methodFunction) {
      await client.sendMessage(chatId, 
        '❌ Forma de pagamento inválida. Use: *pagar pix*, *pagar cartão* ou *pagar boleto*'
      );
      return;
    }

    await methodFunction.call(this, orderId, chatId, client);
  }

  async generatePixPayment(orderId, chatId, client) {
    // In production, integrate with payment gateway
    const pixMessage = `
💳 *PAGAMENTO VIA PIX*

*🧾 Pedido:* ${orderId}

*📱 Chave PIX:*
\`comercial@acasaresidencial.com.br\`

*📋 Como pagar:*
1. Abra seu app bancário
2. Escolha PIX → Chave
3. Cole a chave acima
4. Confirme o valor
5. Envie o comprovante aqui

*⏰ Válido por 30 minutos*
*🎁 5% de desconto já aplicado*

Após o pagamento, envie uma foto do comprovante!
    `.trim();

    await client.sendMessage(chatId, pixMessage);
  }

  async generateCardPayment(orderId, chatId, client) {
    // In production, generate real payment link
    const paymentLink = `https://pay.acasaresidencial.com.br/checkout/${orderId}`;
    
    const cardMessage = `
💳 *PAGAMENTO VIA CARTÃO*

*🧾 Pedido:* ${orderId}

*🔗 Link de Pagamento Seguro:*
${paymentLink}

*💳 Aceitamos:*
• Visa, Mastercard, Elo
• Débito e Crédito
• Parcelamento até 12x

*🔒 Pagamento 100% Seguro*
• Criptografia SSL
• Dados protegidos
• Aprovação instantânea

Clique no link para finalizar seu pagamento!
    `.trim();

    await client.sendMessage(chatId, cardMessage);
  }

  async generateBoletoPayment(orderId, chatId, client) {
    const boletoMessage = `
🧾 *PAGAMENTO VIA BOLETO*

*📄 Pedido:* ${orderId}

*📋 Dados do Boleto:*
• Vencimento: ${this.getBusinessDaysFromNow(3)}
• Valor: [Será enviado por email]

*📧 Envio do Boleto:*
Informe seu email para receber o boleto:
*email [seu@email.com]*

*⚠️ Importante:*
• Pagamento em até 3 dias úteis
• Boleto enviado em até 2 horas
• Compensação em 1-2 dias úteis

*📞 Dúvidas sobre o boleto:*
(21) 2543-2880 - Setor Financeiro
    `.trim();

    await client.sendMessage(chatId, boletoMessage);
  }

  // Order processing helpers
  async processOrderMessage(message, from, client) {
    const chatId = `${from}@c.us`;
    
    // Extract product and quantity from message
    // Expected format: "pedido [produto] [quantidade]"
    const orderMatch = message.match(/pedido\s+(.+?)\s+(\d+)/i);
    
    if (!orderMatch) {
      await client.sendMessage(chatId, `
❌ *Formato incorreto de pedido*

*📋 Formato correto:*
*pedido [produto] [quantidade]*

*📝 Exemplos:*
• *pedido fraldas 30*
• *pedido fisioterapia 8*
• *pedido acompanhante 5*

Digite *catálogo* para ver produtos disponíveis.
      `.trim());
      return;
    }

    const [, productName, quantityStr] = orderMatch;
    const quantity = parseInt(quantityStr);

    if (quantity <= 0 || quantity > 100) {
      await client.sendMessage(chatId, 
        '❌ Quantidade inválida. Use valores entre 1 e 100.'
      );
      return;
    }

    // Add to cart
    const cart = this.addToCart(from, productName, quantity);
    
    const confirmMessage = `
✅ *ITEM ADICIONADO AO CARRINHO*

*🛍️ Produto:* ${productName}
*📦 Quantidade:* ${quantity}
*💰 Preço estimado:* ${this.formatPrice(this.getDefaultPrice(productName) * quantity)}

*🛒 Total de itens no carrinho:* ${cart.items.length}

*🔄 Próximos passos:*
• *carrinho* - Ver carrinho completo
• *finalizar* - Finalizar pedido
• *catálogo* - Continuar comprando

*📞 Dúvidas?* (21) 2543-2880
    `.trim();

    await client.sendMessage(chatId, confirmMessage);
  }

  // Utility functions
  getBusinessDaysFromNow(days) {
    const date = new Date();
    let addedDays = 0;
    
    while (addedDays < days) {
      date.setDate(date.getDate() + 1);
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        addedDays++;
      }
    }
    
    return date.toLocaleDateString('pt-BR');
  }

  // Customer service integration
  async handleCustomerInquiry(message, from, client) {
    const chatId = `${from}@c.us`;
    
    // Check for common questions
    const inquiryType = this.categorizeInquiry(message);
    
    switch (inquiryType) {
      case 'hours':
        await this.sendOperatingHours(chatId, client);
        break;
      case 'location':
        await this.sendLocationInfo(chatId, client);
        break;
      case 'services':
        await this.sendServicesInfo(chatId, client);
        break;
      case 'emergency':
        await this.sendEmergencyContact(chatId, client);
        break;
      default:
        await this.sendGeneralSupport(chatId, client);
    }
  }

  categorizeInquiry(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('horário') || lowerMessage.includes('horario') || 
        lowerMessage.includes('funciona') || lowerMessage.includes('aberto')) {
      return 'hours';
    }
    
    if (lowerMessage.includes('endereço') || lowerMessage.includes('endereco') || 
        lowerMessage.includes('localização') || lowerMessage.includes('onde')) {
      return 'location';
    }
    
    if (lowerMessage.includes('serviços') || lowerMessage.includes('servicos') || 
        lowerMessage.includes('especialidades')) {
      return 'services';
    }
    
    if (lowerMessage.includes('emergência') || lowerMessage.includes('emergencia') || 
        lowerMessage.includes('urgente') || lowerMessage.includes('socorro')) {
      return 'emergency';
    }
    
    return 'general';
  }

  async sendOperatingHours(chatId, client) {
    const hoursMessage = `
🕐 *HORÁRIOS DE FUNCIONAMENTO*

*🏠 Residencial ACASA:*
• Atendimento 24h todos os dias
• Visitas: 14h às 17h (diariamente)
• Recepção: 8h às 18h

*📞 Central de Relacionamento:*
• Segunda a Sexta: 8h às 18h
• Sábado: 8h às 12h
• Domingo: Plantão 8h às 17h

*🚨 Emergências:*
• 24 horas por dia
• Todos os dias do ano

*📱 WhatsApp Comercial:*
• Atendimento automatizado: 24h
• Atendimento humano: 8h às 18h

Precisa de atendimento imediato? Ligue:
*Botafogo:* (21) 2543-2880
*Tijuca:* (21) 2234-5670
    `.trim();

    await client.sendMessage(chatId, hoursMessage);
  }

  async sendLocationInfo(chatId, client) {
    const locationMessage = `
📍 *LOCALIZAÇÃO - ACASA RESIDENCIAL SÊNIOR*

*🏠 Unidade Botafogo:*
📍 Rua São Clemente, 155 - Botafogo
🚇 Próximo ao metrô Botafogo
🅿️ Estacionamento disponível
📞 (21) 2543-2880

*🏠 Unidade Tijuca:*
📍 Rua Conde de Bonfim, 120 - Tijuca  
🚇 Próximo ao metrô Saens Peña
🅿️ Estacionamento conveniado
📞 (21) 2234-5670

*🚗 Como Chegar:*
• Uber/99: "ACASA Residencial Sênior"
• GPS: Use os endereços acima
• Transporte público: Consulte horários

*🕐 Horário de Visitas:*
Todos os dias das 14h às 17h
(Agendamento recomendado)

*📋 Agendar Visita:*
Digite *agendar visita* + sua preferência
    `.trim();

    await client.sendMessage(chatId, locationMessage);
  }

  async sendServicesInfo(chatId, client) {
    const servicesMessage = `
🏥 *SERVIÇOS ACASA RESIDENCIAL SÊNIOR*

*👩‍⚕️ EQUIPE MULTIDISCIPLINAR:*
• Médicos geriatras
• Enfermeiros 24h
• Técnicos de enfermagem
• Fisioterapeutas
• Nutricionista
• Psicóloga
• Assistente social

*🛏️ ACOMODAÇÕES:*
• Quartos individuais e duplos
• Suítes premium
• Apartamentos adaptados
• Móveis e equipamentos inclusos

*🍽️ ALIMENTAÇÃO:*
• 5 refeições diárias
• Cardápio supervisionado por nutricionista
• Dietas especiais
• Cozinha própria

*🎯 ATIVIDADES:*
• Fisioterapia
• Terapia ocupacional
• Atividades de lazer
• Socialização
• Acompanhamento psicológico

*🚨 SEGURANÇA:*
• Monitoramento 24h
• Sistema de emergência
• Equipe de plantão
• Protocolo médico

*💡 Mais informações:*
Digite *orçamento* para consulta personalizada
    `.trim();

    await client.sendMessage(chatId, servicesMessage);
  }

  async sendEmergencyContact(chatId, client) {
    const emergencyMessage = `
🚨 *CONTATOS DE EMERGÊNCIA - ACASA*

*📞 URGENTE - 24 HORAS:*
• *Botafogo:* (21) 2543-2880
• *Tijuca:* (21) 2234-5670

*🏥 EMERGÊNCIAS MÉDICAS:*
• SAMU: 192
• Bombeiros: 193
• Polícia: 190

*📱 WhatsApp Emergência:*
• Central: (21) 99999-0000
• Apenas para situações urgentes

*⚠️ EM CASO DE EMERGÊNCIA:*
1. Ligue imediatamente
2. Informe: Nome do residente
3. Informe: Natureza da emergência
4. Siga as orientações da equipe

*💡 Para dúvidas não urgentes:*
Use este WhatsApp ou ligue no horário comercial.

Sua segurança é nossa prioridade! 🏠
    `.trim();

    await client.sendMessage(chatId, emergencyMessage);
  }

  async sendGeneralSupport(chatId, client) {
    const supportMessage = `
🆘 *ATENDIMENTO ACASA RESIDENCIAL SÊNIOR*

Como posso ajudá-lo melhor?

*📋 Opções de Atendimento:*

*1. Comercial e Vendas:*
• *catálogo* - Ver produtos
• *preços* - Consultar valores
• *orçamento* - Solicitar proposta

*2. Informações Gerais:*
• *horários* - Horário de funcionamento
• *endereço* - Localização das unidades
• *serviços* - Nossos serviços

*3. Urgência:*
• *emergência* - Contatos de emergência
• Para urgências, ligue diretamente

*4. Atendimento Personalizado:*
📞 *Botafogo:* (21) 2543-2880
📞 *Tijuca:* (21) 2234-5670

Nossa equipe está pronta para ajudá-lo! 🏠
    `.trim();

    await client.sendMessage(chatId, supportMessage);
  }

  // Inventory management
  async checkInventory(productName) {
    try {
      const { data: product } = await this.supabase
        .from('products')
        .select('stock, name')
        .ilike('name', `%${productName}%`)
        .single();

      return product || null;
    } catch (error) {
      console.error('Error checking inventory:', error);
      return null;
    }
  }

  async updateInventory(productId, quantityChange) {
    try {
      const { data: product } = await this.supabase
        .from('products')
        .select('stock')
        .eq('id', productId)
        .single();

      if (!product) return false;

      const newStock = Math.max(0, product.stock + quantityChange);

      const { error } = await this.supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', productId);

      return !error;
    } catch (error) {
      console.error('Error updating inventory:', error);
      return false;
    }
  }

  // Analytics and reporting
  async logCommerceActivity(activity, data) {
    try {
      await this.supabase
        .from('commerce_logs')
        .insert([{
          activity,
          data: JSON.stringify(data),
          timestamp: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('Error logging commerce activity:', error);
    }
  }

  // Cleanup old carts (call periodically)
  cleanupOldCarts() {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    
    for (const [phone, cart] of this.activeOrders.entries()) {
      if (cart.lastUpdate < sixHoursAgo) {
        this.activeOrders.delete(phone);
        console.log(`🧹 Cleaned up old cart for ${phone}`);
      }
    }
  }
}