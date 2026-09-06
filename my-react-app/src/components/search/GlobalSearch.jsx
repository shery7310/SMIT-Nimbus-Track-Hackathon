import { useMemo, useState } from 'react';
import { Search, FolderKanban, ListTodo, Building2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

const matches = (values, query) => values.filter(Boolean).join(' ').toLowerCase().includes(query);

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const workspaces = useSelector((state) => state.workspaces.workspaces);
  const projects = useSelector((state) => state.projects.projects);
  const tasks = useSelector((state) => state.tasks.tasks);
  const users = useSelector((state) => state.auth.users);
  const term = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!term) return [];
    const workspaceResults = workspaces.filter((item) => matches([item.name], term)).map((item) => ({ type: 'Workspace', icon: Building2, title: item.name, detail: 'Workspace', to: `/workspace/${item.id}` }));
    const projectResults = projects.filter((item) => matches([item.name, item.description], term)).map((item) => ({ type: 'Project', icon: FolderKanban, title: item.name, detail: 'Project', to: `/workspace/${item.workspaceId}/project/${item.id}` }));
    const taskResults = tasks.filter((item) => {
      const assignee = users.find((user) => user.id === item.assigneeId);
      return matches([item.title, item.description, ...(item.labels || []), assignee?.firstName, assignee?.lastName, assignee?.email], term);
    }).map((item) => ({ type: 'Task', icon: ListTodo, title: item.title, detail: 'Task', to: `/workspace/${item.workspaceId}/project/${item.projectId}` }));
    return [...workspaceResults, ...projectResults, ...taskResults].slice(0, 8);
  }, [term, workspaces, projects, tasks, users]);
  return <div className="global-search"><div className="topbar-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks, projects, workspaces..." aria-label="Global search" /></div>{term && <div className="global-search-results">{results.length ? results.map(({ type, icon: Icon, title, detail, to }, index) => <Link to={to} key={`${type}-${index}`} onClick={() => setQuery('')}><Icon /><span><strong>{title}</strong><small>{detail}</small></span></Link>) : <p>No matching workspaces, projects, or tasks.</p>}</div>}</div>;
}
