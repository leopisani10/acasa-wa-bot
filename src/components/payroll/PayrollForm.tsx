import React, { useState, useEffect } from 'react';
import { X, Calculator, DollarSign, Briefcase, Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import { usePayroll } from '../../contexts/PayrollContext';
import { useEmployees } from '../../contexts/EmployeeContext';
import { useSobreaviso } from '../../contexts/SobreavisoContext';
import { PayrollRecord, Employee, ShiftPayment, SobreavisoEmployee } from '../../types';
import { DateSelector } from './DateSelector';

interface PayrollFormProps {
  payroll?: PayrollRecord;
  onClose: () => void;
  onSave: () => void;
}

export const PayrollForm: React.FC<PayrollFormProps> = ({ payroll, onClose, onSave }) => {
  const { addPayroll, updatePayroll, getShiftPaymentsByEmployeeAndMonth } = usePayroll();
  const { employees } = useEmployees();
  const { sobreavisoEmployees } = useSobreaviso();
  const [loading, setLoading] = useState(false);
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [shiftPayments, setShiftPayments] = useState<ShiftPayment[]>([]);

  const activeEmployees = employees.filter(e => e.status === 'Ativo');
  const activeSobreavisoEmployees = sobreavisoEmployees.filter(e => e.status === 'Ativo');

  type CombinedEmployee = {
    id: string;
    name: string;
    position: string;
    type: 'employee' | 'sobreaviso';
    employmentType?: string;
  };

  const allEmployees: CombinedEmployee[] = [
    ...activeEmployees.map(e => ({
      id: e.id,
      name: e.fullName,
      position: e.position,
      type: 'employee' as const,
      employmentType: e.employmentType,
    })),
    ...activeSobreavisoEmployees.map(e => ({
      id: e.id,
      name: e.fullName,
      position: e.position,
      type: 'sobreaviso' as const,
      employmentType: 'Contrato',
    })),
  ].sort((a, b) => a.name.localeCompare(b.name));

  const [formData, setFormData] = useState({
    employeeId: payroll?.employeeId || '',
    referenceMonth: payroll?.referenceMonth || new Date().toISOString().slice(0, 7).split('-')[1],
    referenceYear: payroll?.referenceYear || new Date().getFullYear(),
    baseSalary: payroll?.baseSalary || 0,
    overtimeHours: payroll?.overtimeHours || 0,
    overtimeAmount: payroll?.overtimeAmount || 0,
    nightShiftHours: payroll?.nightShiftHours || 0,
    nightShiftAmount: payroll?.nightShiftAmount || 0,
    hazardPay: payroll?.hazardPay || 0,
    foodAllowance: payroll?.foodAllowance || 0,
    transportationAllowance: payroll?.transportationAllowance || 0,
    healthInsurance: payroll?.healthInsurance || 0,
    otherBenefits: payroll?.otherBenefits || 0,
    inssDeduction: payroll?.inssDeduction || 0,
    irrfDeduction: payroll?.irrfDeduction || 0,
    otherDeductions: payroll?.otherDeductions || 0,
    paymentDate: payroll?.paymentDate || '',
    paymentStatus: payroll?.paymentStatus || 'pending',
    paymentMethod: payroll?.paymentMethod || '',
    notes: payroll?.notes || '',
    workDates: payroll?.workDates || [],
    simplifiedPayment: payroll?.simplifiedPayment || false,
  });

  const [selectedEmployee, setSelectedEmployee] = useState<CombinedEmployee | null>(null);

  useEffect(() => {
    if (formData.employeeId) {
      const employee = allEmployees.find(e => e.id === formData.employeeId);
      setSelectedEmployee(employee || null);

      if (employee) {
        const isSimplified = employee.employmentType !== 'CLT';
        setFormData(prev => ({
          ...prev,
          simplifiedPayment: isSimplified,
        }));

        if (employee.type === 'sobreaviso' || employee.employmentType === 'Contrato') {
          loadShiftPayments(employee.id);
        }
      }
    } else {
      setSelectedEmployee(null);
      setShiftPayments([]);
    }
  }, [formData.employeeId, employees, sobreavisoEmployees]);

  useEffect(() => {
    if (selectedEmployee?.employmentType === 'Contrato' && formData.employeeId) {
      loadShiftPayments(formData.employeeId);
    }
  }, [formData.referenceMonth, formData.referenceYear]);

  const loadShiftPayments = async (employeeId: string) => {
    setLoadingShifts(true);
    try {
      const shifts = await getShiftPaymentsByEmployeeAndMonth(
        employeeId,
        formData.referenceMonth,
        formData.referenceYear
      );
      setShiftPayments(shifts);

      const dates = shifts.map(s => s.shift_date);
      const totalAmount = shifts.reduce((sum, s) => sum + parseFloat(s.total_amount.toString()), 0);

      setFormData(prev => ({
        ...prev,
        workDates: dates,
        baseSalary: totalAmount,
      }));

      console.log('Plantões carregados:', shifts);
    } catch (error) {
      console.error('Erro ao carregar plantões:', error);
    } finally {
      setLoadingShifts(false);
    }
  };

  const calculateGrossAndNet = () => {
    if (formData.simplifiedPayment) {
      return {
        gross: formData.baseSalary,
        net: formData.baseSalary,
      };
    }

    const gross =
      formData.baseSalary +
      formData.overtimeAmount +
      formData.nightShiftAmount +
      formData.hazardPay +
      formData.foodAllowance +
      formData.transportationAllowance +
      formData.healthInsurance +
      formData.otherBenefits;

    const net =
      gross -
      formData.inssDeduction -
      formData.irrfDeduction -
      formData.otherDeductions;

    return { gross, net };
  };

  const { gross: grossSalary, net: netSalary } = calculateGrossAndNet();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employeeId) {
      alert('Por favor, selecione um colaborador');
      return;
    }

    if (formData.simplifiedPayment && formData.baseSalary === 0) {
      alert('Por favor, informe o valor do pagamento');
      return;
    }

    setLoading(true);

    try {
      const payrollData = {
        ...formData,
        grossSalary,
        netSalary,
        employmentType: selectedEmployee?.employmentType,
        workDates: formData.workDates || [],
        simplifiedPayment: formData.simplifiedPayment || false,
        createdBy: '',
      };

      console.log('Salvando folha de pagamento:', payrollData);

      if (payroll) {
        await updatePayroll(payroll.id, payrollData);
      } else {
        await addPayroll(payrollData);
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving payroll:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`Erro ao salvar folha de pagamento: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getEmploymentTypeBadge = (type?: string) => {
    const badges = {
      CLT: { color: 'bg-blue-100 text-blue-800', label: 'CLT' },
      Contrato: { color: 'bg-purple-100 text-purple-800', label: 'Contrato' },
      Terceirizado: { color: 'bg-orange-100 text-orange-800', label: 'Terceirizado' },
      Estágio: { color: 'bg-green-100 text-green-800', label: 'Estágio' },
      Outro: { color: 'bg-gray-100 text-gray-800', label: 'Outro' },
    };

    const badge = badges[type as keyof typeof badges] || badges.Outro;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const showFullFields = !formData.simplifiedPayment;

  const getOriginalEmployee = () => {
    if (!selectedEmployee) return null;
    if (selectedEmployee.type === 'employee') {
      return employees.find(e => e.id === selectedEmployee.id);
    }
    return null;
  };

  const originalEmployee = getOriginalEmployee();
  const showTransportation = originalEmployee?.receivesTransportation && showFullFields;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl my-8 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">
            {payroll ? 'Editar Folha de Pagamento' : 'Nova Folha de Pagamento'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Colaborador *
                </label>
                <select
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                  required
                >
                  <option value="">Selecione um colaborador</option>

                  {activeEmployees.length > 0 && (
                    <optgroup label="📋 Colaboradores CLT">
                      {activeEmployees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.fullName} - {employee.position}
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {activeSobreavisoEmployees.length > 0 && (
                    <optgroup label="🔔 Curingas / Sobreaviso">
                      {activeSobreavisoEmployees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.fullName} - {employee.position}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>

                {selectedEmployee && (
                  <div className="mt-3 flex items-center gap-3">
                    <Briefcase className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {selectedEmployee.type === 'sobreaviso' ? 'Curinga/Sobreaviso' : 'Tipo de vínculo'}:
                    </span>
                    {getEmploymentTypeBadge(selectedEmployee.employmentType)}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mês de Referência *
                </label>
                <select
                  value={formData.referenceMonth}
                  onChange={(e) => setFormData({ ...formData, referenceMonth: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                  required
                >
                  {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(month => (
                    <option key={month} value={month}>
                      {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][parseInt(month) - 1]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ano de Referência *
                </label>
                <input
                  type="number"
                  value={formData.referenceYear}
                  onChange={(e) => setFormData({ ...formData, referenceYear: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                  required
                />
              </div>

              {formData.simplifiedPayment ? (
                <>
                  <div className="col-span-2 border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-acasa-purple" />
                      Pagamento Simplificado
                    </h3>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor Total do Pagamento *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.baseSalary}
                      onChange={(e) => setFormData({ ...formData, baseSalary: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent text-lg font-semibold"
                      placeholder="0,00"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Informe o valor total a ser pago ao colaborador
                    </p>
                  </div>

                  {(selectedEmployee?.type === 'sobreaviso' || selectedEmployee?.employmentType === 'Contrato') && (
                    <>
                      <div className="col-span-2">
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-sm font-medium text-gray-700">
                            Plantões Cadastrados
                          </label>
                          <button
                            type="button"
                            onClick={() => loadShiftPayments(formData.employeeId)}
                            disabled={loadingShifts}
                            className="flex items-center gap-2 text-sm text-acasa-purple hover:text-purple-700 disabled:opacity-50"
                          >
                            <RefreshCw className={`w-4 h-4 ${loadingShifts ? 'animate-spin' : ''}`} />
                            {loadingShifts ? 'Carregando...' : 'Recarregar'}
                          </button>
                        </div>

                        {loadingShifts ? (
                          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
                            <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin" />
                            <p className="text-sm text-gray-600">Carregando plantões...</p>
                          </div>
                        ) : shiftPayments.length > 0 ? (
                          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <CalendarIcon className="w-5 h-5 text-green-600" />
                                <span className="font-medium text-green-900">
                                  {shiftPayments.length} {shiftPayments.length === 1 ? 'plantão encontrado' : 'plantões encontrados'}
                                </span>
                              </div>
                              <span className="text-sm font-semibold text-green-700">
                                Total: {formatCurrency(shiftPayments.reduce((sum, s) => sum + parseFloat(s.total_amount.toString()), 0))}
                              </span>
                            </div>
                            <div className="max-h-40 overflow-y-auto space-y-2">
                              {shiftPayments.map((shift) => (
                                <div key={shift.id} className="flex items-center justify-between bg-white p-2 rounded border border-green-100">
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-gray-700">
                                      {new Date(shift.shift_date).toLocaleDateString('pt-BR')}
                                    </span>
                                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                      {shift.shift_type}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {shift.hours_worked}h
                                    </span>
                                  </div>
                                  <span className="text-sm font-semibold text-green-600">
                                    {formatCurrency(parseFloat(shift.total_amount.toString()))}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <p className="text-sm text-yellow-800">
                              Nenhum plantão cadastrado para este período. Os plantões cadastrados no módulo de Sobreaviso serão carregados automaticamente aqui.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Dias Trabalhados (opcional - ajuste manual)
                        </label>
                        <DateSelector
                          month={formData.referenceMonth}
                          year={formData.referenceYear}
                          selectedDates={formData.workDates}
                          onChange={(dates) => setFormData({ ...formData, workDates: dates })}
                        />
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="col-span-2 border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-acasa-purple" />
                      Valores Base
                    </h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Salário Base *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.baseSalary}
                      onChange={(e) => setFormData({ ...formData, baseSalary: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Horas Extras
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.overtimeHours}
                      onChange={(e) => setFormData({ ...formData, overtimeHours: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor Horas Extras
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.overtimeAmount}
                      onChange={(e) => setFormData({ ...formData, overtimeAmount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Horas Noturnas
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.nightShiftHours}
                      onChange={(e) => setFormData({ ...formData, nightShiftHours: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adicional Noturno
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.nightShiftAmount}
                      onChange={(e) => setFormData({ ...formData, nightShiftAmount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Insalubridade/Periculosidade
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.hazardPay}
                      onChange={(e) => setFormData({ ...formData, hazardPay: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    />
                  </div>

                  <div className="col-span-2 border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Benefícios</h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vale Alimentação
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.foodAllowance}
                      onChange={(e) => setFormData({ ...formData, foodAllowance: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    />
                  </div>

                  {showTransportation && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vale Transporte
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.transportationAllowance}
                        onChange={(e) => setFormData({ ...formData, transportationAllowance: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Plano de Saúde
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.healthInsurance}
                      onChange={(e) => setFormData({ ...formData, healthInsurance: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Outros Benefícios
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.otherBenefits}
                      onChange={(e) => setFormData({ ...formData, otherBenefits: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    />
                  </div>

                  <div className="col-span-2 border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Descontos</h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      INSS
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.inssDeduction}
                      onChange={(e) => setFormData({ ...formData, inssDeduction: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IRRF
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.irrfDeduction}
                      onChange={(e) => setFormData({ ...formData, irrfDeduction: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Outros Descontos
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.otherDeductions}
                      onChange={(e) => setFormData({ ...formData, otherDeductions: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    />
                  </div>
                </>
              )}

              <div className="col-span-2 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-acasa-purple" />
                  Resumo
                </h3>
              </div>

              {formData.simplifiedPayment ? (
                <div className="col-span-2 bg-green-50 p-6 rounded-lg border-2 border-green-200">
                  <p className="text-sm text-gray-600 mb-2">Valor a Pagar</p>
                  <p className="text-3xl font-bold text-green-600">{formatCurrency(netSalary)}</p>
                  {formData.workDates.length > 0 && (
                    <p className="text-sm text-gray-600 mt-2">
                      {formData.workDates.length} {formData.workDates.length === 1 ? 'dia trabalhado' : 'dias trabalhados'}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Salário Bruto</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(grossSalary)}</p>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Salário Líquido</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(netSalary)}</p>
                  </div>
                </>
              )}

              <div className="col-span-2 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pagamento</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status do Pagamento
                </label>
                <select
                  value={formData.paymentStatus}
                  onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                >
                  <option value="pending">Pendente</option>
                  <option value="processing">Processando</option>
                  <option value="paid">Pago</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de Pagamento
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                >
                  <option value="">Selecione</option>
                  <option value="bank_transfer">Transferência Bancária</option>
                  <option value="check">Cheque</option>
                  <option value="cash">Dinheiro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Pagamento
                </label>
                <input
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                  placeholder="Observações adicionais..."
                />
              </div>
            </div>
          </div>
        </form>

        <div className="flex justify-end gap-4 p-6 border-t border-gray-200 flex-shrink-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={(e) => {
              e.preventDefault();
              const form = e.currentTarget.closest('.flex.flex-col')?.querySelector('form');
              if (form) {
                form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
              }
            }}
            className="px-6 py-2 bg-acasa-purple text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Salvando...' : payroll ? 'Atualizar' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
};
