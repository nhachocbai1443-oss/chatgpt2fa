import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import * as Storage from '../services/storage';
import { UserPlus, Save, Trash2, Key, Search, Shield, LogOut, Download, Upload, RefreshCw, Database, AlertTriangle } from 'lucide-react';

interface AdminPanelProps {
  onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newSecret, setNewSecret] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSecretValue, setEditSecretValue] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    refreshUsers();
  }, []);

  const refreshUsers = async () => {
    setIsLoading(true);
    try {
      const data = await Storage.getStoredUsers();
      setUsers(data);
    } catch (e) {
      setMsg({ type: 'error', text: 'Lỗi kết nối Database' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newSecret) {
      setMsg({ type: 'error', text: 'Thiếu thông tin Username hoặc Secret' });
      return;
    }
    
    setIsLoading(true);
    try {
      await Storage.createUser(newUsername, newSecret);
      setNewUsername('');
      setNewSecret('');
      setMsg({ type: 'success', text: 'Đã thêm user mới' });
      await refreshUsers();
    } catch (error: any) {
      setMsg({ type: 'error', text: error.message || 'Lỗi khi tạo user' });
      setIsLoading(false);
    }
  };

  const startEditing = (user: User) => {
    setEditingId(user.id);
    setEditSecretValue(user.secret);
  };

  const saveEdit = async (id: string) => {
    if (!editSecretValue.trim()) return;
    setIsLoading(true);
    try {
      await Storage.updateUserSecret(id, editSecretValue);
      setEditingId(null);
      setEditSecretValue('');
      setMsg({ type: 'success', text: 'Đã cập nhật Secret' });
      await refreshUsers();
    } catch (error: any) {
       setMsg({ type: 'error', text: 'Lỗi sửa: ' + (error.message || 'Kiểm tra quyền Database') });
       setIsLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, userToDelete: User) => {
    // Ngăn chặn sự kiện click lan ra ngoài
    e.stopPropagation();
    e.preventDefault();

    if(!window.confirm(`XÓA VĨNH VIỄN user "${userToDelete.username}"? Hành động này không thể hoàn tác.`)) return;

    setIsLoading(true);
    // Xóa tạm thời trên UI để cảm giác nhanh hơn
    const previousUsers = [...users];
    setUsers(users.filter(u => u.id !== userToDelete.id));

    try {
      await Storage.deleteUser(userToDelete.id);
      setMsg({ type: 'success', text: 'Đã xóa user thành công' });
    } catch (error: any) {
      console.error("Delete failed", error);
      // Nếu lỗi thì hoàn tác lại UI
      setUsers(previousUsers);
      setMsg({ type: 'error', text: 'Lỗi xóa: ' + error.message });
      // Đồng thời tải lại danh sách thật từ server
      await refreshUsers(); 
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackup = () => {
    const dataStr = JSON.stringify(users, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_users_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerRestore = () => fileInputRef.current?.click();

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      setIsLoading(true);
      const success = await Storage.importUsers(content);
      if (success) {
        setMsg({ type: 'success', text: 'Import dữ liệu thành công' });
        await refreshUsers();
      } else {
        setMsg({ type: 'error', text: 'Import thất bại' });
        setIsLoading(false);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const filteredUsers = users
    .filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.secret.localeCompare(b.secret));

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/20 rounded-xl">
              <Database className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                Quản Trị Hệ Thống
              </h1>
              <p className="text-slate-400 text-sm">Supabase Connected</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isLoading && <RefreshCw className="w-5 h-5 animate-spin text-indigo-400 mr-2" />}
            
            <button onClick={handleBackup} disabled={isLoading} className="btn-icon bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg flex gap-2 items-center text-sm border border-slate-600">
              <Download className="w-4 h-4 text-emerald-400" /> Backup
            </button>
            
            <button onClick={triggerRestore} disabled={isLoading} className="btn-icon bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg flex gap-2 items-center text-sm border border-slate-600">
              <Upload className="w-4 h-4 text-blue-400" /> Restore
            </button>
            <input type="file" ref={fileInputRef} onChange={handleRestoreFile} accept=".json" className="hidden" />

            <div className="h-6 w-px bg-slate-600 mx-2"></div>

            <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/20 text-sm font-medium">
              <LogOut className="w-4 h-4" /> Thoát
            </button>
          </div>
        </div>

        {/* Message Alert */}
        {msg && (
          <div className={`p-4 rounded-lg flex justify-between items-center border ${msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
            <span className="flex items-center gap-2">
              {msg.type === 'error' && <AlertTriangle className="w-5 h-5" />}
              {msg.text}
            </span>
            <button onClick={() => setMsg(null)} className="hover:opacity-75 font-bold">✕</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Create Form */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-700 sticky top-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                <UserPlus className="w-5 h-5 text-indigo-400" /> Thêm User
              </h2>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Username</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 focus:border-indigo-500 outline-none text-white"
                    placeholder="VD: user1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Secret Key</label>
                  <input
                    type="text"
                    value={newSecret}
                    onChange={(e) => setNewSecret(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 focus:border-indigo-500 outline-none font-mono text-sm text-white"
                    placeholder="JBSWY3..."
                  />
                </div>
                <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg transition-all shadow-lg shadow-indigo-500/20 flex justify-center items-center gap-2">
                  {isLoading ? 'Đang xử lý...' : 'Tạo User'}
                </button>
              </form>
            </div>
          </div>

          {/* List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-lg border border-slate-700 mb-4">
              <Search className="w-5 h-5 text-slate-500 ml-2" />
              <input 
                type="text" 
                placeholder="Tìm kiếm..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-slate-200 w-full p-1"
              />
            </div>

            <div className="space-y-3">
              {filteredUsers.map(user => (
                <div key={user.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-slate-600 transition-all group">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-[150px]">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${user.isAdmin ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                          {user.username}
                          {user.isAdmin && <Shield className="w-3 h-3 text-amber-400" />}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-mono">{user.id.slice(0, 6)}...</p>
                      </div>
                    </div>

                    <div className="flex-1 md:px-4">
                       {user.isAdmin ? (
                         <div className="text-slate-600 text-sm italic">System Admin</div>
                       ) : (
                         editingId === user.id ? (
                           <div className="flex gap-2">
                             <input 
                               type="text" 
                               value={editSecretValue}
                               onChange={(e) => setEditSecretValue(e.target.value)}
                               className="flex-1 bg-slate-900 border border-indigo-500 rounded px-3 py-1 font-mono text-sm text-white"
                             />
                             <button onClick={() => saveEdit(user.id)} className="p-2 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30"><Save className="w-4 h-4"/></button>
                             <button onClick={() => setEditingId(null)} className="p-2 bg-slate-700 text-slate-400 rounded hover:bg-slate-600">✕</button>
                           </div>
                         ) : (
                           <div className="bg-slate-900/50 rounded px-3 py-2 font-mono text-sm text-slate-400 border border-slate-700/50 flex items-center gap-2 overflow-hidden">
                             <Key className="w-3 h-3 text-slate-600 flex-shrink-0" />
                             <span className="truncate">{user.secret}</span>
                           </div>
                         )
                       )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!user.isAdmin && (
                         <>
                            {editingId !== user.id && (
                              <button onClick={() => startEditing(user)} disabled={isLoading} className="p-2 hover:bg-indigo-500/20 hover:text-indigo-400 text-slate-500 rounded-lg transition-colors">
                                <span className="text-xs font-medium">Sửa</span>
                              </button>
                            )}
                            <button 
                              type="button"
                              onClick={(e) => handleDelete(e, user)} 
                              disabled={isLoading} 
                              className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-colors border border-rose-500/20 shadow-sm cursor-pointer z-10"
                              title="Xóa user này"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                         </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-12 text-slate-500 italic">
                  Không tìm thấy user nào
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};