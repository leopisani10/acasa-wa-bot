import React, { useState } from 'react';
import { Upload, X, FileSpreadsheet, AlertTriangle, CheckCircle, Download, User } from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { useGuests } from '../../contexts/GuestContext';
import { Guest } from '../../types';

interface GuestImportProps {
  onClose: () => void;
  onImported: () => void;
}

interface ImportRow {
  [key: string]: string;
}

interface PreviewGuest {
  fullName: string;
  gender: string;
  birthDate: string;
  cpf: string;
  rg: string;
  documentIssuer: string;
  unit: string;
  roomNumber: string;
  dependencyLevel: string;
  admissionDate: string;
  contractExpiryDate: string;
  legalResponsibleRelationship: string;
  legalResponsibleCpf: string;
  financialResponsibleName: string;
  financialResponsibleCpf: string;
  financialResponsiblePhone: string;
  financialResponsibleAddress: string;
  status: string;
  isValid: boolean;
  errors: string[];
}

export const GuestImport: React.FC<GuestImportProps> = ({ onClose, onImported }) => {
  const { addGuest } = useGuests();
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewGuest[]>([]);
  const [importing, setImporting] = useState(false);
  const [importComplete, setImportComplete] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; errors: number }>({ success: 0, errors: 0 });
  const [parseError, setParseError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    console.log('File selected:', uploadedFile.name, 'Size:', uploadedFile.size, 'Type:', uploadedFile.type);

    setFile(uploadedFile);
    setImportComplete(false);
    setParseError(null);
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
    
    const preview: PreviewGuest[] = data.map((row, index) => {
      console.log(`Processing row ${index + 1}:`, row);
      const guest: PreviewGuest = {
        fullName: row['Nome Completo'] || row['nome'] || row['Nome'] || '',
        gender: normalizeGender(row['Sexo'] || row['sexo'] || row['Gênero'] || row['genero'] || ''),
        birthDate: formatDate(row['Data de Nascimento'] || row['nascimento'] || row['Data Nascimento'] || ''),
        cpf: row['CPF'] || row['cpf'] || '',
        rg: row['RG'] || row['rg'] || '',
        documentIssuer: row['Órgão Emissor'] || row['orgao_emissor'] || row['Emissor'] || '',
        unit: normalizeUnit(row['Unidade'] || row['unidade'] || ''),
        roomNumber: row['Número do Quarto'] || row['Quarto'] || row['quarto'] || '',
        dependencyLevel: normalizeDependencyLevel(row['Grau de Dependência'] || row['Dependência'] || row['dependencia'] || ''),
        admissionDate: formatDate(row['Data de Admissão'] || row['admissao'] || row['Data Admissão'] || ''),
        contractExpiryDate: formatDate(row['Data Vencimento Contrato'] || row['vencimento_contrato'] || row['Vencimento'] || ''),
        legalResponsibleRelationship: row['Parentesco Responsável'] || row['parentesco'] || row['Parentesco'] || '',
        legalResponsibleCpf: row['CPF Responsável'] || row['cpf_responsavel'] || row['CPF Resp'] || '',
        financialResponsibleName: row['Nome Responsável Financeiro'] || row['responsavel_financeiro'] || row['Resp Financeiro'] || '',
        financialResponsibleCpf: row['CPF Responsável Financeiro'] || row['cpf_resp_financeiro'] || row['CPF Resp Fin'] || '',
        financialResponsiblePhone: row['Telefone Responsável'] || row['telefone_responsavel'] || row['Tel Responsável'] || '',
        financialResponsibleAddress: row['Endereço Responsável'] || row['endereco_responsavel'] || row['End Responsável'] || '',
        status: normalizeStatus(row['Status'] || row['status'] || 'Ativo'),
        isValid: true,
        errors: [],
      };

      // Validação
      const errors: string[] = [];
      
      if (!guest.fullName.trim()) errors.push('Nome é obrigatório');
      if (!guest.cpf.trim()) errors.push('CPF é obrigatório');
      if (!guest.documentIssuer.trim()) errors.push('Órgão emissor é obrigatório');
      if (!guest.roomNumber.trim()) errors.push('Número do quarto é obrigatório');
      if (!['Masculino', 'Feminino'].includes(guest.gender)) errors.push('Sexo deve ser Masculino ou Feminino');
      if (!guest.legalResponsibleCpf.trim()) errors.push('CPF do responsável é obrigatório');
      if (!guest.financialResponsibleName.trim()) errors.push('Nome do responsável financeiro é obrigatório');
      if (!guest.financialResponsibleCpf.trim()) errors.push('CPF do responsável financeiro é obrigatório');
      if (!guest.financialResponsibleAddress.trim()) errors.push('Endereço do responsável é obrigatório');

      guest.errors = errors;
      guest.isValid = errors.length === 0;

      return guest;
    });

    setPreviewData(preview);
    console.log('Preview data set:', preview.length, 'employees');
  };

  const formatDate = (dateStr: string): string => {
    const cleanedDateStr = String(dateStr || '').trim();
    if (!cleanedDateStr) return '';
    
    // Tentar vários formatos de data
    const formats = [
      /(\d{2})\/(\d{2})\/(\d{4})/,  // DD/MM/YYYY
      /(\d{4})-(\d{2})-(\d{2})/,   // YYYY-MM-DD
      /(\d{2})-(\d{2})-(\d{4})/,   // DD-MM-YYYY
    ];

    for (const format of formats) {
      const match = cleanedDateStr.match(format);
      if (match) {
        if (format === formats[0] || format === formats[2]) {
          // DD/MM/YYYY ou DD-MM-YYYY
          return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
        } else {
          // YYYY-MM-DD
          return cleanedDateStr;
        }
      }
    }

    return '';
  };

  const normalizeGender = (gender: string): string => {
    const normalized = gender.toLowerCase().trim();
    if (normalized.includes('masculino') || normalized.includes('m')) return 'Masculino';
    if (normalized.includes('feminino') || normalized.includes('f')) return 'Feminino';
    return gender;
  };

  const normalizeUnit = (unit: string): string => {
    const normalized = unit.toLowerCase().trim();
    if (normalized.includes('botafogo')) return 'Botafogo';
    return unit;
  };

  const normalizeDependencyLevel = (level: string): string => {
    const normalized = level.toLowerCase().trim();
    if (normalized.includes('i') || normalized === '1') return 'I';
    if (normalized.includes('ii') || normalized === '2') return 'II';
    if (normalized.includes('iii') || normalized === '3') return 'III';
    return level;
  };

  const normalizeStatus = (status: string): string => {
    const normalized = status.toLowerCase().trim();
    if (normalized.includes('ativo')) return 'Ativo';
    if (normalized.includes('inativo')) return 'Inativo';
    return 'Ativo';
  };

  const handleImport = async () => {
    setImporting(true);
    
    const validGuests = previewData.filter(guest => guest.isValid);
    console.log('Starting import for', validGuests.length, 'valid guests');
    let successCount = 0;
    let errorCount = 0;
    const detailedErrors: string[] = [];

    for (const guestData of validGuests) {
      try {
        console.log('Importing guest:', guestData.fullName);
        console.log('Guest data to import:', guestData);
        
        const guestToAdd: Omit<Guest, 'id' | 'createdAt' | 'updatedAt'> = {
          fullName: guestData.fullName,
          gender: guestData.gender as 'Masculino' | 'Feminino',
          birthDate: guestData.birthDate || new Date().toISOString().split('T')[0], // Default to today if empty
          cpf: guestData.cpf,
          rg: guestData.rg || 'A preencher',
          documentIssuer: guestData.documentIssuer || 'A preencher',
          photo: '',
          hasCuratorship: false,
          imageUsageAuthorized: false,
          status: guestData.status as 'Ativo' | 'Inativo',
          admissionDate: guestData.admissionDate || new Date().toISOString().split('T')[0],
          exitDate: undefined,
          exitReason: undefined,
          hasNewContract: false,
          contractExpiryDate: guestData.contractExpiryDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0], // Default to 1 year from now
          dependencyLevel: (guestData.dependencyLevel as 'I' | 'II' | 'III') || 'I',
          legalResponsibleRelationship: guestData.legalResponsibleRelationship || 'A preencher',
          legalResponsibleCpf: guestData.legalResponsibleCpf || '000.000.000-00',
          financialResponsibleName: guestData.financialResponsibleName,
          financialResponsibleRg: 'A preencher',
          financialResponsibleCpf: guestData.financialResponsibleCpf,
          financialResponsibleMaritalStatus: 'Solteiro(a)', // Padrão
          financialResponsiblePhone: guestData.financialResponsiblePhone || '(00) 00000-0000',
          financialResponsibleEmail: '',
          financialResponsibleAddress: guestData.financialResponsibleAddress,
          financialResponsibleProfession: '',
          unit: guestData.unit as 'Botafogo',
          climatizationFee: false,
          maintenanceFee: false,
          trousseauFee: false,
          administrativeFee: false,
          roomNumber: guestData.roomNumber,
          healthPlan: '',
          hasSpeechTherapy: false,
          pia: '',
          paisi: '',
          digitalizedContract: '',
          vaccinationUpToDate: false,
          vaccines: [],
        };

        console.log('Mapped guest object:', guestToAdd);
        console.log('Calling addGuest for:', guestData.fullName);
        
        await addGuest(guestToAdd);
        console.log('Successfully imported:', guestData.fullName);
        successCount++;
      } catch (error) {
        console.error('Erro ao importar hóspede:', guestData.fullName, error);
        console.error('Error details:', error);
        
        let errorMsg = `${guestData.fullName}: `;
        if (error instanceof Error) {
          errorMsg += error.message;
        } else if (typeof error === 'object' && error !== null && 'message' in error) {
          errorMsg += (error as any).message;
        } else {
          errorMsg += 'Erro desconhecido';
        }
        detailedErrors.push(errorMsg);
        errorCount++;
      }
    }

    console.log('Import completed. Success:', successCount, 'Errors:', errorCount);
    if (detailedErrors.length > 0) {
      console.log('Detailed errors:', detailedErrors);
    }

    setImportResults({ success: successCount, errors: errorCount });
    setImporting(false);
    setImportComplete(true);
    
    // Se houve erros, mostrar no console para debug
    if (detailedErrors.length > 0) {
      console.error('Erros detalhados da importação:', detailedErrors);
    }
  };

  const downloadTemplate = () => {
    const template = [
      [
        'Nome Completo', 'Sexo', 'Data de Nascimento', 'CPF', 'RG', 'Órgão Emissor',
        'Unidade', 'Número do Quarto', 'Grau de Dependência', 'Data de Admissão',
        'Data Vencimento Contrato', 'Parentesco Responsável', 'CPF Responsável',
        'Nome Responsável Financeiro', 'CPF Responsável Financeiro', 'Telefone Responsável',
        'Endereço Responsável', 'Status'
      ],
      [
        'Maria Silva Santos', 'Feminino', '15/03/1930', '123.456.789-00', '12.345.678-9', 'SSP/RJ',
        'Botafogo', '101', 'I', '10/01/2024', '10/01/2025', 'Filha', '987.654.321-00',
        'Ana Silva Costa', '111.222.333-44', '(21) 99999-9999',
        'Rua das Flores, 123, Copacabana, Rio de Janeiro, RJ, 22070-010', 'Ativo'
      ],
      [
        'João Oliveira Costa', 'Masculino', '20/07/1925', '987.654.321-00', '98.765.432-1', 'SSP/RJ',
        'Carlos Oliveira Lima', '999.888.777-66', '(21) 88888-8888',
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Hóspedes');
    XLSX.writeFile(wb, 'template_hospedes.xlsx');
  };

  const validCount = previewData.filter(guest => guest.isValid).length;
  const invalidCount = previewData.length - validCount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Importar Hóspedes</h2>
            <p className="text-gray-600">Importe dados de hóspedes através de planilha</p>
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
                      <li>Preencha os dados dos hóspedes no arquivo</li>
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

              {/* Parse Error Display */}
              {parseError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="text-red-600 mr-2" size={20} />
                    <span className="text-red-700 font-medium">Erro ao processar arquivo</span>
                  </div>
                  <p className="text-red-600 text-sm mt-2">{parseError}</p>
                </div>
              )}

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
                          <th className="px-4 py-3 text-left font-medium text-gray-700">Quarto</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">Unidade</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">Dependência</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">Responsável</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">Erros</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((guest, index) => (
                          <tr key={index} className={`border-b border-gray-100 ${guest.isValid ? 'bg-white' : 'bg-red-50'}`}>
                            <td className="px-4 py-3">
                              {guest.isValid ? (
                                <CheckCircle className="text-green-600" size={16} />
                              ) : (
                                <AlertTriangle className="text-red-600" size={16} />
                              )}
                            </td>
                            <td className="px-4 py-3 font-medium text-gray-900">{guest.fullName}</td>
                            <td className="px-4 py-3 font-mono text-gray-700">{guest.cpf}</td>
                            <td className="px-4 py-3 text-gray-700">{guest.roomNumber}</td>
                            <td className="px-4 py-3 text-gray-700">{guest.unit}</td>
                            <td className="px-4 py-3 text-gray-700">Grau {guest.dependencyLevel}</td>
                            <td className="px-4 py-3 text-gray-700">{guest.financialResponsibleName}</td>
                            <td className="px-4 py-3">
                              {guest.errors.length > 0 && (
                                <div className="space-y-1">
                                  {guest.errors.map((error, i) => (
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
                          <User size={20} className="mr-2" />
                        )}
                        {importing ? 'Importando...' : `Importar ${validCount} Hóspedes`}
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
                <User size={20} className="mr-2" />
                Ver Hóspedes Importados
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