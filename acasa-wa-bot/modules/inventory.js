// Inventory Management Module
export class InventoryManager {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
    this.lowStockThreshold = 10;
    this.reorderLevel = 5;
  }

  // Check product availability
  async checkAvailability(productName, requestedQuantity) {
    try {
      const { data: product, error } = await this.supabase
        .from('products')
        .select('*')
        .ilike('name', `%${productName}%`)
        .eq('active', true)
        .single();

      if (error || !product) {
        return {
          available: false,
          reason: 'product_not_found',
          message: `Produto "${productName}" não encontrado em nosso catálogo.`
        };
      }

      if (product.stock < requestedQuantity) {
        return {
          available: false,
          reason: 'insufficient_stock',
          product,
          availableStock: product.stock,
          message: `Estoque insuficiente. Disponível: ${product.stock} unidades. Solicitado: ${requestedQuantity}.`
        };
      }

      if (requestedQuantity < product.minimum_order) {
        return {
          available: false,
          reason: 'below_minimum',
          product,
          message: `Pedido mínimo: ${product.minimum_order} unidades. Solicitado: ${requestedQuantity}.`
        };
      }

      if (requestedQuantity > product.maximum_order) {
        return {
          available: false,
          reason: 'above_maximum',
          product,
          message: `Pedido máximo: ${product.maximum_order} unidades. Solicitado: ${requestedQuantity}.`
        };
      }

      return {
        available: true,
        product,
        requestedQuantity,
        totalPrice: product.price * requestedQuantity
      };

    } catch (error) {
      console.error('Error checking availability:', error);
      return {
        available: false,
        reason: 'system_error',
        message: 'Erro ao verificar disponibilidade. Tente novamente.'
      };
    }
  }

  // Reserve stock for order
  async reserveStock(productId, quantity, orderId) {
    try {
      // Get current stock
      const { data: product, error: fetchError } = await this.supabase
        .from('products')
        .select('stock')
        .eq('id', productId)
        .single();

      if (fetchError || !product) {
        throw new Error('Product not found');
      }

      if (product.stock < quantity) {
        throw new Error('Insufficient stock');
      }

      // Update stock
      const newStock = product.stock - quantity;
      const { error: updateError } = await this.supabase
        .from('products')
        .update({ 
          stock: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (updateError) throw updateError;

      // Log the reservation
      await this.logInventoryChange(productId, -quantity, 'reserved', orderId);

      console.log(`📦 Reserved ${quantity} units of product ${productId} for order ${orderId}`);
      return { success: true, newStock };

    } catch (error) {
      console.error('Error reserving stock:', error);
      return { success: false, error: error.message };
    }
  }

  // Release reserved stock (if order is cancelled)
  async releaseStock(productId, quantity, orderId) {
    try {
      const { data: product, error: fetchError } = await this.supabase
        .from('products')
        .select('stock')
        .eq('id', productId)
        .single();

      if (fetchError || !product) {
        throw new Error('Product not found');
      }

      const newStock = product.stock + quantity;
      const { error: updateError } = await this.supabase
        .from('products')
        .update({ 
          stock: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (updateError) throw updateError;

      await this.logInventoryChange(productId, quantity, 'released', orderId);

      console.log(`📦 Released ${quantity} units of product ${productId} from order ${orderId}`);
      return { success: true, newStock };

    } catch (error) {
      console.error('Error releasing stock:', error);
      return { success: false, error: error.message };
    }
  }

  // Check for low stock items
  async getLowStockItems() {
    try {
      const { data: products, error } = await this.supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .lte('stock', this.lowStockThreshold)
        .order('stock');

      if (error) throw error;

      return products || [];
    } catch (error) {
      console.error('Error getting low stock items:', error);
      return [];
    }
  }

  // Generate low stock alert message
  async generateLowStockAlert() {
    const lowStockItems = await this.getLowStockItems();
    
    if (lowStockItems.length === 0) {
      return null;
    }

    let alertMessage = '⚠️ *ALERTA DE ESTOQUE BAIXO*\n\n';
    
    lowStockItems.forEach(product => {
      const urgency = product.stock <= this.reorderLevel ? '🔴 URGENTE' : '🟡 ATENÇÃO';
      alertMessage += `${urgency} *${product.name}*\n`;
      alertMessage += `📦 Estoque atual: ${product.stock} ${product.unit}\n`;
      alertMessage += `💰 Preço: ${this.formatPrice(product.price)}\n`;
      alertMessage += `---\n`;
    });

    alertMessage += '\n📞 *Ação necessária:* Entre em contato com fornecedores';
    alertMessage += '\n🔄 *Reabastecer produtos* para continuar vendas';

    return alertMessage;
  }

  // Log inventory changes
  async logInventoryChange(productId, quantityChange, reason, orderId = null) {
    try {
      await this.supabase
        .from('inventory_logs')
        .insert([{
          product_id: productId,
          quantity_change: quantityChange,
          reason,
          order_id: orderId,
          timestamp: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('Error logging inventory change:', error);
    }
  }

  // Bulk update inventory
  async bulkUpdateInventory(updates) {
    // updates = [{ productId, newStock, reason }]
    try {
      for (const update of updates) {
        await this.supabase
          .from('products')
          .update({ 
            stock: update.newStock,
            updated_at: new Date().toISOString()
          })
          .eq('id', update.productId);

        await this.logInventoryChange(
          update.productId, 
          update.newStock, 
          update.reason || 'bulk_update'
        );
      }

      return { success: true, updated: updates.length };
    } catch (error) {
      console.error('Error in bulk inventory update:', error);
      return { success: false, error: error.message };
    }
  }

  // Get inventory report
  async getInventoryReport() {
    try {
      const { data: products, error } = await this.supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('category', { ascending: true });

      if (error) throw error;

      const report = {
        totalProducts: products.length,
        totalValue: products.reduce((sum, p) => sum + (p.stock * p.price), 0),
        lowStockCount: products.filter(p => p.stock <= this.lowStockThreshold).length,
        outOfStockCount: products.filter(p => p.stock === 0).length,
        categories: {}
      };

      // Group by category
      products.forEach(product => {
        if (!report.categories[product.category]) {
          report.categories[product.category] = {
            products: 0,
            totalValue: 0,
            lowStock: 0
          };
        }
        
        report.categories[product.category].products++;
        report.categories[product.category].totalValue += product.stock * product.price;
        if (product.stock <= this.lowStockThreshold) {
          report.categories[product.category].lowStock++;
        }
      });

      return report;
    } catch (error) {
      console.error('Error generating inventory report:', error);
      return null;
    }
  }

  formatPrice(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }
}