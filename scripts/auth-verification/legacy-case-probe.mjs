// Controlled regression: temporarily uppercase only the existing synthetic mock fixture.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../..");
const privateDir=path.join(root,"storage-rental-secrets");
const fixturePath=path.join(privateDir,"auth-mock-smoke.private.json");
const fixture=JSON.parse(fs.readFileSync(fixturePath,"utf8"));
const phase=process.argv[2];
if(!["before","after"].includes(phase))throw new Error("Expected before|after");
const cp=[path.join(root,"artifacts/auth-staging/migration-classes"),fs.readFileSync(path.join(root,"artifacts/auth-staging/backend-runtime-classpath.txt"),"utf8").trim()].join(path.delimiter);
const evidence={phase,checked_at_utc:new Date().toISOString(),otp_delivery:"MOCK account provenance; no email sent",secret_values_exported:false};
function state(operation){execFileSync("java",["-cp",cp,"AuthFixtureStateControl",path.join(privateDir,"backend.env"),fixturePath,operation],{cwd:root,stdio:["ignore","pipe","pipe"],timeout:30000});}
try {
 state("LEGACY_UPPER_USERNAME");
 const login=await fetch("http://127.0.0.1:18080/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:fixture.username,password:fixture.password}),signal:AbortSignal.timeout(15000)});
 const body=await login.json();evidence.login_http_status=login.status;
 if(login.status!==200 || !body.token)throw new Error("Synthetic legacy login failed");
 const me=await fetch("http://127.0.0.1:18080/api/auth/me",{headers:{Authorization:`Bearer ${body.token}`},signal:AbortSignal.timeout(10000)});
 evidence.me_http_status=me.status;
 evidence.status=phase==="before" ? (me.status===401?"REPRODUCED_LOGIN200_PROFILE401":"REGRESSION_NOT_REPRODUCED") : (me.status===200?"FIX_CONFIRMED_LOGIN200_PROFILE200":"FIX_FAILED");
 if(phase==="after" && me.status!==200)process.exitCode=2;
} catch(error){evidence.status="LEGACY_CASE_PROBE_FAILED";process.exitCode=2;}
finally{state("RESTORE_USERNAME");evidence.fixture_username_restored=true;}
fs.writeFileSync(path.join(root,`artifacts/auth-staging/legacy-case-${phase}.json`),JSON.stringify(evidence,null,2));
console.log(JSON.stringify(evidence));
