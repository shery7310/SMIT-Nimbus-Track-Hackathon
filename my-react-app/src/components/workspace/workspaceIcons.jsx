import { Briefcase, Rocket, Target, Users, Folder, Star, Building2, Sparkles } from 'lucide-react';
/* eslint-disable react-refresh/only-export-components */

export const WORKSPACE_ICONS = {
  Briefcase,
  Rocket,
  Target,
  Users,
  Folder,
  Star,
  Building2,
  Sparkles,
};

export const WORKSPACE_ICON_NAMES = Object.keys(WORKSPACE_ICONS);

export function WorkspaceIcon({ name, ...props }) {
  const IconComponent = WORKSPACE_ICONS[name] || Briefcase;
  return <IconComponent {...props} />;
}