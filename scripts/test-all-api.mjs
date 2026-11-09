// Automated End-to-End API Test Script for Storage Rental
// Simulates the full Postman collection execution

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080/api';

let customerToken = '';
let managerToken = '';
let staffToken = '';
let adminToken = '';
let accessRequestId = '';
let accessPin = '778899';

let passed = 0;
let failed = 0;

async function request(title, path, options = {}) {
    process.stdout.write(`Testing: ${title} ... `);
    try {
        const url = `${BASE_URL}${path}`;
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };
        const res = await fetch(url, {
            method: options.method || 'GET',
            headers,
            body: options.body ? JSON.stringify(options.body) : undefined
        });

        const status = res.status;
        const json = await res.json().catch(() => null);

        if (options.expectedStatus && status !== options.expectedStatus) {
            console.log(`❌ FAILED (Expected ${options.expectedStatus}, got ${status})`);
            if (json) console.log('   Response:', JSON.stringify(json).slice(0, 150));
            failed++;
            return null;
        }

        if (json && json.success === false && options.expectSuccess !== false) {
            console.log(`❌ FAILED (API returned success: false, message: ${json.message})`);
            failed++;
            return null;
        }

        console.log(`✅ PASSED (${status} OK)`);
        passed++;
        return json;
    } catch (err) {
        console.log(`❌ ERROR: ${err.message}`);
        failed++;
        return null;
    }
}

async function run() {
    console.log(`\n======================================================`);
    console.log(`🚀 RUNNING FULL SYSTEM API TESTS AGAINST ${BASE_URL}`);
    console.log(`======================================================\n`);

    // --- 01. Authentication ---
    console.log(`--- [01] Authentication & Multi-Role Login ---`);
    const custLogin = await request('01.1 Customer Login', '/auth/login', {
        method: 'POST',
        body: { username: 'customer', password: 'Demo123!' },
        expectedStatus: 200
    });
    if (custLogin) customerToken = custLogin.token || (custLogin.data && custLogin.data.token);

    await request('01.2 Get Current Profile (/auth/me)', '/auth/me', {
        headers: { Authorization: `Bearer ${customerToken}` },
        expectedStatus: 200
    });

    const mgrLogin = await request('01.3 Facility Manager Login', '/auth/login', {
        method: 'POST',
        body: { username: 'manager', password: 'Demo123!' },
        expectedStatus: 200
    });
    if (mgrLogin) managerToken = mgrLogin.token || (mgrLogin.data && mgrLogin.data.token);

    const stfLogin = await request('01.4 Staff Login', '/auth/login', {
        method: 'POST',
        body: { username: 'staff', password: 'Demo123!' },
        expectedStatus: 200
    });
    if (stfLogin) staffToken = stfLogin.token || (stfLogin.data && stfLogin.data.token);

    const admLogin = await request('01.5 Admin Login', '/auth/login', {
        method: 'POST',
        body: { username: 'admin', password: 'Demo123!' },
        expectedStatus: 200
    });
    if (admLogin) adminToken = admLogin.token || (admLogin.data && admLogin.data.token);

    // --- 02. Facilities & Storage Units ---
    console.log(`\n--- [02] Facilities & Storage Units ---`);
    await request('02.1 List Facilities', '/facilities', { expectedStatus: 200 });
    await request('02.2 List Available Units (Catalog)', '/facilities/units?facilityCode=HN-CG', { expectedStatus: 200 });
    await request('02.3 Service Catalog (/services)', '/services', { expectedStatus: 200 });
    await request('02.4 System Policies & Pricing (/policies)', '/policies', { expectedStatus: 200 });
    await request('02.5 Managed Units (Staff/Manager)', '/facilities/units/manage', {
        headers: { Authorization: `Bearer ${managerToken}` },
        expectedStatus: 200
    });

    // --- 03. Contracts & Customer Rentals ---
    console.log(`\n--- [03] Contracts & Customer Rentals ---`);
    await request('03.1 List Customer Contracts', '/contracts', {
        headers: { Authorization: `Bearer ${customerToken}` },
        expectedStatus: 200
    });
    await request('03.2 Get Contract Detail (CTR-HN-CG-1001)', '/contracts/CTR-HN-CG-1001', {
        headers: { Authorization: `Bearer ${customerToken}` },
        expectedStatus: 200
    });

    // --- 04. Access Control Flow (Check-in & Check-out) ---
    console.log(`\n--- [04] Access Control (Dynamic 6-digit PIN & Check-in / Check-out) ---`);
    const reqRes = await request('04.1 Customer Request Access', '/contracts/CTR-HN-CG-1001/access-requests', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: { purpose: 'Cất thêm 2 thùng hàng gia dụng', notes: 'Có mang theo xe kéo hàng' },
        expectedStatus: 200
    });
    if (reqRes && reqRes.data) accessRequestId = reqRes.data.id;

    if (accessRequestId) {
        const appRes = await request(`04.2 Manager Approve Request (${accessRequestId})`, `/facilities/HN-CG/access-requests/${accessRequestId}/approve`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${managerToken}` },
            body: { pin: '778899', notes: 'Quản lý duyệt và cấp mã PIN 6 số' },
            expectedStatus: 200
        });
        if (appRes && appRes.data && appRes.data.accessPin) accessPin = appRes.data.accessPin;

        await request(`04.3 Customer Check-in with PIN (${accessPin})`, '/contracts/CTR-HN-CG-1001/access-checkin', {
            method: 'POST',
            headers: { Authorization: `Bearer ${customerToken}` },
            body: { pin: accessPin },
            expectedStatus: 200
        });

        await request('04.4 Customer Safety Check-out', '/contracts/CTR-HN-CG-1001/access-checkout', {
            method: 'POST',
            headers: { Authorization: `Bearer ${customerToken}` },
            body: { notes: 'Đã khóa cửa kho an toàn' },
            expectedStatus: 200
        });
    }

    await request('04.5 Manager View Facility Access Logs', '/facilities/HN-CG/access-logs', {
        headers: { Authorization: `Bearer ${managerToken}` },
        expectedStatus: 200
    });

    // --- 05. Invoices & Payments ---
    console.log(`\n--- [05] Invoices & Payments ---`);
    await request('05.1 List Invoices', '/invoices', {
        headers: { Authorization: `Bearer ${customerToken}` },
        expectedStatus: 200
    });
    await request('05.2 Get Bank Transfer Info', '/payments/bank-info', {
        headers: { Authorization: `Bearer ${customerToken}` },
        expectedStatus: 200
    });

    // --- 06. Backoffice Operations ---
    console.log(`\n--- [06] Backoffice Operations & Tasks ---`);
    await request('06.1 List Staff Tasks', '/tasks', {
        headers: { Authorization: `Bearer ${staffToken}` },
        expectedStatus: 200
    });
    await request('06.2 Facility Occupancy Report', '/reports/occupancy', {
        headers: { Authorization: `Bearer ${managerToken}` },
        expectedStatus: 200
    });
    await request('06.3 System Audit Logs', '/audit-logs', {
        headers: { Authorization: `Bearer ${adminToken}` },
        expectedStatus: 200
    });

    console.log(`\n======================================================`);
    console.log(`📊 TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
    console.log(`======================================================\n`);

    if (failed > 0) process.exit(1);
}

run();
