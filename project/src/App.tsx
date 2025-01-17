import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { auth, db } from './lib/firebase';
import { TaskList } from './components/TaskList';
import { ExportModal } from './components/ExportModal';
import type { Task, Profile } from './types/database';
import { ListTodo, Plus, Search, Download, ClipboardList, Clock, CheckCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDoc, setDoc, Timestamp, addDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    subtasks: [] as { title: string }[]
  });

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profileRef = doc(db, 'profiles', firebaseUser.uid);
          const profileDoc = await getDoc(profileRef);
          
          if (profileDoc.exists()) {
            setUser({ id: profileDoc.id, ...profileDoc.data() } as Profile);
          } else {
            const newProfile: Omit<Profile, 'id'> = {
              name: firebaseUser.email?.split('@')[0] || 'Usuário',
              role: 'user',
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now()
            };
            
            await setDoc(profileRef, newProfile);
            setUser({ id: firebaseUser.uid, ...newProfile } as Profile);
            toast.success('Perfil criado com sucesso');
          }
        } catch (error) {
          console.error('Erro ao buscar/criar perfil:', error);
          toast.error('Erro ao configurar perfil do usuário');
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    const q = query(
      collection(db, 'tasks'),
      orderBy('dueDate', 'asc')
    );
    
    const unsubscribeTasks = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      setTasks(tasksData);
    }, (error) => {
      console.error('Erro ao buscar tarefas:', error);
      toast.error('Erro ao carregar tarefas. Tentando novamente...');
    });

    return () => {
      unsubscribeAuth();
      unsubscribeTasks();
    };
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningIn(true);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setShowSignIn(false);
      setEmail('');
      setPassword('');
      toast.success('Login realizado com sucesso');
    } catch (error: any) {
      console.error('Erro no login:', error);
      toast.error(error.message || 'Ocorreu um erro durante o login');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const taskData = {
        title: newTask.title,
        description: newTask.description || null,
        dueDate: Timestamp.fromDate(new Date(newTask.dueDate)),
        status: 'pending',
        assignedTo: null,
        assignedUserName: null,
        createdBy: user.id,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        subtasks: newTask.subtasks.map(st => ({
          id: crypto.randomUUID(),
          title: st.title,
          completed: false,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        }))
      };

      await addDoc(collection(db, 'tasks'), taskData);
      setShowCreateTask(false);
      setNewTask({ title: '', description: '', dueDate: '', subtasks: [] });
      toast.success('Tarefa criada com sucesso');
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      toast.error('Falha ao criar tarefa');
    }
  };

  const handleReserveTask = async (taskId: string) => {
    if (!user) return;

    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        status: 'in_progress',
        assignedTo: user.id,
        assignedUserName: user.name,
        updatedAt: Timestamp.now()
      });
      toast.success('Tarefa reservada com sucesso');
    } catch (error) {
      console.error('Erro ao reservar tarefa:', error);
      toast.error('Falha ao reservar tarefa');
    }
  };

  const handleUpdateTask = async (taskId: string, data: Partial<Task>) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        ...data,
        updatedAt: Timestamp.now()
      });
      toast.success('Tarefa atualizada com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      toast.error('Falha ao atualizar tarefa');
    }
  };

  const handleUpdateSubtask = async (taskId: string, subtaskId: string, completed: boolean) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      const taskDoc = await getDoc(taskRef);
      
      if (taskDoc.exists()) {
        const task = taskDoc.data() as Task;
        const updatedSubtasks = task.subtasks.map(st => 
          st.id === subtaskId ? { ...st, completed, updatedAt: Timestamp.now() } : st
        );
        
        await updateDoc(taskRef, {
          subtasks: updatedSubtasks,
          updatedAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar subtarefa:', error);
      toast.error('Falha ao atualizar subtarefa');
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    if (!user) return;

    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        status: 'completed',
        completedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      toast.success('Tarefa marcada como concluída e enviada para aprovação');
    } catch (error) {
      console.error('Erro ao concluir tarefa:', error);
      toast.error('Falha ao concluir tarefa');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ListTodo className="w-8 h-8 text-blue-500" />
              <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Tarefas</h1>
            </div>
            <div className="flex items-center space-x-4">
              {!user ? (
                <button
                  onClick={() => setShowSignIn(true)}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Entrar
                </button>
              ) : (
                <>
                  <span className="text-sm text-gray-500">
                    Bem-vindo, {user.name} ({user.role === 'admin' ? 'Administrador' : 'Usuário'})
                  </span>
                  <button
                    onClick={() => signOut(auth)}
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Sair
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Pesquisar tarefas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Download className="w-5 h-5 mr-2" />
                Exportar
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user?.role === 'admin' && (
          <div className="mb-6">
            <button
              onClick={() => setShowCreateTask(true)}
              className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nova Tarefa
            </button>
          </div>
        )}
        
        <TaskList
          tasks={tasks}
          onReserveTask={handleReserveTask}
          onUpdateTask={handleUpdateTask}
          onUpdateSubtask={handleUpdateSubtask}
          onCompleteTask={handleCompleteTask}
          isAdmin={user?.role === 'admin'}
          currentUserId={user?.id}
          currentUser={user}
        />
      </main>

      {showSignIn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">Entrar</h2>
            <form onSubmit={handleSignIn}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Senha
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowSignIn(false)}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSigningIn}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSigningIn ? 'Entrando...' : 'Entrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">Nova Tarefa</h2>
            <form onSubmit={handleCreateTask}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Título
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Descrição
                  </label>
                  <textarea
                    id="description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                    Data de Conclusão
                  </label>
                  <input
                    type="date"
                    id="dueDate"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subtarefas
                  </label>
                  {newTask.subtasks.map((subtask, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={subtask.title}
                        onChange={(e) => {
                          const updatedSubtasks = [...newTask.subtasks];
                          updatedSubtasks[index].title = e.target.value;
                          setNewTask({ ...newTask, subtasks: updatedSubtasks });
                        }}
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Título da subtarefa"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updatedSubtasks = newTask.subtasks.filter((_, i) => i !== index);
                          setNewTask({ ...newTask, subtasks: updatedSubtasks });
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setNewTask({
                      ...newTask,
                      subtasks: [...newTask.subtasks, { title: '' }]
                    })}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Adicionar Subtarefa
                  </button>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateTask(false)}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Criar Tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showExportModal && (
        <ExportModal
          onClose={() => setShowExportModal(false)}
          tasks={tasks}
        />
      )}
    </div>
  );
}

export default App;