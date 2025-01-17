import React, { useState, useEffect } from 'react';
import { X, CheckCircle, CheckSquare, Square, AlertCircle } from 'lucide-react';
import type { Task } from '../types/database';

type SubtaskModalProps = {
  task: Task;
  onClose: () => void;
  onUpdateSubtask: (taskId: string, subtaskId: string, completed: boolean) => void;
  onCompleteTask: (taskId: string) => void;
  onApproveTask: (taskId: string) => void;
  canEdit: boolean;
  isAdmin: boolean;
};

export function SubtaskModal({
  task,
  onClose,
  onUpdateSubtask,
  onCompleteTask,
  onApproveTask,
  canEdit,
  isAdmin
}: SubtaskModalProps) {
  const [localSubtasks, setLocalSubtasks] = useState(task.subtasks);

  // Atualiza o estado local quando a task é atualizada
  useEffect(() => {
    setLocalSubtasks(task.subtasks);
  }, [task.subtasks]);

  const allSubtasksCompleted = localSubtasks.every(st => st.completed);
  const progress = Math.round((localSubtasks.filter(st => st.completed).length / localSubtasks.length) * 100);

  const getProgressColor = (value: number) => {
    if (value >= 100) return 'bg-green-600';
    if (value >= 75) return 'bg-blue-600';
    if (value >= 50) return 'bg-yellow-500';
    if (value >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const handleSubtaskToggle = async (subtaskId: string, completed: boolean) => {
    // Atualiza o estado local imediatamente
    setLocalSubtasks(prev => 
      prev.map(st => 
        st.id === subtaskId ? { ...st, completed } : st
      )
    );
    
    // Chama a função de atualização do pai
    onUpdateSubtask(task.id, subtaskId, completed);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto mx-4 transform transition-all">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{task.title}</h2>
            {task.description && (
              <p className="mt-2 text-gray-600 text-sm">{task.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
          </button>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-gray-700">
                Progresso das Subtarefas
              </span>
              <span className={`
                px-2 py-0.5 rounded-full text-xs font-medium
                ${progress === 100 ? 'bg-green-100 text-green-800' : 
                  progress >= 50 ? 'bg-blue-100 text-blue-800' : 
                  'bg-yellow-100 text-yellow-800'}
              `}>
                {progress}%
              </span>
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`${getProgressColor(progress)} h-2.5 rounded-full transition-all duration-500 ease-out`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Lista de Subtarefas</h3>
            <span className="text-sm text-gray-500">
              {localSubtasks.filter(st => st.completed).length} de {localSubtasks.length} concluídas
            </span>
          </div>
          
          <div className="space-y-2">
            {localSubtasks.map((subtask) => (
              <div
                key={subtask.id}
                className={`
                  group flex items-center space-x-3 p-4 rounded-lg
                  ${canEdit ? 'cursor-pointer' : 'cursor-default'}
                  ${subtask.completed ? 'bg-green-50' : 'bg-gray-50'}
                  ${canEdit && !subtask.completed ? 'hover:bg-blue-50' : ''}
                  transition-all duration-200 ease-in-out
                `}
                onClick={() => canEdit && handleSubtaskToggle(subtask.id, !subtask.completed)}
              >
                <div className="flex-shrink-0">
                  {subtask.completed ? (
                    <CheckSquare className="w-5 h-5 text-green-600" />
                  ) : (
                    <Square className={`w-5 h-5 ${canEdit ? 'text-blue-600 group-hover:text-blue-700' : 'text-gray-400'}`} />
                  )}
                </div>
                <span className={`flex-1 text-sm ${
                  subtask.completed 
                    ? 'text-green-700 line-through' 
                    : 'text-gray-700'
                }`}>
                  {subtask.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {!canEdit && !isAdmin && (
          <div className="mt-6 flex items-center justify-center p-4 bg-gray-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-gray-400 mr-2" />
            <span className="text-sm text-gray-500">
              Você não tem permissão para editar esta tarefa
            </span>
          </div>
        )}

        <div className="mt-6 flex justify-end space-x-3">
          {isAdmin && task.status === 'completed' && allSubtasksCompleted && (
            <button
              onClick={() => {
                onApproveTask(task.id);
                onClose();
              }}
              className="flex items-center px-6 py-2.5 bg-green-600 text-white rounded-lg
                hover:bg-green-700 active:bg-green-800
                transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Aprovar Tarefa
            </button>
          )}
          
          {canEdit && allSubtasksCompleted && task.status === 'in_progress' && (
            <button
              onClick={() => {
                onCompleteTask(task.id);
                onClose();
              }}
              className="flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-lg
                hover:bg-blue-700 active:bg-blue-800
                transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Concluir Tarefa
            </button>
          )}
        </div>
      </div>
    </div>
  );
}