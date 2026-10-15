/**
 * SUPABASE CLIENT & SERVICE INTEGRATION
 * Kết nối dự án với Supabase Database & Auth Service
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

class SupabaseService {
  constructor() {
    this.url = process.env.SUPABASE_URL || '';
    this.anonKey = process.env.SUPABASE_ANON_KEY || '';
    this.client = null;
    this.status = 'NOT_INITIALIZED';
    this.lastError = null;

    this.initClient();
  }

  isPlaceholder(url, key) {
    if (!url || !key) return true;
    return (
      url.includes('xyzcompany') ||
      url.includes('your-project') ||
      url.includes('example') ||
      key.includes('example_key') ||
      key.includes('your-anon-key')
    );
  }

  initClient() {
    if (this.url && this.anonKey && this.url.startsWith('http') && !this.isPlaceholder(this.url, this.anonKey)) {
      try {
        this.client = createClient(this.url, this.anonKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        });
        this.status = 'CONNECTED';
        this.lastError = null;
        console.log(`[Supabase] Đã kết nối thành công tới Supabase Project: ${this.url}`);
      } catch (err) {
        this.status = 'ERROR';
        this.lastError = err.message;
        console.error('[Supabase] Khởi tạo Supabase client thất bại:', err.message);
      }
    } else {
      this.status = 'READY_TO_CONFIGURE';
      this.client = null;
      console.log('[Supabase] Chế độ Hybrid Local Mock đang hoạt động. Sẵn sàng kết nối khi bạn cấu hình URL/Key Supabase Cloud thực tế.');
    }
  }

  isConfigured() {
    return this.status === 'CONNECTED' && this.client !== null;
  }

  getStatus() {
    return {
      configured: this.isConfigured(),
      status: this.status,
      url: this.url ? this.url.replace(/\.co.*/, '.co') : '',
      hasKey: !!this.anonKey && !this.isPlaceholder(this.url, this.anonKey),
      lastError: this.lastError,
      message: this.isConfigured() 
        ? 'Kết nối Supabase Cloud hoạt động bình thường' 
        : 'Chế độ Local Hybrid Mock đang hoạt động (Đầy đủ dữ liệu 5 tài khoản định danh)'
    };
  }

  updateConfig(url, anonKey) {
    this.url = (url || '').trim();
    this.anonKey = (anonKey || '').trim();
    this.initClient();
    return this.getStatus();
  }

  async findUserByCredentials(usernameOrEmail, password) {
    if (!this.isConfigured()) return null;

    try {
      const { data, error } = await Promise.race([
        this.client
          .from('users')
          .select('*')
          .or(`username.eq.${usernameOrEmail},email.eq.${usernameOrEmail}`)
          .eq('password', password)
          .maybeSingle(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase timeout')), 1500))
      ]);

      if (error) {
        console.warn('[Supabase] Query user warning:', error.message);
        return null;
      }
      return data;
    } catch (e) {
      console.warn('[Supabase] Query notice:', e.message);
      return null;
    }
  }

  async createUser(userObj) {
    if (!this.isConfigured()) return null;

    try {
      const { data, error } = await Promise.race([
        this.client.from('users').insert([userObj]).select().maybeSingle(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase timeout')), 1500))
      ]);

      if (error) {
        console.warn('[Supabase] Insert user warning:', error.message);
        return null;
      }
      return data;
    } catch (e) {
      console.warn('[Supabase] Insert notice:', e.message);
      return null;
    }
  }

  async insertAuditLog(logObj) {
    if (!this.isConfigured()) return null;

    try {
      const { data, error } = await Promise.race([
        this.client.from('audit_logs').insert([logObj]),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase timeout')), 1500))
      ]);
      if (error) console.warn('[Supabase] Audit log warning:', error.message);
      return data;
    } catch (e) {
      return null;
    }
  }
}

module.exports = new SupabaseService();
