/**
 * AUTH SERVICE - BUSINESS LOGIC
 * Xử lý xác thực, phân quyền, chuyển đổi role và quản trị tài khoản
 */

const { users, rbacMatrix } = require('./auth.model');

class AuthService {
  getAllUsers() {
    return users;
  }

  getUserById(id) {
    return users.find(u => u.id === id);
  }

  toggleLockUser(id) {
    const user = this.getUserById(id);
    if (!user) throw new Error('Không tìm thấy người dùng');
    user.status = user.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    return user;
  }

  createUser(userData) {
    const newUser = {
      id: `USR-0${users.length + 1}`,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      role: userData.role || 'CUSTOMER',
      facility: userData.facility || 'Hà Nội - Cầu Giấy',
      status: 'ACTIVE'
    };
    users.push(newUser);
    return newUser;
  }

  getRBACMatrix() {
    return rbacMatrix;
  }
}

module.exports = new AuthService();
