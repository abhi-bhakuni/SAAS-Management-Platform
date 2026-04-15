import { Injectable } from '@nestjs/common';

@Injectable()
export class SandboxService {
  getDashboardData() {
    return {
      stats: {
        totalProjects: 12,
        activeTasks: 34,
        completedTasks: 89,
        teamSize: 5,
      },
      trends: {
        totalProjects: '+2 this month',
        activeTasks: '+12% this month',
        completedTasks: '+24 this month',
        teamSize: '+1 this month',
      },
      recentActivity: [
        { id: 1, user: 'Abhishek Bhakuni', action: 'completed task "Hero Section Design"', timestamp: '2 mins ago' },
        { id: 2, user: 'Sarah Miller', action: 'moved "Auth Flow" to Review', timestamp: '15 mins ago' },
      ],
      projectStatus: [
        { name: 'Completed', value: 45 },
        { name: 'In Progress', value: 35 },
        { name: 'Review', value: 20 },
      ]
    };
  }

  getProjects() {
    return [
      {
        id: 'mock-proj-1',
        name: 'Website Redesign',
        description: 'Modernizing the landing page with better conversion metrics.',
        members: 3,
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: 'Active',
      },
      {
        id: 'mock-proj-2',
        name: 'Mobile App',
        description: 'Building the iOS/Android client for user core functions.',
        members: 5,
        updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        status: 'In Progress',
      },
      {
        id: 'mock-proj-3',
        name: 'Backend API',
        description: 'Scaling the core microservices for high availability.',
        members: 2,
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        status: 'Planning',
      }
    ];
  }

  getTasks() {
    return [
      {
        id: 'MOCK-101',
        title: 'Design System Documentation',
        project: 'Website Redesign',
        status: 'done',
        assignee: 'Abhishek B.',
        dueDate: '2026-05-10',
        priority: 'High'
      },
      {
        id: 'MOCK-102',
        title: 'Auth Flow Implementation',
        project: 'Mobile App',
        status: 'in_review',
        assignee: 'Sarah M.',
        dueDate: '2026-05-12',
        priority: 'Critical'
      },
      {
        id: 'MOCK-103',
        title: 'Database Optimization',
        project: 'Backend API',
        status: 'in_progress',
        assignee: 'David C.',
        dueDate: '2026-05-15',
        priority: 'Medium'
      }
    ];
  }

  getActivity() {
    return [
      {
        id: 1,
        type: 'task_created',
        user: 'Abhishek Bhakuni',
        avatar: 'https://i.pravatar.cc/150?u=abhishek',
        description: 'created task',
        targetName: 'Design System Documentation',
        project: 'Website Redesign',
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        color: '#3B82F6'
      },
      {
        id: 2,
        type: 'task_moved',
        user: 'Sarah Miller',
        avatar: 'https://i.pravatar.cc/150?u=sarah',
        description: 'moved task',
        targetName: 'Auth Flow Implementation',
        fromStatus: 'Todo',
        toStatus: 'Review',
        project: 'Mobile App',
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        color: '#A855F7'
      }
    ];
  }
}
