import React, { useState } from 'react';
import { Clipboard, Filter, Printer as Print, Users, MapPin } from 'lucide-react';
import { useGuests } from '../../contexts/GuestContext';

export const EscalaKatz: React.FC = () => {
  const { guests } = useGuests();
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [dependencyFilter, setDependencyFilter] = useState<string>('all');

  // Filtrar hóspedes ativos
  const activeGuests = guests.filter(guest => guest.status === 'Ativo');

  // Aplicar filtros
  const filteredGuests = activeGuests.filter(guest => {
    const matchesUnit = unitFilter === 'all' || guest.unit === unitFilter;
    const matchesDependency = dependencyFilter === 'all' || guest.dependencyLevel === dependencyFilter;
    return matchesUnit && matchesDependency;
  });

  // Agrupar por grau de dependência
  const guestsByDependency = {
    'I': filteredGuests.filter(g => g.dependencyLevel === 'I'),
    'II': filteredGuests.filter(g => g.dependencyLevel === 'II'),
    'III': filteredGuests.filter(g => g.dependencyLevel === 'III'),
  };

  // Função de impressão
  const handlePrint = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Escala de Katz - ACASA Residencial Sênior</title>
          <style>
            body { font-family: 'Poppins', Arial, sans-serif; margin: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #8B2C8A; padding-bottom: 20px; }
            .institution { font-size: 24px; font-weight: bold; color: #8B2C8A; margin-bottom: 10px; }
            .unit-header { font-size: 18px; font-weight: 600; color: #666; margin-bottom: 10px; }
            .subtitle { font-size: 16px; color: #666; }
            .unit-section { margin-bottom: 40px; }
            .unit-title { font-size: 20px; font-weight: bold; color: #8B2C8A; margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
            .dependency-group { margin-bottom: 30px; }
            .dependency-title { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 15px; background-color: #f8f9fa; padding: 10px; border-left: 4px solid #8B2C8A; }
            .guest-list { margin-bottom: 20px; }
            .guest-item { padding: 12px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
            .guest-item:last-child { border-bottom: none; }
            .guest-main { flex: 1; }
            .guest-name { font-weight: bold; font-size: 16px; color: #333; margin-bottom: 3px; }
            .guest-info { font-size: 14px; color: #666; }
            .guest-grade { font-weight: bold; color: #8B2C8A; font-size: 18px; padding: 5px 10px; border: 2px solid #8B2C8A; border-radius: 50%; }
            .stats { display: flex; justify-content: space-around; margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px; }
            .stat-item { text-align: center; }
            .stat-number { font-size: 24px; font-weight: bold; color: #8B2C8A; }
            .stat-label { font-size: 14px; color: #666; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="institution">ACASA Residencial Sênior</div>
            ${unitFilter !== 'all' ? `<div class="unit-header">Unidade ${unitFilter}</div>` : ''}
            <div class="subtitle">Escala de Katz - Relatório de Graus de Dependência</div>
            <div class="subtitle">Data: ${new Date().toLocaleDateString('pt-BR')}</div>
          </div>

          <div class="stats">
            <div class="stat-item">
              <div class="stat-number">${filteredGuests.length}</div>
              <div class="stat-label">Total de Hóspedes</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${guestsByDependency['I'].length}</div>
              <div class="stat-label">Grau I</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${guestsByDependency['II'].length}</div>
              <div class="stat-label">Grau II</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${guestsByDependency['III'].length}</div>
              <div class="stat-label">Grau III</div>
            </div>
          </div>

          ${['Botafogo'].map(unit => {
            const unitGuests = filteredGuests.filter(g => g.unit === unit);
            if (unitGuests.length === 0) return '';
            
            return `
              <div class="unit-section">
                <div class="unit-title">📍 Unidade ${unit} (${unitGuests.length} hóspedes)</div>
                
                ${['I', 'II', 'III'].map(level => {
                  const levelGuests = unitGuests.filter(g => g.dependencyLevel === level);
                  if (levelGuests.length === 0) return '';
                  
                  return `
                    <div class="dependency-group">
                      <div class="dependency-title">Grau de Dependência ${level} (${levelGuests.length} hóspedes)</div>
                      <div class="guest-list">
                        ${levelGuests.map(guest => `
                          <div class="guest-item">
                            <div class="guest-main">
                              <div class="guest-name">${guest.fullName}</div>
                              <div class="guest-info">Quarto: ${guest.roomNumber} • CPF: ${guest.cpf}</div>
                            </div>
                            <div class="guest-grade">${guest.dependencyLevel}</div>
                          </div>
                        `).join('')}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `;
          }).join('')}

          <div class="footer">
            <p>ACASA Residencial Sênior - Sistema de Gestão Integrada</p>
            <p>Relatório gerado em ${new Date().toLocaleString('pt-BR')}</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-acasa-purple p-4 rounded-full">
            <Clipboard className="text-white" size={32} />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 font-sans">
          Escala de Katz
        </h1>
        <p className="text-gray-600 font-sans">Classificação por grau de dependência funcional</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <Filter size={20} className="text-acasa-purple" />
            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
            >
              <option value="all">Todas as Unidades</option>
              <option value="Botafogo">Botafogo</option>
            </select>
          </div>
          
          <select
            value={dependencyFilter}
            onChange={(e) => setDependencyFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
          >
            <option value="all">Todos os Graus</option>
            <option value="I">Grau I</option>
            <option value="II">Grau II</option>
            <option value="III">Grau III</option>
          </select>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center px-6 py-2 bg-acasa-purple text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
        >
          <Print size={20} className="mr-2" />
          Imprimir Relatório
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total</p>
              <p className="text-3xl font-bold text-acasa-purple">{filteredGuests.length}</p>
            </div>
            <Users className="text-acasa-purple" size={24} />
          </div>
        </div>
        
        <div className="bg-white border border-gray-100 p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Grau I</p>
              <p className="text-3xl font-bold text-green-600">{guestsByDependency['I'].length}</p>
            </div>
            <div className="text-green-600 font-bold text-lg">I</div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-100 p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Grau II</p>
              <p className="text-3xl font-bold text-yellow-600">{guestsByDependency['II'].length}</p>
            </div>
            <div className="text-yellow-600 font-bold text-lg">II</div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-100 p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Grau III</p>
              <p className="text-3xl font-bold text-red-600">{guestsByDependency['III'].length}</p>
            </div>
            <div className="text-red-600 font-bold text-lg">III</div>
          </div>
        </div>
      </div>

      {/* Dependency Groups */}
      <div className="space-y-8">
        {(['I', 'II', 'III'] as const).map(level => {
          const levelGuests = guestsByDependency[level];
          if (levelGuests.length === 0) return null;

          const colorClass = {
            'I': 'border-green-200 bg-green-50',
            'II': 'border-yellow-200 bg-yellow-50', 
            'III': 'border-red-200 bg-red-50'
          }[level];

          const textColorClass = {
            'I': 'text-green-700',
            'II': 'text-yellow-700',
            'III': 'text-red-700'
          }[level];

          return (
            <div key={level} className={`${colorClass} rounded-lg p-6 border`}>
              <h2 className={`text-2xl font-bold ${textColorClass} mb-6 flex items-center`}>
                <div className={`w-8 h-8 rounded-full ${textColorClass} flex items-center justify-center text-white font-bold mr-3`} style={{backgroundColor: 'currentColor'}}>
                  {level}
                </div>
                Grau de Dependência {level} ({levelGuests.length} hóspedes)
              </h2>
              
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-12 gap-2 p-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700 font-sans">
                  <div className="col-span-4 font-sans">Nome Completo</div>
                  <div className="col-span-2 font-sans">Quarto</div>
                  <div className="col-span-3 font-sans">CPF</div>
                  <div className="col-span-2 font-sans">Unidade</div>
                  <div className="col-span-1 text-center font-sans">Grau</div>
                </div>
                {levelGuests.map((guest, index) => (
                  <div key={guest.id} className={`grid grid-cols-12 gap-2 p-3 text-sm hover:bg-gray-50 transition-colors font-sans ${
                    index !== levelGuests.length - 1 ? 'border-b border-gray-100' : ''
                  }`}>
                    <div className="col-span-4 font-medium text-gray-900 font-sans">{guest.fullName}</div>
                    <div className="col-span-2 text-gray-600 font-sans">{guest.roomNumber}</div>
                    <div className="col-span-3 text-gray-600 font-mono text-xs font-sans">{guest.cpf}</div>
                    <div className="col-span-2 text-gray-600 font-sans">{guest.unit}</div>
                    <div className="col-span-1 flex justify-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs font-sans ${textColorClass}`} style={{backgroundColor: 'currentColor'}}>
                        {level}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {filteredGuests.length === 0 && (
        <div className="text-center py-12">
          <Clipboard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum hóspede encontrado</h3>
          <p className="text-gray-600">
            {unitFilter !== 'all' || dependencyFilter !== 'all'
              ? 'Tente ajustar os filtros de busca.'
              : 'Nenhum hóspede ativo cadastrado no sistema.'}
          </p>
        </div>
      )}

      {/* Info Card */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <div className="bg-purple-100 p-3 rounded-lg mr-4">
              <Clipboard className="text-acasa-purple" size={20} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 font-sans">Sobre os Graus de Dependência</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-bold text-green-700 mb-2">Grau I</h4>
              <p className="text-gray-600">Dependência parcial - necessita ajuda em até 3 atividades de autocuidado.</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-bold text-yellow-700 mb-2">Grau II</h4>
              <p className="text-gray-600">Dependência severa - necessita ajuda em 4 ou 5 atividades de autocuidado.</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <h4 className="font-bold text-red-700 mb-2">Grau III</h4>
              <p className="text-gray-600">Dependência total - necessita ajuda em todas as 6 atividades de autocuidado.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};