import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, User, DollarSign } from 'lucide-react';
import { usePayroll } from '../../contexts/PayrollContext';

export const PayrollCalendar: React.FC = () => {
  const { payrolls } = usePayroll();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');

  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  const monthStr = currentMonth.toString().padStart(2, '0');

  const filteredPayrolls = useMemo(() => {
    return payrolls.filter(payroll => {
      const matchesMonth = payroll.referenceMonth === monthStr && payroll.referenceYear === currentYear;
      const matchesEmployee = selectedEmployee === 'all' || payroll.employeeId === selectedEmployee;
      return matchesMonth && matchesEmployee && payroll.workDates && payroll.workDates.length > 0;
    });
  }, [payrolls, monthStr, currentYear, selectedEmployee]);

  const uniqueEmployees = useMemo(() => {
    const employeeMap = new Map();
    payrolls.forEach(payroll => {
      if (payroll.employeeId && payroll.employeeName && !employeeMap.has(payroll.employeeId)) {
        employeeMap.set(payroll.employeeId, payroll.employeeName);
      }
    });
    return Array.from(employeeMap, ([id, name]) => ({ id, name }));
  }, [payrolls]);

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

  const getDayColor = (employeeIndex: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-orange-500',
      'bg-teal-500',
      'bg-red-500',
      'bg-indigo-500',
      'bg-yellow-500',
      'bg-cyan-500',
    ];
    return colors[employeeIndex % colors.length];
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
            Visualize os dias trabalhados de cada colaborador
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
            <div key={`empty-${index}`} className="aspect-square" />
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
                className={`aspect-square border rounded-lg p-1 transition-all ${
                  isToday
                    ? 'border-blue-500 bg-blue-50'
                    : hasWork
                    ? 'border-gray-300 bg-gray-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="h-full flex flex-col">
                  <div className={`text-sm font-semibold mb-1 ${
                    isToday ? 'text-blue-600' : 'text-gray-700'
                  }`}>
                    {day}
                  </div>

                  {hasWork && (
                    <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
                      {workingEmployees.slice(0, 3).map((payroll, index) => (
                        <div
                          key={payroll.id}
                          className={`h-1.5 rounded-full ${getDayColor(filteredPayrolls.indexOf(payroll))}`}
                          title={payroll.employeeName}
                        />
                      ))}
                      {workingEmployees.length > 3 && (
                        <div className="text-[10px] text-gray-500 text-center mt-0.5">
                          +{workingEmployees.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredPayrolls.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Legenda</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredPayrolls.map((payroll, index) => (
                <div key={payroll.id} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${getDayColor(index)}`} />
                  <span className="text-sm text-gray-700">{payroll.employeeName}</span>
                  <span className="text-xs text-gray-500">
                    ({payroll.workDates?.length || 0} dias)
                  </span>
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
          <li>• Cada barra colorida representa um colaborador que trabalhou naquele dia</li>
          <li>• Use o filtro para visualizar apenas um colaborador específico</li>
          <li>• Navegue entre os meses usando as setas</li>
          <li>• O dia atual está destacado em azul</li>
        </ul>
      </div>
    </div>
  );
};
