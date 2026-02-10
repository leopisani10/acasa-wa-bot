import React, { useState } from 'react';
import { Lock, X } from 'lucide-react';

interface FinancialPasswordModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

const CORRECT_PASSWORD = '623525lp';

export const FinancialPasswordModal: React.FC<FinancialPasswordModalProps> = ({ onSuccess, onClose }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password === CORRECT_PASSWORD) {
      onSuccess();
    } else {
      setError('Senha incorreta. Tente novamente.');
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Lock className="text-acasa-purple mr-2" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">Módulo Financeiro</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-gray-600 mb-4">
            Este módulo contém informações financeiras sensíveis. Por favor, insira a senha para continuar.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
              placeholder="Digite a senha"
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-acasa-purple text-white rounded-lg hover:bg-acasa-red"
            >
              Acessar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
