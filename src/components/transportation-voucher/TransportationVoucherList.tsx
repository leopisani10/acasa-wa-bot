import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Check, X, Calendar, DollarSign, Filter } from 'lucide-react';
import { useTransportationVouchers } from '../../contexts/TransportationVoucherContext';
import { TransportationVoucherForm } from './TransportationVoucherForm';
import { TransportationVoucher } from '../../types';

export const TransportationVoucherList: React.FC = () => {
  const { vouchers, loading, deleteVoucher, updateVoucher } = useTransportationVouchers();
  const [showForm, setShowForm] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<TransportationVoucher | undefined>();
  const [filterMonth, setFilterMonth] = useState('');
  const [filterPaid, setFilterPaid] = useState<'all' | 'paid' | 'unpaid'>('all');

  const handleEdit = (voucher: TransportationVoucher) => {
    setEditingVoucher(voucher);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este registro de vale transporte?')) {
      try {
        await deleteVoucher(id);
      } catch (error) {
        console.error('Error deleting voucher:', error);
      }
    }
  };

  const handleTogglePaid = async (voucher: TransportationVoucher) => {
    try {
      await updateVoucher(voucher.id, {
        paid: !voucher.paid,
        paymentDate: !voucher.paid ? new Date().toISOString().split('T')[0] : voucher.paymentDate,
      });
    } catch (error) {
      console.error('Error updating voucher:', error);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingVoucher(undefined);
  };

  const formatMonthDisplay = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    return `${months[parseInt(month) - 1]}/${year}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  const filteredVouchers = vouchers.filter(voucher => {
    if (filterMonth && voucher.referenceMonth !== filterMonth) return false;
    if (filterPaid === 'paid' && !voucher.paid) return false;
    if (filterPaid === 'unpaid' && voucher.paid) return false;
    return true;
  });

  const totalValue = filteredVouchers.reduce((sum, v) => sum + v.totalValue, 0);
  const paidValue = filteredVouchers.filter(v => v.paid).reduce((sum, v) => sum + v.totalValue, 0);
  const unpaidValue = totalValue - paidValue;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vale Transporte</h1>
          <p className="text-gray-600 mt-1">Gerencie os pagamentos de vale transporte dos colaboradores</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Novo Registro
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center mb-4">
          <Filter className="text-gray-600 mr-2" size={20} />
          <h3 className="font-medium text-gray-900">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mês de Referência
            </label>
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status de Pagamento
            </label>
            <select
              value={filterPaid}
              onChange={(e) => setFilterPaid(e.target.value as 'all' | 'paid' | 'unpaid')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos</option>
              <option value="paid">Pagos</option>
              <option value="unpaid">Não Pagos</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Geral</p>
              <p className="text-2xl font-bold text-gray-900">R$ {totalValue.toFixed(2)}</p>
            </div>
            <DollarSign className="text-gray-400" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-green-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pagos</p>
              <p className="text-2xl font-bold text-green-600">R$ {paidValue.toFixed(2)}</p>
            </div>
            <Check className="text-green-400" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-red-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendentes</p>
              <p className="text-2xl font-bold text-red-600">R$ {unpaidValue.toFixed(2)}</p>
            </div>
            <X className="text-red-400" size={32} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Colaborador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mês Ref.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor/Dia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dias
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pagamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">Nenhum registro de vale transporte encontrado</p>
                    <button
                      onClick={() => setShowForm(true)}
                      className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Adicionar primeiro registro
                    </button>
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((voucher) => (
                  <tr key={voucher.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{voucher.employeeName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatMonthDisplay(voucher.referenceMonth)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">R$ {voucher.dailyValue.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{voucher.workingDays}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">R$ {voucher.totalValue.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(voucher.paymentDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleTogglePaid(voucher)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          voucher.paid
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {voucher.paid ? (
                          <>
                            <Check size={14} className="mr-1" />
                            Pago
                          </>
                        ) : (
                          <>
                            <X size={14} className="mr-1" />
                            Pendente
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(voucher)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(voucher.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <TransportationVoucherForm
          voucher={editingVoucher}
          onClose={handleCloseForm}
          onSave={handleCloseForm}
        />
      )}
    </div>
  );
};
