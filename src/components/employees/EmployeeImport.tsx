import React, { useState } from 'react';
import { Upload, X, FileSpreadsheet, AlertTriangle, CheckCircle, Download, Users } from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { useEmployees } from '../../contexts/EmployeeContext';
import { Employee } from '../../types';

interface EmployeeImportProps {
  onClose: () => void;
  onImported: () => void;
}

interface ImportRow {
  [key: string]: string;
}

interface PreviewEmployee {
  fullName: string;
  cpf: string;
  rg: string;
  birthDate: string;
  position: string;
  unit: string;
  employmentType: string;
  status: string;
  isValid: boolean;
  errors: string[];
}

export const EmployeeImport: React.FC<EmployeeImportProps> = ({ onClose, onImported }) => {
  const { addEmployee } = useEmployees();
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewEmployee[]>([]);
  const [importing, setImporting] = useState(false);
  const [importComplete, setImportComplete] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; errors: number }>({ success: 0, errors: 0 });
  const [parseError, setParseError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setParseError(null);
    setImportComplete(false);
    setPreviewData([]);
    parseFile(uploadedFile);
  };

  const parseFile = (file: File) => {
    console.log('Parsing file:', file.name, 'Size:', file.size, 'Type:', file.type);
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      console.log('Parsing as CSV...');
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        encoding: 'UTF-8',
        delimiter: 'auto',
        complete: (results) => {
          console.log('CSV parse complete:', results);
          if (results.errors && results.errors.length > 0) {
            console.error('CSV parse errors:', results.errors);
            setParseError(`Erro ao ler CSV: ${results.errors.map(e => e.message).join(', ')}`);
            return;
          }
          processData(results.data as ImportRow[]);
        },
        error: (error) => {
          console.error('Erro ao ler CSV:', error);
          setParseError(`Erro ao ler arquivo CSV: ${error.message}`);
        }
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      console.log('Parsing as Excel...');
      const reader = new FileReader();
      reader.onerror = () => {
        console.error('Erro ao ler arquivo:', reader.error);
        setParseError('Erro ao ler o arquivo. Verifique se o arquivo não está corrompido.');
      };
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          console.log('File data read, size:', data.length);
          
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          console.log('Workbook sheets:', workbook.SheetNames);
          
          if (workbook.SheetNames.length === 0) {
            setParseError('O arquivo não contém planilhas válidas.');
            return;
          }
          
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { 
            header: 1, 
            defval: '',
            raw: false // Para manter datas como strings
          });
          
          console.log('JSON data from Excel:', jsonData);
          
          if (jsonData.length < 2) {
            setParseError('O arquivo deve conter pelo menos um cabeçalho e uma linha de dados.');
            return;
          }
          
          // Converter para formato com headers
          const headers = (jsonData[0] as string[]).filter(h => h && h.trim());
          const rows = jsonData.slice(1) as string[][];
          
          if (headers.length === 0) {
            setParseError('Não foi possível identificar os cabeçalhos da planilha.');
            return;
          }
          
          console.log('Headers found:', headers);
          
          const formattedData: ImportRow[] = rows
            .filter(row => row && row.some(cell => cell && cell.toString().trim())) // Remove linhas vazias
            .map(row => {
              const obj: ImportRow = {};
              headers.forEach((header, index) => {
                obj[header] = (row[index] || '').toString().trim();
              });
              return obj;
            });
          
          console.log('Formatted data:', formattedData);
          processData(formattedData);
        } catch (error) {
          console.error('Erro ao processar arquivo Excel:', error);
          setParseError(`Erro ao processar arquivo Excel: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setParseError('Formato de arquivo não suportado. Use apenas .xlsx, .xls ou .csv');
    }
  };

  const processData = (data: ImportRow[]) => {
    console.log('Processing data:', data.length, 'rows');
    
    if (data.length === 0) {
      setParseError('Nenhum dado encontrado no arquivo. Verifique se há dados nas linhas após o cabeçalho.');
      return;
    }
    
    const preview: PreviewEmployee[] = data.map((row, index) => {
      console.log(`Processing row ${index + 1}:`, row);
      const employee: PreviewEmployee = {
        fullName: row['Nome Completo'] || row['nome'] || row['Nome'] || '',
        cpf: row['CPF'] || row['cpf'] || '',
        rg: row['RG'] || row['rg'] || '',
        birthDate: formatDate(row['Data de Nascimento'] || row['nascimento'] || row['Data Nascimento'] || ''),
        position: row['Cargo'] || row['cargo'] || row['Posição'] || '',
        unit: normalizeUnit(row['Unidade'] || row['unidade'] || ''),
        employmentType: normalizeEmploymentType(row['Tipo de Vínculo'] || row['Vínculo'] || row['vinculo'] || ''),
        status: normalizeStatus(row['Status'] || row['status'] || 'Ativo'),
        isValid: true,
        errors: [],
      };

      // Validação
      const errors: string[] = [];
      
      if (!employee.fullName.trim()) errors.push('Nome é obrigatório');
      if (!employee.cpf.trim()) errors.push('CPF é obrigatório');
      if (!employee.rg.trim()) errors.push('RG é obrigatório');
      if (!employee.birthDate) errors.push('Data de nascimento é obrigatória');
      if (!employee.position.trim()) errors.push('Cargo é obrigatório');
      if (!['Botafogo', 'Tijuca'].includes(employee.unit)) errors.push('Unidade deve ser Botafogo ou Tijuca');
      if (!['CLT', 'Contrato', 'Terceirizado', 'Estágio', 'Outro'].includes(employee.employmentType)) {
        errors.push('Tipo de vínculo inválido');
      }

      employee.errors = errors;
      employee.isValid = errors.length === 0;

      return employee;
    });

    setPreviewData(preview);
    console.log('Preview data set:', preview.length, 'employees');
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    
    // Tentar vários formatos de data
    const formats = [
      /(\d{2})\/(\d{2})\/(\d{4})/,  // DD/MM/YYYY
      /(\d{4})-(\d{2})-(\d{2})/,   // YYYY-MM-DD
      /(\d{2})-(\d{2})-(\d{4})/,   // DD-MM-YYYY
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (format === formats[0] || format === formats[2]) {
          // DD/MM/YYYY ou DD-MM-YYYY
          return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
        } else {
          // YYYY-MM-DD
          return dateStr;
        }
      }
    }

    return '';
  };

  const normalizeUnit = (unit: string): string => {
    const normalized = unit.toLowerCase().trim();
    if (normalized.includes('botafogo')) return 'Botafogo';
    if (normalized.includes('tijuca')) return 'Tijuca';
    return unit;
  };

  const normalizeEmploymentType = (type: string): string => {
    const normalized = type.toLowerCase().trim();
    if (normalized.includes('clt')) return 'CLT';
    if (normalized.includes('contrato')) return 'Contrato';
    if (normalized.includes('terceirizado')) return 'Terceirizado';
    if (normalized.includes('estágio') || normalized.includes('estagio')) return 'Estágio';
    return type || 'CLT';
  };

  const normalizeStatus = (status: string): string => {
    const normalized = status.toLowerCase().trim();
    if (normalized.includes('ativo')) return 'Ativo';
    if (normalized.includes('inativo')) return 'Inativo';
    if (normalized.includes('afastado')) return 'Afastado';
    if (normalized.includes('férias') || normalized.includes('ferias')) return 'Férias';
    return 'Ativo';
  };

  const handleImport = async () => {
    setImporting(true);
    
    const validEmployees = previewData.filter(emp => emp.isValid);
    console.log('Starting import for', validEmployees.length, 'valid employees');
    let successCount = 0;
    let errorCount = 0;

    for (const empData of validEmployees) {
      try {
        console.log('Importing employee:', empData.fullName);
        
        // Criar dados básicos obrigatórios
        const employeeToAdd: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'> = {
          fullName: empData.fullName,
          cpf: empData.cpf,
          rg: empData.rg,
          birthDate: empData.birthDate,
          address: 'A ser preenchido',
          position: empData.position,
          unit: empData.unit as 'Botafogo' | 'Tijuca',
          status: empData.status as 'Ativo' | 'Inativo' | 'Afastado' | 'Férias',
          photo: '',
          observations: '',
          professionalLicense: {
            council: 'Não Possui',
            licenseNumber: '',
            expiryDate: '',
          },
          employmentType: empData.employmentType as 'CLT' | 'Contrato' | 'Terceirizado' | 'Estágio' | 'Outro',
          covidVaccines: [],
        };

        // Adicionar dados específicos baseado no tipo de vínculo
        if (empData.employmentType === 'CLT') {
          employeeToAdd.cltData = {
            ctps: '',
            ctpsSeries: '',
            pis: '',
            voterTitle: '',
            voterZone: '',
            voterSection: '',
            medicalExams: [],
            generalVaccines: [],
            vacations: [],
            inssDocument: '',
            contractAmendment: '',
            uniformSize: {
              shirt: 'M',
              pants: '',
              shoes: '',
              coat: 'M',
            },
          };
        }

        if (empData.employmentType === 'Contrato') {
          employeeToAdd.contractData = {
            signedContract: '',
            contractStartDate: '',
            contractEndDate: '',
            bankData: {
              bank: '',
              agency: '',
              account: '',
              accountType: 'Corrente',
              pix: '',
            },
            profession: '',
            phone: '',
            email: '',
          };
        }

        if (empData.employmentType === 'Terceirizado') {
          employeeToAdd.outsourcedData = {
            companyName: '',
            companyCnpj: '',
            directSupervisor: '',
            serviceType: '',
            contractStartDate: '',
            contractEndDate: '',
          };
        }

        console.log('Employee data to add:', employeeToAdd);
        
        // Chamar a função de adicionar do contexto
        await addEmployee(employeeToAdd);
        console.log('Successfully imported:', empData.fullName);
        successCount++;
      } catch (error) {
        console.error('Erro ao importar colaborador:', empData.fullName, error);
        console.error('Error details:', error);
        errorCount++;
      }
    }

    console.log('Import completed. Success:', successCount, 'Errors:', errorCount);

    setImportResults({ success: successCount, errors: errorCount });
    setImporting(false);
    setImportComplete(true);
  };

  const downloadTemplate = () => {
    const template = [
      ['Nome Completo', 'CPF', 'RG', 'Data de Nascimento', 'Cargo', 'Unidade', 'Tipo de Vínculo', 'Status'],
      ['João Silva Santos', '123.456.789-00', '12.345.678-9', '15/03/1985', 'Enfermeiro', 'Botafogo', 'CLT', 'Ativo'],
      ['Maria Oliveira Costa', '987.654.321-00', '98.765.432-1', '20/07/1990', 'Cuidador de Idosos', 'Tijuca', 'Contrato', 'Ativo'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Colaboradores');
    XLSX.writeFile(wb, 'template_colaboradores.xlsx');
  };

  const validCount = previewData.filter(emp => emp.isValid).length;
  const invalidCount = previewData.length - validCount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Importar Colaboradores</h2>
            <p className="text-gray-600">Importe dados de colaboradores através de planilha</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(95vh-140px)] p-6">
          {!importComplete ? (
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <FileSpreadsheet className="text-blue-600 mr-3 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">Como usar:</h3>
                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                      <li>Baixe o modelo de planilha clicando no botão abaixo</li>
                      <li>Preencha os dados dos colaboradores no arquivo</li>
                      <li>Faça upload do arquivo preenchido</li>
                      <li>Revise os dados e confirme a importação</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Download Template */}
              <div className="text-center">
                <button
                  onClick={downloadTemplate}
                  className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <Download size={20} className="mr-2" />
                  Baixar Modelo de Planilha
                </button>
                <p className="text-sm text-gray-600 mt-2">
                  Formato suportado: Excel (.xlsx) ou CSV (.csv)
                </p>
              </div>

              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-acasa-purple transition-colors">
                <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <label className="cursor-pointer">
                  <span className="text-lg font-medium text-gray-700 hover:text-acasa-purple transition-colors">
                    Clique para selecionar arquivo ou arraste aqui
                  </span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  Arquivos aceitos: .xlsx, .xls, .csv (máximo 5MB)
                </p>
              </div>

              {/* File Info */}
              {file && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileSpreadsheet className="text-acasa-purple mr-3" size={20} />
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-600">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setFile(null);
                        setPreviewData([]);
                        setParseError(null);
                      }}
                      className="text-gray-500 hover:text-red-600 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              )}

              {/* Preview Data */}
              {previewData.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Preview dos Dados</h3>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center">
                        <CheckCircle className="text-green-600 mr-1" size={16} />
                        <span className="text-green-600 font-medium">{validCount} válidos</span>
                      </div>
                      {invalidCount > 0 && (
                        <div className="flex items-center">
                          <AlertTriangle className="text-red-600 mr-1" size={16} />
                          <span className="text-red-600 font-medium">{invalidCount} com erros</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">Nome</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">CPF</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">Cargo</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">Unidade</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">Vínculo</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">Erros</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((emp, index) => (
                          <tr key={index} className={`border-b border-gray-100 ${emp.isValid ? 'bg-white' : 'bg-red-50'}`}>
                            <td className="px-4 py-3">
                              {emp.isValid ? (
                                <CheckCircle className="text-green-600" size={16} />
                              ) : (
                                <AlertTriangle className="text-red-600" size={16} />
                              )}
                            </td>
                            <td className="px-4 py-3 font-medium text-gray-900">{emp.fullName}</td>
                            <td className="px-4 py-3 font-mono text-gray-700">{emp.cpf}</td>
                            <td className="px-4 py-3 text-gray-700">{emp.position}</td>
                            <td className="px-4 py-3 text-gray-700">{emp.unit}</td>
                            <td className="px-4 py-3 text-gray-700">{emp.employmentType}</td>
                            <td className="px-4 py-3">
                              {emp.errors.length > 0 && (
                                <div className="space-y-1">
                                  {emp.errors.map((error, i) => (
                                    <div key={i} className="text-xs text-red-600">{error}</div>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {validCount > 0 && (
                    <div className="flex justify-end">
                      <button
                        onClick={handleImport}
                        disabled={importing}
                        className="flex items-center px-6 py-3 bg-acasa-purple text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {importing ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Users size={20} className="mr-2" />
                        )}
                        {importing ? 'Importando...' : `Importar ${validCount} Colaboradores`}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Import Results */
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="text-green-600" size={32} />
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Importação Concluída!</h3>
                <p className="text-gray-600 mb-6">Os dados foram importados com sucesso.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">{importResults.success}</div>
                  <div className="text-sm text-green-700">Importados com sucesso</div>
                </div>
                {importResults.errors > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-red-600">{importResults.errors}</div>
                    <div className="text-sm text-red-700">Erros durante importação</div>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  onImported();
                  onClose();
                }}
                className="inline-flex items-center px-6 py-3 bg-acasa-purple text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                <Users size={20} className="mr-2" />
                Ver Colaboradores Importados
              </button>
            </div>
          )}
        </div>

        {!importComplete && (
          <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};