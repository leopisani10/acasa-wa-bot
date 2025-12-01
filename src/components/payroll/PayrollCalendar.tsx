import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, User, DollarSign } from 'lucide-react';
import { usePayroll } from '../../contexts/PayrollContext';
import { useEmployees } from '../../contexts/EmployeeContext';
import { useSobreaviso } from '../../contexts/SobreavisoContext';

export const PayrollCalendar: React.FC = () => {
  const { payrolls } = usePayroll();
  const { employees } = useEmployees();
  const { sobreavisoEmployees } = useSobreaviso();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');

  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  const monthStr = currentMonth.toString().padStart(2, '0');

  const positionColors: { [key: string]: { bg: string; text: string; label: string } } = {
    curinga: { bg: 'bg-yellow-500', text: 'text-gray-900', label: 'Curinga (Sobreaviso)' },
    cuidador: { bg: 'bg-blue-500', text: 'text-white', label: 'Cuidador' },
    'tecnico de enfermagem': { bg: 'bg-green-500', text: 'text-white', label: 'Técnico de Enfermagem' },
    enfermeiro: { bg: 'bg-purple-500', text: 'text-white', label: 'Enfermeiro' },
    medico: { bg: 'bg-red-500', text: 'text-white', label: 'Médico' },
    nutricionista: { bg: 'bg-orange-500', text: 'text-white', label: 'Nutricionista' },
    fisioterapeuta: { bg: 'bg-teal-500', text: 'text-white', label: 'Fisioterapeuta' },
    psicologo: { bg: 'bg-pink-500', text: 'text-white', label: 'Psicólogo' },
    assistente: { bg: 'bg-indigo-500', text: 'text-white', label: 'Assistente' },
    admin: { bg: 'bg-gray-600', text: 'text-white', label: 'Administrativo' },
    cozinha: { bg: 'bg-amber-600', text: 'text-white', label: 'Cozinha' },
    limpeza: { bg: 'bg-cyan-600', text: 'text-white', label: 'Limpeza' },
    manutencao: { bg: 'bg-stone-700', text: 'text-white', label: 'Manutenção' },
  };

  const getPositionKey = (position: string): string => {
    const normalized = position.toLowerCase().trim();

    if (normalized.includes('curinga')) return 'curinga';
    if (normalized.includes('cuidador')) return 'cuidador';
    if (normalized.includes('técnico') || normalized.includes('tecnico')) return 'tecnico de enfermagem';
    if (normalized.includes('enfermeiro') || normalized.includes('enfermeira')) return 'enfermeiro';
    if (normalized.includes('médico') || normalized.includes('medico')) return 'medico';
    if (normalized.includes('nutricionista')) return 'nutricionista';
    if (normalized.includes('fisioterapeuta')) return 'fisioterapeuta';
    if (normalized.includes('psicólogo') || normalized.includes('psicologo')) return 'psicologo';
    if (normalized.includes('assistente')) return 'assistente';
    if (normalized.includes('cozinha') || normalized.includes('cozinheiro')) return 'cozinha';
    if (normalized.includes('limpeza') || normalized.includes('auxiliar de limpeza')) return 'limpeza';
    if (normalized.includes('manutenção') || normalized.includes('manutencao')) return 'manutencao';
    if (normalized.includes('admin') || normalized.includes('administrativo')) return 'admin';

    return 'admin';
  };

  const getPositionColor = (position: string) => {
    const key = getPositionKey(position);
    return positionColors[key] || positionColors.admin;
  };

  const enrichedPayrolls = useMemo(() => {
    return payrolls.map(payroll => {
      const employee = employees.find(emp => emp.id === payroll.employeeId);

      // Verificar se está no quadro de sobreaviso (busca por CPF ou nome)
      const isSobreaviso = sobreavisoEmployees.some(sa =>
        (sa.cpf && employee?.cpf && sa.cpf === employee.cpf) ||
        (sa.fullName && employee?.name && sa.fullName.toLowerCase() === employee.name.toLowerCase())
      );

      // Se está no sobreaviso, é Curinga
      const position = isSobreaviso ? 'Curinga' : (employee?.position || 'Não especificado');

      return {
        ...payroll,
        position,
        isSobreaviso,
      };
    });
  }, [payrolls, employees, sobreavisoEmployees]);

  const filteredPayrolls = useMemo(() => {
    return enrichedPayrolls.filter(payroll => {
      const matchesMonth = payroll.referenceMonth === monthStr && payroll.referenceYear === currentYear;
      const matchesEmployee = selectedEmployee === 'all' || payroll.employeeId === selectedEmployee;
      return matchesMonth && matchesEmployee && payroll.workDates && payroll.workDates.length > 0;
    });
  }, [enrichedPayrolls, monthStr, currentYear, selectedEmployee]);

  const uniqueEmployees = useMemo(() => {
    const employeeMap = new Map();
    enrichedPayrolls.forEach(payroll => {
      if (payroll.employeeId && payroll.employeeName && !employeeMap.has(payroll.employeeId)) {
        employeeMap.set(payroll.employeeId, payroll.employeeName);
      }
    });
    return Array.from(employeeMap, ([id, name]) => ({ id, name }));
  }, [enrichedPayrolls]);

  const positionStats = useMemo(() => {
    const stats = new Map<string, { count: number; totalDays: number; label: string; color: any }>();

    filteredPayrolls.forEach(payroll => {
      const key = getPositionKey(payroll.position);
      const color = getPositionColor(payroll.position);

      if (!stats.has(key)) {
        stats.set(key, {
          count: 0,
          totalDays: 0,
          label: color.label,
          color: color,
        });
      }

      const stat = stats.get(key)!;
      stat.count += 1;
      stat.totalDays += payroll.workDates?.length || 0;
    });

    return Array.from(stats.entries()).map(([key, value]) => ({
      key,
      ...value,
    }));
  }, [filteredPayrolls]);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month - 1, 1).getDay();
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 2, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth, 1));
  };

  const formatMonth = (month: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1];
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const isWorkDay = (day: number, payroll: any) => {
    if (!payroll.workDates) return false;
    const dateStr = `${currentYear}-${monthStr}-${day.toString().padStart(2, '0')}`;
    return payroll.workDates.includes(dateStr);
  };

  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0];
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfWeek = getFirstDayOfMonth(currentYear, currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  const totalDaysWorked = filteredPayrolls.reduce((sum, payroll) => {
    return sum + (payroll.workDates?.length || 0);
  }, 0);

  const totalPaid = filteredPayrolls.reduce((sum, payroll) => {
    return sum + payroll.netSalary;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-8 h-8 text-blue-600" />
            Calendário de Folha de Pagamento
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Visualize os dias trabalhados por função e colaborador
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos os Colaboradores</option>
            {uniqueEmployees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Colaboradores</p>
              <p className="text-2xl font-bold text-gray-900">{filteredPayrolls.length}</p>
            </div>
            <User className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Dias Trabalhados</p>
              <p className="text-2xl font-bold text-gray-900">{totalDaysWorked}</p>
            </div>
            <Calendar className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Pago</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totalPaid)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>

          <h3 className="text-xl font-bold text-gray-900">
            {formatMonth(currentMonth)} {currentYear}
          </h3>

          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
            <div
              key={day}
              className="text-center font-semibold text-sm text-gray-600 py-2"
            >
              {day}
            </div>
          ))}

          {emptyDays.map((_, index) => (
            <div key={`empty-${index}`} className="min-h-[120px]" />
          ))}

          {days.map((day) => {
            const workingEmployees = filteredPayrolls.filter(payroll => isWorkDay(day, payroll));
            const hasWork = workingEmployees.length > 0;
            const isToday = day === new Date().getDate() &&
                           currentMonth === new Date().getMonth() + 1 &&
                           currentYear === new Date().getFullYear();

            return (
              <div
                key={day}
                className={`min-h-[120px] border rounded-lg p-2 transition-all ${
                  isToday
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 bg-white'
                }`}
              >
                <div className="h-full flex flex-col">
                  <div className={`text-sm font-bold mb-2 ${
                    isToday ? 'text-blue-600' : 'text-gray-700'
                  }`}>
                    {day}
                  </div>

                  {hasWork && (
                    <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
                      {workingEmployees.map((payroll) => {
                        const color = getPositionColor(payroll.position);
                        return (
                          <div
                            key={payroll.id}
                            className={`px-2 py-1 rounded text-[10px] font-medium ${color.bg} ${color.text} truncate`}
                            title={`${payroll.employeeName} - ${payroll.position}`}
                          >
                            {getFirstName(payroll.employeeName || '')}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {positionStats.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Legenda por Função</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {positionStats.map((stat) => (
                <div key={stat.key} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <div className={`w-6 h-6 rounded ${stat.color.bg} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{stat.label}</p>
                    <p className="text-xs text-gray-500">
                      {stat.count} {stat.count === 1 ? 'pessoa' : 'pessoas'} • {stat.totalDays} dias
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredPayrolls.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              Nenhuma folha de pagamento com dias trabalhados para este período
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Selecione outro mês ou colaborador
            </p>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Como funciona?</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Cada colaborador aparece com o primeiro nome no dia trabalhado</li>
          <li>• A cor de fundo indica a função do colaborador</li>
          <li>• Passe o mouse sobre o nome para ver o nome completo e função</li>
          <li>• Use o filtro para visualizar apenas um colaborador específico</li>
          <li>• Navegue entre os meses usando as setas</li>
          <li>• O dia atual está destacado em azul</li>
        </ul>
      </div>
    </div>
  );
};
