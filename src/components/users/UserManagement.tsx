import React, { useState } from 'react';
import { UserCog, Plus, Search, Edit, Trash2, Eye, Shield, AlertTriangle, Users, Key, CheckCircle } from 'lucide-react';
import { useUserManagement } from '../../contexts/UserManagementContext';
import { useAuth } from '../../contexts/AuthContext';
import { User } from '../../types';
import { UserForm } from './UserForm';
import { UserPermissionsModal } from './UserPermissionsModal';

export const UserManagement: React.FC = () => {
  const { users, loading, error, deleteUser, userPermissions, syncOrphanedUsers } = useUserManagement();
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [syncingUsers, setSyncingUsers] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Only allow admins to access this page
  if (currentUser?.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <Shield className="mx-auto h-12 w-12 text-red-600 mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">Acesso Negado</h2>
          <p className="text-red-700">Apenas administradores podem acessar a gestão de usuários.</p>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesUnit = unitFilter === 'all' || user.unit === unitFilter;
    return matchesSearch && matchesRole && matchesUnit;
  });

  const handleDelete = async (user: User) => {
    if (user.id === currentUser?.id) {
      alert('Você não pode excluir sua própria conta.');
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir o usuário ${user.name}? Esta ação é irreversível.`)) {
      const result = await deleteUser(user.id);
      if (!result.success) {
        alert(result.message || 'Erro ao excluir usuário');
      }
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setShowUserForm(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowUserForm(true);
  };

  const handleCloseUserForm = () => {
    setShowUserForm(false);
    setEditingUser(null);
  };

  const handleSaveUser = () => {
    setShowUserForm(false);
    setEditingUser(null);
  };

  const handleSyncUsers = async () => {
    setSyncingUsers(true);
    setSyncMessage(null);
    
    try {
      const result = await syncOrphanedUsers();
      if (result.success) {
        setSyncMessage(result.message || 'Usuários sincronizados com sucesso');
        // Clear the message after 5 seconds
        setTimeout(() => setSyncMessage(null), 5000);
      } else {
        setSyncMessage(result.message || 'Erro ao sincronizar usuários');
      }
    } catch (error) {
      console.error('Error syncing users:', error);
      setSyncMessage('Erro inesperado ao sincronizar usuários');
    } finally {
      setSyncingUsers(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'staff': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'matriz': return 'bg-green-100 text-green-700';
      case 'franqueado': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Usuários</h2>
          <p className="text-gray-600">Carregando usuários...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-2">
            <AlertTriangle className="text-red-600 mr-2" size={20} />
            <h3 className="text-lg font-medium text-red-800">Erro ao Carregar Usuários</h3>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 rounded-full">
            <UserCog className="text-white" size={32} />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Usuários</h1>
        <p className="text-gray-600">Gerencie usuários e suas permissões no sistema</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Usuários do Sistema</h2>
          <p className="text-gray-600">Controle de acesso e permissões modulares</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          {/* Sync Message */}
          {syncMessage && (
            <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
              syncMessage.includes('sucesso') || syncMessage.includes('sincronizados') 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {syncMessage}
            </div>
          )}
          
          {error && error.includes('órfãos') && (
            <button
              onClick={handleSyncUsers}
              disabled={syncingUsers}
              className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {syncingUsers ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Users size={20} className="mr-2" />
              )}
              Sincronizar Usuários
            </button>
          )}
          
          {/* Always show sync button for debugging */}
          <button
            onClick={handleSyncUsers}
            disabled={syncingUsers}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            title="Buscar usuários criados no Supabase Auth que não aparecem na lista"
          >
            {syncingUsers ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <CheckCircle size={20} className="mr-2" />
            )}
            Buscar Usuários Órfãos
          </button>
          
          <button
            onClick={handleAddUser}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus size={20} className="mr-2" />
            Novo Usuário
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">Todos os Papéis</option>
            <option value="admin">Administrador</option>
            <option value="staff">Colaborador</option>
          </select>
          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">Todas as Unidades</option>
            <option value="Botafogo">Botafogo</option>
            <option value="Tijuca">Tijuca</option>
          </select>
          <div className="flex items-center text-sm text-gray-600">
            <Users size={16} className="mr-1" />
            {filteredUsers.length} de {users.length} usuários
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
            <Users className="text-purple-600" size={20} />
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Administradores</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
            <Shield className="text-purple-600" size={20} />
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Colaboradores</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'staff').length}
              </p>
            </div>
            <Users className="text-blue-600" size={20} />
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Unidades</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(users.map(u => u.unit)).size}
              </p>
            </div>
            <UserCog className="text-green-600" size={20} />
          </div>
        </div>
      </div>

      {/* User Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <div key={user.id} className="bg-white rounded-lg border border-gray-100 hover:border-purple-500 hover:shadow-lg transition-all duration-300">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">{user.name}</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>{user.position}</div>
                    <div>{user.email}</div>
                    <div>{user.unit}</div>
                  </div>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                    {user.role === 'admin' ? 'Admin' : 'Staff'}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(user.type)}`}>
                    {user.type === 'matriz' ? 'Matriz' : 'Franqueado'}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Módulos ativos:</span>
                  <span className="font-bold text-purple-600">
                    {userPermissions[user.id]?.enabledModules?.length || 'Padrão'}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedUser(user)}
                  className="flex-1 text-center py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors text-sm font-medium border border-purple-600"
                >
                  Ver
                </button>
                <button
                  onClick={() => setSelectedUserForPermissions(user)}
                  className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors border border-orange-600"
                  title="Gerenciar permissões"
                >
                  <Key size={16} />
                </button>
                <button
                  onClick={() => handleEditUser(user)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-green-600"
                  title="Editar usuário"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(user)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-600"
                  title="Excluir usuário"
                  disabled={user.id === currentUser?.id}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum usuário encontrado</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || roleFilter !== 'all' || unitFilter !== 'all'
              ? 'Tente ajustar os filtros de busca.'
              : 'Comece adicionando o primeiro usuário.'}
          </p>
          {!searchTerm && roleFilter === 'all' && unitFilter === 'all' && (
            <button
              onClick={handleAddUser}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus size={20} className="mr-2" />
              Adicionar Usuário
            </button>
          )}
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Detalhes do Usuário</h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Informações Pessoais</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Nome:</strong> {selectedUser.name}</div>
                      <div><strong>Email:</strong> {selectedUser.email}</div>
                      <div><strong>Cargo:</strong> {selectedUser.position}</div>
                      <div><strong>Unidade:</strong> {selectedUser.unit}</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Acesso e Permissões</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Papel:</strong> <span className={`px-2 py-1 rounded text-xs ${getRoleColor(selectedUser.role)}`}>{selectedUser.role === 'admin' ? 'Administrador' : 'Colaborador'}</span></div>
                      <div><strong>Tipo:</strong> <span className={`px-2 py-1 rounded text-xs ${getTypeColor(selectedUser.type)}`}>{selectedUser.type === 'matriz' ? 'Matriz' : 'Franqueado'}</span></div>
                      <div><strong>Módulos:</strong> {userPermissions[selectedUser.id]?.enabledModules?.length || 0} ativos</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-4 p-6 border-t border-gray-200">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  setSelectedUserForPermissions(selectedUser);
                  setSelectedUser(null);
                }}
                className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Key size={16} className="mr-2" />
                Gerenciar Permissões
              </button>
              <button
                onClick={() => {
                  handleEditUser(selectedUser);
                  setSelectedUser(null);
                }}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Edit size={16} className="mr-2" />
                Editar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Form Modal */}
      {showUserForm && (
        <UserForm
          user={editingUser}
          onClose={handleCloseUserForm}
          onSave={handleSaveUser}
        />
      )}

      {/* User Permissions Modal */}
      {selectedUserForPermissions && (
        <UserPermissionsModal
          user={selectedUserForPermissions}
          onClose={() => setSelectedUserForPermissions(null)}
        />
      )}
    </div>
  );
};