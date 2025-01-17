import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Task } from '../types/database';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import Papa from 'papaparse';

type ExportModalProps = {
  onClose: () => void;
  tasks: Task[];
};

const styles = StyleSheet.create({
  page: {
    padding: 30,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  task: {
    marginBottom: 15,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskDetail: {
    fontSize: 12,
    marginTop: 5,
  },
});

const TasksPDF = ({ tasks, filters }: { tasks: Task[], filters: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Relatório de Tarefas</Text>
      {tasks.filter(task => {
        if (filters.status && task.status !== filters.status) return false;
        if (filters.startDate && task.createdAt.toDate() < new Date(filters.startDate)) return false;
        if (filters.endDate && task.createdAt.toDate() > new Date(filters.endDate)) return false;
        if (filters.assignedTo && task.assignedTo !== filters.assignedTo) return false;
        return true;
      }).map((task, index) => (
        <View key={index} style={styles.task}>
          <Text style={styles.taskTitle}>{task.title}</Text>
          <Text style={styles.taskDetail}>Status: {task.status}</Text>
          <Text style={styles.taskDetail}>
            Data de Conclusão: {format(task.dueDate.toDate(), 'PP', { locale: ptBR })}
          </Text>
          {task.assignedUserName && (
            <Text style={styles.taskDetail}>Atribuído para: {task.assignedUserName}</Text>
          )}
        </View>
      ))}
    </Page>
  </Document>
);

export function ExportModal({ onClose, tasks }: ExportModalProps) {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    assignedTo: '',
  });

  const handleExportCSV = () => {
    const filteredTasks = tasks.filter(task => {
      if (filters.status && task.status !== filters.status) return false;
      if (filters.startDate && task.createdAt.toDate() < new Date(filters.startDate)) return false;
      if (filters.endDate && task.createdAt.toDate() > new Date(filters.endDate)) return false;
      if (filters.assignedTo && task.assignedTo !== filters.assignedTo) return false;
      return true;
    });

    const csvData = filteredTasks.map(task => ({
      Título: task.title,
      Descrição: task.description || '',
      Status: task.status,
      'Data de Conclusão': format(task.dueDate.toDate(), 'PP', { locale: ptBR }),
      'Atribuído para': task.assignedUserName || '',
      'Progresso': `${task.subtasks.filter(st => st.completed).length}/${task.subtasks.length}`,
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `tarefas_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6">Exportar Tarefas</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Período</label>
            <div className="grid grid-cols-2 gap-4 mt-1">
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="pending">Pendente</option>
              <option value="in_progress">Em Progresso</option>
              <option value="completed">Aguardando Aprovação</option>
              <option value="approved">Aprovada</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancelar
          </button>
          
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Exportar CSV
          </button>
          
          <PDFDownloadLink
            document={<TasksPDF tasks={tasks} filters={filters} />}
            fileName={`tarefas_${format(new Date(), 'yyyy-MM-dd')}.pdf`}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            {({ loading }) => (loading ? 'Gerando PDF...' : 'Exportar PDF')}
          </PDFDownloadLink>
        </div>
      </div>
    </div>
  );
}