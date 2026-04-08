export const MOCK_PROJECTS = [
  {
    id: 'mock-proj-1',
    name: '[Demo] Website Redesign',
    description: 'A mock project demonstrating the dashboard view for guests.',
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    members: 3,
  },
  {
    id: 'mock-proj-2',
    name: '[Demo] Mobile App App',
    description: 'Explore how projects are organized in this minimalist interface.',
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    members: 2,
  }
];

export const MOCK_TASKS = [
  {
    id: 'MOCK-101',
    projectId: 'mock-proj-1',
    title: '[Demo] Define Design System',
    description: 'This is a mock task to show how task management works.',
    status: 'done',
    priority: 'high',
    dueDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assignedToUser: { firstName: 'Demo', lastName: 'User' }
  },
  {
    id: 'MOCK-102',
    projectId: 'mock-proj-1',
    title: '[Demo] Implement Auth Flow',
    description: 'Sign in to actually start creating your own tasks.',
    status: 'in_progress',
    priority: 'urgent',
    dueDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assignedToUser: { firstName: 'Guest', lastName: 'Viewer' }
  }
] as any[];

