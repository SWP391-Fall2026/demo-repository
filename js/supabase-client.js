/**
 * SUPABASE FRONTEND CLIENT & BRIDGE
 * Quản lý trạng thái kết nối Supabase Cloud trên giao diện Web
 */

const SupabaseBridge = {
  status: {
    configured: false,
    status: 'READY_TO_CONFIGURE',
    url: '',
    hasKey: false,
    message: 'Chế độ Local Mock đang hoạt động'
  },

  async checkStatus() {
    try {
      const res = await fetch('/api/supabase/status');
      if (res.ok) {
        this.status = await res.json();
        this.updateUIBadge();
        return this.status;
      }
    } catch (err) {
      console.warn('[SupabaseBridge] API status check offline, using local mode.');
    }
    this.updateUIBadge();
    return this.status;
  },

  async updateConfig(url, anonKey) {
    try {
      const res = await fetch('/api/supabase/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, anonKey })
      });
      if (res.ok) {
        const data = await res.json();
        this.status = data.status;
        this.updateUIBadge();
        return { success: true, status: this.status };
      }
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  updateUIBadge() {
    const dot = document.getElementById('authSupabaseDot');
    const text = document.getElementById('authSupabaseText');
    const headerPill = document.getElementById('headerSupabasePill');

    const isConnected = this.status.configured || this.status.status === 'CONNECTED';
    const label = isConnected 
      ? 'Supabase: Đã kết nối' 
      : 'Supabase: Sẵn sàng cấu hình';

    if (dot) {
      dot.style.background = isConnected ? '#22c55e' : '#3b82f6';
    }
    if (text) {
      text.innerText = label;
    }
    if (headerPill) {
      headerPill.innerHTML = `
        <span class="supabase-status-dot" style="background:${isConnected ? '#22c55e' : '#3b82f6'};"></span>
        <span>${label}</span>
      `;
    }
  }
};

window.SupabaseBridge = SupabaseBridge;
