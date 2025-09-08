const { Sequelize, DataTypes } = require('sequelize');

// Database connection
const sequelize = new Sequelize(
  process.env.DB_NAME || 'project_management_app',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// User Model
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  timezone: {
    type: DataTypes.STRING,
    defaultValue: 'UTC'
  },
  userType: {
    type: DataTypes.ENUM('individual', 'company'),
    defaultValue: 'individual'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'users',
  timestamps: true
});

// Company Model
const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  ownerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  }
}, {
  tableName: 'companies',
  timestamps: true
});

// Company Member Model (for role-based permissions)
const CompanyMember = sequelize.define('CompanyMember', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Company,
      key: 'id'
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'project_manager', 'member', 'viewer'),
    defaultValue: 'member'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'company_members',
  timestamps: true
});

// Project Model
const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  methodology: {
    type: DataTypes.ENUM('kanban', 'scrum', 'agile', 'waterfall', 'custom'),
    defaultValue: 'kanban'
  },
  status: {
    type: DataTypes.ENUM('planning', 'active', 'on_hold', 'completed', 'cancelled'),
    defaultValue: 'planning'
  },
  priority: {
    type: DataTypes.ENUM('critical', 'high', 'medium', 'low'),
    defaultValue: 'medium'
  },
  startDate: {
    type: DataTypes.DATE
  },
  endDate: {
    type: DataTypes.DATE
  },
  ownerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: Company,
      key: 'id'
    }
  }
}, {
  tableName: 'projects',
  timestamps: true
});

// Task Model
const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.ENUM('todo', 'in_progress', 'done'),
    defaultValue: 'todo'
  },
  priority: {
    type: DataTypes.ENUM('critical', 'high', 'medium', 'low'),
    defaultValue: 'medium'
  },
  dueDate: {
    type: DataTypes.DATE
  },
  estimatedHours: {
    type: DataTypes.DECIMAL(5, 2)
  },
  actualHours: {
    type: DataTypes.DECIMAL(5, 2)
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  projectId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Project,
      key: 'id'
    }
  },
  assigneeId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    }
  },
  createdById: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  }
}, {
  tableName: 'tasks',
  timestamps: true
});

// Daily Task Model (for the unique daily reset feature)
const DailyTask = sequelize.define('DailyTask', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  completedAt: {
    type: DataTypes.DATE
  },
  streak: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  projectId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: Project,
      key: 'id'
    }
  }
}, {
  tableName: 'daily_tasks',
  timestamps: true
});

// Daily Task History (for tracking performance over time)
const DailyTaskHistory = sequelize.define('DailyTaskHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  dailyTaskId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: DailyTask,
      key: 'id'
    }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  wasCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  completedAt: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'daily_task_history',
  timestamps: true
});

// Define Associations
User.hasMany(Company, { foreignKey: 'ownerId', as: 'ownedCompanies' });
Company.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

User.belongsToMany(Company, { through: CompanyMember, foreignKey: 'userId', as: 'companies' });
Company.belongsToMany(User, { through: CompanyMember, foreignKey: 'companyId', as: 'members' });

User.hasMany(Project, { foreignKey: 'ownerId', as: 'ownedProjects' });
Project.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

Company.hasMany(Project, { foreignKey: 'companyId', as: 'projects' });
Project.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

Project.hasMany(Task, { foreignKey: 'projectId', as: 'tasks' });
Task.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

User.hasMany(Task, { foreignKey: 'assigneeId', as: 'assignedTasks' });
Task.belongsTo(User, { foreignKey: 'assigneeId', as: 'assignee' });

User.hasMany(Task, { foreignKey: 'createdById', as: 'createdTasks' });
Task.belongsTo(User, { foreignKey: 'createdById', as: 'creator' });

User.hasMany(DailyTask, { foreignKey: 'userId', as: 'dailyTasks' });
DailyTask.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Project.hasMany(DailyTask, { foreignKey: 'projectId', as: 'dailyTasks' });
DailyTask.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

DailyTask.hasMany(DailyTaskHistory, { foreignKey: 'dailyTaskId', as: 'history' });
DailyTaskHistory.belongsTo(DailyTask, { foreignKey: 'dailyTaskId', as: 'dailyTask' });

module.exports = {
  sequelize,
  User,
  Company,
  CompanyMember,
  Project,
  Task,
  DailyTask,
  DailyTaskHistory
};
