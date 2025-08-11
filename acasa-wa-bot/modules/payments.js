import Stripe from 'stripe';

// Payment Processing Module
export class PaymentProcessor {
  constructor() {
    this.stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
  }

  // Generate PIX payment instructions
  generatePixPayment(orderId, amount, customerPhone) {
    const discountAmount = amount * 0.95; // 5% discount for PIX
    
    return {
      method: 'pix',
      orderId,
      originalAmount: amount,
      finalAmount: discountAmount,
      discount: amount - discountAmount,
      pixKey: 'comercial@acasaresidencial.com.br',
      instructions: `
💳 *PAGAMENTO VIA PIX*

*🧾 Pedido:* ${orderId}
*💰 Valor original:* ${this.formatPrice(amount)}
*🎁 Desconto PIX (5%):* -${this.formatPrice(amount - discountAmount)}
*💚 Valor final:* ${this.formatPrice(discountAmount)}

*📱 Chave PIX:*
\`comercial@acasaresidencial.com.br\`

*📋 Como pagar:*
1. Abra seu app bancário
2. Escolha PIX → Chave
3. Cole a chave acima
4. Confirme o valor: *${this.formatPrice(discountAmount)}*
5. Envie o comprovante aqui

*⏰ Válido por 30 minutos*
*📞 Dúvidas:* (21) 2543-2880

Após o pagamento, envie uma foto do comprovante!
      `.trim(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    };
  }

  // Generate credit card payment link
  async generateCardPayment(orderId, amount, customerPhone, items = []) {
    if (!this.stripe) {
      return this.generateManualCardPayment(orderId, amount);
    }

    try {
      // Create Stripe Checkout Session
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: items.map(item => ({
          price_data: {
            currency: 'brl',
            product_data: {
              name: item.name,
              description: item.description || '',
            },
            unit_amount: Math.round(item.price * 100), // Convert to cents
          },
          quantity: item.quantity,
        })),
        mode: 'payment',
        success_url: `${process.env.HUB_URL || 'https://hub.acasaresidencial.com.br'}/payment-success?order=${orderId}`,
        cancel_url: `${process.env.HUB_URL || 'https://hub.acasaresidencial.com.br'}/payment-cancel?order=${orderId}`,
        metadata: {
          orderId,
          customerPhone,
        },
        customer_phone: customerPhone,
        locale: 'pt-BR',
      });

      return {
        method: 'card',
        orderId,
        amount,
        paymentUrl: session.url,
        sessionId: session.id,
        instructions: `
💳 *PAGAMENTO VIA CARTÃO*

*🧾 Pedido:* ${orderId}
*💰 Valor:* ${this.formatPrice(amount)}

*🔗 Link de Pagamento Seguro:*
${session.url}

*💳 Aceitamos:*
• Visa, Mastercard, Elo
• Débito e Crédito
• Parcelamento até 12x

*🔒 Pagamento 100% Seguro*
• Processado pela Stripe
• Criptografia SSL
• Dados protegidos

Clique no link para finalizar seu pagamento!
        `.trim(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      };

    } catch (error) {
      console.error('Error creating Stripe session:', error);
      return this.generateManualCardPayment(orderId, amount);
    }
  }

  generateManualCardPayment(orderId, amount) {
    return {
      method: 'card',
      orderId,
      amount,
      instructions: `
💳 *PAGAMENTO VIA CARTÃO*

*🧾 Pedido:* ${orderId}
*💰 Valor:* ${this.formatPrice(amount)}

*📞 Para pagamento com cartão:*
Ligue para nossa central:
*(21) 2543-2880* - Botafogo
*(21) 2234-5670* - Tijuca

*💳 Aceitamos:*
• Visa, Mastercard, Elo
• Débito e Crédito
• Parcelamento até 12x

*🕐 Horário para pagamento:*
Segunda a Sexta: 8h às 18h
Sábado: 8h às 12h

Nossa equipe processará seu cartão com segurança!
      `.trim()
    };
  }

  // Generate boleto payment
  generateBoletoPayment(orderId, amount, customerPhone) {
    const dueDate = this.getBusinessDaysFromNow(3);
    
    return {
      method: 'boleto',
      orderId,
      amount,
      dueDate,
      instructions: `
🧾 *PAGAMENTO VIA BOLETO*

*📄 Pedido:* ${orderId}
*💰 Valor:* ${this.formatPrice(amount)}
*📅 Vencimento:* ${dueDate}

*📧 Para receber o boleto:*
Informe seu email:
*email [seu@email.com]*

Exemplo: *email joao@gmail.com*

*⚠️ Importante:*
• Boleto enviado em até 2 horas
• Vencimento em 3 dias úteis
• Compensação em 1-2 dias úteis
• Juros de 2% ao mês após vencimento

*📞 Dúvidas sobre boleto:*
(21) 2543-2880 - Setor Financeiro
      `.trim(),
      expiresAt: new Date(dueDate)
    };
  }

  // Process payment confirmation
  async confirmPayment(orderId, paymentMethod, supabaseClient) {
    try {
      const { error } = await supabaseClient
        .from('orders')
        .update({
          payment_status: 'paid',
          payment_method: paymentMethod,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      return {
        success: true,
        confirmationMessage: `
✅ *PAGAMENTO CONFIRMADO*

*🧾 Pedido:* ${orderId}
*💳 Método:* ${paymentMethod.toUpperCase()}
*📅 Confirmado em:* ${new Date().toLocaleString('pt-BR')}

*📦 Próximos passos:*
• Pedido em processamento
• Previsão de entrega: 24-48h
• Acompanhe pelo número do pedido

*📞 Acompanhamento:*
(21) 2543-2880 - Comercial

Obrigado por escolher a ACASA! 🏠
        `.trim()
      };

    } catch (error) {
      console.error('Error confirming payment:', error);
      return {
        success: false,
        error: 'Erro ao confirmar pagamento'
      };
    }
  }

  // Utility functions
  formatPrice(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  getBusinessDaysFromNow(days) {
    const date = new Date();
    let addedDays = 0;
    
    while (addedDays < days) {
      date.setDate(date.getDate() + 1);
      // Skip weekends
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        addedDays++;
      }
    }
    
    return date.toLocaleDateString('pt-BR');
  }

  // Webhook handler for payment confirmations
  async handlePaymentWebhook(webhookData, supabaseClient) {
    try {
      if (webhookData.type === 'checkout.session.completed') {
        const session = webhookData.data.object;
        const orderId = session.metadata.orderId;
        
        await this.confirmPayment(orderId, 'card', supabaseClient);
        
        console.log(`💳 Payment confirmed for order ${orderId}`);
        return { success: true };
      }
      
      return { success: false, message: 'Unhandled webhook type' };
    } catch (error) {
      console.error('Error handling payment webhook:', error);
      return { success: false, error: error.message };
    }
  }
}