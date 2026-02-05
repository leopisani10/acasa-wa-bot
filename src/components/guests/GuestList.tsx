import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Eye, User, Calendar, MapPin, FileText, Upload, Download } from 'lucide-react';
import { useGuests } from '../../contexts/GuestContext';
import { Guest } from '../../types';
import { GuestImport } from './GuestImport';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface GuestListProps {
  onAddGuest: () => void;
  onEditGuest: (guest: Guest) => void;
}

export const GuestList: React.FC<GuestListProps> = ({ onAddGuest, onEditGuest }) => {
  const { guests, deleteGuest } = useGuests();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Ativo' | 'Inativo' | 'Reservado'>('all');
  const [unitFilter, setUnitFilter] = useState<'all' | 'Botafogo'>('all');
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [showImport, setShowImport] = useState(false);

  const filteredGuests = guests.filter(guest => {
    const matchesSearch = guest.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guest.cpf.includes(searchTerm) ||
                         guest.roomNumber.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || guest.status === statusFilter;
    const matchesUnit = unitFilter === 'all' || guest.unit === unitFilter;
    return matchesSearch && matchesStatus && matchesUnit;
  });

  const handleDelete = (guest: Guest) => {
    if (window.confirm(`Tem certeza que deseja excluir o hóspede ${guest.fullName}?`)) {
      deleteGuest(guest.id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const exportToPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');

    doc.setFontSize(18);
    doc.text('Lista de Hóspedes - ACASA', 14, 15);

    doc.setFontSize(11);
    doc.text(`Data de Geração: ${new Date().toLocaleDateString('pt-BR')}`, 14, 22);

    const tableData = filteredGuests.map(guest => [
      guest.fullName,
      guest.roomNumber,
      guest.unit,
      guest.cpf,
      `${calculateAge(guest.birthDate)} anos`,
      `Grau ${guest.dependencyLevel}`,
      guest.healthPlan || 'Não informado',
      guest.status
    ]);

    autoTable(doc, {
      startY: 28,
      head: [['Nome', 'Quarto', 'Unidade', 'CPF', 'Idade', 'Dependência', 'Plano de Saúde', 'Status']],
      body: tableData,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [103, 58, 183], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 250] },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 25 },
        3: { cellWidth: 30 },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 25, halign: 'center' },
        6: { cellWidth: 35 },
        7: { cellWidth: 20, halign: 'center' }
      },
      didDrawPage: (data) => {
        const pageCount = doc.getNumberOfPages();
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        doc.setFontSize(9);
        doc.text(
          `Página ${data.pageNumber} de ${pageCount}`,
          data.settings.margin.left,
          pageHeight - 10
        );
      }
    });

    doc.save(`hospedes-acasa-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between font-sans">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 font-sans">Hóspedes</h2>
          <p className="text-gray-600 font-sans">Gerencie os residentes da ACASA</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button
            onClick={exportToPDF}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-sans font-medium"
            title="Exportar lista em PDF"
          >
            <Download size={20} className="mr-2" />
            Exportar PDF
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-sans font-medium"
          >
            <Upload size={20} className="mr-2" />
            Importar Planilha
          </button>
          <button
            onClick={onAddGuest}
            className="flex items-center px-4 py-2 bg-acasa-purple text-white rounded-lg hover:bg-purple-700 transition-colors font-sans font-medium"
          >
            <Plus size={20} className="mr-2" />
            Novo Hóspede
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 font-sans">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome, CPF ou quarto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'Ativo' | 'Inativo' | 'Reservado')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans"
        >
          <option value="all">Todos os Status</option>
          <option value="Ativo">Ativo</option>
          <option value="Reservado">Reservado</option>
          <option value="Inativo">Inativo</option>
        </select>
        <select
          value={unitFilter}
          onChange={(e) => setUnitFilter(e.target.value as 'all' | 'Botafogo')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans"
        >
          <option value="all">Todas as Unidades</option>
          <option value="Botafogo">Botafogo</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-sans">
        <div className="bg-white border border-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium font-sans">Total de Hóspedes</p>
              <p className="text-2xl font-bold text-gray-900 font-sans">{guests.length}</p>
            </div>
            <User className="text-acasa-purple" size={20} />
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium font-sans">Ativos</p>
              <p className="text-2xl font-bold text-gray-900 font-sans">
                {guests.filter(g => g.status === 'Ativo').length}
              </p>
            </div>
            <User className="text-green-600" size={20} />
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium font-sans">Reservas</p>
              <p className="text-2xl font-bold text-gray-900 font-sans">
                {guests.filter(g => g.status === 'Reservado').length}
              </p>
            </div>
            <Calendar className="text-blue-600" size={20} />
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium font-sans">Inativos</p>
              <p className="text-2xl font-bold text-gray-900 font-sans">
                {guests.filter(g => g.status === 'Inativo').length}
              </p>
            </div>
            <User className="text-acasa-red" size={20} />
          </div>
        </div>
      </div>

      {/* Guest Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Quarto
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Unidade
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  CPF
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Idade
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Dependência
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Plano de Saúde
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredGuests.map((guest) => (
                <tr key={guest.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {guest.fullName}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <span className="font-bold text-acasa-purple">{guest.roomNumber}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {guest.unit}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 font-mono">
                    {guest.cpf}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-center">
                    {calculateAge(guest.birthDate)} anos
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-acasa-purple">
                      Grau {guest.dependencyLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {guest.healthPlan || 'Não informado'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      guest.status === 'Ativo'
                        ? 'bg-green-100 text-green-700'
                        : guest.status === 'Reservado'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {guest.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => setSelectedGuest(guest)}
                        className="p-1.5 text-acasa-purple hover:bg-purple-50 rounded transition-colors"
                        title="Ver detalhes"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => onEditGuest(guest)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(guest)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredGuests.length === 0 && (
        <div className="text-center py-12 font-sans">
          <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2 font-sans">Nenhum hóspede encontrado</h3>
          <p className="text-gray-600 mb-4 font-sans">
            {searchTerm
              ? 'Tente ajustar os filtros de busca.'
              : 'Comece adicionando o primeiro hóspede.'}
          </p>
          {!searchTerm && (
            <button
              onClick={onAddGuest}
             className="inline-flex items-center px-4 py-2 bg-acasa-purple text-white rounded-lg hover:bg-purple-700 transition-colors font-sans font-medium"
            >
              <Plus size={20} className="mr-2" />
              Adicionar Hóspede
            </button>
          )}
        </div>
      )}

      {/* Guest Detail Modal */}
      {selectedGuest && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-sans">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden font-sans">
            <div className="bg-acasa-purple p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-1 font-sans">{selectedGuest.fullName}</h2>
                  <p className="text-purple-100 text-sm font-sans">Detalhes do Hóspede</p>
                </div>
                <button
                  onClick={() => setSelectedGuest(null)}
                  className="text-white hover:text-purple-200 transition-colors bg-white/20 hover:bg-white/30 rounded-full p-2 font-sans"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
              <div className="space-y-8">
                {/* Status Badge - mais singelo */}
                <div className="flex justify-start">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    selectedGuest.status === 'Ativo'
                      ? 'bg-green-100 text-green-700'
                      : selectedGuest.status === 'Reservado'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-red-100 text-red-700'
                  } font-sans`}>
                    {selectedGuest.status}
                  </span>
                </div>

                {/* Reservation Info - only show if status is Reservado */}
                {selectedGuest.status === 'Reservado' && (
                  <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 border border-blue-200">
                    <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center font-sans">
                      <Calendar className="mr-2 text-blue-600" size={20} />
                      Informações da Reserva
                    </h3>
                    <div className="space-y-3 text-sm font-sans">
                      {selectedGuest.reservationDate && (
                        <div className="flex justify-between items-center py-2 border-b border-blue-100">
                          <span className="font-medium text-gray-600 font-sans">Data da Reserva:</span>
                          <span className="font-bold text-gray-900 font-sans">{formatDate(selectedGuest.reservationDate)}</span>
                        </div>
                      )}
                      {selectedGuest.expectedEntryDate && (
                        <div className="flex justify-between items-center py-2 border-b border-blue-100">
                          <span className="font-medium text-gray-600 font-sans">Previsão de Entrada:</span>
                          <span className="font-bold text-blue-600 font-sans">{formatDate(selectedGuest.expectedEntryDate)}</span>
                        </div>
                      )}
                      {selectedGuest.reservationNotes && (
                        <div className="py-2">
                          <span className="font-medium text-gray-600 block mb-2 font-sans">Observações:</span>
                          <p className="text-gray-900 font-sans bg-white p-3 rounded-lg border border-blue-100">{selectedGuest.reservationNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Main Info Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-6 border border-purple-100">
                    <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center font-sans">
                      <User className="mr-2 text-acasa-purple" size={20} />
                      Informações Pessoais
                    </h3>
                    <div className="space-y-3 text-sm font-sans">
                      <div className="flex justify-between items-center py-2 border-b border-purple-100">
                        <span className="font-medium text-gray-600 font-sans">Nome:</span>
                        <span className="font-bold text-gray-900 font-sans">{selectedGuest.fullName}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-purple-100">
                        <span className="font-medium text-gray-600 font-sans">Sexo:</span>
                        <span className="font-bold text-gray-900 font-sans">{selectedGuest.gender}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-purple-100">
                        <span className="font-medium text-gray-600 font-sans">Idade:</span>
                        <span className="font-bold text-acasa-purple font-sans">{calculateAge(selectedGuest.birthDate)} anos</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-purple-100">
                        <span className="font-medium text-gray-600 font-sans">CPF:</span>
                        <span className="font-mono font-bold text-gray-900 font-sans">{selectedGuest.cpf}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="font-medium text-gray-600 font-sans">RG:</span>
                        <span className="font-mono font-bold text-gray-900 font-sans">{selectedGuest.rg}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 border border-blue-100">
                    <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center font-sans">
                      <MapPin className="mr-2 text-blue-600" size={20} />
                      Informações da Residência
                    </h3>
                    <div className="space-y-3 text-sm font-sans">
                      <div className="flex justify-between items-center py-2 border-b border-blue-100">
                        <span className="font-medium text-gray-600 font-sans">Quarto:</span>
                        <span className="font-bold text-blue-600 text-lg font-sans">{selectedGuest.roomNumber}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-blue-100">
                        <span className="font-medium text-gray-600 font-sans">Unidade:</span>
                        <span className="font-bold text-gray-900 font-sans">{selectedGuest.unit}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-blue-100">
                        <span className="font-medium text-gray-600 font-sans">Dependência:</span>
                        <span className="font-bold text-acasa-purple font-sans">Grau {selectedGuest.dependencyLevel}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-blue-100">
                        <span className="font-medium text-gray-600 font-sans">Admissão:</span>
                        <span className="font-bold text-gray-900 font-sans">{formatDate(selectedGuest.admissionDate)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="font-medium text-gray-600 font-sans">Plano de Saúde:</span>
                        <span className="font-bold text-gray-900 font-sans">{selectedGuest.healthPlan || 'Não informado'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Responsible */}
                <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-6 border border-green-100">
                  <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center font-sans">
                    <User className="mr-2 text-green-600" size={20} />
                    Responsável Financeiro
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-sans">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-green-100">
                        <span className="font-medium text-gray-600 font-sans">Nome:</span>
                        <span className="font-bold text-gray-900 font-sans">{selectedGuest.financialResponsibleName}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-green-100">
                        <span className="font-medium text-gray-600 font-sans">CPF:</span>
                        <span className="font-mono font-bold text-gray-900 font-sans">{selectedGuest.financialResponsibleCpf}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="font-medium text-gray-600 font-sans">Estado Civil:</span>
                        <span className="font-bold text-gray-900 font-sans">{selectedGuest.financialResponsibleMaritalStatus}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-green-100">
                        <span className="font-medium text-gray-600 font-sans">Telefone:</span>
                        <span className="font-bold text-gray-900 font-sans">{selectedGuest.financialResponsiblePhone}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-green-100">
                        <span className="font-medium text-gray-600 font-sans">Email:</span>
                        <span className="font-bold text-gray-900 font-sans">{selectedGuest.financialResponsibleEmail || 'Não informado'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="font-medium text-gray-600 font-sans">Profissão:</span>
                        <span className="font-bold text-gray-900 font-sans">{selectedGuest.financialResponsibleProfession || 'Não informado'}</span>
                      </div>
                    </div>
                  </div>
                  {selectedGuest.financialResponsibleAddress && (
                    <div className="mt-4 pt-4 border-t border-green-100">
                      <div className="flex justify-between items-start py-2">
                        <span className="font-medium text-gray-600 font-sans">Endereço:</span>
                        <span className="font-bold text-gray-900 text-right max-w-md font-sans">{selectedGuest.financialResponsibleAddress}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Documents */}
                {(selectedGuest.pia || selectedGuest.paisi || selectedGuest.digitalizedContract) && (
                  <div className="bg-gradient-to-br from-yellow-50 to-white rounded-xl p-6 border border-yellow-100">
                    <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center font-sans">
                      <FileText className="mr-2 text-yellow-600" size={20} />
                      Documentos
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {selectedGuest.pia && (
                        <div className="bg-white rounded-lg p-4 border border-yellow-200">
                          <div className="flex items-center space-x-2">
                            <FileText size={16} className="text-acasa-purple" />
                            <a 
                              href={selectedGuest.pia} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-acasa-purple hover:underline font-bold text-sm font-sans"
                            >
                              Visualizar PIA
                            </a>
                          </div>
                        </div>
                      )}
                      {selectedGuest.paisi && (
                        <div className="bg-white rounded-lg p-4 border border-yellow-200">
                          <div className="flex items-center space-x-2">
                            <FileText size={16} className="text-acasa-purple" />
                            <a 
                              href={selectedGuest.paisi} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-acasa-purple hover:underline font-bold text-sm font-sans"
                            >
                              Visualizar PAISI
                            </a>
                          </div>
                        </div>
                      )}
                      {selectedGuest.digitalizedContract && (
                        <div className="bg-white rounded-lg p-4 border border-yellow-200">
                          <div className="flex items-center space-x-2">
                            <FileText size={16} className="text-acasa-purple" />
                            <a 
                              href={selectedGuest.digitalizedContract} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-acasa-purple hover:underline font-bold text-sm font-sans"
                            >
                              Visualizar Contrato
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {/* Vaccines */}
                {selectedGuest.vaccines.length > 0 && (
                  <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl p-6 border border-indigo-100">
                    <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center font-sans">
                      <Calendar className="mr-2 text-indigo-600" size={20} />
                      Vacinas
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedGuest.vaccines.map((vaccine) => (
                        <div key={vaccine.id} className="bg-white rounded-lg p-4 border border-indigo-200">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-indigo-700 font-sans">{vaccine.type}</span>
                            <span className="text-sm font-bold text-gray-900 font-sans">{formatDate(vaccine.applicationDate)}</span>
                          </div>
                          {vaccine.notes && (
                            <p className="text-sm text-gray-600 mt-2 italic font-sans">{vaccine.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-gray-50 border-t border-gray-200 p-6">
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setSelectedGuest(null)}
                  className="px-6 py-2.5 text-gray-700 border-2 border-gray-300 rounded-xl hover:bg-gray-100 transition-colors font-bold font-sans"
                >
                  Fechar
                </button>
                <button
                  onClick={() => {
                    onEditGuest(selectedGuest);
                    setSelectedGuest(null);
                  }}
                  className="flex items-center px-6 py-2.5 bg-acasa-purple text-white rounded-xl hover:bg-purple-700 transition-colors font-bold border-2 border-acasa-purple font-sans"
                >
                  <Edit size={18} className="mr-2" />
                  Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <GuestImport
          onClose={() => setShowImport(false)}
          onImported={() => {
            // Refresh the guest list or trigger re-fetch
            window.location.reload(); // Simple refresh for now
          }}
        />
      )}
    </div>
  );
};