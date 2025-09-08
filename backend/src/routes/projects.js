const express = require('express');
const { body, validationResult } = require('express-validator');
const { Project, Task, User, Company } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all project routes
router.use(authenticateToken);

// Get all projects for the authenticated user
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, methodology } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = { ownerId: req.user.userId };
    if (status) whereClause.status = status;
    if (methodology) whereClause.methodology = methodology;

    const projects = await Project.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: Task,
          as: 'tasks',
          attributes: ['id', 'status', 'priority']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    // Calculate project statistics
    const projectsWithStats = projects.rows.map(project => {
      const tasks = project.tasks || [];
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => task.status === 'done').length;
      const inProgressTasks = tasks.filter(task => task.status === 'in_progress').length;
      const todoTasks = tasks.filter(task => task.status === 'todo').length;
      
      return {
        ...project.toJSON(),
        stats: {
          totalTasks,
          completedTasks,
          inProgressTasks,
          todoTasks,
          completionPercentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
        }
      };
    });

    res.json({
      success: true,
      data: {
        projects: projectsWithStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: projects.count,
          totalPages: Math.ceil(projects.count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching projects'
    });
  }
});

// Get a specific project by ID
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findOne({
      where: {
        id: req.params.id,
        ownerId: req.user.userId
      },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: Task,
          as: 'tasks',
          include: [
            {
              model: User,
              as: 'assignee',
              attributes: ['id', 'firstName', 'lastName', 'email']
            }
          ]
        }
      ]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Calculate detailed project statistics
    const tasks = project.tasks || [];
    const stats = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(task => task.status === 'done').length,
      inProgressTasks: tasks.filter(task => task.status === 'in_progress').length,
      todoTasks: tasks.filter(task => task.status === 'todo').length,
      criticalTasks: tasks.filter(task => task.priority === 'critical').length,
      highPriorityTasks: tasks.filter(task => task.priority === 'high').length,
      overdueTasks: tasks.filter(task => task.dueDate && new Date(task.dueDate) < new Date()).length,
      completionPercentage: tasks.length > 0 ? Math.round((tasks.filter(task => task.status === 'done').length / tasks.length) * 100) : 0
    };

    res.json({
      success: true,
      data: {
        project: {
          ...project.toJSON(),
          stats
        }
      }
    });

  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching project'
    });
  }
});

// Create a new project
router.post('/', [
  body('name').trim().isLength({ min: 1 }).withMessage('Project name is required'),
  body('description').optional().trim(),
  body('methodology').optional().isIn(['kanban', 'scrum', 'agile', 'waterfall', 'custom']),
  body('priority').optional().isIn(['critical', 'high', 'medium', 'low']),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      name,
      description,
      methodology = 'kanban',
      priority = 'medium',
      startDate,
      endDate
    } = req.body;

    // Validate date logic
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be after end date'
      });
    }

    const project = await Project.create({
      name,
      description,
      methodology,
      priority,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      ownerId: req.user.userId,
      status: 'planning'
    });

    // Fetch the created project with owner details
    const createdProject = await Project.findByPk(project.id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project: createdProject }
    });

  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating project'
    });
  }
});

// Update a project
router.put('/:id', [
  body('name').optional().trim().isLength({ min: 1 }).withMessage('Project name cannot be empty'),
  body('description').optional().trim(),
  body('methodology').optional().isIn(['kanban', 'scrum', 'agile', 'waterfall', 'custom']),
  body('status').optional().isIn(['planning', 'active', 'on_hold', 'completed', 'cancelled']),
  body('priority').optional().isIn(['critical', 'high', 'medium', 'low']),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const project = await Project.findOne({
      where: {
        id: req.params.id,
        ownerId: req.user.userId
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const updateData = req.body;

    // Validate date logic if both dates are provided
    if (updateData.startDate && updateData.endDate) {
      if (new Date(updateData.startDate) > new Date(updateData.endDate)) {
        return res.status(400).json({
          success: false,
          message: 'Start date cannot be after end date'
        });
      }
    }

    // Convert date strings to Date objects
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);

    await project.update(updateData);

    // Fetch updated project with owner details
    const updatedProject = await Project.findByPk(project.id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: { project: updatedProject }
    });

  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating project'
    });
  }
});

// Delete a project
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findOne({
      where: {
        id: req.params.id,
        ownerId: req.user.userId
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if project has tasks
    const taskCount = await Task.count({
      where: { projectId: project.id }
    });

    if (taskCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete project with ${taskCount} existing tasks. Please delete all tasks first.`
      });
    }

    await project.destroy();

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting project'
    });
  }
});

// Get project dashboard data
router.get('/:id/dashboard', async (req, res) => {
  try {
    const project = await Project.findOne({
      where: {
        id: req.params.id,
        ownerId: req.user.userId
      },
      include: [
        {
          model: Task,
          as: 'tasks'
        }
      ]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const tasks = project.tasks || [];
    
    // Calculate comprehensive statistics
    const stats = {
      overview: {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'done').length,
        inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
        todoTasks: tasks.filter(t => t.status === 'todo').length,
        completionPercentage: tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0
      },
      priority: {
        critical: tasks.filter(t => t.priority === 'critical').length,
        high: tasks.filter(t => t.priority === 'high').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        low: tasks.filter(t => t.priority === 'low').length
      },
      deadlines: {
        overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length,
        dueSoon: tasks.filter(t => {
          if (!t.dueDate) return false;
          const dueDate = new Date(t.dueDate);
          const today = new Date();
          const threeDaysFromNow = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000));
          return dueDate >= today && dueDate <= threeDaysFromNow;
        }).length,
        noDueDate: tasks.filter(t => !t.dueDate).length
      },
      recentActivity: {
        tasksCreatedThisWeek: tasks.filter(t => {
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return new Date(t.createdAt) > weekAgo;
        }).length,
        tasksCompletedThisWeek: tasks.filter(t => {
          if (t.status !== 'done') return false;
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return new Date(t.updatedAt) > weekAgo;
        }).length
      }
    };

    res.json({
      success: true,
      data: {
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          methodology: project.methodology,
          status: project.status,
          priority: project.priority,
          startDate: project.startDate,
          endDate: project.endDate
        },
        stats
      }
    });

  } catch (error) {
    console.error('Get project dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching project dashboard'
    });
  }
});

module.exports = router;
