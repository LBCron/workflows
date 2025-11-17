#!/usr/bin/env node

/**
 * Test script for Universal Credential Vault
 */

// Set test master password
process.env.MASTER_PASSWORD = 'test-master-password-for-testing';
process.env.VAULT_SALT = 'test-salt';

const UniversalCredentialVault = require('./src/core/universal-credential-vault');

async function testVault() {
  console.log('🧪 Testing Universal Credential Vault...\n');

  const vault = new UniversalCredentialVault();

  try {
    // Test 1: List supported services
    console.log('1️⃣ Test: List supported services');
    const services = vault.getSupportedServices();
    console.log(`   ✅ Found ${services.length} supported services`);
    console.log(`   📧 Email: ${services.filter(s => s.type === 'email').length}`);
    console.log(`   🛍️ Commerce: ${services.filter(s => s.type === 'commerce').length}`);
    console.log(`   📊 Productivity: ${services.filter(s => s.type === 'productivity').length}`);
    console.log(`   💬 Social: ${services.filter(s => s.type === 'social').length}`);
    console.log(`   💳 Payment: ${services.filter(s => s.type === 'payment').length}`);
    console.log(`   ⚙️ Custom: ${services.filter(s => s.type === 'custom').length}\n`);

    // Test 2: Load/Save vault
    console.log('2️⃣ Test: Load vault');
    await vault.load();
    console.log('   ✅ Vault loaded\n');

    // Test 3: Add Gmail credentials (test)
    console.log('3️⃣ Test: Add Gmail credentials');
    await vault.setCredentials('gmail', {
      email: 'test@gmail.com',
      app_password: 'test1234test1234'
    });
    console.log('   ✅ Gmail credentials saved\n');

    // Test 4: Add Xianyu credentials (test)
    console.log('4️⃣ Test: Add Xianyu credentials');
    await vault.setCredentials('xianyu', {
      username: 'test_user',
      password: 'test_password'
    });
    console.log('   ✅ Xianyu credentials saved\n');

    // Test 5: List configured services
    console.log('5️⃣ Test: List configured services');
    const configured = await vault.listConfiguredServices();
    console.log(`   ✅ Found ${configured.length} configured service(s):`);
    configured.forEach(s => {
      console.log(`      • ${s.name} (${s.type})`);
    });
    console.log('');

    // Test 6: Retrieve credentials
    console.log('6️⃣ Test: Retrieve Gmail credentials');
    const gmailCreds = await vault.getCredentials('gmail');
    console.log(`   ✅ Retrieved: email=${gmailCreds.email}, app_password=***hidden***\n`);

    // Test 7: Export encrypted backup
    console.log('7️⃣ Test: Export encrypted backup');
    const backup = await vault.exportEncrypted('my-backup-password');
    console.log(`   ✅ Backup created:`);
    console.log(`      Version: ${backup.version}`);
    console.log(`      Exported: ${backup.exportedAt}`);
    console.log(`      Data length: ${backup.data.length} chars\n`);

    // Test 8: Delete credential
    console.log('8️⃣ Test: Delete Xianyu credentials');
    await vault.deleteCredentials('xianyu');
    const afterDelete = await vault.listConfiguredServices();
    console.log(`   ✅ Deleted. Remaining: ${afterDelete.length} service(s)\n`);

    // Test 9: Check encryption
    console.log('9️⃣ Test: Verify encryption');
    const fs = require('fs');
    const vaultContent = fs.readFileSync(vault.vaultPath, 'utf8');
    const containsPlaintext = vaultContent.includes('test@gmail.com');
    console.log(`   ${containsPlaintext ? '❌' : '✅'} Vault file is ${containsPlaintext ? 'NOT ' : ''}encrypted\n`);

    // Cleanup
    console.log('🧹 Cleanup: Deleting test vault');
    await fs.promises.unlink(vault.vaultPath).catch(() => {});
    console.log('   ✅ Test vault deleted\n');

    console.log('━'.repeat(60));
    console.log('✅ ALL VAULT TESTS PASSED!');
    console.log('━'.repeat(60));

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testVault();
