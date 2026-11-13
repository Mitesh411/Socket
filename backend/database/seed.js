const bcrypt = require('bcryptjs');
const logger = require('../src/utils/logger');
const {
  sequelize,
  Role,
  College,
  Department,
  Course,
  Batch,
  User,
  StudentProfile,
  FacultyProfile,
  ChatRoom,
  ChatRoomMember,
  Message,
  MessageStatus,
  Announcement,
  Notification,
  UserNotification
} = require('../src/models');

const seedDatabase = async () => {
  try {
    logger.info('Starting database sync and seeding...');
    await sequelize.sync({ alter: true });
    logger.info('Database tables synchronized.');

    // 1. Roles
    const rolesData = [
      { id: 1, name: 'super_admin', description: 'System-wide administrator' },
      { id: 2, name: 'college_admin', description: 'College-level administrator' },
      { id: 3, name: 'faculty', description: 'Faculty / Professor / Instructor' },
      { id: 4, name: 'student', description: 'Enrolled College Student' }
    ];

    for (const r of rolesData) {
      await Role.findOrCreate({
        where: { name: r.name },
        defaults: r
      });
    }
    logger.info('Roles seeded.');

    // 2. Colleges
    const [mit] = await College.findOrCreate({
      where: { code: 'MIT' },
      defaults: {
        name: 'Massachusetts Institute of Technology',
        code: 'MIT',
        address: '77 Massachusetts Ave, Cambridge, MA 02139',
        contact_email: 'contact@mit.edu',
        contact_phone: '+1 617-253-1000',
        status: 'active'
      }
    });

    const [stanford] = await College.findOrCreate({
      where: { code: 'STANFORD' },
      defaults: {
        name: 'Stanford University',
        code: 'STANFORD',
        address: '450 Serra Mall, Stanford, CA 94305',
        contact_email: 'info@stanford.edu',
        contact_phone: '+1 650-723-2300',
        status: 'active'
      }
    });
    logger.info('Colleges seeded.');

    // 3. Departments for MIT
    const [deptCs] = await Department.findOrCreate({
      where: { college_id: mit.id, code: 'CSE' },
      defaults: {
        college_id: mit.id,
        name: 'Computer Science & Engineering',
        code: 'CSE'
      }
    });

    const [deptEce] = await Department.findOrCreate({
      where: { college_id: mit.id, code: 'ECE' },
      defaults: {
        college_id: mit.id,
        name: 'Electronics & Communication',
        code: 'ECE'
      }
    });

    const [deptMe] = await Department.findOrCreate({
      where: { college_id: mit.id, code: 'ME' },
      defaults: {
        college_id: mit.id,
        name: 'Mechanical Engineering',
        code: 'ME'
      }
    });
    logger.info('Departments seeded.');

    // 4. Courses for MIT CS
    const [courseBtechCs] = await Course.findOrCreate({
      where: { department_id: deptCs.id, code: 'CS101' },
      defaults: {
        department_id: deptCs.id,
        name: 'B.Tech in Computer Science',
        code: 'CS101',
        duration_years: 4
      }
    });

    // 5. Batches
    const [batch2024] = await Batch.findOrCreate({
      where: { course_id: courseBtechCs.id, name: 'Batch 2024-2028' },
      defaults: {
        course_id: courseBtechCs.id,
        name: 'Batch 2024-2028',
        start_year: 2024,
        end_year: 2028
      }
    });
    logger.info('Courses and Batches seeded.');

    // Passwords
    const adminHash = await bcrypt.hash('Admin@123', 10);
    const facultyHash = await bcrypt.hash('Faculty@123', 10);
    const studentHash = await bcrypt.hash('Student@123', 10);

    // 6. Users
    // Super Admin
    const [superAdmin] = await User.findOrCreate({
      where: { email: 'superadmin@college.edu' },
      defaults: {
        college_id: null,
        role_id: 1, // super_admin
        first_name: 'Global',
        last_name: 'Administrator',
        email: 'superadmin@college.edu',
        password_hash: adminHash,
        phone: '+1 800-555-0100',
        avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=superadmin',
        is_active: true
      }
    });

    // MIT College Admin
    const [mitAdmin] = await User.findOrCreate({
      where: { email: 'admin@mit.edu' },
      defaults: {
        college_id: mit.id,
        role_id: 2, // college_admin
        first_name: 'MIT',
        last_name: 'Administrator',
        email: 'admin@mit.edu',
        password_hash: adminHash,
        phone: '+1 617-555-0123',
        avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=mitadmin',
        is_active: true
      }
    });

    // Stanford College Admin
    const [stanfordAdmin] = await User.findOrCreate({
      where: { email: 'admin@stanford.edu' },
      defaults: {
        college_id: stanford.id,
        role_id: 2, // college_admin
        first_name: 'Stanford',
        last_name: 'Administrator',
        email: 'admin@stanford.edu',
        password_hash: adminHash,
        phone: '+1 650-555-0123',
        avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=stanfordadmin',
        is_active: true
      }
    });

    // Faculty: Prof Alan Turing
    const [profAlan] = await User.findOrCreate({
      where: { email: 'faculty.cs@mit.edu' },
      defaults: {
        college_id: mit.id,
        role_id: 3, // faculty
        first_name: 'Alan',
        last_name: 'Turing',
        email: 'faculty.cs@mit.edu',
        password_hash: facultyHash,
        phone: '+1 617-555-0456',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alan',
        is_active: true
      }
    });

    await FacultyProfile.findOrCreate({
      where: { user_id: profAlan.id },
      defaults: {
        user_id: profAlan.id,
        employee_id: 'MIT-FAC-001',
        department_id: deptCs.id,
        designation: 'Professor & Head of CS',
        qualification: 'Ph.D. in Computer Science'
      }
    });

    // Student 1: Alice Johnson
    const [alice] = await User.findOrCreate({
      where: { email: 'student.cs@mit.edu' },
      defaults: {
        college_id: mit.id,
        role_id: 4, // student
        first_name: 'Alice',
        last_name: 'Johnson',
        email: 'student.cs@mit.edu',
        password_hash: studentHash,
        phone: '+1 617-555-0789',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
        is_active: true
      }
    });

    await StudentProfile.findOrCreate({
      where: { user_id: alice.id },
      defaults: {
        user_id: alice.id,
        enrollment_no: 'MIT-2024-CS001',
        batch_id: batch2024.id,
        department_id: deptCs.id,
        semester: 2
      }
    });

    // Student 2: Bob Smith
    const [bob] = await User.findOrCreate({
      where: { email: 'student2.cs@mit.edu' },
      defaults: {
        college_id: mit.id,
        role_id: 4, // student
        first_name: 'Bob',
        last_name: 'Smith',
        email: 'student2.cs@mit.edu',
        password_hash: studentHash,
        phone: '+1 617-555-0790',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
        is_active: true
      }
    });

    await StudentProfile.findOrCreate({
      where: { user_id: bob.id },
      defaults: {
        user_id: bob.id,
        enrollment_no: 'MIT-2024-CS002',
        batch_id: batch2024.id,
        department_id: deptCs.id,
        semester: 2
      }
    });
    logger.info('Users and profiles seeded.');

    // 7. Chat Rooms
    // Campus-Wide Chat Room
    const [campusRoom] = await ChatRoom.findOrCreate({
      where: { college_id: mit.id, type: 'college', name: 'MIT Campus-Wide' },
      defaults: {
        college_id: mit.id,
        type: 'college',
        name: 'MIT Campus-Wide',
        created_by: mitAdmin.id,
        is_active: true
      }
    });

    // Department Chat Room
    const [deptCsRoom] = await ChatRoom.findOrCreate({
      where: { college_id: mit.id, type: 'department', reference_id: deptCs.id },
      defaults: {
        college_id: mit.id,
        type: 'department',
        reference_id: deptCs.id,
        name: 'Computer Science Department',
        created_by: profAlan.id,
        is_active: true
      }
    });

    // Batch Chat Room
    const [batchRoom] = await ChatRoom.findOrCreate({
      where: { college_id: mit.id, type: 'batch', reference_id: batch2024.id },
      defaults: {
        college_id: mit.id,
        type: 'batch',
        reference_id: batch2024.id,
        name: 'CSE Batch 2024-2028',
        created_by: profAlan.id,
        is_active: true
      }
    });

    // Direct Chat between Alice and Bob
    const directRoomName = `direct_${Math.min(alice.id, bob.id)}_${Math.max(alice.id, bob.id)}`;
    const [directRoom] = await ChatRoom.findOrCreate({
      where: { college_id: mit.id, type: 'direct', name: directRoomName },
      defaults: {
        college_id: mit.id,
        type: 'direct',
        name: directRoomName,
        created_by: alice.id,
        is_active: true
      }
    });

    // Add Members to Chat Rooms
    const mitUsers = [mitAdmin, profAlan, alice, bob];
    for (const u of mitUsers) {
      await ChatRoomMember.findOrCreate({
        where: { chat_room_id: campusRoom.id, user_id: u.id },
        defaults: { chat_room_id: campusRoom.id, user_id: u.id, role: u.id === mitAdmin.id ? 'admin' : 'member' }
      });
      await ChatRoomMember.findOrCreate({
        where: { chat_room_id: deptCsRoom.id, user_id: u.id },
        defaults: { chat_room_id: deptCsRoom.id, user_id: u.id, role: u.id === profAlan.id ? 'admin' : 'member' }
      });
    }

    // Batch room members (profAlan, alice, bob)
    for (const u of [profAlan, alice, bob]) {
      await ChatRoomMember.findOrCreate({
        where: { chat_room_id: batchRoom.id, user_id: u.id },
        defaults: { chat_room_id: batchRoom.id, user_id: u.id, role: u.id === profAlan.id ? 'admin' : 'member' }
      });
    }

    // Direct room members
    await ChatRoomMember.findOrCreate({
      where: { chat_room_id: directRoom.id, user_id: alice.id },
      defaults: { chat_room_id: directRoom.id, user_id: alice.id, role: 'member' }
    });
    await ChatRoomMember.findOrCreate({
      where: { chat_room_id: directRoom.id, user_id: bob.id },
      defaults: { chat_room_id: directRoom.id, user_id: bob.id, role: 'member' }
    });
    logger.info('Chat rooms and memberships seeded.');

    // 8. Sample Messages
    const [msg1] = await Message.findOrCreate({
      where: { chat_room_id: campusRoom.id, sender_id: mitAdmin.id, content: 'Welcome to MIT Real-Time Communication Network!' },
      defaults: {
        chat_room_id: campusRoom.id,
        sender_id: mitAdmin.id,
        content: 'Welcome to MIT Real-Time Communication Network!',
        message_type: 'announcement'
      }
    });

    const [msg2] = await Message.findOrCreate({
      where: { chat_room_id: deptCsRoom.id, sender_id: profAlan.id, content: 'Algorithms lab session is scheduled for tomorrow at 10:00 AM in Lab 3.' },
      defaults: {
        chat_room_id: deptCsRoom.id,
        sender_id: profAlan.id,
        content: 'Algorithms lab session is scheduled for tomorrow at 10:00 AM in Lab 3.',
        message_type: 'text'
      }
    });

    const [msg3] = await Message.findOrCreate({
      where: { chat_room_id: directRoom.id, sender_id: alice.id, content: 'Hi Bob, did you review the operating systems notes?' },
      defaults: {
        chat_room_id: directRoom.id,
        sender_id: alice.id,
        content: 'Hi Bob, did you review the operating systems notes?',
        message_type: 'text'
      }
    });

    // 9. Announcements
    await Announcement.findOrCreate({
      where: { college_id: mit.id, title: 'Annual Tech Symposium 2026' },
      defaults: {
        college_id: mit.id,
        department_id: deptCs.id,
        created_by: profAlan.id,
        title: 'Annual Tech Symposium 2026',
        content: 'Registration for MIT Hackathon and Paper Presentations is now open!',
        target_role: 'all',
        priority: 'high'
      }
    });

    // 10. Notifications
    const [notif1] = await Notification.findOrCreate({
      where: { college_id: mit.id, title: 'Welcome to the New Academic Semester' },
      defaults: {
        college_id: mit.id,
        sender_id: mitAdmin.id,
        title: 'Welcome to the New Academic Semester',
        content: 'Please check your course schedules and batch allocations on the portal.',
        type: 'college',
        priority: 'normal'
      }
    });

    for (const u of [profAlan, alice, bob]) {
      await UserNotification.findOrCreate({
        where: { notification_id: notif1.id, user_id: u.id },
        defaults: {
          notification_id: notif1.id,
          user_id: u.id,
          is_read: false
        }
      });
    }

    logger.info('Database seeding completed successfully!');
  } catch (error) {
    logger.error('Error during database seeding:', error);
    throw error;
  }
};

if (require.main === module) {
  seedDatabase()
    .then(() => {
      logger.info('Seed process finished.');
      process.exit(0);
    })
    .catch((err) => {
      logger.error('Seed process failed:', err);
      process.exit(1);
    });
}

module.exports = seedDatabase;
