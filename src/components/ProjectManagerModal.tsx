import React, { useState, useRef } from 'react';
import {
  X,
  Plus,
  FolderKanban,
  Copy,
  Trash2,
  Download,
  Upload,
  Clock,
  Film,
  Check,
} from 'lucide-react';
import { Project } from '../types/editor';
import {
  createNewProject,
  duplicateProject,
  deleteProject,
  exportProjectToFile,
  importProjectFromFile,
} from '../utils/projectStorage';

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  currentProjectId: string;
  onSelectProject: (project: Project) => void;
  onProjectsUpdated: (projects: Project[]) => void;
}

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  isOpen,
  onClose,
  projects,
  currentProjectId,
  onSelectProject,
  onProjectsUpdated,
}) => {
  const [newProjectName, setNewProjectName] = useState('');
  const [newAspectRatio, setNewAspectRatio] = useState<Project['aspectRatio']>('9:16');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    const created = createNewProject(newProjectName, newAspectRatio);
    setNewProjectName('');
    setShowCreateForm(false);
    onSelectProject(created);
    onProjectsUpdated([created, ...projects.filter((p) => p.id !== created.id)]);
  };

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const cloned = duplicateProject(id);
    if (cloned) {
      onSelectProject(cloned);
      onProjectsUpdated([cloned, ...projects]);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (projects.length <= 1) {
      alert('Không thể xóa dự án duy nhất còn lại.');
      return;
    }
    if (confirm('Bạn có chắc muốn xóa dự án này? Thao tác không thể hoàn tác.')) {
      const remaining = deleteProject(id);
      onProjectsUpdated(remaining);
      onSelectProject(remaining[0]);
    }
  };

  const handleExport = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    exportProjectToFile(project);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importProjectFromFile(file);
      onSelectProject(imported);
      onProjectsUpdated([imported, ...projects]);
      alert(`Đã nhập thành công dự án: "${imported.name}"`);
    } catch (err: any) {
      alert('Lỗi nhập file dự án: ' + err.message);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <FolderKanban className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Quản Lý Dự Án Video (Projects)</h2>
              <p className="text-xs text-slate-400">Lưu trữ, sao lưu và chuyển đổi giữa các dự án dựng 70s</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              accept=".cinepro,.json"
              onChange={handleImportFile}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center space-x-1.5 transition-colors border border-slate-700"
              title="Nhập dự án từ file .cinepro"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Nhập File</span>
            </button>

            <button
              onClick={() => setShowCreateForm(true)}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Dự Án Mới</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Create Form Drawer */}
        {showCreateForm && (
          <form onSubmit={handleCreate} className="p-4 bg-slate-950 border-b border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Khởi Tạo Dự Án Mới</span>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="text-xs text-slate-500 hover:text-slate-300"
              >
                Hủy
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Tên dự án (VD: Shorts Hài Hước 70s)..."
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                autoFocus
                className="col-span-2 bg-slate-900 border border-slate-800 text-slate-200 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-500"
              />

              <select
                value={newAspectRatio}
                onChange={(e) => setNewAspectRatio(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 text-slate-200 text-xs px-2.5 py-2 rounded-lg focus:outline-none"
              >
                <option value="9:16">9:16 (TikTok/Shorts)</option>
                <option value="16:9">16:9 (YouTube Ngang)</option>
                <option value="1:1">1:1 (Instagram)</option>
              </select>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400 transition-colors shadow"
              >
                Tạo Ngay
              </button>
            </div>
          </form>
        )}

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {projects.map((proj) => {
            const isActive = proj.id === currentProjectId;
            const clipCount = proj.timelineClips?.length || 0;

            return (
              <div
                key={proj.id}
                onClick={() => {
                  onSelectProject(proj);
                  onClose();
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isActive
                    ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-950 border-slate-800/80 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                {/* Left Info */}
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-white">{proj.name}</span>
                    {isActive && (
                      <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.5 rounded font-bold">
                        Đang Mở
                      </span>
                    )}
                    <span className="text-[10px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800">
                      {proj.aspectRatio}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-[11px] text-slate-500">
                    <span className="flex items-center space-x-1">
                      <Film className="w-3 h-3 text-slate-400" />
                      <span>{clipCount} phân đoạn</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>Sửa đổi: {formatDate(proj.updatedAt)}</span>
                    </span>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={(e) => handleExport(proj, e)}
                    className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors"
                    title="Xuất file .cinepro sao lưu dự án"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => handleDuplicate(proj.id, e)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                    title="Nhân bản dự án"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => handleDelete(proj.id, e)}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                    title="Xóa dự án"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-500">
          <span>Tổng cộng: <strong className="text-slate-300">{projects.length} dự án</strong></span>
          <span>Dữ liệu lưu trữ an toàn trong IndexedDB/Storage trên máy bạn</span>
        </div>
      </div>
    </div>
  );
};
