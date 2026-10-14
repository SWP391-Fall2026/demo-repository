/**
 * AUTH SERVICE - BUSINESS LOGIC
 * Xử lý xác thực, phân quyền, chuyển đổi role và quản trị tài khoản
 */

const { users, loginHistory, rbacMatrix } = require('./auth.model');
const supabase = require('../../server/supabase');

const VALID_PROVINCES = [
  '001','002','004','006','008','010','011','012','014','015','017','019',
  '020','022','024','025','026','027','030','031','033','034','035','036',
  '037','038','040','042','044','045','046','048','049','051','052','054',
  '056','058','060','062','064','066','067','068','070','072','074','075',
  '077','079','080','082','083','084','086','087','089','091','092','093',
  '094','095','096'
];

class AuthService {
  constructor() {
    this.pendingOtps = new Map(); // email -> { code, userData, expiresAt }
  }

  getAllUsers() {
    return users.map(({ password, ...user }) => user);
  }

  getUserById(id) {
    const user = users.find(u => u.id === id);
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
  }

  async login(username, password, ip = '127.0.0.1', device = 'Web Browser') {
    if (!username || !password) {
      throw new Error('Thông tin không hợp lệ!');
    }
    const cleanU = String(username).trim().toLowerCase();
    const user = users.find(u => 
      (u.username.toLowerCase() === cleanU || u.email.toLowerCase() === cleanU) &&
      String(u.password) === String(password).trim()
    );

    if (!user) {
      this.recordLogin({ username }, ip, device, 'FAILED');
      throw new Error('Thông tin không hợp lệ!');
    }

    if (user.status === 'LOCKED') {
      this.recordLogin(user, ip, device, 'BLOCKED');
      throw new Error('Tài khoản đã bị khóa!');
    }

    this.recordLogin(user, ip, device, 'SUCCESS');
    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  validateRegistrationData(data) {
    const { name, dob, gender, phone, email, cccd, username, password, confirmPassword } = data;

    // 1. Họ và tên
    if (!name || !String(name).trim()) {
      throw new Error('Thông tin không hợp lệ!');
    }
    const cleanName = String(name).trim();
    if (cleanName.length < 2 || cleanName.length > 50) {
      throw new Error('Thông tin không hợp lệ!');
    }
    const nameRegex = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+$/;
    if (!nameRegex.test(cleanName)) {
      throw new Error('Thông tin không hợp lệ!');
    }

    // 2. Ngày tháng năm sinh
    if (!dob) {
      throw new Error('Thông tin không hợp lệ!');
    }
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) {
      throw new Error('Thông tin không hợp lệ!');
    }
    const today = new Date();
    if (birthDate > today) {
      throw new Error('Thông tin không hợp lệ!');
    }
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 18 || age > 100) {
      throw new Error('Thông tin không hợp lệ!');
    }

    // 3. Giới tính
    if (!gender || (gender !== 'Nam' && gender !== 'Nữ' && gender !== 'Khác')) {
      throw new Error('Thông tin không hợp lệ!');
    }

    // 4. Số điện thoại
    if (!phone || !String(phone).trim()) {
      throw new Error('Thông tin không hợp lệ!');
    }
    const cleanPhone = String(phone).replace(/[\s.-]/g, '');
    const phoneRegex = /^(03|05|07|08|09)[0-9]{8}$/;
    if (!phoneRegex.test(cleanPhone)) {
      throw new Error('Thông tin không hợp lệ!');
    }
    if (/^(\d)\1{9}$/.test(cleanPhone) || cleanPhone === '0123456789' || cleanPhone === '0987654321') {
      throw new Error('Thông tin không hợp lệ!');
    }

    // 5. Email
    if (!email || !String(email).trim()) {
      throw new Error('Thông tin không hợp lệ!');
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail) || cleanEmail.includes('..')) {
      throw new Error('Thông tin không hợp lệ!');
    }
    const fakeDomains = ['test.com', 'example.com', 'fake.com', 'mailinator.com', 'tempmail.com', 'abc.xyz'];
    const emailDomain = cleanEmail.split('@')[1];
    if (fakeDomains.includes(emailDomain)) {
      throw new Error('Thông tin không hợp lệ!');
    }

    // 6. Số CCCD
    if (!cccd || !String(cccd).trim()) {
      throw new Error('Thông tin không hợp lệ!');
    }
    const cleanCccd = String(cccd).replace(/\s/g, '');
    if (!/^[0-9]{12}$/.test(cleanCccd)) {
      throw new Error('Thông tin không hợp lệ!');
    }
    const provinceCode = cleanCccd.substring(0, 3);
    if (!VALID_PROVINCES.includes(provinceCode)) {
      throw new Error('Thông tin không hợp lệ!');
    }
    const birthYear = birthDate.getFullYear();
    let expectedCenturyCode = -1;
    if (birthYear >= 1900 && birthYear <= 1999) {
      expectedCenturyCode = (gender === 'Nam') ? 0 : 1;
    } else if (birthYear >= 2000 && birthYear <= 2099) {
      expectedCenturyCode = (gender === 'Nam') ? 2 : 3;
    }
    const actualCenturyCode = parseInt(cleanCccd.charAt(3), 10);
    if (expectedCenturyCode !== -1 && actualCenturyCode !== expectedCenturyCode) {
      throw new Error('Thông tin không hợp lệ!');
    }
    const expectedYearDigits = String(birthYear).slice(-2);
    const actualYearDigits = cleanCccd.substring(4, 6);
    if (expectedYearDigits !== actualYearDigits) {
      throw new Error('Thông tin không hợp lệ!');
    }

    // 7. Tên đăng nhập
    if (!username || !String(username).trim()) {
      throw new Error('Thông tin không hợp lệ!');
    }
    const cleanUsername = String(username).trim().toLowerCase();
    if (!/^[a-zA-Z0-9_]{4,20}$/.test(cleanUsername)) {
      throw new Error('Thông tin không hợp lệ!');
    }
    if (/^[0-9]/.test(cleanUsername)) {
      throw new Error('Thông tin không hợp lệ!');
    }
    const exists = users.find(u => 
      u.username.toLowerCase() === cleanUsername || 
      u.email.toLowerCase() === cleanEmail
    );
    if (exists) {
      throw new Error('Thông tin không hợp lệ!');
    }

    // 8. Mật khẩu
    if (!password) {
      throw new Error('Thông tin không hợp lệ!');
    }
    if (String(password).length < 6) {
      throw new Error('Thông tin không hợp lệ!');
    }

    // 9. Xác nhận mật khẩu
    if (!confirmPassword) {
      throw new Error('Thông tin không hợp lệ!');
    }
    if (String(password) !== String(confirmPassword)) {
      throw new Error('Thông tin không hợp lệ!');
    }

    return {
      name: cleanName,
      dob,
      gender,
      phone: cleanPhone,
      email: cleanEmail,
      cccd: cleanCccd,
      username: cleanUsername,
      password: String(password),
      facility: data.facility || 'Hà Nội - Cầu Giấy'
    };
  }

  generateAndSendOtp(data) {
    const validData = this.validateRegistrationData(data);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 phút

    this.pendingOtps.set(validData.email, {
      code,
      userData: validData,
      expiresAt
    });

    console.log(`[AuthService] 📬 Đã gửi mã xác minh email tới [${validData.email}]: Mã OTP = ${code}`);

    return {
      success: true,
      message: `Mã xác minh đã được gửi tới email ${validData.email}!`,
      email: validData.email,
      code: code
    };
  }

  async verifyOtpAndRegister(email, code, ip = '127.0.0.1') {
    if (!email || !code) {
      throw new Error('Thông tin không hợp lệ!');
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanCode = String(code).trim();

    const pending = this.pendingOtps.get(cleanEmail);
    if (!pending) {
      throw new Error('Thông tin không hợp lệ!');
    }

    if (Date.now() > pending.expiresAt) {
      this.pendingOtps.delete(cleanEmail);
      throw new Error('Mã xác minh đã hết hạn!');
    }

    if (pending.code !== cleanCode) {
      throw new Error('Thông tin không hợp lệ!');
    }

    const newUser = await this.register({
      ...pending.userData,
      emailVerified: true
    }, ip);

    this.pendingOtps.delete(cleanEmail);
    return newUser;
  }

  async register(userData, ip = '127.0.0.1') {
    const { name, dob, gender, username, password, email, phone, cccd, facility, emailVerified } = userData;

    if (!name || !username || !password || !email || !phone) {
      throw new Error('Thông tin không hợp lệ!');
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const cleanEmail = String(email).trim().toLowerCase();

    const existing = users.find(u => 
      u.username.toLowerCase() === cleanUsername || 
      u.email.toLowerCase() === cleanEmail
    );

    if (existing) {
      throw new Error('Thông tin không hợp lệ!');
    }

    const newUser = {
      id: `USR-0${users.length + 1}`,
      name: String(name).trim(),
      dob: dob || '2000-01-01',
      gender: gender || 'Nam',
      username: cleanUsername,
      password: String(password).trim(),
      email: cleanEmail,
      phone: String(phone).trim(),
      cccd: cccd ? String(cccd).trim() : '001202099999',
      role: 'CUSTOMER',
      roleTitle: 'Khách hàng thuê kho',
      facility: facility || 'Hà Nội - Cầu Giấy',
      facilityCode: 'HN-CG',
      status: 'ACTIVE',
      emailVerified: !!emailVerified,
      createdAt: new Date().toISOString().split('T')[0]
    };

    users.push(newUser);

    if (supabase.isConfigured()) {
      try {
        await supabase.createUser({
          id: newUser.id,
          name: newUser.name,
          username: newUser.username,
          password: newUser.password,
          email: newUser.email,
          phone: newUser.phone,
          cccd: newUser.cccd,
          role: newUser.role,
          role_title: newUser.roleTitle,
          facility: newUser.facility,
          facility_code: newUser.facilityCode,
          status: newUser.status
        });
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
