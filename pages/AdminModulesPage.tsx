
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import Header from '../components/Header';
import Spinner from '../components/Spinner';
import type { Module } from '../types';

const AdminModulesPage = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModules = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching modules:', error);
      } else {
        setModules(data as Module[]);
      }
      setLoading(false);
    };

    fetchModules();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this module and all its questions? This action cannot be undone.')) {
      // First delete associated questions
      const { error: questionsError } = await supabase.from('questions').delete().eq('module_id', id);
      if (questionsError) {
        alert('Error deleting questions: ' + questionsError.message);
        return;
      }
      
      // Then delete the module
      const { error: moduleError } = await supabase.from('modules').delete().eq('id', id);
      if (moduleError) {
        alert('Error deleting module: ' + moduleError.message);
      } else {
        setModules(modules.filter(m => m.id !== id));
      }
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <>
      <Header />
      <main className="container mx-auto p-8">
        <div className="flex justify-between items-center mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold">Manage Modules</h1>
          <Link to="/admin/module/new" className="px-6 py-3 bg-primary hover:bg-indigo-700 rounded-md text-white font-semibold transition-all duration-300 transform hover:scale-105">
            Create New Module
          </Link>
        </div>
        
        {loading ? (
          <Spinner />
        ) : (
          <div className="bg-neutral-800/50 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-neutral-700 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-neutral-600">
                    <th className="p-4">Title</th>
                    <th className="p-4">Description</th>
                    <th className="p-4">Created At</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {modules.map(module => (
                    <tr key={module.id} className="border-b border-neutral-700 hover:bg-neutral-700/50">
                      <td className="p-4 font-semibold">{module.title}</td>
                      <td className="p-4 text-gray-400 max-w-md truncate">{module.description}</td>
                      <td className="p-4 text-gray-400">{formatDate(module.created_at)}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-4">
                          <Link to={`/admin/module/edit/${module.id}`} className="text-accent hover:text-green-400 font-semibold transition-colors">
                            Edit
                          </Link>
                          <button onClick={() => handleDelete(module.id)} className="text-error hover:text-red-400 font-semibold transition-colors">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default AdminModulesPage;
