"use client";

import { useRouter } from "next/navigation";
import { useProjects } from "@/hooks/useProjects";
import { formatDate } from "@/lib/utils/format";
import { useState } from "react";

export default function DashboardPage() {
  const { projects, loading, createProject, deleteProject } = useProjects();
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    const id = await createProject();
    setCreating(false);
    if (id) router.push(`/projects/${id}`);
  };

  const handleDelete = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (confirm("Delete this project? This cannot be undone.")) {
      await deleteProject(projectId);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-headline text-2xl font-bold text-primary-container">
            Projects
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            LED tape estimator projects
          </p>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-container text-on-primary
            font-semibold text-sm rounded-lg hover:bg-[#2a3a54] transition-colors
            disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          {creating ? "Creating..." : "New Project"}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary-container border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!loading && projects.length === 0 && (
        <div className="text-center py-20 bg-white rounded-xl border border-outline-variant">
          <span className="material-symbols-outlined text-5xl text-outline mb-4">
            note_add
          </span>
          <h2 className="font-headline text-lg font-bold text-on-surface mb-2">
            No projects yet
          </h2>
          <p className="text-sm text-on-surface-variant mb-6">
            Create your first LED tape estimator project to get started.
          </p>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="px-5 py-2.5 bg-primary-container text-on-primary font-semibold text-sm
              rounded-lg hover:bg-[#2a3a54] transition-colors"
          >
            Create Project
          </button>
        </div>
      )}

      {/* Project Grid */}
      {!loading && projects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => router.push(`/projects/${project.id}`)}
              className="bg-white rounded-xl border border-outline-variant p-5 cursor-pointer
                hover:shadow-md hover:border-secondary transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-headline text-base font-bold text-on-surface group-hover:text-primary-container transition-colors">
                  {project.name}
                </h3>
                <div className="flex items-center gap-1">
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                      project.status === "draft"
                        ? "bg-secondary-container text-[#5D4201]"
                        : project.status === "finalized"
                          ? "bg-[#EEF2E8] text-success"
                          : "bg-surface-container text-on-surface-variant"
                    }`}
                  >
                    {project.status}
                  </span>
                  <button
                    onClick={(e) => handleDelete(e, project.id)}
                    className="ml-1 text-outline hover:text-error transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <span className="material-symbols-outlined text-lg">
                      delete
                    </span>
                  </button>
                </div>
              </div>

              {project.clientName && (
                <p className="text-sm text-on-surface-variant mb-1">
                  {project.clientName}
                </p>
              )}
              {project.showroomName && (
                <p className="text-xs text-outline">{project.showroomName}</p>
              )}

              <div className="mt-4 pt-3 border-t border-outline-variant flex items-center justify-between">
                <span className="text-xs text-outline">
                  {formatDate(project.updatedAt)}
                </span>
                <span className="text-xs text-secondary font-medium capitalize">
                  {project.pricingDisplay}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
