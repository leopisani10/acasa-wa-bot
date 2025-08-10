import React, { useState } from 'react';
import { Calendar, FileText, User, CheckCircle, Printer, Download } from 'lucide-react';
import { useSchedule } from '../../contexts/ScheduleContext';
import { MonthlyScheduleReport, ScheduleSubstitution } from '../../types';

interface MonthlyReportProps {
  scheduleType: 'Geral' | 'Enfermagem' | 'Nutrição';
  unit: string;
  month: number;
  year: number;
  employees: any[];
  onClose: () => void;
}

export const MonthlyReport: React.FC<MonthlyReportProps> = ({
  scheduleType,
  unit,
  month,
  year,
  employees,
  onClose
}) => {
  const { getScheduleForMonth, getSubstitutionsForMonth } = useSchedule();
  const [nurseSignature, setNurseSignature] = useState('');
  const [approved, setApproved] = useState(false);

  const monthSchedules = getScheduleForMonth(scheduleType, unit, month, year);
  const monthSubstitutions = getSubstitutionsForMonth(scheduleType, unit, month, year);
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Calcular relatório para cada funcionário
  const generateReport = (): MonthlyScheduleReport[] => {
    const allReports: MonthlyScheduleReport[] = [];
    
    // Relatórios dos funcionários regulares
    employees.forEach(employee => {
      const employeeSchedule = monthSchedules.find(s => s.employeeId === employee.id);
      const employeeSubstitutions = monthSubstitutions.filter(s => s.employeeId === employee.id);
      
      const shiftBreakdown = {
        SD: 0,
        DR: 0,
        '12': 0,
        '24': 0,
        '6h': 0,
      };

      let totalShifts = 0;
      let actualDaysWorked = 0;
      let substitutedDays = 0;

      if (employeeSchedule) {
        for (let day = 1; day <= daysInMonth; day++) {
          const dayKey = `day${day}` as keyof typeof employeeSchedule;
          const shift = employeeSchedule[dayKey] as string;
          
          // Verificar se foi substituído neste dia
          const wasSubstituted = employeeSubstitutions.some(sub => sub.day === day);
          
          if (shift && shift !== '') {
            totalShifts++;
            if (shift !== 'DR') {
              if (wasSubstituted) {
                substitutedDays++;
              } else {
                actualDaysWorked++;
              }
            }
            if (shiftBreakdown.hasOwnProperty(shift)) {
              shiftBreakdown[shift as keyof typeof shiftBreakdown]++;
            }
          }
        }
      }

      allReports.push({
        employeeId: employee.id,
        employeeName: employee.name,
        position: employee.position,
        unit: employee.unit,
        totalShifts,
        shiftBreakdown,
        substitutions: substitutedDays, // Quantas vezes foi substituído
        actualDaysWorked,
      });
    });
    
    // Agrupar substituições por substituto e adicionar como "funcionários"
    const substituteSummary = monthSubstitutions.reduce((acc, sub) => {
      if (!acc[sub.substituteName]) {
        acc[sub.substituteName] = {
          name: sub.substituteName,
          count: 0,
          employees: new Set<string>(),
          reasons: new Set<string>(),
          days: [],
        };
      }
      acc[sub.substituteName].count++;
      acc[sub.substituteName].employees.add(employees.find(e => e.id === sub.employeeId)?.name || 'Desconhecido');
      acc[sub.substituteName].reasons.add(sub.reason);
      acc[sub.substituteName].days.push(sub.day);
      return acc;
    }, {} as Record<string, { name: string; count: number; employees: Set<string>; reasons: Set<string>; days: number[] }>);

    // Adicionar curingas como "funcionários" na listagem
    Object.values(substituteSummary).forEach(substitute => {
      allReports.push({
        employeeId: `curinga-${substitute.name}`,
        employeeName: `${substitute.name} (CURINGA)`,
        position: 'Curinga/Substituto',
        unit: selectedUnit,
        totalShifts: substitute.count,
        shiftBreakdown: {
          SD: 0, // Não sabemos o tipo específico do turno do curinga
          DR: 0,
          '12': 0,
          '24': 0,
          '6h': 0,
        },
        substitutions: 0, // Curingas não são substituídos
        actualDaysWorked: substitute.count,
      });
    });

    return allReports.sort((a, b) => {
      // Curingas no final
      if (a.employeeName.includes('CURINGA') && !b.employeeName.includes('CURINGA')) return 1;
      if (!a.employeeName.includes('CURINGA') && b.employeeName.includes('CURINGA')) return -1;
      // Ordenar por dias trabalhados
      return b.actualDaysWorked - a.actualDaysWorked;
    });
  };

  const handlePrint = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório Mensal de Escalas - ${monthNames[month - 1]} ${year}</title>
          <style>
            body { font-family: 'Arial', sans-serif; margin: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #8B2C8A; padding-bottom: 20px; }
            .institution { font-size: 24px; font-weight: bold; color: #8B2C8A; margin-bottom: 10px; }
            .subtitle { font-size: 16px; color: #666; margin-bottom: 5px; }
            .summary { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; text-align: center; }
            .summary-item { }
            .summary-number { font-size: 24px; font-weight: bold; color: #8B2C8A; }
            .summary-label { font-size: 14px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #8B2C8A; color: white; font-weight: bold; }
            .shift-cell { text-align: center; font-weight: bold; }
            .substitutions-section { background-color: #fef7e6; padding: 20px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #f59e0b; }
            .substitute-item { background-color: white; padding: 12px; margin-bottom: 10px; border-radius: 6px; border: 1px solid #f59e0b; }
            .substitute-header { font-weight: bold; color: #f59e0b; margin-bottom: 5px; }
            .substitute-details { font-size: 12px; color: #666; }
            .signature-section { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 50px; }
            .signature-box { text-align: center; }
            .signature-line { border-top: 1px solid #333; padding-top: 10px; margin-top: 50px; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
            .approved-stamp { position: absolute; top: 150px; right: 50px; border: 3px solid #22c55e; color: #22c55e; padding: 10px 20px; font-weight: bold; transform: rotate(15deg); font-size: 18px; }
          </style>
        </head>
        <body>
          ${approved ? '<div class="approved-stamp">APROVADO</div>' : ''}
          
          <div class="header">
            <div class="institution">ACASA Residencial Sênior</div>
            <div class="subtitle">Relatório Mensal de Escalas - ${scheduleType}</div>
            <div class="subtitle">Unidade: ${unit} • ${monthNames[month - 1]} ${year}</div>
            <div class="subtitle">Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</div>
          </div>

          <div class="summary">
            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-number">${reportData.length}</div>
                <div class="summary-label">Colaboradores</div>
              </div>
              <div class="summary-item">
                <div class="summary-number">${totalWorkDays}</div>
                <div class="summary-label">Total Dias Trabalhados</div>
              </div>
              <div class="summary-item">
                <div class="summary-number">${daysInMonth}</div>
                <div class="summary-label">Dias no Mês</div>
              </div>
              <div class="summary-item">
                <div class="summary-number">${totalSubstitutions}</div>
                <div class="summary-label">Total Substituições</div>
              </div>
            </div>
          </div>

          ${Object.keys(substituteSummary).length > 0 ? `
            <div class="substitutions-section">
              <h3 style="margin-bottom: 20px; color: #f59e0b; font-weight: bold;">Curingas Utilizados no Mês</h3>
              ${Object.values(substituteSummary).map(substitute => `
                <div class="substitute-item">
                  <div class="substitute-header">${substitute.name} - ${substitute.count} substituição(ões)</div>
                  <div class="substitute-details">
                    <strong>Colaboradores substituídos:</strong> ${Array.from(substitute.employees).join(', ')}<br>
                    <strong>Motivos:</strong> ${Array.from(substitute.reasons).join(', ')}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <table>
            <thead>
              <tr>
                <th>Colaborador</th>
                <th>Cargo</th>
                <th>Registro</th>
                <th class="shift-cell">SD</th>
                <th class="shift-cell">DR</th>
                <th class="shift-cell">12h</th>
                <th class="shift-cell">24h</th>
                <th class="shift-cell">6h</th>
                <th class="shift-cell">Total Plantões</th>
                <th class="shift-cell">Substituições</th>
                <th class="shift-cell">Dias Efetivos</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.map(emp => `
                <tr>
                  <td><strong>${emp.employeeName}</strong></td>
                  <td>${emp.position}</td>
                  <td style="font-family: monospace; font-size: 11px;">${employees.find(e => e.id === emp.employeeId)?.professionalRegistry || employees.find(e => e.id === emp.employeeId)?.cpf || '-'}</td>
                  <td class="shift-cell">${emp.shiftBreakdown.SD}</td>
                  <td class="shift-cell">${emp.shiftBreakdown.DR}</td>
                  <td class="shift-cell">${emp.shiftBreakdown['12']}</td>
                  <td class="shift-cell">${emp.shiftBreakdown['24']}</td>
                  <td class="shift-cell">${emp.shiftBreakdown['6h']}</td>
                  <td class="shift-cell"><strong>${emp.totalShifts}</strong></td>
                  <td class="shift-cell"><strong>${emp.substitutions}</strong></td>
                  <td class="shift-cell"><strong>${emp.actualDaysWorked}</strong></td>
                </tr>
              `).join('')}
              <tr style="background-color: #f8f9fa; font-weight: bold;">
                <td colspan="3">TOTAIS</td>
                <td class="shift-cell">${reportData.reduce((sum, emp) => sum + emp.shiftBreakdown.SD, 0)}</td>
                <td class="shift-cell">${reportData.reduce((sum, emp) => sum + emp.shiftBreakdown.DR, 0)}</td>
                <td class="shift-cell">${reportData.reduce((sum, emp) => sum + emp.shiftBreakdown['12'], 0)}</td>
                <td class="shift-cell">${reportData.reduce((sum, emp) => sum + emp.shiftBreakdown['24'], 0)}</td>
                <td class="shift-cell">${reportData.reduce((sum, emp) => sum + emp.shiftBreakdown['6h'], 0)}</td>
                <td class="shift-cell">${reportData.reduce((sum, emp) => sum + emp.totalShifts, 0)}</td>
                <td class="shift-cell">${totalSubstitutions}</td>
                <td class="shift-cell">${totalWorkDays}</td>
              </tr>
            </tbody>
          </table>

          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line">
                <div><strong>${nurseSignature || '_'.repeat(40)}</strong></div>
                <div>Enfermeira Responsável Técnico</div>
                <div style="font-size: 12px; color: #666;">COREN: _______________</div>
              </div>
            </div>
            <div class="signature-box">
              <div class="signature-line">
                <div><strong>Data: ${new Date().toLocaleDateString('pt-BR')}</strong></div>
                <div>Aprovação e Validação</div>
                <div style="font-size: 12px; color: #666;">Responsável pela Unidade</div>
              </div>
            </div>
          </div>

          <div class="footer">
            <p><strong>ACASA Residencial Sênior</strong> - Relatório de Escalas ${scheduleType}</p>
            <p>Este documento certifica o cumprimento das escalas de trabalho conforme legislação vigente</p>
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Relatório Mensal de Plantões</h2>
            <p className="text-gray-600">{scheduleType} • {unit} • {monthNames[month - 1]} {year}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(95vh-200px)] p-6">
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-acasa-purple">{reportData.length}</div>
                <div className="text-sm text-gray-600">Colaboradores</div>
              </div>
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{totalWorkDays}</div>
                <div className="text-sm text-gray-600">Dias Trabalhados</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{daysInMonth}</div>
                <div className="text-sm text-gray-600">Dias no Mês</div>
              </div>
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">{totalSubstitutions}</div>
                <div className="text-sm text-gray-600">Substituições</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-600">{Object.keys(substituteSummary).length}</div>
                <div className="text-sm text-gray-600">Curingas Únicos</div>
              </div>
            </div>

            {/* Curingas Utilizados */}
            {Object.keys(substituteSummary).length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center">
                  <User className="mr-2 text-yellow-600" size={20} />
                  Curingas Utilizados no Mês
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.values(substituteSummary).map(substitute => (
                    <div key={substitute.name} className="bg-white border border-yellow-300 rounded-lg p-4">
                      <div className="font-semibold text-yellow-800 mb-2">
                        {substitute.name} - {substitute.count} substituição(ões)
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>
                          <strong>Substituiu:</strong> {Array.from(substitute.employees).join(', ')}
                        </div>
                        <div>
                          <strong>Motivos:</strong> {Array.from(substitute.reasons).join(', ')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Report Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-acasa-purple text-white">
                    <tr>
                      <th className="px-4 py-3 text-left">Colaborador</th>
                      <th className="px-4 py-3 text-left">Cargo</th>
                      <th className="px-4 py-3 text-center">SD</th>
                      <th className="px-4 py-3 text-center">DR</th>
                      <th className="px-4 py-3 text-center">12h</th>
                      <th className="px-4 py-3 text-center">24h</th>
                      <th className="px-4 py-3 text-center">6h</th>
                      <th className="px-4 py-3 text-center">Total</th>
                      <th className="px-4 py-3 text-center">Substituições</th>
                      <th className="px-4 py-3 text-center">Dias Efetivos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((emp, index) => (
                      <tr key={emp.employeeId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 font-medium text-gray-900">{emp.employeeName}</td>
                        <td className="px-4 py-3 text-gray-700">{emp.position}</td>
                        <td className="px-4 py-3 text-center font-semibold">{emp.shiftBreakdown.SD}</td>
                        <td className="px-4 py-3 text-center font-semibold">{emp.shiftBreakdown.DR}</td>
                        <td className="px-4 py-3 text-center font-semibold">{emp.shiftBreakdown['12']}</td>
                        <td className="px-4 py-3 text-center font-semibold">{emp.shiftBreakdown['24']}</td>
                        <td className="px-4 py-3 text-center font-semibold">{emp.shiftBreakdown['6h']}</td>
                        <td className="px-4 py-3 text-center font-bold text-acasa-purple">{emp.totalShifts}</td>
                        <td className="px-4 py-3 text-center font-bold text-orange-600">{emp.substitutions}</td>
                        <td className="px-4 py-3 text-center font-bold text-green-600">{emp.actualDaysWorked}</td>
                      </tr>
                    ))}
                    <tr className="bg-acasa-purple text-white font-bold">
                      <td className="px-4 py-3" colSpan={2}>TOTAIS</td>
                      <td className="px-4 py-3 text-center">{reportData.reduce((sum, emp) => sum + emp.shiftBreakdown.SD, 0)}</td>
                      <td className="px-4 py-3 text-center">{reportData.reduce((sum, emp) => sum + emp.shiftBreakdown.DR, 0)}</td>
                      <td className="px-4 py-3 text-center">{reportData.reduce((sum, emp) => sum + emp.shiftBreakdown['12'], 0)}</td>
                      <td className="px-4 py-3 text-center">{reportData.reduce((sum, emp) => sum + emp.shiftBreakdown['24'], 0)}</td>
                      <td className="px-4 py-3 text-center">{reportData.reduce((sum, emp) => sum + emp.shiftBreakdown['6h'], 0)}</td>
                      <td className="px-4 py-3 text-center">{reportData.reduce((sum, emp) => sum + emp.totalShifts, 0)}</td>
                      <td className="px-4 py-3 text-center">{totalSubstitutions}</td>
                      <td className="px-4 py-3 text-center">{totalWorkDays}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Validation Section */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="mr-2 text-green-600" size={20} />
                Validação e Aprovação
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Enfermeira Responsável Técnico *
                  </label>
                  <input
                    type="text"
                    value={nurseSignature}
                    onChange={(e) => setNurseSignature(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    placeholder="Ex: Maria Silva Santos"
                    required
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="approved"
                    checked={approved}
                    onChange={(e) => setApproved(e.target.checked)}
                    className="mr-3 h-4 w-4 text-acasa-purple focus:ring-acasa-purple border-gray-300 rounded"
                  />
                  <label htmlFor="approved" className="text-sm font-medium text-gray-700">
                    Eu confirmo que os dados deste relatório estão corretos e aprovados
                  </label>
                </div>
              </div>

              {approved && nurseSignature && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="text-green-600 mr-2" size={20} />
                    <span className="text-green-700 font-medium">
                      Relatório aprovado por: <strong>{nurseSignature}</strong>
                    </span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    Aprovado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <strong>Legenda:</strong> SD=Serviço Diurno • DR=Descanso • 12h=Plantão 12h • 24h=Plantão 24h • 6h=Plantão 6h • Substituições=Curingas utilizados
          </div>
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={handlePrint}
              disabled={!approved || !nurseSignature}
              className="flex items-center px-6 py-2 bg-acasa-purple text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer size={16} className="mr-2" />
              Imprimir Relatório
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};