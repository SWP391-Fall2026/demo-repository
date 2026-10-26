@echo off
echo =======================================================
echo TAO KHO KHOA SSL/TLS KEYSTORE CHO SELF-STORAGE GATEWAY
echo =======================================================

set KEYSTORE_PATH=src\main\resources\keystore\gateway.p12
set PASSWORD=selfstorage123
set ALIAS=gateway

if exist "%KEYSTORE_PATH%" (
    echo Xoa keystore cu...
    del "%KEYSTORE_PATH%"
)

keytool -genkeypair -alias %ALIAS% -keyalg RSA -keysize 2048 -storetype PKCS12 -keystore "%KEYSTORE_PATH%" -validity 3650 -storepass %PASSWORD% -dname "CN=localhost, OU=SelfStorage, O=SWP391, L=Hanoi, ST=Hanoi, C=VN"

echo Keystore da duoc tao thanh cong tai: %KEYSTORE_PATH%
echo Mat khau: %PASSWORD%
echo Alias: %ALIAS%
pause
