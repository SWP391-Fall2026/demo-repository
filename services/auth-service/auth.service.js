/**
 * AUTH SERVICE - BUSINESS LOGIC
 * Xử lý xác thực, phân quyền, chuyển đổi role và quản trị tài khoản
 */

const { users, loginHistory, rbacMatrix } = require('./auth.model');
const supabase = require('../../server/supabase');

class AuthService {
  getAllUsers() {
    return users.map(({ password, ...user }) => user);
  }

  getUserById(id) {
    const user = users.find(u => u.id === id);
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
  }

  async login(identifier, password, ip = '127.0.0.1', device = 'Web Browser') {
    if (!identifier || !password) {
      throw new Error('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!');
    }

    const cleanId = String(identifier).trim().toLowerCase();
    const cleanPw = String(password).trim();

    // 1. Try Supabase if configured
    if (supabase.isConfigured()) {
      try {
        const sbUser = await supabase.findUserByCredentials(cleanId, cleanPw);
        if (sbUser) {
          this.recordLogin(sbUser, ip, device, 'SUCCESS');
          return sbUser;
        }
      } catch (err) {
        console.warn('[AuthService] Supabase login query warning:', err.message);
      }
    }

    // 2. Query in-memory repository (local fallback / primary)
    const user = users.find(u => 
      (u.username.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId) &&
      String(u.password) === cleanPw
    );

    if (!user) {
      this.recordLogin({ username: identifier, name: 'Khách không xác định', role: 'UNKNOWN' }, ip, device, 'FAILED');
      throw new Error('Tên đăng nhập hoặc mật khẩu không chính xác!');
    }

    if (user.status === 'LOCKED') {
      this.recordLogin(user, ip, device, 'LOCKED');
      throw new Error('Tài khoản của bạn đã bị khóa! Vui lòng liên hệ Quản trị viên hệ thống.');
    }

    this.recordLogin(user, ip, device, 'SUCCESS');

    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  async register(userData, ip = '127.0.0.1') {
    const { name, username, password, email, phone, cccd, facility } = userData;

    if (!name || !username || !password || !email || !phone) {
      throw new Error('Vui lòng điền đầy đủ các thông tin bắt buộc!');
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const existing = users.find(u => 
      u.username.toLowerCase() === cleanUsername || 
      u.email.toLowerCase() === String(email).trim().toLowerCase()
    );

    if (existing) {
      throw new Error('Tên đăng nhập hoặc email đã tồn tại trong hệ thống!');
    }

    const newUser = {
      id: `USR-0${users.length + 1}`,
      name: String(name).trim(),
      username: cleanUsername,
      password: String(password).trim(),
      email: String(email).trim(),
      phone: String(phone).trim(),
      cccd: cccd ? String(cccd).trim() : '001202099999',
      role: 'CUSTOMER',
      roleTitle: 'Khách hàng thuê kho',
      facility: facility || 'Hà Nội - Cầu Giấy',
      facilityCode: 'HN-CG',
      status: 'ACTIVE',
      createdAt: new Date().toISOString().split('T')[0]
    };

    users.push(newUser);

    // Sync to Supabase if configured
    if (supabase.isConfigured()) {
      try {
        await supabase.createUser(newUser);
      } catch (err) {
        console.warn('[AuthService] Supabase user sync warning:', err.message);
      }
    }

    this.recordLogin(newUser, ip, 'Web Register', 'SUCCESS');

    const { password: _, ...safeUser } = newUser;
    return safeUser;
  }

  recordLogin(user, ip, device, status) {
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    
    loginHistory.unshift({
      id: `LOG-0${loginHistory.length + 1}`,
      username: user.username || 'unknown',
      name: user.name || 'Khách vãng lai',
      role: user.role || 'UNKNOWN',
      time: timeStr,
      ip: ip || '127.0.0.1',
      device: device || 'Web Browser',
      status: status
    });
  }

  getLoginHistory() {
    return loginHistory;
  }

  toggleLockUser(id) {
    const user = users.find(u => u.id === id);
    if (!user) throw new Error('Không tìm thấy người dùng');
    user.status = user.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    const { password, ...safeUser } = user;
    return safeUser;
  }

  createUser(userData) {
    const newUser = {
      id: `USR-0${users.length + 1}`,
      name: userData.name,
      username: (userData.username || `user_${Date.now()}`).toLowerCase(),
      password: userData.password || '123456',
      email: userData.email,
      phone: userData.phone,
      cccd: userData.cccd || '',
      role: userData.role || 'CUSTOMER',
      facility: userData.facility || 'Hà Nội - Cầu Giấy',
      status: 'ACTIVE',
      createdAt: new Date().toISOString().split('T')[0]
    };
    users.push(newUser);
    const { password, ...safeUser } = newUser;
    return safeUser;
  }

  getRBACMatrix() {
    return rbacMatrix;
  }
}

module.exports = new AuthService();
