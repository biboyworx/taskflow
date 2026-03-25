"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { useAppStore } from "@/lib/store";

export function DataProvider() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const loadProjects = useAppStore((s) => s.loadProjects);
  const loadProjectData = useAppStore((s) => s.loadProjectData);
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const loadInvites = useAppStore((s) => s.loadInvites);
  const isUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  const setProjects = useAppStore((s) => s.setProjects);
  const setColumns = useAppStore((s) => s.setColumns);
  const setTasks = useAppStore((s) => s.setTasks);
  const setMembers = useAppStore((s) => s.setMembers);
  const setTags = useAppStore((s) => s.setTags);
  const setActivities = useAppStore((s) => s.setActivities);
  const setInvites = useAppStore((s) => s.setInvites);
  const setCurrentMemberRole = useAppStore((s) => s.setCurrentMemberRole);
  const setActiveProject = useAppStore((s) => s.setActiveProject);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      setProjects([]);
      setColumns([]);
      setTasks([]);
      setMembers([]);
      setTags([]);
      setActivities([]);
      setInvites([]);
      setActiveProject(null);
      setCurrentMemberRole(null);
      return;
    }
    void loadProjects(user.id);
    if (user.email) {
      void loadInvites(user.email);
    }
  }, [isAuthenticated, isLoading, loadInvites, loadProjects, setActivities, setActiveProject, setColumns, setCurrentMemberRole, setInvites, setMembers, setProjects, setTags, setTasks, user]);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !activeProjectId || !isUuid(activeProjectId) || !user) return;
    void loadProjectData(activeProjectId, user.id);
  }, [activeProjectId, isAuthenticated, isLoading, loadProjectData, user]);

  return null;
}
