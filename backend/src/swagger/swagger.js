const swaggerUi = require('swagger-ui-express');

const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'College-Based Real-Time Socket Communication System API',
    version: '1.0.0',
    description: `Complete REST and Real-Time WebSocket API for collegiate communication.
Supports multi-college isolation, department and batch routing, live messaging, presence indicators, notifications, and announcements.`,
    contact: {
      name: 'College Socket System Team',
      email: 'admin@college.edu'
    }
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Backend Server'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token (obtained via /api/v1/auth/login or /register)'
      }
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          statusCode: { type: 'integer', example: 200 },
          message: { type: 'string', example: 'Operation successful' },
          data: { type: 'object' }
        }
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@mit.edu' },
          password: { type: 'string', format: 'password', example: 'Admin@123' }
        }
      },
      RegisterRequest: {
        type: 'object',
        required: ['first_name', 'last_name', 'email', 'password'],
        properties: {
          first_name: { type: 'string', example: 'John' },
          last_name: { type: 'string', example: 'Doe' },
          email: { type: 'string', format: 'email', example: 'johndoe@mit.edu' },
          password: { type: 'string', example: 'Password@123' },
          role_id: { type: 'integer', example: 4, description: '1: super_admin, 2: college_admin, 3: faculty, 4: student' },
          college_id: { type: 'integer', example: 1 },
          phone: { type: 'string', example: '+1 617-555-9999' },
          enrollment_no: { type: 'string', example: 'MIT-2024-CS999' },
          batch_id: { type: 'integer', example: 1 },
          department_id: { type: 'integer', example: 1 }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          first_name: { type: 'string', example: 'Alan' },
          last_name: { type: 'string', example: 'Turing' },
          email: { type: 'string', example: 'faculty.cs@mit.edu' },
          phone: { type: 'string', example: '+1 617-555-0456' },
          avatar_url: { type: 'string', example: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alan' },
          college_id: { type: 'integer', example: 1 },
          role_id: { type: 'integer', example: 3 },
          is_active: { type: 'boolean', example: true }
        }
      },
      College: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Massachusetts Institute of Technology' },
          code: { type: 'string', example: 'MIT' },
          address: { type: 'string', example: '77 Massachusetts Ave, Cambridge, MA' },
          contact_email: { type: 'string', example: 'contact@mit.edu' },
          contact_phone: { type: 'string', example: '+1 617-253-1000' },
          status: { type: 'string', enum: ['active', 'inactive'], example: 'active' }
        }
      },
      Department: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          college_id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Computer Science & Engineering' },
          code: { type: 'string', example: 'CSE' }
        }
      },
      ChatRoom: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          college_id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'MIT Campus-Wide' },
          type: { type: 'string', enum: ['direct', 'group', 'college', 'department', 'course', 'batch'], example: 'college' },
          reference_id: { type: 'integer', nullable: true },
          is_active: { type: 'boolean', example: true }
        }
      },
      SendMessageRequest: {
        type: 'object',
        required: ['content'],
        properties: {
          content: { type: 'string', example: 'Hello everyone in the campus room!' },
          message_type: { type: 'string', enum: ['text', 'announcement', 'system', 'file'], default: 'text' },
          media_url: { type: 'string', nullable: true }
        }
      },
      SendNotificationRequest: {
        type: 'object',
        required: ['title', 'content'],
        properties: {
          title: { type: 'string', example: 'Campus Maintenance Alert' },
          content: { type: 'string', example: 'Library will close at 8 PM tonight for maintenance.' },
          type: { type: 'string', enum: ['announcement', 'college', 'department', 'course', 'personal', 'system'], default: 'college' },
          priority: { type: 'string', enum: ['low', 'normal', 'high'], default: 'normal' },
          target_role: { type: 'string', enum: ['all', 'faculty', 'student'], default: 'all' },
          target_user_id: { type: 'integer', nullable: true }
        }
      }
    }
  },
  tags: [
    { name: 'Auth', description: 'Authentication & Session operations' },
    { name: 'Users', description: 'User management, profiles & online status' },
    { name: 'Colleges', description: 'College, Department, Course & Batch management' },
    { name: 'Chat', description: 'Rooms, Direct messaging, History & Delivery status' },
    { name: 'Notifications', description: 'Real-time and stored notifications' },
    { name: 'Announcements', description: 'Broad announcements for students and faculty' },
    { name: 'System', description: 'Health and monitoring endpoints' }
  ],
  paths: {
    '/api/v1/health': {
      get: {
        tags: ['System'],
        summary: 'Server Health Check',
        responses: {
          200: {
            description: 'Server is healthy',
            content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'healthy' } } } } }
          }
        }
      }
    },
    '/api/v1/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'User Login',
        description: 'Authenticates user with email and password and returns JWT token.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } }
        },
        responses: {
          200: { description: 'Login successful with token' },
          401: { description: 'Invalid email or password' }
        }
      }
    },
    '/api/v1/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'User Registration',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } }
        },
        responses: {
          201: { description: 'User registered successfully' },
          400: { description: 'Missing required fields' },
          409: { description: 'Email already exists' }
        }
      }
    },
    '/api/v1/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get Current Authenticated Profile',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'User profile retrieved' },
          401: { description: 'Unauthorized' }
        }
      }
    },
    '/api/v1/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'User Logout',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Logged out successfully' }
        }
      }
    },
    '/api/v1/users': {
      get: {
        tags: ['Users'],
        summary: 'List Users',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'college_id', schema: { type: 'integer' } },
          { in: 'query', name: 'role_id', schema: { type: 'integer' } },
          { in: 'query', name: 'search', schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'List of users' }
        }
      }
    },
    '/api/v1/users/online': {
      get: {
        tags: ['Users'],
        summary: 'List Online Users',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'List of currently active socket users' }
        }
      }
    },
    '/api/v1/users/students': {
      get: {
        tags: ['Users'],
        summary: 'List Student Profiles',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'List of students with batch and department' }
        }
      }
    },
    '/api/v1/users/faculty': {
      get: {
        tags: ['Users'],
        summary: 'List Faculty Members',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'List of faculty members' }
        }
      }
    },
    '/api/v1/colleges': {
      get: {
        tags: ['Colleges'],
        summary: 'List Colleges',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'List of registered colleges' }
        }
      },
      post: {
        tags: ['Colleges'],
        summary: 'Create College (Super Admin)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'code'],
                properties: {
                  name: { type: 'string', example: 'Harvard University' },
                  code: { type: 'string', example: 'HARVARD' },
                  address: { type: 'string', example: 'Cambridge, MA' },
                  contact_email: { type: 'string', example: 'info@harvard.edu' },
                  contact_phone: { type: 'string', example: '+1 617-495-1000' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'College created' }
        }
      }
    },
    '/api/v1/colleges/{id}': {
      get: {
        tags: ['Colleges'],
        summary: 'Get College Details with Departments',
        security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'College details' } }
      }
    },
    '/api/v1/colleges/departments/list': {
      get: {
        tags: ['Colleges'],
        summary: 'List Departments for College',
        security: [{ BearerAuth: [] }],
        parameters: [{ in: 'query', name: 'college_id', schema: { type: 'integer' } }],
        responses: { 200: { description: 'Departments list' } }
      }
    },
    '/api/v1/colleges/departments/create': {
      post: {
        tags: ['Colleges'],
        summary: 'Create Department',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'code'],
                properties: {
                  college_id: { type: 'integer', example: 1 },
                  name: { type: 'string', example: 'Civil Engineering' },
                  code: { type: 'string', example: 'CIVIL' }
                }
              }
            }
          }
        },
        responses: { 201: { description: 'Department created' } }
      }
    },
    '/api/v1/chat/rooms': {
      get: {
        tags: ['Chat'],
        summary: 'List Chat Rooms for Authenticated User',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'List of accessible chat rooms' } }
      },
      post: {
        tags: ['Chat'],
        summary: 'Create Group Chat Room',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'AI Project Study Group' },
                  member_ids: { type: 'array', items: { type: 'integer' }, example: [4, 5] }
                }
              }
            }
          }
        },
        responses: { 201: { description: 'Group created' } }
      }
    },
    '/api/v1/chat/direct': {
      post: {
        tags: ['Chat'],
        summary: 'Get or Create Direct 1-to-1 Chat Room',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['recipient_id'],
                properties: {
                  recipient_id: { type: 'integer', example: 5 }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'Direct room instance' } }
      }
    },
    '/api/v1/chat/rooms/{id}/messages': {
      get: {
        tags: ['Chat'],
        summary: 'Get Messages in Chat Room with Pagination',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'integer' } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 50 } },
          { in: 'query', name: 'before_id', schema: { type: 'integer' } }
        ],
        responses: { 200: { description: 'List of messages' } }
      },
      post: {
        tags: ['Chat'],
        summary: 'Send Message via REST',
        security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SendMessageRequest' } } }
        },
        responses: { 201: { description: 'Message sent' } }
      }
    },
    '/api/v1/chat/rooms/{id}/read': {
      post: {
        tags: ['Chat'],
        summary: 'Mark Room Messages as Read',
        security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['last_message_id'],
                properties: { last_message_id: { type: 'integer', example: 10 } }
              }
            }
          }
        },
        responses: { 200: { description: 'Messages marked read' } }
      }
    },
    '/api/v1/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'Get Current User Notifications & Unread Count',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 50 } },
          { in: 'query', name: 'unread', schema: { type: 'boolean', default: false } }
        ],
        responses: { 200: { description: 'Notifications and unread count' } }
      },
      post: {
        tags: ['Notifications'],
        summary: 'Send Notification (Admin & Faculty)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SendNotificationRequest' } } }
        },
        responses: { 201: { description: 'Notification created' } }
      }
    },
    '/api/v1/notifications/{id}/read': {
      patch: {
        tags: ['Notifications'],
        summary: 'Mark Specific Notification as Read',
        security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Notification marked as read' } }
      }
    },
    '/api/v1/notifications/read-all': {
      patch: {
        tags: ['Notifications'],
        summary: 'Mark All Notifications as Read',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'All notifications marked as read' } }
      }
    },
    '/api/v1/announcements': {
      get: {
        tags: ['Announcements'],
        summary: 'List Announcements for User College',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'List of announcements' } }
      },
      post: {
        tags: ['Announcements'],
        summary: 'Create Announcement (Admin & Faculty)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'content'],
                properties: {
                  title: { type: 'string', example: 'Final Exams Schedule Released' },
                  content: { type: 'string', example: 'The end-semester exam datesheet is now published on the board.' },
                  target_role: { type: 'string', enum: ['all', 'faculty', 'student'], default: 'all' },
                  priority: { type: 'string', enum: ['low', 'normal', 'high'], default: 'normal' }
                }
              }
            }
          }
        },
        responses: { 201: { description: 'Announcement posted' } }
      }
    }
  }
};

const setupSwagger = (app) => {
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'College Socket API Documentation'
    })
  );
};

module.exports = {
  setupSwagger,
  swaggerDocument
};
