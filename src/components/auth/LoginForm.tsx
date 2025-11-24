import React, { useState } from 'react';
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface LoginFormProps {
  onToggleMode: () => void;
  isLogin: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode, isLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [unit, setUnit] = useState('');
  const [type, setType] = useState<'matriz' | 'franqueado'>('matriz');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let result;
      
      if (isLogin) {
        result = await login(email, password);
        if (!result.success) {
          setError(result.message || 'Email ou senha incorretos. Verifique suas credenciais ou cadastre-se caso não tenha uma conta.');
        }
      } else {
        if (name.trim().length < 2) {
          setError('Nome deve ter pelo menos 2 caracteres');
          setIsLoading(false);
          return;
        }
        if (position.trim().length < 2) {
          setError('Cargo deve ter pelo menos 2 caracteres');
          setIsLoading(false);
          return;
        }
        const registerResult = await register(email, password, name, position, unit, type);
        if (!registerResult) {
          setError('Erro ao criar conta. Este email pode já estar cadastrado ou houve um problema de conexão.');
        }
      }
    } catch (err) {
      setError('Erro de conexão com o servidor. Verifique sua internet e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md relative">
      <form onSubmit={handleSubmit} className="bg-white shadow-2xl rounded-2xl px-8 pt-8 pb-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isLogin ? 'Bem-vindo' : 'Criar Conta'}
          </h2>
          <p className="text-gray-600">
            {isLogin ? 'Faça login para acessar o sistema' : 'Cadastre-se para começar'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {!isLogin && (
          <div className="mb-6">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Digite seu nome completo"
              required
            />
          </div>
        )}

        {!isLogin && (
          <div className="mb-6">
            <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
              Cargo
            </label>
            <input
              type="text"
              id="position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent transition-all"
              placeholder="Ex: Enfermeiro, Cuidador, Administrador"
              required
            />
          </div>
        )}

        {!isLogin && (
          <div className="mb-6">
            <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-2">
              Unidade
            </label>
            <select
              id="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent transition-all"
              required
            >
              <option value="">Selecione a unidade</option>
              <option value="Botafogo">Botafogo</option>
            </select>
          </div>
        )}

        {!isLogin && (
          <div className="mb-6">
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              Tipo
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as 'matriz' | 'franqueado')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent transition-all"
              required
            >
              <option value="matriz">Matriz</option>
              <option value="franqueado">Franqueado</option>
            </select>
          </div>
        )}

        <div className="mb-6">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Digite seu email"
            required
          />
        </div>

        <div className="mb-8">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Senha
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
              placeholder="Digite sua senha"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-acasa-purple text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 focus:ring-2 focus:ring-acasa-purple focus:ring-offset-2 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              {isLogin ? <LogIn className="mr-2" size={20} /> : <UserPlus className="mr-2" size={20} />}
              {isLogin ? 'Entrar' : 'Cadastrar'}
            </>
          )}
        </button>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onToggleMode}
            className="text-acasa-purple hover:text-purple-700 font-medium transition-colors"
          >
            {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}
          </button>
        </div>
      </form>
    </div>
  );
};