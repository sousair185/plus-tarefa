import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, Clock, AlertCircle, User, PlayCircle, ChevronLeft, ChevronRight, ClipboardList, Edit } from 'lucide-react';
import type { Task, Profile } from '../types/database';
import { SubtaskModal } from './SubtaskModal';
import { TaskEditModal } from './TaskEditModal';

type TaskListProps = {
  tasks: Task[];
  onReserveTask?: (taskId: string) => void;
  onUpdateTask?: (taskId: string, data: Partial<Task>) => void;
  onUpdateSubtask?: (taskId: string, subtaskId: string, completed: boolean) => void;
  onCompleteTask?: (taskId: string) => void;
  isAdmin?: boolean;
  currentUserId?: string;
  currentUser?: Profile | null;
};

type StatusPages = {
  pending: number;
  in_progress: number;
  completed: number;
  approved: number;
};

export function TaskList({
  tasks,
  onReserveTask,
  onUpdateTask,
  onUpdateSubtask,
  onCompleteTask,
  isAdmin,
  currentUserId,
  currentUser
}: TaskListProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [currentPages, setCurrentPages] = useState<StatusPages>({
    pending: 1,
    in_progress: 1,
    completed: 1,
    approved: 1
  });

  const TASKS_PER_PAGE = 2;

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const calculateProgress = (task: Task) => {
    if (task.status === 'completed' || task.status === 'approved') return 100;
    if (!task.subtasks?.length) return 0;
    const completed = task.subtasks.filter(st => st.completed).length;
    return Math.round((completed / task.subtasks.length) * 100);
  };

  const tasksByStatus = {
    pending: tasks.filter(t => t.status === 'pending'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    completed: tasks.filter(t => t.status === 'completed'),
    approved: tasks.filter(t => t.status === 'approved')
  };

  const handlePageChange = (status: keyof StatusPages, direction: 'prev' | 'next') => {
    setCurrentPages(prev => {
      const totalPages = Math.ceil(tasksByStatus[status].length / TASKS_PER_PAGE);
      const newPage = direction === 'next' 
        ? Math.min(prev[status] + 1, totalPages)
        : Math.max(prev[status] - 1, 1);
      
      return {
        ...prev,
        [status]: newPage
      };
    });
  };

  const getPaginatedTasks = (status: keyof typeof tasksByStatus) => {
    const startIndex = (currentPages[status] - 1) * TASKS_PER_PAGE;
    return tasksByStatus[status].slice(startIndex, startIndex + TASKS_PER_PAGE);
  };

  const renderPagination = (status: keyof StatusPages) => {
    const totalPages = Math.ceil(tasksByStatus[status].length / TASKS_PER_PAGE);
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-center space-x-2 mt-4">
        <button
          onClick={() => handlePageChange(status, 'prev')}
          disabled={currentPages[status] === 1}
          className="p-1 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm text-gray-600">
          {currentPages[status]} de {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(status, 'next')}
          disabled={currentPages[status] === totalPages}
          className="p-1 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  const handleApproveTask = (taskId: string) => {
    onUpdateTask?.(taskId, {
      status: 'approved',
      updatedAt: new Date()
    });
  };

  const handleUnassignTask = (taskId: string) => {
    onUpdateTask?.(taskId, {
      status: 'pending',
      assignedTo: null,
      assignedUserName: null,
      updatedAt: new Date()
    });
  };

  const renderTaskCard = (task: Task) => {
    const progress = calculateProgress(task);
    const isAssignedToCurrentUser = currentUserId === task.assignedTo;
    const canEdit = isAdmin || (isAssignedToCurrentUser && task.status === 'in_progress');
    const hasSubtasks = task.subtasks?.length > 0;

    return (
      <div 
        key={task.id}
        className={`
          bg-white rounded-lg border shadow-sm 
          hover:shadow-lg hover:translate-y-[-2px] hover:border-blue-200
          transform transition-all duration-200 ease-in-out
          group
        `}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold group-hover:text-blue-600 transition-colors duration-200">
              {task.title}
            </h3>
            <div className="flex items-center space-x-2">
              {isAdmin && (
                <button
                  onClick={() => setEditingTask(task)}
                  className="flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 
                    rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 
                    focus:ring-offset-2 transition-colors duration-200"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </button>
              )}
              {task.status === 'pending' && !isAdmin && currentUserId && !task.assignedTo && (
                <button
                  onClick={() => onReserveTask?.(task.id)}
                  className="flex items-center px-3 py-1 text-sm font-medium text-white bg-blue-500 
                    rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 
                    focus:ring-offset-2 transform hover:scale-105 transition-all duration-200"
                >
                  <PlayCircle className="w-4 h-4 mr-1" />
                  Executar
                </button>
              )}
              {hasSubtasks && (
                <button
                  onClick={() => setSelectedTask(task)}
                  className="flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 
                    rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 
                    focus:ring-offset-2 transition-colors duration-200"
                >
                  <ClipboardList className="w-4 h-4 mr-1" />
                  Subtarefas
                </button>
              )}
            </div>
          </div>
          
          {task.description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>
                {format(task.dueDate.toDate(), 'PP', { locale: ptBR })}
              </span>
              {task.assignedUserName && (
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>{task.assignedUserName}</span>
                  {isAdmin && task.status !== 'approved' && (
                    <button
                      onClick={() => handleUnassignTask(task.id)}
                      className="ml-2 text-red-500 hover:text-red-700 text-xs"
                    >
                      Remover
                    </button>
                  )}
                </div>
              )}
            </div>

            {hasSubtasks && (
              <div className="relative pt-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-600">
                    Progresso: {progress}%
                  </span>
                </div>
                <div className="overflow-hidden h-1.5 text-xs flex rounded bg-gray-200">
                  <div
                    style={{ width: `${progress}%` }}
                    className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center 
                      ${getProgressColor(progress)} transition-all duration-500`}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Pending Tasks */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-semibold">Pendentes</h2>
            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
              {tasksByStatus.pending.length}
            </span>
          </div>
          <div className="space-y-4 min-h-[200px]">
            {getPaginatedTasks('pending').map(task => renderTaskCard(task))}
            {tasksByStatus.pending.length === 0 && (
              <p className="text-gray-500 text-center py-4">Nenhuma tarefa pendente</p>
            )}
          </div>
          {renderPagination('pending')}
        </div>

        {/* In Progress Tasks */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Em Progresso</h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
              {tasksByStatus.in_progress.length}
            </span>
          </div>
          <div className="space-y-4 min-h-[200px]">
            {getPaginatedTasks('in_progress').map(task => renderTaskCard(task))}
            {tasksByStatus.in_progress.length === 0 && (
              <p className="text-gray-500 text-center py-4">Nenhuma tarefa em progresso</p>
            )}
          </div>
          {renderPagination('in_progress')}
        </div>

        {/* Completed Tasks */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold">Aguardando Aprovação</h2>
            <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">
              {tasksByStatus.completed.length}
            </span>
          </div>
          <div className="space-y-4 min-h-[200px]">
            {getPaginatedTasks('completed').map(task => renderTaskCard(task))}
            {tasksByStatus.completed.length === 0 && (
              <p className="text-gray-500 text-center py-4">Nenhuma tarefa aguardando aprovação</p>
            )}
          </div>
          {renderPagination('completed')}
        </div>

        {/* Approved Tasks */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold">Aprovadas</h2>
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
              {tasksByStatus.approved.length}
            </span>
          </div>
          <div className="space-y-4 min-h-[200px]">
            {getPaginatedTasks('approved').map(task => renderTaskCard(task))}
            {tasksByStatus.approved.length === 0 && (
              <p className="text-gray-500 text-center py-4">Nenhuma tarefa aprovada</p>
            )}
          </div>
          {renderPagination('approved')}
        </div>
      </div>

      {selectedTask && (
        <SubtaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdateSubtask={onUpdateSubtask!}
          onCompleteTask={onCompleteTask!}
          onApproveTask={handleApproveTask}
          canEdit={isAdmin || (currentUserId === selectedTask.assignedTo && selectedTask.status === 'in_progress')}
          isAdmin={isAdmin || false}
        />
      )}

      {editingTask && (
        <TaskEditModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onUpdateTask={onUpdateTask!}
        />
      )}
    </>
  );
}