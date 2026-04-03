import { KanbanBoard } from './components/KanbanBoard';
import { ActivityFeed } from './components/ActivityFeed';

function App() {
  // TODO: Get these from routing/context/auth
  const orgId = 'your-org-id'; // Replace with actual org ID
  const projectId = 'your-project-id'; // Replace with actual project ID

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Kanban Board</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Kanban Board - takes up 3 columns on large screens */}
          <div className="lg:col-span-3">
            <KanbanBoard orgId={orgId} projectId={projectId} />
          </div>

          {/* Activity Feed - takes up 1 column on large screens */}
          <div className="lg:col-span-1">
            <ActivityFeed orgId={orgId} projectId={projectId} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
