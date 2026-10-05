import { Project, TimelineClip } from '../types/editor';

const PROJECTS_STORAGE_KEY = 'cinepro_studio_projects_v1';
const ACTIVE_PROJECT_ID_KEY = 'cinepro_studio_active_id_v1';

export function getInitialDefaultProject(): Project {
  return {
    id: 'proj_default_01',
    name: 'Dự Án Viral Shorts 70s - AI Dialogue Highlights',
    createdAt: Date.now() - 3600000 * 2,
    updatedAt: Date.now(),
    targetDuration: 70.0,
    aspectRatio: '9:16',
    resolutionPreset: '1080x1920',
    fps: 30,
    timelineClips: [],
    subtitlesEnabled: true,
    subtitleStyle: 'tiktok-bold',
    bgmTrack: {
      enabled: true,
      title: 'Phonk Drill - High Energy Beats',
      volume: 35,
      genre: 'Energetic Phonk',
    },
    gpuEngine: 'nvenc',
  };
}

export function loadAllProjects(): Project[] {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) {
      const defaultProj = getInitialDefaultProject();
      saveAllProjects([defaultProj]);
      return [defaultProj];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [getInitialDefaultProject()];
  } catch (e) {
    return [getInitialDefaultProject()];
  }
}

export function saveAllProjects(projects: Project[]): void {
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('Lỗi lưu dự án vào bộ nhớ máy:', e);
  }
}

export function getActiveProjectId(): string {
  return localStorage.getItem(ACTIVE_PROJECT_ID_KEY) || 'proj_default_01';
}

export function setActiveProjectId(id: string): void {
  localStorage.setItem(ACTIVE_PROJECT_ID_KEY, id);
}

export function createNewProject(name: string, aspectRatio: Project['aspectRatio'] = '9:16'): Project {
  const newProj: Project = {
    id: `proj_${Date.now()}`,
    name: name.trim() || `Dự Án Mới #${Math.floor(Math.random() * 1000)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    targetDuration: 70.0,
    aspectRatio,
    resolutionPreset: aspectRatio === '16:9' ? '1920x1080' : '1080x1920',
    fps: 30,
    timelineClips: [],
    subtitlesEnabled: true,
    subtitleStyle: 'tiktok-bold',
    bgmTrack: {
      enabled: true,
      title: 'Upbeat Cinematic Vlog',
      volume: 30,
      genre: 'Upbeat Vlog',
    },
    gpuEngine: 'nvenc',
  };

  const list = loadAllProjects();
  list.unshift(newProj);
  saveAllProjects(list);
  setActiveProjectId(newProj.id);
  return newProj;
}

export function duplicateProject(projectId: string): Project | null {
  const list = loadAllProjects();
  const found = list.find((p) => p.id === projectId);
  if (!found) return null;

  const clone: Project = {
    ...found,
    id: `proj_${Date.now()}`,
    name: `${found.name} (Bản sao)`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  list.unshift(clone);
  saveAllProjects(list);
  setActiveProjectId(clone.id);
  return clone;
}

export function deleteProject(projectId: string): Project[] {
  let list = loadAllProjects();
  list = list.filter((p) => p.id !== projectId);
  if (list.length === 0) {
    list = [getInitialDefaultProject()];
  }
  saveAllProjects(list);
  setActiveProjectId(list[0].id);
  return list;
}

export function exportProjectToFile(project: Project): void {
  const jsonStr = JSON.stringify(project, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name.replace(/\s+/g, '_')}_70s.cinepro`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importProjectFromFile(file: File): Promise<Project> {
  const text = await file.text();
  const parsed = JSON.parse(text) as Project;
  if (!parsed.id || !parsed.name) {
    throw new Error('Định dạng tệp dự án .cinepro không hợp lệ.');
  }

  parsed.id = `proj_imported_${Date.now()}`;
  parsed.updatedAt = Date.now();

  const list = loadAllProjects();
  list.unshift(parsed);
  saveAllProjects(list);
  setActiveProjectId(parsed.id);
  return parsed;
}
